import re

import markdown as md
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from tavily import TavilyClient

# WeasyPrint is optional on Windows (requires external GTK/Pango libs).
# Import it lazily so the API can boot even when those DLLs are missing.
try:
    from weasyprint import HTML  # type: ignore
except Exception:  # pragma: no cover
    HTML = None  # type: ignore

try:
    from xhtml2pdf import pisa
except ImportError:
    pisa = None

from .config import get_settings
from .graph import build_research_graph
from .models import ChatRequest, ChatResponse, PDFRequest


app = FastAPI(title="ScioAI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = get_settings()
tavily_client = TavilyClient(api_key=settings.tavily_api_key)

research_graph = build_research_graph(
    tavily_client=tavily_client,
    openrouter_api_key=settings.openrouter_api_key,
    model_researcher=settings.model_researcher,
    model_writer=settings.model_writer,
    model_critic=settings.model_critic,
    model_fallback=settings.model_fallback,
)


def _safe_filename(raw_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", raw_name.strip())
    cleaned = cleaned.strip("-_")
    return cleaned[:70] or "scioai-report"


def _clean_text(text: str) -> str:
    """Replaces problematic unicode characters that often render as black boxes in PDFs."""
    if not text:
        return ""
    replacements = {
        "\u2011": "-",  # Non-breaking hyphen
        "\u2013": "-",  # En dash
        "\u2014": "--", # Em dash
        "\u00A0": " ",  # Non-breaking space
        "\u2022": "*",  # Bullet
        "\u2018": "'",  # Left single quote
        "\u2019": "'",  # Right single quote
        "\u201C": '"',  # Left double quote
        "\u201D": '"',  # Right double quote
        "\u2026": "...", # Ellipsis
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def _wrap_html(html_body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <style>
      @page {{ size: A4; margin: 20mm; }}
      body {{ 
        font-family: \"Helvetica\", \"Arial\", sans-serif; 
        color: #000000; 
        background: #ffffff; 
        line-height: 1.5; 
        font-size: 11pt; 
      }}
      h1, h2, h3 {{ color: #000000; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; }}
      h1 {{ font-size: 24pt; border-bottom: 1.5pt solid #000000; padding-bottom: 10px; margin-top: 0; }}
      h2 {{ font-size: 18pt; border-bottom: 0.5pt solid #dddddd; padding-bottom: 4px; }}
      h3 {{ font-size: 14pt; }}
      p {{ margin: 0.8em 0; text-align: justify; }}
      ul, ol {{ padding-left: 1.5rem; margin: 0.8em 0; }}
      li {{ margin: 0.4em 0; }}
      blockquote {{ 
        margin: 1.5em 0; 
        padding: 0.5em 1em; 
        border-left: 3pt solid #000000; 
        background: #f9f9f9; 
        font-style: italic;
      }}
      table {{ 
        width: 100%; 
        border-collapse: collapse; 
        margin: 1.5em 0; 
        table-layout: auto;
      }}
      th {{ 
        background: #f2f2f2; 
        color: #000000; 
        font-weight: bold; 
        text-transform: uppercase;
        font-size: 10pt;
      }}
      td, th {{ 
        border: 0.5pt solid #000000; 
        padding: 8px; 
        text-align: left; 
        vertical-align: top; 
      }}
      code {{ 
        background: #f4f4f4; 
        padding: 2px 4px; 
        border-radius: 3px;
        font-family: monospace;
      }}
      pre {{ 
        background: #000000; 
        color: #ffffff; 
        padding: 12px; 
        border-radius: 4px;
        white-space: pre-wrap; 
        word-wrap: break-word;
        font-family: monospace;
        font-size: 10pt;
      }}
      hr {{ border: none; border-top: 1pt solid #000000; margin: 2em 0; }}
      a {{ color: #000000; text-decoration: underline; }}
    </style>
  </head>
  <body>
    {html_body}
  </body>
</html>""".strip()


def _markdown_to_html(markdown_text: str) -> str:
    markdown_text = _clean_text(markdown_text)
    html_body = md.markdown(
        markdown_text,
        extensions=["fenced_code", "tables", "toc", "sane_lists", "nl2br"],
    )

    return _wrap_html(html_body)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    initial_state = {
        "user_query": request.query,
        "research_data": "",
        "draft": "",
        "final_report": "",
        "current_step": "queued",
        "workflow_steps": [],
    }

    try:
        final_state = research_graph.invoke(initial_state)
        final_report = final_state.get("final_report") or final_state.get("draft")
        if not final_report:
            raise ValueError("LangGraph run completed without a final report.")

        return ChatResponse(
            response=final_report,
            current_step=str(final_state.get("current_step", "unknown")),
            workflow_steps=list(final_state.get("workflow_steps", [])),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LangGraph pipeline failed: {exc}") from exc


@app.post("/api/generate-pdf")
def generate_pdf(request: PDFRequest) -> Response:
    file_name = _safe_filename(request.filename or "scioai-report")
    
    # 1. Try WeasyPrint (Best quality)
    if HTML is not None:
        try:
            if request.html and request.html.strip():
                html_doc = _wrap_html(_clean_text(request.html))
            else:
                html_doc = _markdown_to_html(request.markdown)

            pdf_bytes = HTML(string=html_doc).write_pdf()
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{file_name}.pdf"'},
            )
        except Exception as exc:
            print(f"WeasyPrint failed: {exc}")

    # 2. Try xhtml2pdf (Pure Python fallback)
    if pisa is not None:
        try:
            import io
            if request.html and request.html.strip():
                html_doc = _wrap_html(_clean_text(request.html))
            else:
                html_doc = _markdown_to_html(request.markdown)
            
            # xhtml2pdf expects a file-like object for output
            result = io.BytesIO()
            pisa_status = pisa.CreatePDF(io.BytesIO(html_doc.encode("utf-8")), dest=result)
            
            if not pisa_status.err:
                pdf_data = result.getvalue()
                print(f"--- xhtml2pdf generated PDF successfully. Size: {len(pdf_data)} bytes ---")
                return Response(
                    content=pdf_data,
                    media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{file_name}.pdf"'},
                )
            else:
                print(f"--- xhtml2pdf Error: {pisa_status.err} ---")
        except Exception as exc:
             print(f"xhtml2pdf fallback failed: {exc}")

    # 3. Last resort error
    raise HTTPException(
        status_code=503,
        detail=(
            "PDF generation failed. WeasyPrint dependencies are missing, and the fallback generator failed.\n"
            "Please check backend logs."
        ),
    )

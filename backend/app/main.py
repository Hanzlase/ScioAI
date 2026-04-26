import re

import markdown as md
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pinecone import Pinecone
from tavily import TavilyClient

# WeasyPrint is optional on Windows (requires external GTK/Pango libs).
# Import it lazily so the API can boot even when those DLLs are missing.
try:
    from weasyprint import HTML  # type: ignore
except Exception:  # pragma: no cover
    HTML = None  # type: ignore

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
pinecone_client = Pinecone(api_key=settings.pinecone_api_key)

research_graph = build_research_graph(
    tavily_client=tavily_client,
    pinecone_client=pinecone_client,
    pinecone_index_name=settings.pinecone_index_name,
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


def _wrap_html(html_body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <style>
      @page {{ size: A4; margin: 28mm 20mm 24mm 20mm; }}
      body {{ font-family: \"Segoe UI\", \"Inter\", sans-serif; color: #1f2937; background: #fffdf7; line-height: 1.6; font-size: 12pt; }}
      h1, h2, h3 {{ color: #0f766e; margin-top: 1.2em; margin-bottom: 0.45em; }}
      h1 {{ font-size: 26px; border-bottom: 2px solid #67e8f9; padding-bottom: 8px; }}
      h2 {{ font-size: 20px; }}
      h3 {{ font-size: 16px; }}
      p {{ margin: 0.55em 0; }}
      ul, ol {{ padding-left: 1.2rem; margin: 0.6em 0; }}
      li {{ margin: 0.25em 0; }}
      blockquote {{ margin: 0.8em 0; padding: 0.65em 0.9em; border-left: 4px solid #f97316; background: #fff7ed; }}
      table {{ width: 100%; border-collapse: collapse; margin: 1em 0; table-layout: fixed; word-wrap: break-word; }}
      th {{ background: #cffafe; color: #164e63; }}
      td, th {{ border: 1px solid #bae6fd; padding: 8px; text-align: left; vertical-align: top; }}
      code {{ background: #fef3c7; padding: 1px 4px; border-radius: 4px; }}
      pre {{ background: #0f172a; color: #e2e8f0; padding: 10px 12px; border-radius: 8px; overflow: hidden; white-space: pre-wrap; word-break: break-word; }}
      hr {{ border: none; border-top: 1px solid #e2e8f0; margin: 1.2em 0; }}
      a {{ color: #0ea5e9; text-decoration: none; }}
      a:hover {{ text-decoration: underline; }}
    </style>
  </head>
  <body>
    {html_body}
  </body>
</html>""".strip()


def _markdown_to_html(markdown_text: str) -> str:
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
    if HTML is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "PDF generation is unavailable on this machine because WeasyPrint could not load its native "
                "dependencies (GTK/Pango/Cairo/GObject).\n\n"
                "Windows quick fix:\n"
                "1) Install MSYS2\n"
                "2) Install the required libraries (pango, cairo, gdk-pixbuf)\n"
                "3) Ensure the DLLs are on PATH\n\n"
                "Docs: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation"
            ),
        )

    try:
        html_doc = _wrap_html(request.html) if (request.html and request.html.strip()) else _markdown_to_html(request.markdown)
        pdf_bytes = HTML(string=html_doc).write_pdf()
        file_name = _safe_filename(request.filename or "scioai-report")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{file_name}.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc

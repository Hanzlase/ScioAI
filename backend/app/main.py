import re

import markdown as md
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pinecone import Pinecone
from tavily import TavilyClient
from weasyprint import HTML

from .config import get_settings
from .graph import build_research_graph
from .models import ChatRequest, ChatResponse, PDFRequest


app = FastAPI(title="ScioAI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    groq_api_key=settings.groq_api_key,
)


def _safe_filename(raw_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", raw_name.strip())
    cleaned = cleaned.strip("-_")
    return cleaned[:70] or "scioai-report"


def _markdown_to_html(markdown_text: str) -> str:
    html_body = md.markdown(
        markdown_text,
        extensions=["fenced_code", "tables", "toc", "sane_lists", "nl2br"],
    )

    return f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page {{
        size: A4;
        margin: 28mm 20mm 24mm 20mm;
      }}
      body {{
        font-family: "Segoe UI", "Inter", sans-serif;
        color: #1f2937;
        background: #fffdf7;
        line-height: 1.6;
        font-size: 12pt;
      }}
      h1, h2, h3 {{
        color: #0f766e;
        margin-top: 1.2em;
        margin-bottom: 0.45em;
      }}
      h1 {{
        font-size: 26px;
        border-bottom: 2px solid #67e8f9;
        padding-bottom: 8px;
      }}
      h2 {{
        font-size: 20px;
      }}
      h3 {{
        font-size: 16px;
      }}
      p {{
        margin: 0.55em 0;
      }}
      ul, ol {{
        padding-left: 1.2rem;
      }}
      blockquote {{
        margin: 0.8em 0;
        padding: 0.65em 0.9em;
        border-left: 4px solid #f97316;
        background: #fff7ed;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }}
      th {{
        background: #cffafe;
        color: #164e63;
      }}
      td, th {{
        border: 1px solid #bae6fd;
        padding: 8px;
        text-align: left;
      }}
      code {{
        background: #fef3c7;
        padding: 1px 4px;
        border-radius: 4px;
      }}
      pre {{
        background: #0f172a;
        color: #e2e8f0;
        padding: 10px 12px;
        border-radius: 8px;
        overflow: hidden;
      }}
      hr {{
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 1.2em 0;
      }}
      a {{
        color: #0ea5e9;
      }}
    </style>
  </head>
  <body>
    {html_body}
  </body>
</html>
""".strip()


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
    try:
        html_doc = _markdown_to_html(request.markdown)
        pdf_bytes = HTML(string=html_doc).write_pdf()
        file_name = _safe_filename(request.filename or "scioai-report")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{file_name}.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc

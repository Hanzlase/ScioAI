import io
import re

import markdown as md
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from tavily import TavilyClient

from .config import get_settings
from .graph import build_research_graph
from .models import ChatRequest, ChatResponse, PDFRequest


app = FastAPI(title="ScioAI Backend", version="0.3.0")

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
    """Replace problematic unicode characters that cause rendering issues."""
    if not text:
        return ""
    replacements = {
        "\u2011": "-",   # Non-breaking hyphen
        "\u2013": "-",   # En dash
        "\u2014": "--",  # Em dash
        "\u00A0": " ",   # Non-breaking space
        "\u2022": "*",   # Bullet
        "\u2018": "'",   # Left single quote
        "\u2019": "'",   # Right single quote
        "\u201C": '"',   # Left double quote
        "\u201D": '"',   # Right double quote
        "\u2026": "...", # Ellipsis
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def _build_pdf_styles() -> dict:
    """Build a clean monochromatic B&W style set for reportlab."""
    base = getSampleStyleSheet()

    styles = {
        "h1": ParagraphStyle(
            "H1", parent=base["Normal"],
            fontSize=22, fontName="Helvetica-Bold",
            textColor=colors.black, spaceAfter=6, spaceBefore=4,
            borderPadding=(0, 0, 4, 0),
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Normal"],
            fontSize=16, fontName="Helvetica-Bold",
            textColor=colors.black, spaceAfter=4, spaceBefore=14,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Normal"],
            fontSize=13, fontName="Helvetica-Bold",
            textColor=colors.black, spaceAfter=3, spaceBefore=10,
        ),
        "h4": ParagraphStyle(
            "H4", parent=base["Normal"],
            fontSize=11, fontName="Helvetica-Bold",
            textColor=colors.black, spaceAfter=2, spaceBefore=8,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["Normal"],
            fontSize=10, fontName="Helvetica",
            textColor=colors.black, spaceAfter=6, leading=15,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["Normal"],
            fontSize=10, fontName="Helvetica",
            textColor=colors.black, spaceAfter=3, leading=14,
            leftIndent=12, bulletIndent=0,
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Normal"],
            fontSize=9, fontName="Courier",
            textColor=colors.black, backColor=colors.HexColor("#f4f4f4"),
            spaceAfter=6, leading=13, leftIndent=8, rightIndent=8,
            borderPadding=4,
        ),
    }
    return styles


def _escape_xml(text: str) -> str:
    """Escape characters that would break reportlab's XML parser."""
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
    )


def _markdown_to_story(markdown_text: str) -> list:
    """Convert markdown text to a reportlab story (list of Flowables)."""
    text = _clean_text(markdown_text)
    styles = _build_pdf_styles()
    story = []

    lines = text.split("\n")
    i = 0
    in_code_block = False
    code_buffer = []

    while i < len(lines):
        line = lines[i]

        # --- Code blocks ---
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_buffer = []
            else:
                in_code_block = False
                code_text = _escape_xml("\n".join(code_buffer))
                story.append(Paragraph(code_text.replace("\n", "<br/>"), styles["code"]))
                story.append(Spacer(1, 4))
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        # --- Headings ---
        heading_match = re.match(r"^(#{1,4})\s+(.*)", line)
        if heading_match:
            level = len(heading_match.group(1))
            heading_text = _escape_xml(heading_match.group(2).strip())
            style_key = f"h{min(level, 4)}"
            story.append(Paragraph(heading_text, styles[style_key]))
            if level == 1:
                story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=6))
            elif level == 2:
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc"), spaceAfter=4))
            i += 1
            continue

        # --- Horizontal rules ---
        if re.match(r"^[-*_]{3,}\s*$", line.strip()):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=8, spaceBefore=8))
            i += 1
            continue

        # --- Bullet lists ---
        bullet_match = re.match(r"^(\s*)[-*+]\s+(.*)", line)
        if bullet_match:
            indent_level = len(bullet_match.group(1)) // 2
            item_text = _escape_xml(bullet_match.group(2).strip())
            bullet_style = ParagraphStyle(
                f"Bullet{indent_level}", parent=styles["bullet"],
                leftIndent=12 + indent_level * 16, bulletText="•",
            )
            story.append(Paragraph(item_text, bullet_style))
            i += 1
            continue

        # --- Numbered lists ---
        num_match = re.match(r"^(\s*)\d+\.\s+(.*)", line)
        if num_match:
            item_text = _escape_xml(num_match.group(2).strip())
            story.append(Paragraph(item_text, styles["bullet"]))
            i += 1
            continue

        # --- Tables (simple Markdown pipe tables) ---
        if line.strip().startswith("|") and "|" in line[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            # Filter out separator rows (|---|---|)
            rows = []
            for tl in table_lines:
                if re.match(r"^\|[\s\-:|]+\|", tl.strip()):
                    continue
                cells = [_escape_xml(c.strip()) for c in tl.strip().strip("|").split("|")]
                rows.append(cells)
            if rows:
                max_cols = max(len(r) for r in rows)
                # Pad shorter rows
                padded = [r + [""] * (max_cols - len(r)) for r in rows]
                para_rows = []
                for ri, row in enumerate(padded):
                    font = "Helvetica-Bold" if ri == 0 else "Helvetica"
                    para_rows.append([Paragraph(cell, ParagraphStyle("tc", fontName=font, fontSize=9, leading=12)) for cell in row])
                col_width = (A4[0] - 40 * mm) / max_cols
                t = Table(para_rows, colWidths=[col_width] * max_cols)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
                ]))
                story.append(Spacer(1, 6))
                story.append(t)
                story.append(Spacer(1, 6))
            continue

        # --- Blank lines ---
        if not line.strip():
            story.append(Spacer(1, 6))
            i += 1
            continue

        # --- Normal paragraph ---
        # Apply inline formatting: **bold**, *italic*, `code`
        para_text = _escape_xml(line.strip())
        para_text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", para_text)
        para_text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", para_text)
        para_text = re.sub(r"`(.+?)`", r'<font name="Courier" size="9">\1</font>', para_text)
        # Strip markdown links: [text](url) → text
        para_text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", para_text)
        story.append(Paragraph(para_text, styles["body"]))
        i += 1

    return story


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

    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
            title=file_name,
        )
        story = _markdown_to_story(request.markdown)
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{file_name}.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {exc}",
        ) from exc

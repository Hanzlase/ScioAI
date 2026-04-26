from __future__ import annotations

from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from pinecone import Pinecone
from tavily import TavilyClient


class ResearchGraphState(TypedDict):
    user_query: str
    research_data: str
    draft: str
    final_report: str
    current_step: str
    workflow_steps: list[str]


def _format_tavily_results(search_payload: dict[str, Any]) -> str:
    entries = search_payload.get("results", [])
    if not entries:
        return "No Tavily web results were returned."

    lines: list[str] = []
    for idx, item in enumerate(entries[:6], start=1):
        title = item.get("title", "Untitled")
        url = item.get("url", "")
        content = (item.get("content", "") or "").strip()
        lines.append(f"[{idx}] {title}\nSource: {url}\nEvidence: {content}")
    return "\n\n".join(lines)


def _retrieve_pinecone_context(index: Any, query: str) -> str:
    stats = index.describe_index_stats()
    dimension = stats.get("dimension")
    if not isinstance(dimension, int) or dimension <= 0:
        return "Pinecone index connected, but the vector dimension is unavailable."

    query_result = index.query(
        vector=[0.0] * dimension,
        top_k=4,
        include_metadata=True,
    )
    matches = query_result.get("matches", [])
    if not matches:
        return f"Pinecone query returned no chunks for semantic seed: {query}"

    chunks: list[str] = []
    for idx, match in enumerate(matches, start=1):
        metadata = match.get("metadata", {}) or {}
        text = metadata.get("text") or metadata.get("chunk") or str(metadata)
        source = metadata.get("source") or metadata.get("url") or "pinecone://chunk"
        score = float(match.get("score", 0.0))
        chunks.append(f"[P{idx}] score={score:.4f} | source={source}\n{text}")

    return "\n\n".join(chunks)


def build_research_graph(
    tavily_client: TavilyClient,
    pinecone_client: Pinecone,
    pinecone_index_name: str,
    groq_api_key: str,
):
    index = pinecone_client.Index(pinecone_index_name)
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        max_tokens=1800,
    )

    def researcher_node(state: ResearchGraphState) -> ResearchGraphState:
        query = state["user_query"]
        tavily_search = tavily_client.search(query=query, max_results=8)
        web_context = _format_tavily_results(tavily_search)
        pinecone_context = _retrieve_pinecone_context(index, query)

        research_data = (
            "## Tavily Evidence (use these URLs as citations)\n"
            f"{web_context}\n\n"
            "## Pinecone Chunks (cite as [P1], [P2], etc.)\n"
            f"{pinecone_context}"
        )

        return {
            **state,
            "research_data": research_data,
            "current_step": "research_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "researcher"],
        }

    def writer_node(state: ResearchGraphState) -> ResearchGraphState:
        writer_prompt = (
            "You are the Writer agent for ScioAI.\n\n"
            "Goal: Produce a detailed, citation-grounded research report in Markdown.\n"
            "Write for a technical audience, but keep it readable.\n\n"
            "Hard requirements:\n"
            "- Length: at least 900 words (unless user explicitly asked for concise).\n"
            "- Use the exact section headings below.\n"
            "- Every major claim must include an inline citation like [1] or [P1].\n"
            "- The '## Citations' section must be a numbered list where EACH item is a clickable Markdown link:\n"
            "  Example: [1] [Article title](https://example.com)\n"
            "- Do NOT invent sources. Only use URLs present in Tavily Evidence.\n"
            "- If a citation is missing a URL, omit it.\n\n"
            "Required sections:\n"
            "# Title\n"
            "## Executive Summary\n"
            "## Key Findings\n"
            "## Deep Analysis\n"
            "## Risks and Unknowns\n"
            "## What to verify next\n"
            "## Citations\n"
        )

        draft_msg = llm.invoke(
            [
                SystemMessage(content=writer_prompt),
                HumanMessage(
                    content=(
                        f"User Query:\n{state['user_query']}\n\n"
                        f"Research Data:\n{state['research_data']}"
                    )
                ),
            ]
        )
        draft = draft_msg.content if isinstance(draft_msg.content, str) else str(draft_msg.content)

        return {
            **state,
            "draft": draft,
            "current_step": "draft_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "writer"],
        }

    def critic_node(state: ResearchGraphState) -> ResearchGraphState:
        critic_prompt = (
            "You are the Critic agent for ScioAI.\n"
            "Review the draft against the original query and the provided research data.\n\n"
            "Hard requirements:\n"
            "1) Keep tone objective and analytical.\n"
            "2) Ensure the report is detailed (do not over-compress).\n"
            "3) Ensure every source in '## Citations' is a Markdown link with a real URL from Tavily.\n"
            "4) Remove unsupported claims; add more citations where needed.\n"
            "5) Remove any meta-notes like 'Note: I removed...' from the final answer.\n\n"
            "Return only the improved markdown report."
        )

        reviewed_msg = llm.invoke(
            [
                SystemMessage(content=critic_prompt),
                HumanMessage(
                    content=(
                        f"Original Query:\n{state['user_query']}\n\n"
                        f"Research Data (authoritative sources):\n{state['research_data']}\n\n"
                        f"Draft to review:\n{state['draft']}"
                    )
                ),
            ]
        )
        final_report = (
            reviewed_msg.content
            if isinstance(reviewed_msg.content, str)
            else str(reviewed_msg.content)
        )

        return {
            **state,
            "final_report": final_report,
            "current_step": "critic_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "critic"],
        }

    workflow = StateGraph(ResearchGraphState)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("critic", critic_node)

    workflow.add_edge(START, "researcher")
    workflow.add_edge("researcher", "writer")
    workflow.add_edge("writer", "critic")
    workflow.add_edge("critic", END)

    return workflow.compile()

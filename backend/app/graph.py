from __future__ import annotations

import time
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
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
    for idx, item in enumerate(entries[:5], start=1):
        title = item.get("title", "Untitled")
        url = item.get("url", "")
        # Truncate each result to ~800 chars to save tokens
        content = (item.get("content", "") or "").strip()[:800]
        lines.append(f"[{idx}] {title}\nURL: {url}\n{content}")
    return "\n\n---\n\n".join(lines)


def build_research_graph(
    tavily_client: TavilyClient,
    groq_api_key: str,
    model_researcher: str,
    model_writer: str,
    model_critic: str,
    model_fallback: str,
):
    def _llm(model: str, *, temperature: float, max_tokens: int) -> ChatOpenAI:
        return ChatOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=300,
        )

    llm_researcher = _llm(model_researcher, temperature=0.2, max_tokens=1200)
    llm_writer     = _llm(model_writer,     temperature=0.6, max_tokens=2000)
    llm_critic     = _llm(model_critic,     temperature=0.1, max_tokens=2000)
    llm_fallback   = _llm(model_fallback,   temperature=0.2, max_tokens=2000)

    def _invoke(messages: list[Any], llm: ChatOpenAI) -> str:
        """Invoke the LLM with fallback on any error."""
        try:
            msg = llm.invoke(messages)
        except Exception as e:
            print(f"Primary LLM failed ({e}), using fallback...")
            msg = llm_fallback.invoke(messages)
        return msg.content if isinstance(msg.content, str) else str(msg.content)

    # ── NODE 1: RESEARCHER ─────────────────────────────────────────────────────
    def researcher_node(state: ResearchGraphState) -> ResearchGraphState:
        print(f"[Researcher] Query: {state['user_query']}")
        tavily_results = tavily_client.search(query=state["user_query"], max_results=5)
        raw_evidence = _format_tavily_results(tavily_results)
        print("[Researcher] Tavily done. Condensing evidence...")

        # Condense raw web results into a tight research brief to save tokens
        brief = _invoke(
            [
                SystemMessage(content=(
                    "You are a Research Analyst. Extract ALL key facts, statistics, "
                    "claims and citations from the evidence. Output a numbered bullet-point "
                    "brief. Keep EVERY URL. No padding, no fluff. Max 1000 words."
                )),
                HumanMessage(content=(
                    f"Query: {state['user_query']}\n\nEvidence:\n{raw_evidence}"
                )),
            ],
            llm_researcher,
        )

        # Hard cap: 3500 chars (~875 tokens) so Writer batches have headroom
        if len(brief) > 3500:
            brief = brief[:3500] + "\n...[truncated]"

        print("[Researcher] Done.")
        return {
            **state,
            "research_data": brief,
            "current_step": "research_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "researcher"],
        }

    # ── NODE 2: WRITER (Batched) ───────────────────────────────────────────────
    def writer_node(state: ResearchGraphState) -> ResearchGraphState:
        print("[Writer] Starting batched writing...")
        query = state["user_query"]
        brief = state["research_data"]

        # Each batch: system (~150 tokens) + query + brief (~875 tokens) + instruction (~100 tokens)
        # Total input ~1125 tokens, leaving ~2000 tokens for output. Well under 8k TPM.

        base_system = (
            "You are an expert Research Writer for ScioAI. "
            "Write detailed, evidence-based Markdown. Cite sources inline like [1], [2]. "
            "Every claim needs a citation from the provided research brief. "
            "Be thorough, analytical and detailed. Do NOT truncate or summarise early."
        )

        # ── Batch 1: Title + Executive Summary + Key Findings ──────────────────
        print("[Writer] Batch 1/3: Title + Summary + Key Findings...")
        batch1 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nResearch Brief:\n{brief}\n\n"
                    "Write ONLY these sections (be detailed, min 400 words total):\n"
                    "# [Descriptive Title]\n"
                    "## Executive Summary\n"
                    "## Key Findings\n"
                )),
            ],
            llm_writer,
        )
        time.sleep(2)  # Pause to avoid hitting per-minute rate limits

        # ── Batch 2: Deep Analysis + Implications ──────────────────────────────
        print("[Writer] Batch 2/3: Deep Analysis + Implications...")
        batch2 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nResearch Brief:\n{brief}\n\n"
                    "Write ONLY these sections (be detailed, min 500 words, use subheadings):\n"
                    "## Deep Analysis\n"
                    "## Implications\n"
                )),
            ],
            llm_writer,
        )
        time.sleep(2)

        # ── Batch 3: Risks + Next Steps + Citations ─────────────────────────────
        print("[Writer] Batch 3/3: Risks + Next Steps + Citations...")
        batch3 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nResearch Brief:\n{brief}\n\n"
                    "Write ONLY these sections:\n"
                    "## Risks and Unknowns\n"
                    "## What to Verify Next\n"
                    "## Citations\n"
                    "(Citations: numbered Markdown link list. Use ONLY real URLs from the Research Brief.)\n"
                )),
            ],
            llm_writer,
        )

        # Assemble all batches into one full report
        full_draft = f"{batch1}\n\n{batch2}\n\n{batch3}"
        print(f"[Writer] All batches complete. Draft length: {len(full_draft)} chars.")

        return {
            **state,
            "draft": full_draft,
            "current_step": "draft_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "writer"],
        }

    # ── NODE 3: CRITIC (Lean pass) ────────────────────────────────────────────
    def critic_node(state: ResearchGraphState) -> ResearchGraphState:
        print("[Critic] Polishing report...")

        # Critic only receives the draft (no raw research) to stay under 8k TPM.
        # We pass the first 3000 chars for structural fixes, then append the rest unchanged.
        draft = state["draft"]
        draft_for_critic = draft[:3000]

        polished_head = _invoke(
            [
                SystemMessage(content=(
                    "You are the Editor for ScioAI. Polish the Markdown report: "
                    "fix broken sections, ensure all citations are proper Markdown links [n](url), "
                    "remove any meta-commentary like 'Note: I removed...', "
                    "improve flow. Return the corrected Markdown only."
                )),
                HumanMessage(content=(
                    f"Query: {state['user_query']}\n\n"
                    f"Report (first portion):\n{draft_for_critic}"
                )),
            ],
            llm_critic,
        )

        # Combine polished head with the unreviewed tail of the draft
        if len(draft) > 3000:
            final = polished_head + "\n\n" + draft[3000:]
        else:
            final = polished_head

        print(f"[Critic] Done. Final report length: {len(final)} chars.")

        return {
            **state,
            "final_report": final,
            "current_step": "critic_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "critic"],
        }

    # ── Build LangGraph ───────────────────────────────────────────────────────
    workflow = StateGraph(ResearchGraphState)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("critic", critic_node)

    workflow.add_edge(START, "researcher")
    workflow.add_edge("researcher", "writer")
    workflow.add_edge("writer", "critic")
    workflow.add_edge("critic", END)

    return workflow.compile()

from __future__ import annotations

import time
from datetime import datetime, timezone
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


def _today() -> str:
    """Return today's date as a string for grounding agent context."""
    return datetime.now(timezone.utc).strftime("%B %d, %Y")


def _format_tavily_results(search_payload: dict[str, Any]) -> str:
    """Format Tavily results into a clearly numbered evidence block."""
    entries = search_payload.get("results", [])
    if not entries:
        return "No results returned."
    lines: list[str] = []
    for idx, item in enumerate(entries[:5], start=1):
        title   = item.get("title", "Untitled")
        url     = item.get("url", "")
        content = (item.get("content", "") or "").strip()[:900]
        lines.append(
            f"[Source {idx}]\n"
            f"Title: {title}\n"
            f"URL: {url}\n"
            f"Excerpt: {content}"
        )
    return "\n\n" + "=" * 60 + "\n\n".join(lines)


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

    llm_researcher = _llm(model_researcher, temperature=0.1, max_tokens=1500)
    llm_writer     = _llm(model_writer,     temperature=0.4, max_tokens=2000)
    llm_critic     = _llm(model_critic,     temperature=0.1, max_tokens=2000)
    llm_fallback   = _llm(model_fallback,   temperature=0.1, max_tokens=2000)

    def _invoke(messages: list[Any], llm: ChatOpenAI) -> str:
        try:
            msg = llm.invoke(messages)
        except Exception as e:
            print(f"Primary LLM failed ({e}), trying fallback...")
            time.sleep(3)
            msg = llm_fallback.invoke(messages)
        return msg.content if isinstance(msg.content, str) else str(msg.content)

    # ── NODE 1: RESEARCHER ─────────────────────────────────────────────────────
    def researcher_node(state: ResearchGraphState) -> ResearchGraphState:
        today = _today()
        query = state["user_query"]
        print(f"[Researcher] Query: {query} | Date: {today}")

        # Run TWO targeted searches to get richer, more relevant evidence
        results_a = tavily_client.search(query=query, max_results=3)
        time.sleep(1)
        results_b = tavily_client.search(
            query=f"{query} data statistics research {today[:4]}",
            max_results=3,
        )

        raw_a = _format_tavily_results(results_a)
        raw_b = _format_tavily_results(results_b)
        combined_evidence = f"=== Search 1 ===\n{raw_a}\n\n=== Search 2 ===\n{raw_b}"

        # Hard cap on evidence to stay within token budget
        if len(combined_evidence) > 5000:
            combined_evidence = combined_evidence[:5000] + "\n...[clipped]"

        print("[Researcher] Tavily searches done. Building verified fact sheet...")

        # The researcher's job is to be a SKEPTICAL ANALYST, not a summarizer
        researcher_system = f"""You are a rigorous Research Analyst for ScioAI. Today is {today}.

CRITICAL RULES — violating any of these is a failure:
1. ONLY include facts that are EXPLICITLY stated in the evidence below.
2. REJECT any source whose content is clearly irrelevant to the query (e.g., a construction bid, a job posting, an unrelated PDF).
3. For each fact, write: "[Fact] ... [Source X]" so attribution is traceable.
4. If a statistic or claim exists in the source, quote it EXACTLY. Do NOT round, extrapolate or paraphrase numbers.
5. If a source's date is unknown or older than 2 years, mark it [DATED].
6. If you find fewer than 3 genuinely relevant sources, say so explicitly.
7. Do NOT invent sub-topics, companies, or events not mentioned in the sources.

Output format: A structured "Verified Fact Sheet" with sections:
- Relevant Sources (list only sources that are actually about the query)
- Key Verified Facts (with [Source X] attribution on every bullet)
- Data Points & Statistics (exact figures only, never estimated)
- Gaps in Evidence (what the sources don't cover)"""

        fact_sheet = _invoke(
            [
                SystemMessage(content=researcher_system),
                HumanMessage(content=(
                    f"Research Query: {query}\n\n"
                    f"Raw Evidence:\n{combined_evidence}"
                )),
            ],
            llm_researcher,
        )

        # Hard cap to give Writer batches enough headroom
        if len(fact_sheet) > 3200:
            fact_sheet = fact_sheet[:3200] + "\n...[clipped for token budget]"

        print(f"[Researcher] Fact sheet ready ({len(fact_sheet)} chars).")
        return {
            **state,
            "research_data": fact_sheet,
            "current_step": "research_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "researcher"],
        }

    # ── NODE 2: WRITER (Batched, anti-hallucination) ──────────────────────────
    def writer_node(state: ResearchGraphState) -> ResearchGraphState:
        today = _today()
        query = state["user_query"]
        facts = state["research_data"]
        print("[Writer] Starting batched writing with anti-hallucination rules...")

        # Strict anti-hallucination base system prompt
        base_system = f"""You are a rigorous Research Writer for ScioAI. Today is {today}.

ABSOLUTE RULES — breaking these means the output is rejected:
1. ONLY write claims that are directly supported by the Verified Fact Sheet provided.
2. If a statistic is in the Fact Sheet, quote it exactly. NEVER round, inflate or extrapolate numbers.
3. If you don't have a source for a claim, either omit it OR clearly label it [UNVERIFIED ESTIMATE].
4. Cite every factual claim inline like [1], [2] referencing the Source numbers in the Fact Sheet.
5. Do NOT invent organizations, reports, PDFs, or events not named in the Fact Sheet.
6. If the evidence is thin on a subtopic, say "Evidence on this point is limited" instead of speculating.
7. Write clearly structured, professional Markdown. Be detailed where evidence supports it."""

        # ── Batch 1: Title + Executive Summary + Key Findings ──────────────────
        print("[Writer] Batch 1/3: Title + Summary + Key Findings...")
        batch1 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                    "Write ONLY these sections. Be detailed (min 350 words). "
                    "Every claim needs an inline citation [n].\n\n"
                    "# [Descriptive, Specific Title — not generic]\n"
                    "## Executive Summary\n"
                    "## Key Findings\n"
                )),
            ],
            llm_writer,
        )
        time.sleep(3)  # Respect rate limits between batches

        # ── Batch 2: Deep Analysis + Implications ──────────────────────────────
        print("[Writer] Batch 2/3: Deep Analysis + Implications...")
        batch2 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                    "Write ONLY these sections. Be analytical (min 400 words). "
                    "Use subheadings. Mark any thin-evidence areas explicitly.\n\n"
                    "## Deep Analysis\n"
                    "## Implications\n"
                )),
            ],
            llm_writer,
        )
        time.sleep(3)

        # ── Batch 3: Risks + Next Steps + Citations ─────────────────────────────
        print("[Writer] Batch 3/3: Risks + Next Steps + Citations...")
        batch3 = _invoke(
            [
                SystemMessage(content=base_system),
                HumanMessage(content=(
                    f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                    "Write ONLY these sections:\n\n"
                    "## Risks and Unknowns\n"
                    "## What to Verify Next\n"
                    "## Citations\n"
                    "For Citations: numbered Markdown link list. "
                    "ONLY include URLs that appear in the Verified Fact Sheet. "
                    "Format: [n] [Title](URL)\n"
                )),
            ],
            llm_writer,
        )

        full_draft = f"{batch1}\n\n---\n\n{batch2}\n\n---\n\n{batch3}"
        print(f"[Writer] All batches done. Draft: {len(full_draft)} chars.")

        return {
            **state,
            "draft": full_draft,
            "current_step": "draft_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "writer"],
        }

    # ── NODE 3: CRITIC (Fact-checking + Polish) ───────────────────────────────
    def critic_node(state: ResearchGraphState) -> ResearchGraphState:
        today = _today()
        draft = state["draft"]
        print("[Critic] Starting fact-check + polish pass...")

        # Critic polishes the head of the draft (stays within token budget)
        draft_for_critic = draft[:2800]

        critic_system = f"""You are a Fact-Checking Editor for ScioAI. Today is {today}.

Your job is to catch hallucinations and improve quality:
1. FLAG any statistic, market size, or event claim that seems inflated or unverified. Replace with [UNVERIFIED] if unsure.
2. Remove any citations that look fabricated (e.g., PDF filenames unrelated to the topic, made-up report names).
3. Ensure the report does NOT claim things are current if they are from years ago.
4. Fix any claims like "X has already happened" if the evidence suggests it is still in progress.
5. Remove all meta-commentary ("Note: I removed...", "As an AI...").
6. Ensure all citations in ## Citations are proper Markdown links: [n] [Title](URL).
7. Return ONLY the corrected Markdown report."""

        polished_head = _invoke(
            [
                SystemMessage(content=critic_system),
                HumanMessage(content=(
                    f"Query: {state['user_query']}\n\n"
                    f"Report (first section for review):\n{draft_for_critic}"
                )),
            ],
            llm_critic,
        )

        # Append unreviewed tail of the draft as-is
        final = polished_head
        if len(draft) > 2800:
            final = polished_head + "\n\n" + draft[2800:]

        # Sanity check: if critic truncated too aggressively, use original draft
        if len(final) < len(draft) * 0.4:
            print("[Critic] Output too short, reverting to original draft.")
            final = draft

        print(f"[Critic] Done. Final report: {len(final)} chars.")
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

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

    # Kept max_tokens lower to respect strict 8000 TPM limit on free tier
    llm_researcher = _llm(model_researcher, temperature=0.1, max_tokens=1500)
    llm_writer     = _llm(model_writer,     temperature=0.4, max_tokens=2500)
    llm_critic     = _llm(model_critic,     temperature=0.1, max_tokens=3000)
    llm_fallback   = _llm(model_fallback,   temperature=0.1, max_tokens=3000)

    def _invoke(messages: list[Any], llm: ChatOpenAI) -> str:
        max_retries = 3
        base_delay = 2
        for attempt in range(max_retries):
            try:
                msg = llm.invoke(messages)
                return msg.content if isinstance(msg.content, str) else str(msg.content)
            except Exception as e:
                print(f"Primary LLM failed ({e}), attempt {attempt + 1}/{max_retries}")
                if attempt == max_retries - 1:
                    print("Falling back to secondary model...")
                    msg = llm_fallback.invoke(messages)
                    return msg.content if isinstance(msg.content, str) else str(msg.content)
                time.sleep(base_delay * (2 ** attempt)) # Exponential backoff

    # ── NODE 1: RESEARCHER ─────────────────────────────────────────────────────
    def researcher_node(state: ResearchGraphState) -> ResearchGraphState:
        import concurrent.futures
        today = _today()
        query = state["user_query"]
        print(f"[Researcher] Query: {query} | Date: {today}")

        # Run multiple targeted searches in parallel to get richer, more relevant evidence
        # Increased max_results to 6 for deeper research gathering
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_a = executor.submit(tavily_client.search, query=query, max_results=6)
            future_b = executor.submit(
                tavily_client.search,
                query=f"{query} data statistics research {today[:4]} comprehensive",
                max_results=6,
            )
            results_a = future_a.result()
            results_b = future_b.result()

        raw_a = _format_tavily_results(results_a)
        raw_b = _format_tavily_results(results_b)
        combined_evidence = f"=== Search 1 ===\n{raw_a}\n\n=== Search 2 ===\n{raw_b}"

        # Relaxed cap but kept under TPM limits (8000 chars is ~2000 tokens)
        if len(combined_evidence) > 8000:
            combined_evidence = combined_evidence[:8000] + "\n...[clipped]"

        print("[Researcher] Tavily searches done. Building verified fact sheet...")

        researcher_system = f"""You are a rigorous Research Analyst for ScioAI. Today is {today}.

CRITICAL RULES — violating any of these is a failure:
1. ONLY include facts that are EXPLICITLY stated in the evidence below.
2. REJECT any source whose content is clearly irrelevant to the query (e.g., a construction bid, a job posting, an unrelated PDF).
3. For each fact, write: "[Fact] ... [Source X]" so attribution is traceable.
4. If a statistic or claim exists in the source, quote it EXACTLY. Do NOT round, extrapolate or paraphrase numbers.
5. If a source's date is unknown or older than 2 years, mark it [DATED].
6. Do NOT invent sub-topics, companies, or events not mentioned in the sources.
7. Be extremely detailed and exhaustive. Extract as much relevant information, nuances, and data as possible.

Output format: A highly detailed, structured "Verified Fact Sheet" with sections:
- Relevant Sources (list only sources that are actually about the query)
- Comprehensive Verified Facts (with [Source X] attribution on every bullet, go deep into details)
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

        # Relaxed char limit to 6000 (~1500 tokens) to retain deep insights without hitting rate limits
        if len(fact_sheet) > 6000:
            fact_sheet = fact_sheet[:6000] + "\n...[clipped for token budget]"

        print(f"[Researcher] Fact sheet ready ({len(fact_sheet)} chars).")
        return {
            **state,
            "research_data": fact_sheet,
            "current_step": "research_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "researcher"],
        }

    # ── NODE 2: WRITER (Batched, anti-hallucination) ──────────────────────────
    def writer_node(state: ResearchGraphState) -> ResearchGraphState:
        import concurrent.futures
        today = _today()
        query = state["user_query"]
        facts = state["research_data"]
        print("[Writer] Starting batched writing with anti-hallucination rules...")

        base_system = f"""You are a rigorous Research Writer for ScioAI. Today is {today}.

ABSOLUTE RULES — breaking these means the output is rejected:
1. ONLY write claims that are directly supported by the Verified Fact Sheet provided.
2. If a statistic is in the Fact Sheet, quote it exactly. NEVER round, inflate or extrapolate numbers.
3. If you don't have a source for a claim, either omit it OR clearly label it [UNVERIFIED ESTIMATE].
4. Cite every factual claim inline like [1], [2] referencing the Source numbers in the Fact Sheet.
5. Do NOT invent organizations, reports, PDFs, or events not named in the Fact Sheet.
6. Write extensively and comprehensively. Provide deep, thorough analysis rather than brief summaries.
7. Write clearly structured, professional Markdown. Use detailed subheadings where appropriate."""

        # Prepare messages for parallel execution
        msg1 = [
            SystemMessage(content=base_system),
            HumanMessage(content=(
                f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                "Write ONLY these sections. Be extremely detailed and exhaustive (min 600 words). "
                "Every claim needs an inline citation [n].\n\n"
                "# [Descriptive, Specific Title — not generic]\n"
                "## Executive Summary\n"
                "## Key Findings\n"
            )),
        ]

        msg2 = [
            SystemMessage(content=base_system),
            HumanMessage(content=(
                f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                "Write ONLY these sections. Be highly analytical and detailed (min 800 words). "
                "Use deep subheadings and explore nuances. Mark any thin-evidence areas explicitly.\n\n"
                "## Deep Analysis\n"
                "## Implications\n"
            )),
        ]

        msg3 = [
            SystemMessage(content=base_system),
            HumanMessage(content=(
                f"Topic: {query}\n\nVerified Fact Sheet:\n{facts}\n\n"
                "Write ONLY these sections in detail (min 400 words):\n\n"
                "## Risks and Unknowns\n"
                "## What to Verify Next\n"
                "## Citations\n"
                "For Citations: numbered Markdown link list. "
                "ONLY include URLs that appear in the Verified Fact Sheet. "
                "Format: [n] [Title](URL)\n"
            )),
        ]

        # Execute batches sequentially with delays to respect the 8000 TPM limit
        print("[Writer] Batch 1/3: Title + Summary + Key Findings...")
        batch1 = _invoke(msg1, llm_writer)
        time.sleep(12)  # Generous sleep to reset TPM bucket

        print("[Writer] Batch 2/3: Deep Analysis + Implications...")
        batch2 = _invoke(msg2, llm_writer)
        time.sleep(12)

        print("[Writer] Batch 3/3: Risks + Next Steps + Citations...")
        batch3 = _invoke(msg3, llm_writer)

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
        print("[Critic] Starting full draft fact-check + polish pass...")

        critic_system = f"""You are a Fact-Checking Editor for ScioAI. Today is {today}.

Your job is to critically review the FULL draft and fix hallucinations without removing important details:
1. FLAG any statistic, market size, or event claim that seems inflated or unverified. Replace with [UNVERIFIED] if unsure.
2. Remove any citations that look fabricated (e.g., PDF filenames unrelated to the topic, made-up report names).
3. Ensure the report does NOT claim things are current if they are from years ago.
4. Fix any claims like "X has already happened" if the evidence suggests it is still in progress.
5. Remove all meta-commentary ("Note: I removed...", "As an AI...").
6. Ensure all citations in ## Citations are proper Markdown links: [n] [Title](URL).
7. DO NOT summarize or arbitrarily truncate the report. The final report MUST retain all depth and analytical sections.
8. Return ONLY the corrected Markdown report."""

        final = _invoke(
            [
                SystemMessage(content=critic_system),
                HumanMessage(content=(
                    f"Query: {state['user_query']}\n\n"
                    f"Full Draft Report for review:\n{draft}"
                )),
            ],
            llm_critic,
        )

        # Sanity check: if critic truncated too aggressively (e.g. system timeout or failure), use original draft
        if len(final) < len(draft) * 0.4:
            print("[Critic] Output significantly too short, reverting to original draft.")
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

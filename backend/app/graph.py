from __future__ import annotations

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
    # Reduced to top 5 results to save tokens
    for idx, item in enumerate(entries[:5], start=1):
        title = item.get("title", "Untitled")
        url = item.get("url", "")
        # Truncate content to ~1000 chars per result
        content = (item.get("content", "") or "").strip()[:1000]
        lines.append(f"[{idx}] {title}\nSource: {url}\nEvidence: {content}")
    return "\n\n".join(lines)





def build_research_graph(
    tavily_client: TavilyClient,
    groq_api_key: str,
    model_researcher: str,
    model_writer: str,
    model_critic: str,
    model_fallback: str,
):
    def _llm(model: str, *, temperature: float, max_tokens: int) -> ChatOpenAI:

        # Groq is OpenAI-compatible via their API endpoint.
        return ChatOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=300, # Increased to 5 minutes for long reports
        )

    # Reduced max_tokens to stay under 8k total (Prompt + Completion)
    llm_researcher = _llm(model_researcher, temperature=0.25, max_tokens=1500)
    llm_writer = _llm(model_writer, temperature=0.6, max_tokens=4000)
    llm_critic = _llm(model_critic, temperature=0.15, max_tokens=4000)
    llm_fallback = _llm(model_fallback, temperature=0.2, max_tokens=4000)

    def _invoke_with_fallback(messages: list[Any], primary: ChatOpenAI) -> str:
        try:
            msg = primary.invoke(messages)
        except Exception:
            msg = llm_fallback.invoke(messages)
        return msg.content if isinstance(msg.content, str) else str(msg.content)

    def researcher_node(state: ResearchGraphState) -> ResearchGraphState:
        print(f"--- Entering Researcher Node for query: {state['user_query']} ---")
        query = state["user_query"]
        print("Tavily search starting...")
        # Get 5 results
        tavily_search = tavily_client.search(query=query, max_results=5)
        print("Tavily search complete.")
        web_context = _format_tavily_results(tavily_search)

        # We summarize the evidence immediately to save tokens for the writer.
        researcher_prompt = (
            "You are the Research Analyst for ScioAI.\n"
            "Your goal is to extract ALL critical facts, data points, and citations from the evidence below.\n"
            "Format your output as a 'Condensed Research Brief' with bullet points.\n"
            "Maintain all URLs and citations. Be extremely dense and factual. No fluff."
        )
        
        condensed_brief = _invoke_with_fallback(
            [
                SystemMessage(content=researcher_prompt),
                HumanMessage(
                    content=(
                        f"User Query: {state['user_query']}\n\n"
                        f"Evidence:\n{web_context}"
                    )
                ),
            ],
            llm_researcher,
        )

        # Final safety check: hard truncate the research data to ~12k chars 
        # to ensure we never exceed the 8k token limit (Prompt + Completion).
        final_data = f"## Research Brief\n{condensed_brief}"
        if len(final_data) > 12000:
            final_data = final_data[:12000] + "\n... [truncated for token limits] ..."

        return {
            **state,
            "research_data": final_data,
            "current_step": "research_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "researcher"],
        }

    def writer_node(state: ResearchGraphState) -> ResearchGraphState:
        print("--- Entering Writer Node ---")
        writer_prompt = (
            "You are the Writer agent for ScioAI.\n\n"
            "Goal: Produce a detailed, citation-grounded research report in Markdown.\n"
            "Write for a technical audience, but keep it readable.\n\n"
            "Hard requirements:\n"
            "- Length: at least 900 words (unless user explicitly asked for concise).\n"
            "- Use the exact section headings below.\n"
            "- Every major claim must include an inline citation like [1].\n"
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

        print("LLM Writer starting...")
        draft = _invoke_with_fallback(
            [
                SystemMessage(content=writer_prompt),
                HumanMessage(
                    content=(
                        f"User Query:\n{state['user_query']}\n\n"
                        f"Research Data:\n{state['research_data']}"
                    )
                ),
            ],
            llm_writer,
        )
        print("LLM Writer complete.")

        return {
            **state,
            "draft": draft,
            "current_step": "draft_complete",
            "workflow_steps": [*state.get("workflow_steps", []), "writer"],
        }

    def critic_node(state: ResearchGraphState) -> ResearchGraphState:
        print("--- Entering Critic Node ---")
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

        print("LLM Critic starting...")
        final_report = _invoke_with_fallback(
            [
                SystemMessage(content=critic_prompt),
                HumanMessage(
                    content=(
                        f"Original Query:\n{state['user_query']}\n\n"
                        f"Research Data (authoritative sources):\n{state['research_data']}\n\n"
                        f"Draft to review:\n{state['draft']}"
                    )
                ),
            ],
            llm_critic,
        )
        print("LLM Critic complete.")

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

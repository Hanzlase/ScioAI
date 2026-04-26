from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pinecone import Pinecone
from tavily import TavilyClient

from .config import get_settings
from .graph import build_research_graph
from .models import ChatRequest, ChatResponse


app = FastAPI(title="ScioAI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"(http://localhost:\d+|https://.*\.up\.railway\.app)",
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



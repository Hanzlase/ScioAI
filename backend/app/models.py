from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    response: str
    current_step: str
    workflow_steps: list[str] = Field(default_factory=list)


class PDFRequest(BaseModel):
    markdown: str = Field(..., min_length=1)
    filename: str | None = None

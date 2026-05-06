from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
import bleach


class ExplainedTopic(BaseModel):
    topic: str
    depth: str  # "surface" | "deep" | "expert"
    date: str   # ISO date string


class MemorySummary(BaseModel):
    studied_concepts: list[str] = []
    weak_areas: list[str] = []
    strong_areas: list[str] = []
    quiz_scores: dict[str, int] = {}
    interview_sessions: int = 0
    preferred_style: str = ""
    explained_topics: list[ExplainedTopic] = []


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AgentRequest(BaseModel):
    mode: Literal["ask", "interview", "quiz", "debug", "threeam"] = "ask"
    message: str = Field(..., min_length=1, max_length=600)
    concept_id: Optional[str] = None
    memory: Optional[MemorySummary] = None
    history: list[ConversationTurn] = Field(default=[], max_length=6)

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v):
        # Strip HTML and scripts
        cleaned = bleach.clean(v, tags=[], strip=True)
        # Basic prompt injection patterns
        injection_patterns = [
            "ignore previous", "ignore all previous", "disregard",
            "forget your instructions", "new instructions:", "system prompt",
            "you are now", "pretend you are", "act as if",
        ]
        lower = cleaned.lower()
        for pattern in injection_patterns:
            if pattern in lower:
                raise ValueError("Invalid input")
        return cleaned


class MemoryUpdate(BaseModel):
    weak_areas: list[str] = []
    strong_areas: list[str] = []
    session_note: str = ""
    interview_score: Optional[int] = None
    explained_topics: list[ExplainedTopic] = []


class AgentResponse(BaseModel):
    response: str
    suggested_questions: list[str] = []
    concepts_referenced: list[str] = []
    memory_update: Optional[MemoryUpdate] = None

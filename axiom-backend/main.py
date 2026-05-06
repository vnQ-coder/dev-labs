import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from models import AgentRequest
from agent import run_agent
from tools import load_concepts_from_api

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/day", "20/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load concepts at startup
    logger.info("Loading concept data from Next.js API...")
    await load_concepts_from_api()
    logger.info("Axiom ready.")
    yield


app = FastAPI(
    title="Axiom — System Design Mentor API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://system-design-app-mauve.vercel.app,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "axiom", "version": "1.0.0"}


@app.post("/api/agent")
@limiter.limit("20/minute;100/day")
async def agent_endpoint(request: Request, body: AgentRequest):
    """Main Axiom agent endpoint — returns SSE stream."""
    return StreamingResponse(
        run_agent(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/concepts/list")
async def list_concepts():
    """Return available concept IDs and titles."""
    from tools import CONCEPT_META

    return {"concepts": [{"id": k, **v} for k, v in CONCEPT_META.items()]}

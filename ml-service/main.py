"""PrepHelp ML Analysis Service.

Provides health checks, speech analysis, text analysis, and coaching endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.speech import router as speech_router
from app.routers.text import router as text_router
from app.routers.coach import router as coach_router
from app.routers.profile import router as profile_router
from app.routers.planner import router as planner_router
from app.llm import get_llm_metrics

app = FastAPI(
    title="PrepHelp ML Service",
    version="0.3.0",
    description="Machine Learning service providing speech, text, and coaching analysis for PrepHelp.",
)

# CORS middleware for cross-origin frontend/backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(speech_router)
app.include_router(text_router)
app.include_router(coach_router)
app.include_router(profile_router)
app.include_router(planner_router)


@app.get("/health")
def health() -> dict:
    """Service health check endpoint."""
    return {
        "status": "ok",
        "service": "prephelp-ml",
        "phase": 3,
    }


@app.get("/llm/metrics")
def llm_metrics() -> dict:
    """Return LLM usage and budget statistics."""
    return get_llm_metrics()

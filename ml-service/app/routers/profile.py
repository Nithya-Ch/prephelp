"""Profile update endpoint – EMA/Elo learner profile math."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import math

router = APIRouter(prefix="/profile", tags=["profiler"])


class DimensionState(BaseModel):
    score: float = 50.0
    uncertainty: float = 30.0
    trend: float = 0.0
    lastPracticed: Optional[str] = None
    attempts: int = 0


class ProfileUpdateRequest(BaseModel):
    currentProfile: Dict[str, DimensionState] = Field(default_factory=dict)
    sessionScores: Dict[str, Optional[float]] = Field(default_factory=dict)
    exerciseDifficulty: float = 50.0
    method: str = "ema"  # "ema" or "elo"
    recentScores: Dict[str, List[float]] = Field(default_factory=dict)
    errorPatterns: Dict[str, int] = Field(default_factory=dict)


class DimensionUpdate(BaseModel):
    score: float
    uncertainty: float
    trend: float
    attempts: int
    changed: bool


class ProfileUpdateResponse(BaseModel):
    updatedDimensions: Dict[str, DimensionUpdate]
    errorPatterns: Dict[str, int]
    method: str


# Default dimension names
ALL_DIMENSIONS = [
    "grammar", "vocabulary", "fluency", "pace",
    "filler_control", "structure", "confidence",
]

# EMA default alpha
EMA_ALPHA = 0.3

# Elo constants
ELO_K_BASE = 0.5
ELO_SCALE = 15.0

# Uncertainty floor/ceiling
UNCERTAINTY_FLOOR = 5.0
UNCERTAINTY_DECAY = 0.9


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _compute_trend(recent: List[float], n: int = 5) -> float:
    """Slope of last N scores via simple linear regression (points per session)."""
    vals = recent[-n:]
    if len(vals) < 2:
        return 0.0
    n_pts = len(vals)
    x_mean = (n_pts - 1) / 2.0
    y_mean = sum(vals) / n_pts
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(vals))
    den = sum((i - x_mean) ** 2 for i in range(n_pts))
    if den == 0:
        return 0.0
    return round(num / den, 2)


def _apply_error_decay(patterns: Dict[str, int], decay: float = 0.95) -> Dict[str, int]:
    """Accumulate error pattern counts with multiplicative decay."""
    decayed: Dict[str, int] = {}
    for cat, count in patterns.items():
        decayed[cat] = max(0, int(count * decay))
    return decayed


@router.post("/update", response_model=ProfileUpdateResponse)
def update_profile(req: ProfileUpdateRequest):
    """Update learner profile dimensions based on session analysis scores."""
    updated: Dict[str, DimensionUpdate] = {}

    for dim in ALL_DIMENSIONS:
        session_score = req.sessionScores.get(dim)
        if session_score is None:
            # Dimension not evaluated (e.g. speech-only dims in text mode)
            if dim in req.currentProfile:
                state = req.currentProfile[dim]
                updated[dim] = DimensionUpdate(
                    score=state.score,
                    uncertainty=state.uncertainty,
                    trend=state.trend,
                    attempts=state.attempts,
                    changed=False,
                )
            continue

        # Get current state or initialize
        state = req.currentProfile.get(dim, DimensionState())
        old_score = state.score
        old_uncertainty = state.uncertainty

        # Apply update method
        if req.method == "elo":
            expected = _sigmoid((old_score - req.exerciseDifficulty) / ELO_SCALE)
            actual = session_score / 100.0
            k = ELO_K_BASE * (old_uncertainty / 30.0 + 0.5)
            k = max(0.1, min(2.0, k))  # cap K
            delta = k * (actual - expected) * 100.0 / 4.0
            new_score = old_score + delta
        else:
            # EMA (default)
            new_score = EMA_ALPHA * session_score + (1 - EMA_ALPHA) * old_score

        new_score = max(0.0, min(100.0, round(new_score, 1)))

        # Uncertainty decays with each observation
        new_uncertainty = max(UNCERTAINTY_FLOOR, round(old_uncertainty * UNCERTAINTY_DECAY, 1))

        # Compute trend from recent scores
        recent = req.recentScores.get(dim, [])
        recent_with_new = recent + [session_score]
        trend = _compute_trend(recent_with_new)

        updated[dim] = DimensionUpdate(
            score=new_score,
            uncertainty=new_uncertainty,
            trend=trend,
            attempts=state.attempts + 1,
            changed=True,
        )

    # Apply error pattern decay and merge new
    merged_patterns = _apply_error_decay(req.errorPatterns)

    return ProfileUpdateResponse(
        updatedDimensions=updated,
        errorPatterns=merged_patterns,
        method=req.method,
    )

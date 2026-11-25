"""Planner endpoint – adaptive next-exercise selection engine."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import random
import math

router = APIRouter(prefix="/planner", tags=["planner"])


class CandidateExercise(BaseModel):
    exerciseId: str
    targetSkills: List[str] = Field(default_factory=list)
    difficulty: float = 50.0
    type: str = "interview"
    tags: List[str] = Field(default_factory=list)


class DimensionProfile(BaseModel):
    score: float = 50.0
    uncertainty: float = 30.0
    trend: float = 0.0
    attempts: int = 0


class PlannerRequest(BaseModel):
    userId: str
    profile: Dict[str, DimensionProfile] = Field(default_factory=dict)
    candidates: List[CandidateExercise] = Field(default_factory=list)
    recentExerciseIds: List[str] = Field(default_factory=list)
    strategy: str = "rule"  # "rule", "weighted", "bandit", "random", "fixed"
    coldStart: bool = False
    diagnosticSetIds: List[str] = Field(default_factory=list)


class PlannerResponse(BaseModel):
    exerciseId: str
    strategy: str
    explanation: str
    factors: Dict[str, Any] = Field(default_factory=dict)


def _get_weakness(profile: Dict[str, DimensionProfile]) -> List[tuple]:
    """Return dimensions sorted by weakness (highest weakness first).
    weakness = (100 - score) / 100 weighted by uncertainty.
    """
    weaknesses = []
    for dim, state in profile.items():
        weakness = ((100.0 - state.score) / 100.0) * (1.0 + state.uncertainty / 100.0)
        weaknesses.append((dim, weakness, state))
    weaknesses.sort(key=lambda x: x[1], reverse=True)
    return weaknesses


@router.post("/next", response_model=PlannerResponse)
def select_next_exercise(req: PlannerRequest):
    """Select the next exercise based on learner profile, strategy, and candidate pool."""
    candidates = req.candidates
    recent_ids = set(req.recentExerciseIds)

    # Filter out recently done exercises
    available = [c for c in candidates if c.exerciseId not in recent_ids]
    if not available:
        available = candidates  # fallback to all if everything was recent

    if not available:
        return PlannerResponse(
            exerciseId="",
            strategy=req.strategy,
            explanation="No candidate exercises available.",
            factors={},
        )

    # Cold start: use diagnostic set
    if req.coldStart and req.diagnosticSetIds:
        for diag_id in req.diagnosticSetIds:
            match = next((c for c in available if c.exerciseId == diag_id), None)
            if match:
                return PlannerResponse(
                    exerciseId=match.exerciseId,
                    strategy="fixed",
                    explanation=f"Cold start diagnostic exercise ({match.type}). Building your baseline profile.",
                    factors={"reason": "cold_start", "diagnostic_index": req.diagnosticSetIds.index(diag_id)},
                )

    # Random strategy
    if req.strategy == "random":
        chosen = random.choice(available)
        return PlannerResponse(
            exerciseId=chosen.exerciseId,
            strategy="random",
            explanation="Randomly selected for variety.",
            factors={"pool_size": len(available)},
        )

    # Rule-based (v1)
    if req.strategy == "rule":
        weaknesses = _get_weakness(req.profile)
        if not weaknesses:
            chosen = random.choice(available)
            return PlannerResponse(
                exerciseId=chosen.exerciseId,
                strategy="rule",
                explanation="No profile data yet. Selected a general exercise.",
                factors={},
            )

        weakest_dim, weakness_val, state = weaknesses[0]
        target_diff = min(100.0, state.score + 10.0)

        # Find exercises targeting the weakest dimension near target difficulty
        scored_candidates = []
        for c in available:
            skill_match = 1.0 if weakest_dim in [s.lower().replace(" ", "_") for s in c.targetSkills] else 0.3
            diff_fit = max(0.0, 1.0 - abs(c.difficulty - target_diff) / 50.0)
            score = skill_match * 0.6 + diff_fit * 0.4
            scored_candidates.append((c, score))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        chosen = scored_candidates[0][0]

        explanation = (
            f"Your weakest area is {weakest_dim.replace('_', ' ')} "
            f"(score: {state.score:.0f}, uncertainty: {state.uncertainty:.0f}). "
            f"This exercise targets it at difficulty {chosen.difficulty:.0f} "
            f"(your target: {target_diff:.0f})."
        )

        # Add specific coaching context
        if weakest_dim == "filler_control" and state.score < 60:
            explanation += " Focus on pausing instead of using filler words."
        elif weakest_dim == "structure" and state.score < 60:
            explanation += " Try planning: Opening → Points → Example → Conclusion."
        elif weakest_dim == "confidence" and state.score < 50:
            explanation += " Start with an easier prompt to build momentum."

        return PlannerResponse(
            exerciseId=chosen.exerciseId,
            strategy="rule",
            explanation=explanation,
            factors={
                "weakest_dimension": weakest_dim,
                "weakness_value": round(weakness_val, 3),
                "target_difficulty": target_diff,
                "skill_match": scored_candidates[0][1],
            },
        )

    # Weighted (v2)
    if req.strategy == "weighted":
        weaknesses = _get_weakness(req.profile)
        weakness_map = {dim: w for dim, w, _ in weaknesses}

        scored = []
        for c in available:
            # Weakness contribution
            skill_weakness = 0.0
            for skill in c.targetSkills:
                sk = skill.lower().replace(" ", "_")
                skill_weakness = max(skill_weakness, weakness_map.get(sk, 0.3))

            # Recency factor (not in recent = bonus)
            recency_factor = 1.2 if c.exerciseId not in recent_ids else 0.5

            # Difficulty fit
            avg_score = sum(s.score for s in req.profile.values()) / max(1, len(req.profile))
            diff_fit = max(0.1, 1.0 - abs(c.difficulty - (avg_score + 10)) / 50.0)

            # Novelty (different type)
            novelty = 1.0

            priority = skill_weakness * 0.4 * recency_factor * novelty * diff_fit
            scored.append((c, priority))

        scored.sort(key=lambda x: x[1], reverse=True)
        chosen = scored[0][0]

        top_weak = weaknesses[0] if weaknesses else ("unknown", 0, DimensionProfile())
        return PlannerResponse(
            exerciseId=chosen.exerciseId,
            strategy="weighted",
            explanation=(
                f"Selected based on weighted priority score. "
                f"Primary focus: {top_weak[0].replace('_', ' ')} (weakness: {top_weak[1]:.2f}). "
                f"Exercise difficulty: {chosen.difficulty:.0f}."
            ),
            factors={
                "priority_score": round(scored[0][1], 3),
                "pool_size": len(available),
                "focus_dimension": top_weak[0],
            },
        )

    # Fixed strategy (specific exercise requested)
    if req.strategy == "fixed" and available:
        chosen = available[0]
        return PlannerResponse(
            exerciseId=chosen.exerciseId,
            strategy="fixed",
            explanation="Specific exercise requested.",
            factors={},
        )

    # Default fallback
    chosen = random.choice(available)
    return PlannerResponse(
        exerciseId=chosen.exerciseId,
        strategy=req.strategy,
        explanation="Selected from available exercises.",
        factors={"pool_size": len(available)},
    )

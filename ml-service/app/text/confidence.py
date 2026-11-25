"""Transparent composite confidence indicator for text-only attempts."""

from typing import Any, Dict, List
from pydantic import BaseModel
from app.config import config
from app.text.hedging import HedgingMetrics


class TextConfidenceResult(BaseModel):
    confidence_score: float
    factors: Dict[str, float]
    label: str = "confidence indicator"


def compute_text_confidence(hedging_metrics: HedgingMetrics) -> TextConfidenceResult:
    """Calculate transparent text confidence indicator (0-100 scale).
    
    Formula:
    confidence = 0.40 * hedging_subscore + 0.35 * completeness_subscore + 0.25 * repetition_subscore
    """
    weights = config.text_confidence_weights

    # 1. Hedging subscore: 0 hedges = 100, drops with hedging ratio
    # 5 or more hedges per 100 words -> drops towards 0
    hedging_ratio = hedging_metrics.hedging_ratio
    hedging_subscore = max(0.0, 100.0 - (hedging_ratio * 20.0))

    # 2. Completeness subscore: completeness_ratio (0.0 to 1.0) -> (0 to 100)
    completeness_subscore = hedging_metrics.completeness_ratio * 100.0

    # 3. Repetition subscore: 0 repeated phrases = 100, drops by 15 per repeated phrase
    rep_count = hedging_metrics.repetition_count
    repetition_subscore = max(0.0, 100.0 - (rep_count * 15.0))

    composite = (
        weights.hedging * hedging_subscore
        + weights.completeness * completeness_subscore
        + weights.repetition * repetition_subscore
    )

    composite = max(0.0, min(100.0, round(composite, 1)))

    return TextConfidenceResult(
        confidence_score=composite,
        factors={
            "hedging_subscore": round(hedging_subscore, 1),
            "completeness_subscore": round(completeness_subscore, 1),
            "repetition_subscore": round(repetition_subscore, 1),
            "hedging_weight": weights.hedging,
            "completeness_weight": weights.completeness,
            "repetition_weight": weights.repetition,
        },
    )

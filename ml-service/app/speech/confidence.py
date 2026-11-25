"""Composite confidence indicator module."""

import re
from typing import List
from app.config import config

HEDGE_TERMS = [
    r"\bi guess\b",
    r"\bi think\b",
    r"\bmaybe\b",
    r"\bprobably\b",
    r"\bpossibly\b",
    r"\bnot sure\b",
    r"\bsuppose\b",
]


def score_pitch_variation(pitch_std: float) -> float:
    """Score pitch variation (0-100)."""
    if pitch_std <= 0.0:
        return 80.0  # neutral fallback if pitch detection is unvoiced/unavailable

    # Optimal speaking pitch std is roughly 20-50 Hz
    if 20.0 <= pitch_std <= 50.0:
        return 100.0
    elif pitch_std < 20.0:
        return round(max(40.0, 100.0 - (20.0 - pitch_std) * 3.0), 1)
    else:
        return round(max(40.0, 100.0 - (pitch_std - 50.0) * 1.5), 1)


def score_volume_steadiness(volume_mean: float, volume_std: float) -> float:
    """Score volume steadiness (0-100)."""
    if volume_mean <= 0.0:
        return 80.0

    cov = volume_std / volume_mean
    if 0.2 <= cov <= 0.8:
        return 100.0
    else:
        penalty = abs(cov - 0.5) * 60.0
        return round(max(40.0, 100.0 - penalty), 1)


def score_hedging(transcript: str) -> float:
    """Detect hedging phrases in text and score confidence (0-100)."""
    if not transcript:
        return 100.0

    lower_text = transcript.lower()
    hedge_count = 0
    for pattern in HEDGE_TERMS:
        matches = re.findall(pattern, lower_text)
        hedge_count += len(matches)

    score = 100.0 - (hedge_count * 6.0)
    return round(max(40.0, min(100.0, score)), 1)


def calculate_composite_confidence(
    filler_control_score: float,
    fluency_score: float,
    pace_score: float,
    pitch_std: float,
    volume_mean: float,
    volume_std: float,
    transcript: str = "",
) -> float:
    """Compute transparent weighted confidence indicator (0-100).

    Weights:
        filler_control: 0.25
        pause_behavior: 0.20
        pace_stability: 0.20
        pitch_variation: 0.15
        volume_steadiness: 0.10
        hedging: 0.10
    """
    weights = config.confidence_weights

    pitch_score = score_pitch_variation(pitch_std)
    vol_score = score_volume_steadiness(volume_mean, volume_std)
    hedge_score = score_hedging(transcript)

    composite = (
        weights.filler_control * filler_control_score
        + weights.pause_behavior * fluency_score
        + weights.pace_stability * pace_score
        + weights.pitch_variation * pitch_score
        + weights.volume_steadiness * vol_score
        + weights.hedging * hedge_score
    )

    total_weight = (
        weights.filler_control
        + weights.pause_behavior
        + weights.pace_stability
        + weights.pitch_variation
        + weights.volume_steadiness
        + weights.hedging
    )

    final_score = composite / total_weight if total_weight > 0 else composite
    return round(max(0.0, min(100.0, final_score)), 1)

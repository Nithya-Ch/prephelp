"""Fluency analysis module (pause detection, run length, and fluency score)."""

from typing import List, Tuple
from app.config import config
from app.schemas import FlagItem, WordTimestamp


def calculate_fluency(
    words: List[WordTimestamp],
    total_duration_sec: float,
) -> Tuple[int, int, float, float, float, float, List[FlagItem]]:
    """Compute pause metrics, mean length of run, and fluency score.

    Args:
        words: List of transcribed words with timestamps.
        total_duration_sec: Total duration in seconds.

    Returns:
        Tuple:
            - pause_count (int)
            - long_pause_count (int)
            - pause_rate_per_min (float)
            - pause_ratio (float)
            - mean_length_of_run (float)
            - fluency_score (float, 0-100)
            - flags (List[FlagItem])
    """
    if len(words) < 2 or total_duration_sec <= 0:
        return 0, 0, 0.0, 0.0, float(len(words)), 100.0, []

    pause_threshold = config.fluency.pause_threshold_sec  # 0.5s
    long_pause_threshold = config.fluency.long_pause_threshold_sec  # 1.5s
    target_pause_rate = config.fluency.target_pause_rate_per_min  # 12.0

    pause_count = 0
    long_pause_count = 0
    total_pause_duration = 0.0
    flags: List[FlagItem] = []

    run_lengths: List[int] = []
    current_run_words = 1

    for i in range(len(words) - 1):
        w_curr = words[i]
        w_next = words[i + 1]
        gap = max(0.0, w_next.start - w_curr.end)

        if gap >= pause_threshold:
            pause_count += 1
            total_pause_duration += gap
            run_lengths.append(current_run_words)
            current_run_words = 1

            if gap >= long_pause_threshold:
                long_pause_count += 1
                flags.append(
                    FlagItem(
                        type="long_pause",
                        start=round(w_curr.end, 2),
                        end=round(w_next.start, 2),
                        detail=f"Long silence of {gap:.2f}s between '{w_curr.w}' and '{w_next.w}'.",
                    )
                )
        else:
            current_run_words += 1

    run_lengths.append(current_run_words)

    mean_length_of_run = round(
        sum(run_lengths) / len(run_lengths) if run_lengths else 0.0, 1
    )
    duration_min = max(total_duration_sec / 60.0, 0.01)
    pause_rate_per_min = round(float(pause_count) / duration_min, 1)
    pause_ratio = round(min(1.0, total_pause_duration / max(total_duration_sec, 0.1)), 3)

    # Calculate Fluency Score (0-100)
    score = 100.0

    # Long pause penalty: up to 10 points per long pause
    score -= long_pause_count * 8.0

    # Pause rate penalty: penalty if pause rate significantly deviates from target
    if pause_rate_per_min > target_pause_rate:
        excess_rate = pause_rate_per_min - target_pause_rate
        score -= excess_rate * 2.0

    # Pause ratio penalty: penalty if pauses take up > 30% of total speech
    if pause_ratio > 0.30:
        excess_ratio = pause_ratio - 0.30
        score -= excess_ratio * 75.0

    # Mean length of run penalty: halting speech has very short runs (< 4 words)
    if mean_length_of_run < 4.0 and len(words) >= 6:
        score -= (4.0 - mean_length_of_run) * 4.0

    fluency_score = round(max(0.0, min(100.0, score)), 1)

    return (
        pause_count,
        long_pause_count,
        pause_rate_per_min,
        pause_ratio,
        mean_length_of_run,
        fluency_score,
        flags,
    )

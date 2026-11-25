"""Pace analysis module (WPM, articulation rate, and pace score)."""

from typing import List, Tuple
from app.config import config
from app.schemas import FlagItem, WordTimestamp


def calculate_pace(
    words: List[WordTimestamp],
    total_duration_sec: float,
    speech_duration_sec: float,
) -> Tuple[float, float, float, List[FlagItem]]:
    """Compute speaking rate (WPM), articulation rate (WPM), pace score (0-100), and pace flags.

    Args:
        words: List of transcribed words with timestamps.
        total_duration_sec: Total duration of the audio recording in seconds.
        speech_duration_sec: Voice activity duration in seconds.

    Returns:
        Tuple[float, float, float, List[FlagItem]]:
            (wpm, articulation_wpm, pace_score, flags)
    """
    total_words = len(words)
    if total_duration_sec <= 0 or total_words == 0:
        return 0.0, 0.0, 0.0, []

    wpm = round((float(total_words) / total_duration_sec) * 60.0, 1)

    effective_speech_duration = max(speech_duration_sec, 0.1)
    # Articulation rate cannot exceed total words / minimal duration
    articulation_wpm = round(
        (float(total_words) / effective_speech_duration) * 60.0, 1
    )

    # Calculate pace score based on target band
    target_min = config.pace.target_min_wpm
    target_max = config.pace.target_max_wpm
    drop_penalty = config.pace.drop_penalty

    if target_min <= wpm <= target_max:
        pace_score = 100.0
    elif wpm < target_min:
        diff = target_min - wpm
        # Linear drop outside band
        pace_score = max(0.0, 100.0 - (diff * drop_penalty * 1.5))
    else:
        diff = wpm - target_max
        pace_score = max(0.0, 100.0 - (diff * drop_penalty * 1.5))

    pace_score = round(min(100.0, max(0.0, pace_score)), 1)

    flags: List[FlagItem] = []
    if wpm < 100.0 and total_words >= 3:
        flags.append(
            FlagItem(
                type="pace_slow",
                start=0.0,
                end=round(total_duration_sec, 2),
                detail=f"Speaking pace is slow ({wpm} WPM). Target range is {target_min:.0f}-{target_max:.0f} WPM.",
            )
        )
    elif wpm > 180.0 and total_words >= 3:
        flags.append(
            FlagItem(
                type="pace_fast",
                start=0.0,
                end=round(total_duration_sec, 2),
                detail=f"Speaking pace is fast ({wpm} WPM). Target range is {target_min:.0f}-{target_max:.0f} WPM.",
            )
        )

    return wpm, articulation_wpm, pace_score, flags

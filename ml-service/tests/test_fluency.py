"""Tests for fluency analysis module."""

import pytest
from app.schemas import WordTimestamp
from app.speech.fluency import calculate_fluency


def test_fluent_speech_without_pauses():
    # 10 words, 0.2s duration each with only 0.1s gap
    words = []
    t = 0.0
    for i in range(10):
        words.append(WordTimestamp(w=f"word{i}", start=round(t, 2), end=round(t + 0.3, 2)))
        t += 0.4

    pause_count, long_pauses, pause_rate, pause_ratio, mlr, score, flags = calculate_fluency(
        words, total_duration_sec=5.0
    )

    assert pause_count == 0
    assert long_pauses == 0
    assert pause_rate == 0.0
    assert pause_ratio == 0.0
    assert mlr == 10.0
    assert score == 100.0
    assert len(flags) == 0


def test_pauses_and_long_pauses_detection():
    # Run 1: 3 words
    # Pause of 0.8s (> 0.5s)
    # Run 2: 3 words
    # Long pause of 2.0s (> 1.5s)
    # Run 3: 4 words
    words = [
        # Run 1
        WordTimestamp(w="I", start=0.0, end=0.3),
        WordTimestamp(w="am", start=0.4, end=0.6),
        WordTimestamp(w="speaking", start=0.7, end=1.2),
        # Gap: 2.0 - 1.2 = 0.8s (Pause)
        # Run 2
        WordTimestamp(w="about", start=2.0, end=2.4),
        WordTimestamp(w="my", start=2.5, end=2.7),
        WordTimestamp(w="experience", start=2.8, end=3.5),
        # Gap: 5.5 - 3.5 = 2.0s (Long Pause)
        # Run 3
        WordTimestamp(w="at", start=5.5, end=5.7),
        WordTimestamp(w="the", start=5.8, end=6.0),
        WordTimestamp(w="previous", start=6.1, end=6.6),
        WordTimestamp(w="company", start=6.7, end=7.2),
    ]

    total_duration = 10.0
    (
        pause_count,
        long_pauses,
        pause_rate,
        pause_ratio,
        mlr,
        score,
        flags,
    ) = calculate_fluency(words, total_duration_sec=total_duration)

    assert pause_count == 2
    assert long_pauses == 1
    # Mean length of run: 10 words across 3 runs = 3.3
    assert mlr == 3.3
    assert pause_ratio > 0.20
    # Flag generated for long pause
    assert any(f.type == "long_pause" for f in flags)
    assert score < 100.0


def test_fluency_edge_cases():
    # Only 1 word
    words = [WordTimestamp(w="Hello", start=0.5, end=1.0)]
    pause_count, long_pauses, pause_rate, pause_ratio, mlr, score, flags = calculate_fluency(
        words, total_duration_sec=2.0
    )
    assert pause_count == 0
    assert score == 100.0

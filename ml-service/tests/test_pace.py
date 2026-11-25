"""Tests for pace analysis module."""

import pytest
from app.schemas import WordTimestamp
from app.speech.pace import calculate_pace


def make_words(count: int, duration: float) -> list[WordTimestamp]:
    """Generate synthetic evenly-spaced words."""
    step = duration / count
    words = []
    for i in range(count):
        start = round(i * step, 2)
        end = round(start + step * 0.8, 2)
        words.append(WordTimestamp(w=f"word{i+1}", start=start, end=end))
    return words


def test_pace_in_target_band():
    # 140 words in 60s = 140 WPM (target band 120-160)
    words = make_words(count=140, duration=60.0)
    wpm, art_wpm, score, flags = calculate_pace(words, total_duration_sec=60.0, speech_duration_sec=50.0)

    assert wpm == 140.0
    assert art_wpm > wpm
    assert score == 100.0
    assert len(flags) == 0


def test_pace_slow():
    # 70 words in 60s = 70 WPM (< 120)
    words = make_words(count=70, duration=60.0)
    wpm, art_wpm, score, flags = calculate_pace(words, total_duration_sec=60.0, speech_duration_sec=55.0)

    assert wpm == 70.0
    assert score < 100.0
    # Flag pace_slow should be generated
    assert any(f.type == "pace_slow" for f in flags)


def test_pace_fast():
    # 200 words in 60s = 200 WPM (> 160)
    words = make_words(count=200, duration=60.0)
    wpm, art_wpm, score, flags = calculate_pace(words, total_duration_sec=60.0, speech_duration_sec=58.0)

    assert wpm == 200.0
    assert score < 100.0
    # Flag pace_fast should be generated
    assert any(f.type == "pace_fast" for f in flags)


def test_pace_empty_words():
    wpm, art_wpm, score, flags = calculate_pace([], total_duration_sec=30.0, speech_duration_sec=20.0)
    assert wpm == 0.0
    assert art_wpm == 0.0
    assert score == 0.0
    assert flags == []

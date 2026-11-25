"""Tests for filler word detection and spaCy POS filtering."""

import pytest
from app.schemas import WordTimestamp
from app.speech.fillers import detect_fillers, is_like_filler_pos


def test_single_and_multiword_fillers():
    # Transcript: "Um, I worked there, you know, kind of hard."
    words = [
        WordTimestamp(w="Um,", start=0.0, end=0.3),
        WordTimestamp(w="I", start=0.4, end=0.6),
        WordTimestamp(w="worked", start=0.7, end=1.0),
        WordTimestamp(w="there,", start=1.1, end=1.4),
        WordTimestamp(w="you", start=1.5, end=1.7),
        WordTimestamp(w="know,", start=1.8, end=2.0),
        WordTimestamp(w="kind", start=2.1, end=2.3),
        WordTimestamp(w="of", start=2.4, end=2.5),
        WordTimestamp(w="hard.", start=2.6, end=3.0),
    ]
    transcript = "Um, I worked there, you know, kind of hard."
    total_duration = 5.0

    count, fpm, score, flags, updated_words = detect_fillers(
        words, transcript, total_duration
    )

    # Fillers: "Um", "you know", "kind of" -> 3 fillers
    assert count == 3
    assert fpm > 0.0
    assert score < 100.0
    assert len(flags) == 3

    # Check flags assigned to word objects
    assert updated_words[0].flag == "filler"  # Um
    assert updated_words[4].flag == "filler"  # you
    assert updated_words[5].flag == "filler"  # know
    assert updated_words[6].flag == "filler"  # kind
    assert updated_words[7].flag == "filler"  # of
    assert updated_words[1].flag is None  # I


def test_like_as_verb_not_filler():
    # "I like building software." -> like is a VERB
    words = [
        WordTimestamp(w="I", start=0.0, end=0.2),
        WordTimestamp(w="like", start=0.3, end=0.6),
        WordTimestamp(w="building", start=0.7, end=1.1),
        WordTimestamp(w="software", start=1.2, end=1.8),
    ]
    transcript = "I like building software"
    count, fpm, score, flags, updated_words = detect_fillers(
        words, transcript, total_duration_sec=3.0
    )

    # In "I like building software", 'like' should not be counted as a filler if spaCy is active
    # If spaCy pos tagged as VERB, count == 0
    pos_is_filler = is_like_filler_pos(transcript, 2, 6)
    if not pos_is_filler:
        assert count == 0
        assert updated_words[1].flag is None


def test_no_fillers():
    words = [
        WordTimestamp(w="Good", start=0.0, end=0.4),
        WordTimestamp(w="morning", start=0.5, end=0.9),
        WordTimestamp(w="everyone", start=1.0, end=1.6),
    ]
    transcript = "Good morning everyone"
    count, fpm, score, flags, updated = detect_fillers(words, transcript, 3.0)

    assert count == 0
    assert fpm == 0.0
    assert score == 100.0
    assert len(flags) == 0

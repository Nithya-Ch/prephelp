"""Tests for response structure and read-aloud alignment."""

import pytest
from app.text.structure import evaluate_structure
from app.text.read_aloud import evaluate_read_aloud


def test_structure_rule_markers_detection():
    structured_response = (
        "First of all, good morning. In my previous role at Acme, I managed a team of five engineers. "
        "Firstly, we rearchitected the core backend. Secondly, we redesigned the UX. "
        "For example, when our customer portal experienced high latency, we introduced Redis caching. "
        "In conclusion, this reduced latency by 60 percent. Thank you."
    )
    res = evaluate_structure(structured_response)
    assert res.metrics.opening_detected is True
    assert res.metrics.conclusion_detected is True
    assert res.metrics.sequencing_count >= 2
    assert res.metrics.example_count >= 1
    assert res.structure_score >= 80.0


def test_structure_unstructured_response():
    unstructured_response = "I code stuff. It was fun. Things happened."
    res = evaluate_structure(unstructured_response)
    assert res.metrics.opening_detected is False
    assert res.metrics.conclusion_detected is False
    assert res.structure_score < 50.0
    assert any(f["type"] == "structure_missing_opening" for f in res.flags)
    assert any(f["type"] == "structure_missing_conclusion" for f in res.flags)


def test_read_aloud_perfect_match():
    reference = "Effective communication is fundamental to career advancement and leadership success."
    spoken = "Effective communication is fundamental to career advancement and leadership success."
    res = evaluate_read_aloud(reference, spoken)
    assert res.wer == 0.0
    assert res.accuracy_percentage == 100.0
    assert res.insertions == 0
    assert res.deletions == 0
    assert res.substitutions == 0
    assert res.correct == len(reference.split())


def test_read_aloud_substitutions_and_deletions():
    reference = "The quick brown fox jumps over the lazy dog"
    spoken = "The quick red fox jumps the lazy dog"
    res = evaluate_read_aloud(reference, spoken)
    # 'brown' -> 'red' (1 sub), 'over' omitted (1 del)
    assert res.substitutions == 1
    assert res.deletions == 1
    assert res.wer > 0.0
    assert res.accuracy_percentage < 100.0
    assert res.correct == 7

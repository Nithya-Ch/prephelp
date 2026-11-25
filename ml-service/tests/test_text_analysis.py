"""Tests for text analysis modules: grammar, vocabulary, and hedging."""

import pytest
from app.text.grammar import analyze_grammar
from app.text.vocabulary import analyze_vocabulary
from app.text.hedging import analyze_hedging_and_structure
from app.text.confidence import compute_text_confidence


def test_grammar_clean_text():
    clean_text = "I am a software engineer with three years of experience building modern web architectures."
    res = analyze_grammar(clean_text)
    assert res.error_count == 0
    assert res.errors_per_100_words == 0.0
    assert res.grammar_score >= 95.0
    assert len(res.errors) == 0


def test_grammar_agreement_and_articles():
    buggy_text = "He don't like when they is late. I have a apple in my bag and could of done better."
    res = analyze_grammar(buggy_text)
    assert res.error_count >= 3
    assert res.error_patterns["agreement"] >= 1
    assert res.error_patterns["article"] >= 1
    assert res.grammar_score < 90.0
    assert len(res.flags) >= 3


def test_grammar_speech_irrelevant_ignored():
    # Capitalization and punctuation issues should be ignored for spoken transcripts
    spoken_text = "i am a senior engineer and we built the system successfully"
    res = analyze_grammar(spoken_text)
    # Shouldn't penalize lower-case 'i' or missing terminal period as syntax errors
    assert res.error_count == 0
    assert res.grammar_score >= 95.0


def test_vocabulary_short_sample():
    short_text = "I am practicing interview questions."
    res = analyze_vocabulary(short_text)
    assert res.metrics.short_sample is True
    assert res.metrics.total_words == 5
    assert len(res.flags) == 1
    assert res.flags[0]["type"] == "vocabulary_short_sample"


def test_vocabulary_mtld_and_cefr():
    rich_text = (
        "In my professional tenure, our distributed architecture tackled significant scalability challenges. "
        "We systematically orchestrated microservices, optimized database queries, and implemented rigorous "
        "automated telemetry. Consequently, customer satisfaction metrics exhibited substantial improvement, "
        "fostering robust cross-functional collaboration and delivering sustainable business outcomes across quarters."
    )
    res = analyze_vocabulary(rich_text)
    assert res.metrics.total_words >= 35
    assert res.metrics.ttr > 0.5
    assert res.vocabulary_score >= 60.0
    assert res.metrics.b2_plus_ratio > 0.0
    assert len(res.metrics.advanced_words) > 0


def test_hedging_detection():
    hedged_text = "I guess maybe we sort of finished the project, but I'm not sure if it was optimal."
    res = analyze_hedging_and_structure(hedged_text)
    assert res.metrics.hedging_count >= 3
    assert "i guess" in res.metrics.hedging_phrases_found or "maybe" in res.metrics.hedging_phrases_found
    assert res.metrics.hedging_ratio > 0.0


def test_text_confidence_composite():
    hedged_text = "I guess maybe we sort of finished the project, but I'm not sure."
    hedged_res = analyze_hedging_and_structure(hedged_text)
    low_conf = compute_text_confidence(hedged_res.metrics)

    confident_text = "We spearheaded the migration to Kubernetes. The deployment succeeded without downtime."
    confident_res = analyze_hedging_and_structure(confident_text)
    high_conf = compute_text_confidence(confident_res.metrics)

    assert high_conf.confidence_score > low_conf.confidence_score
    assert high_conf.confidence_score >= 80.0

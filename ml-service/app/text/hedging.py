"""Hedging, phrase repetition, and sentence completeness detection for text confidence."""

import re
from typing import Any, Dict, List
from pydantic import BaseModel, Field

# Common English epistemic hedging markers
HEDGING_PHRASES: List[str] = [
    "i guess",
    "i think",
    "maybe",
    "sort of",
    "kind of",
    "probably",
    "i suppose",
    "perhaps",
    "i'm not sure",
    "im not sure",
    "might be",
    "could be",
    "it seems like",
    "as far as i know",
    "somewhat",
]

# Basic auxiliary/finite verb list for sentence completeness checking without heavy dependencies
FINITE_VERB_PATTERNS: List[str] = [
    r"\b(is|am|are|was|were|be|been|being)\b",
    r"\b(have|has|had)\b",
    r"\b(do|does|did)\b",
    r"\b(can|could|will|would|shall|should|may|might|must)\b",
    r"\b[a-z]+(?:ed|ing|s)\b",
]


class HedgingMetrics(BaseModel):
    hedging_count: int
    hedging_phrases_found: List[str] = Field(default_factory=list)
    hedging_ratio: float
    repetition_count: int
    repeated_phrases: List[str] = Field(default_factory=list)
    sentence_count: int
    complete_sentences: int
    completeness_ratio: float


class HedgingAnalysisResult(BaseModel):
    metrics: HedgingMetrics
    flags: List[Dict[str, Any]]


def analyze_hedging_and_structure(text: str) -> HedgingAnalysisResult:
    """Analyze hedging words, repeated n-grams, and sentence completeness."""
    if not text or not text.strip():
        return HedgingAnalysisResult(
            metrics=HedgingMetrics(
                hedging_count=0,
                hedging_phrases_found=[],
                hedging_ratio=0.0,
                repetition_count=0,
                repeated_phrases=[],
                sentence_count=0,
                complete_sentences=0,
                completeness_ratio=1.0,
            ),
            flags=[],
        )

    lower = text.lower()
    words = re.findall(r"\b\w+\b", lower)
    total_words = max(1, len(words))

    # 1. Hedging detection
    hedging_found: List[str] = []
    flags: List[Dict[str, Any]] = []

    for phrase in HEDGING_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        matches = list(re.finditer(pattern, lower))
        for m in matches:
            hedging_found.append(phrase)
            flags.append({
                "type": "hedging",
                "start": m.start(),
                "end": m.end(),
                "detail": f"Hedging phrase '{phrase}' may project uncertainty.",
            })

    hedging_count = len(hedging_found)
    hedging_ratio = round(hedging_count / (total_words / 100.0), 2)  # per 100 words

    # 2. Repeated 2-word and 3-word n-grams (excluding common function words)
    repeated_phrases: List[str] = []
    ngram_counts: Dict[str, int] = {}

    for n in (2, 3):
        for i in range(len(words) - n + 1):
            gram = " ".join(words[i : i + n])
            ngram_counts[gram] = ngram_counts.get(gram, 0) + 1

    # Filter ngrams repeated 3 or more times (and length > 6 chars)
    for gram, cnt in ngram_counts.items():
        if cnt >= 3 and len(gram) > 6:
            repeated_phrases.append(f"{gram} ({cnt}x)")

    # 3. Sentence completeness
    raw_sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    sentence_count = len(raw_sentences)
    complete_count = 0

    combined_verb_re = re.compile("|".join(FINITE_VERB_PATTERNS), re.IGNORECASE)

    for s in raw_sentences:
        s_words = re.findall(r"\b\w+\b", s)
        # A minimally complete spoken clause typically has >= 3 words and at least one finite verb marker
        if len(s_words) >= 3 and combined_verb_re.search(s):
            complete_count += 1

    completeness_ratio = (
        round(complete_count / sentence_count, 2) if sentence_count > 0 else 1.0
    )

    return HedgingAnalysisResult(
        metrics=HedgingMetrics(
            hedging_count=hedging_count,
            hedging_phrases_found=list(set(hedging_found)),
            hedging_ratio=hedging_ratio,
            repetition_count=len(repeated_phrases),
            repeated_phrases=repeated_phrases[:5],
            sentence_count=sentence_count,
            complete_sentences=complete_count,
            completeness_ratio=completeness_ratio,
        ),
        flags=flags,
    )

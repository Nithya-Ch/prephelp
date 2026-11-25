"""Vocabulary analysis module computing MTLD, TTR/MSTTR, and CEFR level distribution."""

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Set
from pydantic import BaseModel, Field
from app.config import config


class VocabularyMetrics(BaseModel):
    total_words: int
    unique_words: int
    ttr: float
    mtld: float
    short_sample: bool
    cefr_distribution: Dict[str, float]
    b2_plus_ratio: float
    advanced_words: List[str] = Field(default_factory=list)


class VocabularyAnalysisResult(BaseModel):
    vocabulary_score: float
    metrics: VocabularyMetrics
    flags: List[Dict[str, Any]]


_CEFR_MAP: Dict[str, str] = {}


def _load_cefr_lexicon() -> Dict[str, str]:
    """Load CEFR vocabulary mapping from data/cefr_words.json."""
    global _CEFR_MAP
    if _CEFR_MAP:
        return _CEFR_MAP

    possible_paths = [
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "cefr_words.json",
        Path(__file__).resolve().parent.parent / "data" / "cefr_words.json",
        Path("data/cefr_words.json"),
    ]

    for p in possible_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for level, words in data.items():
                        for w in words:
                            _CEFR_MAP[w.lower()] = level.upper()
                break
            except Exception:
                pass
    return _CEFR_MAP


def _compute_mtld(words: List[str], ttr_threshold: float = 0.72) -> float:
    """Compute Measure of Textual Lexical Diversity (MTLD) in bidirectional passes."""
    if len(words) < 10:
        return 0.0

    def _one_pass(token_list: List[str]) -> float:
        factors = 0.0
        types: Set[str] = set()
        tokens = 0
        for w in token_list:
            types.add(w)
            tokens += 1
            current_ttr = len(types) / tokens
            if current_ttr <= ttr_threshold:
                factors += 1.0
                types.clear()
                tokens = 0
        # Account for partial factor at the end
        if tokens > 0:
            current_ttr = len(types) / tokens
            partial = (1.0 - current_ttr) / (1.0 - ttr_threshold) if current_ttr < 1.0 else 0.0
            factors += max(0.0, min(1.0, partial))
        return len(token_list) / factors if factors > 0 else float(len(token_list))

    forward = _one_pass(words)
    backward = _one_pass(list(reversed(words)))
    return round((forward + backward) / 2.0, 2)


def analyze_vocabulary(text: str) -> VocabularyAnalysisResult:
    """Analyze vocabulary richness, lexical diversity, and CEFR level distribution."""
    if not text or not text.strip():
        return VocabularyAnalysisResult(
            vocabulary_score=50.0,
            metrics=VocabularyMetrics(
                total_words=0,
                unique_words=0,
                ttr=0.0,
                mtld=0.0,
                short_sample=True,
                cefr_distribution={"A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0},
                b2_plus_ratio=0.0,
                advanced_words=[],
            ),
            flags=[{"type": "vocabulary_short_sample", "detail": "Empty text provided."}],
        )

    raw_tokens = re.findall(r"\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b", text.lower())
    total_words = len(raw_tokens)

    if total_words == 0:
        return VocabularyAnalysisResult(
            vocabulary_score=50.0,
            metrics=VocabularyMetrics(
                total_words=0,
                unique_words=0,
                ttr=0.0,
                mtld=0.0,
                short_sample=True,
                cefr_distribution={"A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0},
                b2_plus_ratio=0.0,
                advanced_words=[],
            ),
            flags=[{"type": "vocabulary_short_sample", "detail": "No valid words found."}],
        )

    unique_tokens = set(raw_tokens)
    ttr = round(len(unique_tokens) / total_words, 3)

    min_words = config.vocabulary.min_words_for_mtld  # 50
    short_sample = total_words < min_words

    if not short_sample:
        mtld = _compute_mtld(raw_tokens)
    else:
        # For short samples, estimate scaled diversity from Root TTR
        mtld = round(ttr * math.sqrt(total_words) * 10.0, 2)

    # CEFR Level Distribution
    cefr_lex = _load_cefr_lexicon()
    counts = {"A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0}
    b2_plus_count = 0
    advanced_words: List[str] = []

    for word in raw_tokens:
        # Check exact token first, then common inflections (e.g. orchestrated -> orchestrate)
        lvl = cefr_lex.get(word, None)
        if not lvl:
            for suffix in ("ed", "ing", "es", "s", "ly", "tion", "tions", "ment", "ments"):
                if word.endswith(suffix):
                    base = word[:-len(suffix)]
                    if base in cefr_lex:
                        lvl = cefr_lex[base]
                        break
                    if base + "e" in cefr_lex:
                        lvl = cefr_lex[base + "e"]
                        break
        if lvl in counts:
            counts[lvl] += 1
            if lvl in ("B2", "C1", "C2"):
                b2_plus_count += 1
                if word not in advanced_words:
                    advanced_words.append(word)

    dist: Dict[str, float] = {}
    for lvl, c in counts.items():
        dist[lvl] = round((c / total_words) * 100.0, 1)

    b2_plus_ratio = round((b2_plus_count / total_words), 3)

    # Scoring formula: 50% MTLD relative to target + 50% B2+ ratio relative to target
    target_mtld = config.vocabulary.target_mtld  # 70.0
    target_b2 = config.vocabulary.target_b2_ratio  # 0.20

    mtld_score = min(100.0, (mtld / target_mtld) * 100.0)
    b2_score = min(100.0, (b2_plus_ratio / target_b2) * 100.0)

    score = 0.5 * mtld_score + 0.5 * b2_score
    score = max(20.0, min(100.0, round(score, 1)))

    flags: List[Dict[str, Any]] = []
    if short_sample:
        flags.append({
            "type": "vocabulary_short_sample",
            "detail": f"Word count ({total_words}) is below 50 words; diversity estimate has higher uncertainty.",
        })

    return VocabularyAnalysisResult(
        vocabulary_score=score,
        metrics=VocabularyMetrics(
            total_words=total_words,
            unique_words=len(unique_tokens),
            ttr=ttr,
            mtld=mtld,
            short_sample=short_sample,
            cefr_distribution=dist,
            b2_plus_ratio=round(b2_plus_ratio * 100.0, 1),
            advanced_words=advanced_words[:10],
        ),
        flags=flags,
    )

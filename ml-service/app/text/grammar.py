"""Grammar analysis module with categorised error checking and speech-irrelevant filtering."""

import os
import re
from typing import Any, Dict, List, Tuple
from pydantic import BaseModel, Field
from app.config import config


class GrammarError(BaseModel):
    message: str
    category: str  # agreement, verb_tense, article, preposition, pronoun, general
    rule_id: str
    offset: int
    length: int
    replacements: List[str] = Field(default_factory=list)


class GrammarAnalysisResult(BaseModel):
    error_count: int
    word_count: int
    errors_per_100_words: float
    grammar_score: float
    error_patterns: Dict[str, int]
    errors: List[GrammarError]
    flags: List[Dict[str, Any]]


# Rule-based regex grammar patterns with categories
_GRAMMAR_RULES: List[Tuple[str, str, str, str]] = [
    # (regex_pattern, category, rule_id, suggested_message)
    (r"\b(he|she|it)\s+(don't|do|have|are)\b", "agreement", "SUBJ_VERB_AGREEMENT", "Subject-verb agreement error with third-person singular pronoun."),
    (r"\b(they|we|you)\s+(does|is|has|was)\b", "agreement", "SUBJ_VERB_AGREEMENT", "Subject-verb agreement error with plural pronoun."),
    (r"\b(i)\s+(is|are|has|does)\b", "agreement", "SUBJ_VERB_AGREEMENT", "Incorrect verb form following 'I'."),
    (r"\b(a)\s+([aeiou][a-z]+)\b", "article", "ARTICLE_A_AN", "Use 'an' instead of 'a' before vowel sounds."),
    (r"\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b", "article", "ARTICLE_A_AN", "Use 'a' instead of 'an' before consonant sounds."),
    (r"\b(did|didn't|did\s+not)\s+([a-z]+ed|[a-z]+went|[a-z]+came|[a-z]+saw)\b", "verb_tense", "DOUBLE_PAST_TENSE", "Use base verb form after auxiliary 'did' / 'didn't'."),
    (r"\b(could|would|should)\s+of\b", "preposition", "COULD_OF_HAVE", "Use 'have' instead of 'of' after modal verbs."),
    (r"\b(between)\s+you\s+and\s+(i)\b", "pronoun", "PRONOUN_CASE", "Use objective pronoun 'me' after preposition 'between'."),
    (r"\b(more|most)\s+([a-z]+er|[a-z]+est)\b", "general", "DOUBLE_COMPARATIVE", "Double comparative/superlative modifier detected."),
    (r"\b(one\s+of\s+the)\s+([a-z]+)(?!\s+[a-z]+s)\b", "agreement", "ONE_OF_THE_PLURAL", "'One of the' should usually be followed by a plural noun."),
    (r"\b(i\s+am|we\s+are|he\s+is|she\s+is)\s+having\s+(knowledge|experience|skills?|years?\s+of\s+experience)\b", "verb_tense", "STATIVE_HAVE_CONTINUOUS", "Use simple present ('I have') rather than continuous ('am having') for states of knowledge or possession."),
    (r"\b(pass(?:ed)?\s+out)\s+(?:from|in)\b", "verb_tense", "GRADUATE_INSTEAD_OF_PASSOUT", "Use 'graduated from' instead of 'passed out from' for educational background."),
    (r"\b(myself)\s+([a-zA-Z]+)\b", "pronoun", "MYSELF_SELF_INTRO", "Avoid introducing yourself with 'Myself [Name]'; use 'I am [Name]' or 'My name is [Name]'."),
    (r"\b(revert\s+back)\b", "general", "REVERT_BACK_REDUNDANT", "Use 'revert' or 'reply' instead of 'revert back' (redundant)."),
    (r"\b(discuss\s+about)\b", "preposition", "DISCUSS_ABOUT_PREP", "Use 'discuss' directly without 'about' (e.g., 'discuss the project')."),
]


def _filter_speech_irrelevant(rule_id: str, message: str) -> bool:
    """Return True if rule is irrelevant to spoken transcripts (e.g. capitalization, punctuation)."""
    irrelevant_keywords = [
        "capital",
        "uppercase",
        "lowercase",
        "punctuation",
        "comma",
        "period",
        "whitespace",
        "typography",
        "quote",
        "apostrophe",
    ]
    check = f"{rule_id} {message}".lower()
    return any(k in check for k in irrelevant_keywords)


def analyze_grammar(text: str) -> GrammarAnalysisResult:
    """Analyze text for grammar issues using LanguageTool (if available) or deterministic rule engine."""
    if not text or not text.strip():
        return GrammarAnalysisResult(
            error_count=0,
            word_count=0,
            errors_per_100_words=0.0,
            grammar_score=100.0,
            error_patterns={},
            errors=[],
            flags=[],
        )

    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)
    if word_count == 0:
        return GrammarAnalysisResult(
            error_count=0,
            word_count=0,
            errors_per_100_words=0.0,
            grammar_score=100.0,
            error_patterns={},
            errors=[],
            flags=[],
        )

    errors: List[GrammarError] = []

    # Try language_tool_python if installed & operational & explicitly enabled
    lt_success = False
    if os.getenv("ENABLE_LANGUAGETOOL", "false").lower() == "true":
        try:
            import language_tool_python  # type: ignore
            tool = language_tool_python.LanguageToolPublicAPI("en-US")
            matches = tool.check(text)
            for m in matches:
                if _filter_speech_irrelevant(m.ruleId, m.message):
                    continue
                cat = "general"
                msg = m.message.lower()
                if "agreement" in msg or "singular" in msg or "plural" in msg:
                    cat = "agreement"
                elif "tense" in msg or "verb" in msg:
                    cat = "verb_tense"
                elif "article" in msg or "determiner" in msg:
                    cat = "article"
                elif "preposition" in msg:
                    cat = "preposition"
                elif "pronoun" in msg:
                    cat = "pronoun"

                errors.append(
                    GrammarError(
                        message=m.message,
                        category=cat,
                        rule_id=m.ruleId,
                        offset=m.offset,
                        length=m.errorLength,
                        replacements=m.replacements[:3],
                    )
                )
            lt_success = True
        except Exception:
            lt_success = False

    # Fallback to rule-based pattern matching
    if not lt_success:
        for pattern, cat, rule_id, default_msg in _GRAMMAR_RULES:
            for match in re.finditer(pattern, text, flags=re.IGNORECASE):
                # Verify not speech-irrelevant
                if _filter_speech_irrelevant(rule_id, default_msg):
                    continue
                errors.append(
                    GrammarError(
                        message=default_msg,
                        category=cat,
                        rule_id=rule_id,
                        offset=match.start(),
                        length=match.end() - match.start(),
                        replacements=[],
                    )
                )

    # Accumulate categories for errorPatterns
    error_patterns: Dict[str, int] = {
        "agreement": 0,
        "verb_tense": 0,
        "article": 0,
        "preposition": 0,
        "pronoun": 0,
        "general": 0,
    }
    flags: List[Dict[str, Any]] = []

    for err in errors:
        error_patterns[err.category] = error_patterns.get(err.category, 0) + 1
        flags.append({
            "type": "grammar",
            "start": err.offset,
            "end": err.offset + err.length,
            "detail": f"[{err.category.upper()}] {err.message}",
        })

    error_count = len(errors)
    errors_per_100 = (error_count / word_count) * 100.0

    # Score calculation: 100 drops linearly towards 0 at max_error_rate
    target_err = config.grammar.errors_per_100_target  # e.g., 3.0
    max_err = config.grammar.max_error_rate  # e.g., 15.0

    if errors_per_100 <= target_err:
        score = 100.0 - (errors_per_100 / target_err) * 10.0
    else:
        penalty_ratio = (errors_per_100 - target_err) / max(1.0, max_err - target_err)
        score = 90.0 - (penalty_ratio * 90.0)

    score = max(0.0, min(100.0, round(score, 1)))

    return GrammarAnalysisResult(
        error_count=error_count,
        word_count=word_count,
        errors_per_100_words=round(errors_per_100, 2),
        grammar_score=score,
        error_patterns=error_patterns,
        errors=errors,
        flags=flags,
    )

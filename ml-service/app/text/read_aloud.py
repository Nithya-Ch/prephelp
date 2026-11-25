"""Alignment Word Error Rate (WER) and accuracy for read-aloud exercises."""

import re
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class AlignmentWord(BaseModel):
    reference: str
    spoken: str
    status: str  # correct, substituted, deleted, inserted


class ReadAloudAnalysisResult(BaseModel):
    reference_word_count: int
    spoken_word_count: int
    insertions: int
    deletions: int
    substitutions: int
    correct: int
    wer: float
    accuracy_percentage: float
    alignment: List[AlignmentWord] = Field(default_factory=list)


def _clean_tokens(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9']+\b", text)]


def evaluate_read_aloud(reference_text: str, spoken_text: str) -> ReadAloudAnalysisResult:
    """Compute Levenshtein alignment, WER and word accuracy for read-aloud passage."""
    ref_words = _clean_tokens(reference_text)
    hyp_words = _clean_tokens(spoken_text)

    n = len(ref_words)
    m = len(hyp_words)

    if n == 0:
        return ReadAloudAnalysisResult(
            reference_word_count=0,
            spoken_word_count=m,
            insertions=m,
            deletions=0,
            substitutions=0,
            correct=0,
            wer=1.0 if m > 0 else 0.0,
            accuracy_percentage=0.0 if m > 0 else 100.0,
            alignment=[],
        )

    # Dynamic programming table for edit distance
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],      # deletion
                    dp[i][j - 1],      # insertion
                    dp[i - 1][j - 1],  # substitution
                )

    # Backtracking to reconstruct alignment
    i, j = n, m
    alignment: List[AlignmentWord] = []
    insertions = 0
    deletions = 0
    substitutions = 0
    correct = 0

    while i > 0 or j > 0:
        if i > 0 and j > 0 and ref_words[i - 1] == hyp_words[j - 1]:
            alignment.append(AlignmentWord(reference=ref_words[i - 1], spoken=hyp_words[j - 1], status="correct"))
            correct += 1
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            alignment.append(AlignmentWord(reference=ref_words[i - 1], spoken=hyp_words[j - 1], status="substituted"))
            substitutions += 1
            i -= 1
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            alignment.append(AlignmentWord(reference=ref_words[i - 1], spoken="", status="deleted"))
            deletions += 1
            i -= 1
        else:
            alignment.append(AlignmentWord(reference="", spoken=hyp_words[j - 1], status="inserted"))
            insertions += 1
            j -= 1

    alignment.reverse()

    wer = round((insertions + deletions + substitutions) / n, 3)
    accuracy = round(max(0.0, min(100.0, (correct / n) * 100.0)), 1)

    return ReadAloudAnalysisResult(
        reference_word_count=n,
        spoken_word_count=m,
        insertions=insertions,
        deletions=deletions,
        substitutions=substitutions,
        correct=correct,
        wer=wer,
        accuracy_percentage=accuracy,
        alignment=alignment,
    )

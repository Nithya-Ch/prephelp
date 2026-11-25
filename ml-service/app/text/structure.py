"""Response structure evaluation combining discourse rule markers and LLM rubric."""

import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.config import config
from app.llm import llm_client, load_prompt_template

# Discourse rule markers
OPENING_MARKERS = [
    r"\b(hello|hi|good\s+morning|good\s+afternoon|good\s+evening)\b",
    r"\b(first\s+of\s+all|to\s+begin\s+with|thank\s+you\s+for|i\s+would\s+like\s+to\s+introduce|let\s+me\s+start)\b",
    r"\b(regarding\s+the\s+question|when\s+it\s+comes\s+to|speaking\s+about)\b",
]

SEQUENCING_MARKERS = [
    r"\b(firstly|secondly|thirdly|next|furthermore|moreover|in\s+addition|another\s+aspect|on\s+one\s+hand|on\s+the\s+other\s+hand)\b",
    r"\b(then|after\s+that|subsequently|meanwhile|besides|also)\b",
]

EXAMPLE_MARKERS = [
    r"\b(for\s+example|for\s+instance|such\s+as|to\s+illustrate|a\s+case\s+in\s+point|in\s+my\s+experience|when\s+i\s+worked\s+on)\b",
    r"\b(one\s+time|specifically|namely)\b",
]

CONCLUSION_MARKERS = [
    r"\b(in\s+conclusion|to\s+sum\s+up|to\s+conclude|overall|finally|in\s+summary|that\s+is\s+why|as\s+a\s+result|therefore|thus)\b",
    r"\b(thank\s+you|that's\s+all|wrapping\s+up)\b",
]


class StructureLLMOutput(BaseModel):
    opening: int = Field(ge=0, le=4)
    main_points: int = Field(ge=0, le=4)
    examples: int = Field(ge=0, le=4)
    conclusion: int = Field(ge=0, le=4)
    coherence: int = Field(ge=0, le=4)
    overall_comment: str = ""


class StructureMetrics(BaseModel):
    rule_score: float
    llm_score: float
    opening_detected: bool
    sequencing_count: int
    example_count: int
    conclusion_detected: bool
    rubric_scores: Dict[str, int] = Field(default_factory=dict)
    comment: str = ""


class StructureAnalysisResult(BaseModel):
    structure_score: float
    llm_used: bool
    fallback_used: bool
    metrics: StructureMetrics
    flags: List[Dict[str, Any]]


def _evaluate_rule_structure(text: str) -> tuple[float, Dict[str, Any]]:
    lower = text.lower()

    has_opening = any(re.search(p, lower) for p in OPENING_MARKERS)
    has_conclusion = any(re.search(p, lower) for p in CONCLUSION_MARKERS)

    seq_count = 0
    for p in SEQUENCING_MARKERS:
        seq_count += len(re.findall(p, lower))

    ex_count = 0
    for p in EXAMPLE_MARKERS:
        ex_count += len(re.findall(p, lower))

    # Calculate rule score 0-100:
    # Opening: 25 pts, Conclusion: 25 pts, Sequencing: up to 25 pts, Example: up to 25 pts
    score = 0.0
    if has_opening:
        score += 25.0
    if has_conclusion:
        score += 25.0
    score += min(25.0, seq_count * 12.5)
    score += min(25.0, ex_count * 12.5)

    # Word count heuristic floor: if student spoke well (>60 words) but omitted explicit markers, give baseline
    words = re.findall(r"\b\w+\b", text)
    if len(words) >= 60 and score < 40.0:
        score = 40.0

    return score, {
        "opening_detected": has_opening,
        "sequencing_count": seq_count,
        "example_count": ex_count,
        "conclusion_detected": has_conclusion,
    }


def evaluate_structure(
    transcript: str,
    exercise_prompt: str = "Self-introduction or interview question",
    exercise_type: str = "interview",
) -> StructureAnalysisResult:
    """Evaluate response structure combining discourse rules and LLM rubric."""
    rule_score, rule_details = _evaluate_rule_structure(transcript)

    # Prepare deterministic fallback for LLM rubric
    def _deterministic_fallback() -> StructureLLMOutput:
        # Map rule score (0-100) to 0-4 scale per rubric dimension
        base = int(min(4, max(1, round((rule_score / 100.0) * 4.0))))
        return StructureLLMOutput(
            opening=4 if rule_details["opening_detected"] else 2,
            main_points=base,
            examples=4 if rule_details["example_count"] > 0 else 2,
            conclusion=4 if rule_details["conclusion_detected"] else 2,
            coherence=base,
            overall_comment="Evaluated via deterministic discourse analysis.",
        )

    # Prepare LLM prompt
    llm_used = False
    fallback_used = False
    rubric_scores = {}
    comment = ""

    try:
        template = load_prompt_template("rubric_structure_v1.txt")
        # Sanitize transcript to prevent instruction breakout
        safe_transcript = transcript.replace("<transcript>", "").replace("</transcript>", "")
        prompt = (
            template.replace("{{exercise_prompt}}", exercise_prompt)
            .replace("{{exercise_type}}", exercise_type)
            .replace("{{transcript}}", safe_transcript)
        )

        rubric_res, fallback = llm_client.generate_json(
            prompt=prompt,
            schema=StructureLLMOutput,
            fallback_factory=_deterministic_fallback,
            prompt_version=config.prompt_versions.get("rubric_structure", "rubric_structure_v1"),
        )
        fallback_used = fallback
        llm_used = not fallback

        # Rubric total is sum of 5 dimensions (0-20), scale to 0-100
        total_pts = (
            rubric_res.opening
            + rubric_res.main_points
            + rubric_res.examples
            + rubric_res.conclusion
            + rubric_res.coherence
        )
        llm_score = (total_pts / 20.0) * 100.0
        rubric_scores = {
            "opening": rubric_res.opening,
            "main_points": rubric_res.main_points,
            "examples": rubric_res.examples,
            "conclusion": rubric_res.conclusion,
            "coherence": rubric_res.coherence,
        }
        comment = rubric_res.overall_comment
    except Exception:
        fallback_used = True
        llm_used = False
        fb = _deterministic_fallback()
        total_pts = fb.opening + fb.main_points + fb.examples + fb.conclusion + fb.coherence
        llm_score = (total_pts / 20.0) * 100.0
        rubric_scores = {
            "opening": fb.opening,
            "main_points": fb.main_points,
            "examples": fb.examples,
            "conclusion": fb.conclusion,
            "coherence": fb.coherence,
        }
        comment = fb.overall_comment

    # Composite structure formula:
    # structure = 0.5 * rule + 0.5 * llm; if LLM fails, use rule only and set fallbackUsed
    if fallback_used and not llm_used:
        structure_score = rule_score
    else:
        rw = config.structure.rule_weight
        lw = config.structure.llm_weight
        structure_score = rw * rule_score + lw * llm_score

    structure_score = max(0.0, min(100.0, round(structure_score, 1)))

    flags: List[Dict[str, Any]] = []
    if not rule_details["opening_detected"]:
        flags.append({"type": "structure_missing_opening", "detail": "No explicit introductory greeting or opening statement detected."})
    if not rule_details["conclusion_detected"]:
        flags.append({"type": "structure_missing_conclusion", "detail": "Response ends without a concluding summary or sign-off."})

    return StructureAnalysisResult(
        structure_score=structure_score,
        llm_used=llm_used,
        fallback_used=fallback_used,
        metrics=StructureMetrics(
            rule_score=round(rule_score, 1),
            llm_score=round(llm_score, 1),
            opening_detected=rule_details["opening_detected"],
            sequencing_count=rule_details["sequencing_count"],
            example_count=rule_details["example_count"],
            conclusion_detected=rule_details["conclusion_detected"],
            rubric_scores=rubric_scores,
            comment=comment,
        ),
        flags=flags,
    )

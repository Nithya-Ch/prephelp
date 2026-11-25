"""Coach feedback endpoint – generates personalised coaching based on computed metrics."""

import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from app.config import config
from app.llm import llm_client, load_prompt_template
from app.schemas import (
    CoachFeedbackRequest,
    CoachFeedbackResponse,
    DimensionScores,
    SentenceExample,
)
from pydantic import BaseModel, Field

router = APIRouter(prefix="/coach", tags=["coaching"])


class CoachLLMOutput(BaseModel):
    summary: str
    strengths: List[str]
    improvements: List[str]
    sentenceExamples: List[SentenceExample] = Field(default_factory=list)
    tip: str


def _extract_deterministic_sentence_examples(
    transcript: str, exercise_type: str
) -> List[SentenceExample]:
    """Extract rule-based sentence improvement suggestions when LLM is unavailable."""
    examples: List[SentenceExample] = []
    if not transcript:
        return examples

    # 1. Stative have in continuous form (e.g. "I am having knowledge of Python")
    m = re.search(
        r"\b(i\s+am|we\s+are|he\s+is|she\s+is)\s+having\s+(knowledge|experience|skills?|years?\s+of\s+experience)\b(?:\s+(?:of|in)\s+([a-zA-Z0-9#+]+))?",
        transcript,
        re.IGNORECASE,
    )
    if m:
        subj = m.group(1).strip()
        topic = m.group(2).strip()
        domain = f" of {m.group(3)}" if m.group(3) else ""
        correct_verb = "has" if subj.lower() in ("he is", "she is") else "have"
        correct_subj = (
            "He" if subj.lower() == "he is" else ("She" if subj.lower() == "she is" else ("We" if subj.lower() == "we are" else "I"))
        )
        examples.append(
            SentenceExample(
                original=m.group(0),
                improved=f"{correct_subj} {correct_verb} {topic}{domain}",
                reason=(
                    "'Have' is a stative verb expressing knowledge or possession. "
                    f"Use the simple present tense '{correct_subj} {correct_verb}' rather than the continuous 'am having'."
                ),
            )
        )

    # 2. Myself as intro ("Myself John")
    m = re.search(r"\bmyself\s+([A-Za-z]+)\b", transcript, re.IGNORECASE)
    if m:
        name = m.group(1)
        examples.append(
            SentenceExample(
                original=m.group(0),
                improved=f"My name is {name}",
                reason=(
                    "'Myself' is a reflexive pronoun and cannot stand as a subject. "
                    f"In professional introductions, introduce yourself with 'My name is {name}' or 'I am {name}'."
                ),
            )
        )

    # 3. Passed out from
    m = re.search(r"\b(pass(?:ed)?\s+out)\s+(?:from|in)\b", transcript, re.IGNORECASE)
    if m:
        examples.append(
            SentenceExample(
                original=m.group(0),
                improved="graduated from",
                reason=(
                    "Use 'graduated from' for educational completion. "
                    "'Passed out' colloquially means fainted in international professional contexts."
                ),
            )
        )

    # 4. Could of / would of / should of
    m = re.search(r"\b(could|would|should)\s+of\b", transcript, re.IGNORECASE)
    if m:
        modal = m.group(1).lower()
        examples.append(
            SentenceExample(
                original=m.group(0),
                improved=f"{modal} have",
                reason=f"Modal perfect constructions require 'have' ('{modal} have'), not the preposition 'of'.",
            )
        )

    # 5. Redundant revert back
    m = re.search(r"\brevert\s+back\b", transcript, re.IGNORECASE)
    if m:
        examples.append(
            SentenceExample(
                original="revert back",
                improved="reply or respond",
                reason="'Revert' already denotes a return or reply. Adding 'back' is an unnecessary redundancy.",
            )
        )

    # 6. Discuss about
    m = re.search(r"\bdiscuss\s+about\b", transcript, re.IGNORECASE)
    if m:
        examples.append(
            SentenceExample(
                original="discuss about",
                improved="discuss",
                reason="'Discuss' is a transitive verb that directly takes an object without the preposition 'about'.",
            )
        )

    # 7. One of the + singular noun
    m = re.search(r"\bone\s+of\s+the\s+([a-z]{4,})(?!\s+[a-z]+s)\b", transcript, re.IGNORECASE)
    if m and not m.group(1).endswith("s"):
        sing = m.group(1)
        examples.append(
            SentenceExample(
                original=f"one of the {sing}",
                improved=f"one of the {sing}s",
                reason="'One of the' should always be followed by a plural noun.",
            )
        )

    # If no grammatical issues matched and this is a professional introduction, offer a constructive structural upgrade
    if not examples and exercise_type in ("professional-introduction", "professional_introduction"):
        sentences = [s.strip() for s in re.split(r"[.!?]", transcript) if s.strip()]
        if sentences:
            sample_sentence = sentences[0]
            if len(sample_sentence.split()) >= 4:
                examples.append(
                    SentenceExample(
                        original=sample_sentence,
                        improved=f"{sample_sentence}. In my work, I focus on delivering scalable, high-impact results.",
                        reason="Connecting your background directly to business value and tangible outcomes strengthens your initial impression.",
                    )
                )

    return examples[:3]


def _deterministic_feedback(
    scores: DimensionScores,
    metrics: Dict[str, Any],
    exercise_type: str = "interview",
    transcript: str = "",
) -> CoachLLMOutput:
    """Generate rule-based coaching feedback without any LLM call."""
    strengths: List[str] = []
    improvements: List[str] = []
    sentence_examples: List[SentenceExample] = _extract_deterministic_sentence_examples(transcript, exercise_type)

    score_map = {
        "Grammar": scores.grammar,
        "Vocabulary": scores.vocabulary,
        "Fluency": scores.fluency,
        "Speaking Pace": scores.pace,
        "Filler Control": scores.filler_control,
        "Response Structure": scores.structure,
        "Confidence Indicator": scores.confidence,
    }

    scored_dims = [(name, val) for name, val in score_map.items() if val is not None]
    scored_dims.sort(key=lambda x: x[1], reverse=True)

    for name, val in scored_dims[:3]:
        if val >= 60:
            strengths.append(
                f"Your {name.lower()} score of {val:.0f}/100 shows solid proficiency."
            )
    if not strengths:
        strengths.append("You completed the exercise — that is a great first step.")

    for name, val in scored_dims[-3:]:
        if val is not None and val < 70:
            improvements.append(
                f"Focus on improving {name.lower()} (currently {val:.0f}/100)."
            )
    if not improvements:
        improvements.append("Continue practising to maintain and extend your skills.")

    tip = "Record yourself for 30 seconds on any topic, listen back, and identify one specific thing to change."
    if scored_dims:
        weakest_name = scored_dims[-1][0]
        tips_map = {
            "Grammar": "Write out a 3-sentence answer before speaking — this helps catch grammar issues before they become habits.",
            "Vocabulary": "Read one short professional article and note 3 new words. Try using them in your next response.",
            "Fluency": "Practise the 'power pause': intentionally pause 1 second after each sentence instead of rushing.",
            "Speaking Pace": "Set a 60-second timer and describe your morning routine — aim for roughly 140 words. Replay and count.",
            "Filler Control": "Record 30 seconds and count every 'um', 'uh', and 'like'. Awareness is the first step.",
            "Response Structure": "Before answering, plan: Opening → 2 Main Points → Example → Conclusion. Even 5 seconds of planning helps.",
            "Confidence Indicator": "Stand up, take a deep breath, and speak your answer as if presenting to a friendly audience.",
        }
        tip = tips_map.get(weakest_name, tip)

    # Read-aloud specific tip
    if exercise_type in ("read-aloud", "read_aloud"):
        ra = metrics.get("read_aloud", {})
        if isinstance(ra, dict):
            acc = ra.get("accuracy_percentage", None)
            if acc is not None and acc < 80:
                tip = (
                    "Read the passage silently once to identify difficult words, "
                    "then read it aloud slowly — prioritising accuracy over speed."
                )
    elif exercise_type == "extempore":
        tip = (
            "Use the Rule of Three for spontaneous speaking: Opening statement → "
            "Three supporting points → Memorable conclusion."
        )
    elif exercise_type in ("rapid-fire", "rapid_fire"):
        tip = (
            "Aim for the 60-second sweet spot: 10s context, 40s specific actions, "
            "10s quantified outcome."
        )

    if scored_dims:
        avg = sum(v for _, v in scored_dims) / len(scored_dims)
        if avg >= 75:
            summary = f"Strong performance overall with an average score of {avg:.0f}/100."
        elif avg >= 50:
            summary = f"A solid attempt with an average of {avg:.0f}/100. Targeted practice will make a noticeable difference."
        else:
            summary = f"This session scored an average of {avg:.0f}/100. Consistent practice on the areas below will lead to improvement."
    else:
        summary = "Practice session completed. Keep going to build your communication skills."

    return CoachLLMOutput(
        summary=summary,
        strengths=strengths[:3],
        improvements=improvements[:3],
        sentenceExamples=sentence_examples,
        tip=tip,
    )


def _fmt(val: Optional[float]) -> str:
    if val is None:
        return "N/A (not applicable for this mode)"
    return f"{val:.1f}"


def _fill_common_placeholders(
    prompt: str,
    scores: DimensionScores,
    metrics: Dict[str, Any],
    transcript: str,
    exercise_prompt: str,
) -> str:
    """Fill placeholders shared across all prompt templates."""
    grammar_m = metrics.get("grammar", {})
    vocab_m = metrics.get("vocabulary", {})
    fluency_m = metrics.get("fluency", {}) if isinstance(metrics.get("fluency"), dict) else {}
    pace_m = metrics.get("pace", {}) if isinstance(metrics.get("pace"), dict) else {}
    filler_m = metrics.get("filler", {}) if isinstance(metrics.get("filler"), dict) else {}

    prompt = prompt.replace("{{exercise_prompt}}", exercise_prompt)
    prompt = prompt.replace("{{grammar_score}}", _fmt(scores.grammar))
    prompt = prompt.replace("{{vocabulary_score}}", _fmt(scores.vocabulary))
    prompt = prompt.replace("{{fluency_score}}", _fmt(scores.fluency))
    prompt = prompt.replace("{{pace_score}}", _fmt(scores.pace))
    prompt = prompt.replace("{{filler_score}}", _fmt(scores.filler_control))
    prompt = prompt.replace("{{structure_score}}", _fmt(scores.structure))
    prompt = prompt.replace("{{confidence_score}}", _fmt(scores.confidence))
    prompt = prompt.replace("{{grammar_errors_per_100}}", str(grammar_m.get("errors_per_100_words", "N/A")))
    prompt = prompt.replace("{{b2_plus_ratio}}", str(vocab_m.get("b2_plus_ratio", "N/A")))
    prompt = prompt.replace("{{mtld}}", str(vocab_m.get("mtld", "N/A")))
    prompt = prompt.replace("{{pause_count}}", str(fluency_m.get("pause_count", metrics.get("pause_count", "N/A"))))
    prompt = prompt.replace("{{pause_ratio}}", str(fluency_m.get("pause_ratio", metrics.get("pause_ratio", "N/A"))))
    prompt = prompt.replace("{{speaking_rate_wpm}}", str(pace_m.get("wpm", metrics.get("wpm", "N/A"))))
    prompt = prompt.replace("{{articulation_rate_wpm}}", str(pace_m.get("articulation_wpm", metrics.get("articulation_wpm", "N/A"))))
    prompt = prompt.replace("{{fillers_per_minute}}", str(filler_m.get("fillers_per_minute", metrics.get("fillers_per_minute", "N/A"))))
    prompt = prompt.replace("{{top_fillers}}", str(filler_m.get("top_fillers", metrics.get("top_fillers", "N/A"))))

    safe_transcript = transcript.replace("<transcript>", "").replace("</transcript>", "")
    prompt = prompt.replace("{{transcript}}", safe_transcript)
    return prompt


def _fill_read_aloud_placeholders(
    prompt: str,
    metrics: Dict[str, Any],
) -> str:
    """Fill read-aloud specific placeholders."""
    ra = metrics.get("read_aloud", {})
    if not isinstance(ra, dict):
        ra = {}
    prompt = prompt.replace("{{reference_word_count}}", str(ra.get("reference_word_count", "N/A")))
    prompt = prompt.replace("{{spoken_word_count}}", str(ra.get("spoken_word_count", "N/A")))
    prompt = prompt.replace("{{accuracy_percentage}}", str(ra.get("accuracy_percentage", "N/A")))
    prompt = prompt.replace("{{wer}}", str(ra.get("wer", "N/A")))
    prompt = prompt.replace("{{correct_count}}", str(ra.get("correct", "N/A")))
    prompt = prompt.replace("{{deletion_count}}", str(ra.get("deletions", "N/A")))
    prompt = prompt.replace("{{substitution_count}}", str(ra.get("substitutions", "N/A")))
    prompt = prompt.replace("{{insertion_count}}", str(ra.get("insertions", "N/A")))

    # Difficulty label from difficulty score (if present)
    difficulty = metrics.get("difficulty", None)
    if difficulty is not None:
        if difficulty <= 40:
            level = "Beginner"
        elif difficulty <= 65:
            level = "Intermediate"
        else:
            level = "Advanced"
    else:
        level = "N/A"
    prompt = prompt.replace("{{difficulty_level}}", level)
    return prompt


@router.post("/feedback", response_model=CoachFeedbackResponse)
def generate_feedback(req: CoachFeedbackRequest):
    """Generate coaching feedback from computed metrics and transcript."""
    scores = req.scores
    metrics = req.metrics
    transcript = req.transcript
    exercise_type = req.exerciseType or "interview"

    def fallback_factory() -> CoachLLMOutput:
        return _deterministic_feedback(scores, metrics, exercise_type, transcript=transcript)

    fallback_used = False

    # Choose prompt template based on exercise type
    if exercise_type in ("professional-introduction", "professional_introduction"):
        template_name = "coach_pi_v1.txt"
        prompt_version_key = "coach_pi"
    elif exercise_type in ("read-aloud", "read_aloud"):
        template_name = "coach_read_aloud_v1.txt"
        prompt_version_key = "coach_read_aloud"
    elif exercise_type == "situational":
        template_name = "coach_situational_v1.txt"
        prompt_version_key = "coach_situational"
    elif exercise_type == "extempore":
        template_name = "coach_extempore_v1.txt"
        prompt_version_key = "coach_extempore"
    elif exercise_type in ("rapid-fire", "rapid_fire"):
        template_name = "coach_rapid_fire_v1.txt"
        prompt_version_key = "coach_rapid_fire"
    else:
        template_name = "coach_feedback_v1.txt"
        prompt_version_key = "coach_feedback"

    try:
        template = load_prompt_template(template_name)
        prompt = _fill_common_placeholders(
            template, scores, metrics, transcript, req.exercisePrompt
        )
        # For read-aloud, also fill alignment-specific slots
        if exercise_type in ("read-aloud", "read_aloud"):
            prompt = _fill_read_aloud_placeholders(prompt, metrics)

        result, fallback_used = llm_client.generate_json(
            prompt=prompt,
            schema=CoachLLMOutput,
            fallback_factory=fallback_factory,
            prompt_version=config.prompt_versions.get(prompt_version_key, template_name.replace(".txt", "")),
        )
    except Exception:
        result = fallback_factory()
        fallback_used = True

    return CoachFeedbackResponse(
        sessionId=req.sessionId,
        summary=result.summary,
        strengths=result.strengths,
        improvements=result.improvements,
        sentenceExamples=result.sentenceExamples if hasattr(result, "sentenceExamples") else [],
        tip=result.tip,
        fallbackUsed=fallback_used,
    )

"""Text analysis endpoint for PrepHelp."""

from fastapi import APIRouter
from app.config import config
from app.schemas import (
    AnalysisVersions,
    DimensionScores,
    FlagItem,
    TextAnalysisRequest,
    TextAnalysisResponse,
)
from app.text import (
    analyze_grammar,
    analyze_hedging_and_structure,
    analyze_vocabulary,
    compute_text_confidence,
    evaluate_read_aloud,
    evaluate_structure,
)

router = APIRouter(prefix="/analyze", tags=["text-analysis"])


@router.post("/text", response_model=TextAnalysisResponse)
def analyze_text_endpoint(req: TextAnalysisRequest):
    """Analyze text response for grammar, vocabulary, structure, and confidence."""
    text = req.text.strip()

    # 1. Grammar analysis
    grammar_res = analyze_grammar(text)

    # 2. Vocabulary analysis
    vocab_res = analyze_vocabulary(text)

    # 3. Hedging & Completeness
    hedging_res = analyze_hedging_and_structure(text)

    # 4. Text Confidence (Transparent composite)
    confidence_res = compute_text_confidence(hedging_res.metrics)

    # 5. Structure evaluation
    struct_res = evaluate_structure(
        transcript=text,
        exercise_prompt=req.exercisePrompt or "Interview response",
        exercise_type=req.exerciseType or "interview",
    )

    # 6. Read-aloud evaluation if reference passage is provided
    read_aloud_data = None
    if req.referenceText and req.referenceText.strip():
        read_aloud_res = evaluate_read_aloud(req.referenceText, text)
        read_aloud_data = read_aloud_res.model_dump()

    # Consolidate flags
    all_flags: list[FlagItem] = []
    for f in grammar_res.flags:
        all_flags.append(FlagItem(type=f["type"], start=f["start"], end=f["end"], detail=f["detail"]))
    for f in hedging_res.flags:
        all_flags.append(FlagItem(type=f["type"], start=f["start"], end=f["end"], detail=f["detail"]))
    for f in struct_res.flags:
        all_flags.append(FlagItem(type=f["type"], start=0.0, end=0.0, detail=f["detail"]))
    for f in vocab_res.flags:
        all_flags.append(FlagItem(type=f["type"], start=0.0, end=0.0, detail=f["detail"]))

    # Scores (speech dimensions null for text attempts)
    scores = DimensionScores(
        grammar=grammar_res.grammar_score,
        vocabulary=vocab_res.vocabulary_score,
        structure=struct_res.structure_score,
        confidence=confidence_res.confidence_score,
        fluency=None,
        pace=None,
        filler_control=None,
    )

    metrics = {
        "grammar": {
            "error_count": grammar_res.error_count,
            "word_count": grammar_res.word_count,
            "errors_per_100_words": grammar_res.errors_per_100_words,
        },
        "vocabulary": vocab_res.metrics.model_dump(),
        "hedging": hedging_res.metrics.model_dump(),
        "confidence_factors": confidence_res.factors,
        "structure": struct_res.metrics.model_dump(),
    }
    if read_aloud_data:
        metrics["read_aloud"] = read_aloud_data

    return TextAnalysisResponse(
        sessionId=req.sessionId,
        text=text,
        scores=scores,
        metrics=metrics,
        flags=all_flags,
        errorPatterns=grammar_res.error_patterns,
        llmUsed=struct_res.llm_used,
        fallbackUsed=struct_res.fallback_used,
        versions=AnalysisVersions(
            whisperModel=None,
            promptVersions=config.prompt_versions,
            formulaVersion=config.formula_version,
        ),
    )

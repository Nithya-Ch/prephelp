"""FastAPI router for speech analysis endpoint."""

import os
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from app.audio.converter import convert_to_16k_mono_wav
from app.audio.quality import check_audio_quality
from app.audio.vad import analyze_vad
from app.config import config
from app.schemas import (
    DimensionScores,
    FlagItem,
    SpeechAnalysisResponse,
    SpeechVersions,
)
from app.speech.confidence import calculate_composite_confidence
from app.speech.fillers import detect_fillers
from app.speech.fluency import calculate_fluency
from app.speech.pace import calculate_pace
from app.speech.prosody import extract_prosody
from app.speech.transcriber import transcribe_audio
from app.text import (
    analyze_grammar,
    analyze_hedging_and_structure,
    analyze_vocabulary,
    evaluate_structure,
    evaluate_read_aloud,
)

router = APIRouter(prefix="/analyze", tags=["Speech Analysis"])


@router.post("/speech", response_model=SpeechAnalysisResponse)
def analyze_speech_endpoint(
    file: UploadFile = File(...),
    sessionId: Optional[str] = Form(None),
    referenceText: Optional[str] = Form(None),
    exercisePrompt: Optional[str] = Form(None),
    exerciseType: Optional[str] = Form(None),
) -> SpeechAnalysisResponse:
    """Analyze an uploaded speech audio file (e.g. webm, wav, mp3, ogg).

    Performs:
    1. Validation & 16kHz mono WAV conversion
    2. Quality checks (silence, duration, energy)
    3. Voice Activity Detection (VAD)
    4. Faster-Whisper transcription with filler biasing
    5. Pace, Fluency, Filler, and Prosody scoring
    6. Composite Confidence estimation
    7. Text analysis on transcript (grammar, vocabulary, structure)
    """
    if hasattr(file, "file") and file.file is not None:
        audio_bytes = file.file.read()
    elif hasattr(file, "read"):
        raw = file.read()
        audio_bytes = raw if isinstance(raw, bytes) else bytes()
    else:
        audio_bytes = b""
    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    ref_text = referenceText if isinstance(referenceText, str) else None
    ex_prompt = exercisePrompt if isinstance(exercisePrompt, str) else None
    ex_type = exerciseType if isinstance(exerciseType, str) else None
    sess_id = sessionId if isinstance(sessionId, str) else None

    wav_path = None
    try:
        # Convert and validate size & duration
        wav_path, duration = convert_to_16k_mono_wav(
            audio_bytes=audio_bytes,
            original_filename=file.filename or "recording.webm",
        )

        # Quality inspection
        warnings, silence_ratio, rms_energy = check_audio_quality(wav_path, duration)

        # Voice Activity Detection
        try:
            vad_res = analyze_vad(wav_path)
            speech_duration = vad_res["speech_duration"]
        except Exception:
            speech_duration = max(0.5, duration * (1.0 - silence_ratio))

        # Transcription with word timestamps
        transcript, words = transcribe_audio(wav_path)

        # ── Acoustic analysis ──
        # Pace
        wpm, articulation_wpm, pace_score, pace_flags = calculate_pace(
            words=words,
            total_duration_sec=duration,
            speech_duration_sec=speech_duration,
        )

        # Fluency
        (
            pause_count,
            long_pause_count,
            pause_rate_per_min,
            pause_ratio,
            mean_length_of_run,
            fluency_score,
            fluency_flags,
        ) = calculate_fluency(
            words=words,
            total_duration_sec=duration,
        )

        # Fillers
        (
            filler_count,
            fillers_per_min,
            filler_control_score,
            filler_flags,
            updated_words,
        ) = detect_fillers(
            words=words,
            full_transcript=transcript,
            total_duration_sec=duration,
        )

        # Prosody (pitch & volume)
        pitch_mean, pitch_std, volume_mean, volume_std = extract_prosody(wav_path)

        # Composite Confidence (acoustic)
        confidence_score = calculate_composite_confidence(
            filler_control_score=filler_control_score,
            fluency_score=fluency_score,
            pace_score=pace_score,
            pitch_std=pitch_std,
            volume_mean=volume_mean,
            volume_std=volume_std,
            transcript=transcript,
        )

        # ── Text analysis on transcript ──
        grammar_res = analyze_grammar(transcript)
        vocab_res = analyze_vocabulary(transcript)
        hedging_res = analyze_hedging_and_structure(transcript)
        struct_res = evaluate_structure(
            transcript=transcript,
            exercise_prompt=ex_prompt or "Interview response",
            exercise_type=ex_type or "interview",
        )

        # Read-aloud WER if reference provided
        read_aloud_data = None
        if ref_text and ref_text.strip():
            ra_res = evaluate_read_aloud(ref_text, transcript)
            read_aloud_data = ra_res.model_dump()

        # ── Aggregate flags ──
        all_flags: list[FlagItem] = sorted(
            pace_flags + fluency_flags + filler_flags,
            key=lambda f: f.start,
        )
        # Append grammar flags (character offsets)
        for f in grammar_res.flags:
            all_flags.append(FlagItem(type=f["type"], start=f["start"], end=f["end"], detail=f["detail"]))
        for f in hedging_res.flags:
            all_flags.append(FlagItem(type=f["type"], start=f["start"], end=f["end"], detail=f["detail"]))
        for f in struct_res.flags:
            all_flags.append(FlagItem(type=f["type"], start=0.0, end=0.0, detail=f["detail"]))

        # ── Build unified metrics dict ──
        metrics = {
            "wpm": wpm,
            "articulation_wpm": articulation_wpm,
            "pause_count": pause_count,
            "long_pause_count": long_pause_count,
            "pause_rate_per_min": pause_rate_per_min,
            "pause_ratio": pause_ratio,
            "mean_length_of_run": mean_length_of_run,
            "filler_count": filler_count,
            "fillers_per_minute": fillers_per_min,
            "pitch_mean": pitch_mean,
            "pitch_std": pitch_std,
            "volume_mean": volume_mean,
            "volume_std": volume_std,
            "speech_duration": round(speech_duration, 2),
            "total_duration": round(duration, 2),
            "grammar": {
                "error_count": grammar_res.error_count,
                "word_count": grammar_res.word_count,
                "errors_per_100_words": grammar_res.errors_per_100_words,
            },
            "vocabulary": vocab_res.metrics.model_dump(),
            "hedging": hedging_res.metrics.model_dump(),
            "structure": struct_res.metrics.model_dump(),
        }
        if read_aloud_data:
            metrics["read_aloud"] = read_aloud_data

        # ── Build unified scores ──
        scores = DimensionScores(
            pace=pace_score,
            fluency=fluency_score,
            filler_control=filler_control_score,
            confidence=confidence_score,
            grammar=grammar_res.grammar_score,
            vocabulary=vocab_res.vocabulary_score,
            structure=struct_res.structure_score,
        )

        versions = SpeechVersions(
            whisperModel=config.whisper_model,
            formulaVersion=config.formula_version,
            promptVersions=config.prompt_versions,
        )

        return SpeechAnalysisResponse(
            sessionId=sess_id,
            transcript=transcript,
            words=updated_words,
            metrics=metrics,
            scores=scores,
            flags=all_flags,
            warnings=warnings,
            errorPatterns=grammar_res.error_patterns,
            llmUsed=struct_res.llm_used,
            fallbackUsed=struct_res.fallback_used,
            versions=versions,
        )

    finally:
        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except OSError:
                pass

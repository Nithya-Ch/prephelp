"""Singleton faster-whisper transcriber module with filler biasing."""

import os
from typing import Callable, List, Optional, Tuple
from app.config import config
from app.schemas import WordTimestamp

INITIAL_FILLER_PROMPT = "Umm, let me think, uh, like, you know, well..."

_whisper_model_instance = None
_transcribe_override: Optional[Callable[[str], Tuple[str, List[WordTimestamp]]]] = None


def get_whisper_model():
    """Retrieve or initialize the faster-whisper WhisperModel singleton."""
    global _whisper_model_instance
    if _whisper_model_instance is None:
        from faster_whisper import WhisperModel

        model_name = os.getenv("WHISPER_MODEL", config.whisper_model or "base")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

        _whisper_model_instance = WhisperModel(
            model_name,
            device=device,
            compute_type=compute_type,
        )
    return _whisper_model_instance


def set_transcribe_override(override_fn: Optional[Callable[[str], Tuple[str, List[WordTimestamp]]]]):
    """Set or clear a transcription override for testing."""
    global _transcribe_override
    _transcribe_override = override_fn


def transcribe_audio(
    wav_path: str,
    language: str = "en",
) -> Tuple[str, List[WordTimestamp]]:
    """Transcribe 16kHz mono audio using faster-whisper with word timestamps and filler biasing.

    Returns:
        Tuple[str, List[WordTimestamp]]: (full_transcript, list_of_word_timestamps)
    """
    global _transcribe_override
    if _transcribe_override is not None:
        return _transcribe_override(wav_path)

    model = get_whisper_model()
    segments, _ = model.transcribe(
        wav_path,
        language=language,
        word_timestamps=True,
        initial_prompt=INITIAL_FILLER_PROMPT,
        beam_size=5,
        vad_filter=False,
    )

    words_list: List[WordTimestamp] = []
    full_text_parts: List[str] = []

    for segment in segments:
        full_text_parts.append(segment.text.strip())
        if segment.words:
            for w in segment.words:
                cleaned_word = w.word.strip()
                if cleaned_word:
                    words_list.append(
                        WordTimestamp(
                            w=cleaned_word,
                            start=round(float(w.start), 3),
                            end=round(float(w.end), 3),
                            flag=None,
                        )
                    )

    transcript = " ".join(full_text_parts).strip()
    return transcript, words_list

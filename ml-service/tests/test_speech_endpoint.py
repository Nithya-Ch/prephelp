"""Integration tests for the /analyze/speech API endpoint."""

import io
import wave
import struct
from unittest.mock import patch
import pytest
from fastapi import HTTPException, UploadFile
from main import health
from app.routers.speech import analyze_speech_endpoint
from app.schemas import WordTimestamp
from app.speech.transcriber import set_transcribe_override


def make_dummy_wav(duration_sec: float = 3.0, sample_rate: int = 16000) -> bytes:
    """Create in-memory PCM WAV with sound energy."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        n = int(sample_rate * duration_sec)
        frames = [int(12000 * ((i % 36) - 18) / 18) for i in range(n)]
        raw = struct.pack(f"<{len(frames)}h", *frames)
        wf.writeframes(raw)
    return buf.getvalue()


def test_health_check():
    data = health()
    assert data["status"] == "ok"
    assert data["phase"] in (2, 3)


def test_speech_endpoint_empty_file():
    upload = UploadFile(filename="empty.wav", file=io.BytesIO(b""))
    with pytest.raises(HTTPException) as exc:
        analyze_speech_endpoint(file=upload)
    assert exc.value.status_code == 400
    assert "empty" in str(exc.value.detail).lower()


def test_speech_endpoint_oversized_file():
    oversized = b"\x00" * int(11 * 1024 * 1024)
    upload = UploadFile(filename="large.wav", file=io.BytesIO(oversized))
    with pytest.raises(HTTPException) as exc:
        analyze_speech_endpoint(file=upload)
    assert exc.value.status_code in [400, 413]


def test_speech_endpoint_valid_audio(tmp_path):
    wav_bytes = make_dummy_wav(duration_sec=3.0)
    fake_wav_path = str(tmp_path / "fake_input.wav")
    with open(fake_wav_path, "wb") as f:
        f.write(wav_bytes)

    # Mock transcriber output
    mock_words = [
        WordTimestamp(w="Hello", start=0.2, end=0.6),
        WordTimestamp(w="world", start=0.7, end=1.2),
        WordTimestamp(w="this", start=1.3, end=1.6),
        WordTimestamp(w="is", start=1.7, end=1.9),
        WordTimestamp(w="PrepHelp", start=2.0, end=2.7),
    ]

    def mock_transcribe(path):
        return "Hello world this is PrepHelp", mock_words

    set_transcribe_override(mock_transcribe)

    try:
        with patch("app.routers.speech.convert_to_16k_mono_wav", return_value=(fake_wav_path, 3.0)):
            upload = UploadFile(filename="audio.wav", file=io.BytesIO(wav_bytes))
            data = analyze_speech_endpoint(file=upload, sessionId="test-session-123")

        assert data.sessionId == "test-session-123"
        assert data.transcript == "Hello world this is PrepHelp"
        assert len(data.words) == 5
        assert data.metrics is not None
        assert data.scores is not None
        assert data.versions is not None
        assert data.flags is not None
        assert data.warnings is not None

        # Check metrics keys
        metrics = data.metrics
        assert "wpm" in metrics
        assert "articulation_wpm" in metrics
        assert "pause_count" in metrics
        assert "long_pause_count" in metrics
        assert "mean_length_of_run" in metrics
        assert "filler_count" in metrics
        assert "pitch_mean" in metrics
        assert "volume_mean" in metrics

        # Check scores keys
        scores = data.scores
        assert scores.pace is not None
        assert scores.fluency is not None
        assert scores.filler_control is not None
        assert scores.confidence is not None

    finally:
        set_transcribe_override(None)

"""Tests for audio converter module."""

import io
import struct
import wave
from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException
from app.audio.converter import convert_to_16k_mono_wav, get_audio_duration_wave


def create_synthetic_wav_bytes(duration_sec: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Helper to create an in-memory 16kHz mono 16-bit PCM WAV."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        n_samples = int(sample_rate * duration_sec)
        # Generate moderate sine-wave like alternating values
        frames = [int(1000 * ((i % 100) - 50) / 50) for i in range(n_samples)]
        raw_data = struct.pack(f"<{len(frames)}h", *frames)
        wf.writeframes(raw_data)
    return buffer.getvalue()


def test_get_audio_duration_wave(tmp_path):
    wav_bytes = create_synthetic_wav_bytes(duration_sec=3.5)
    file_path = tmp_path / "test.wav"
    file_path.write_bytes(wav_bytes)

    duration = get_audio_duration_wave(str(file_path))
    assert abs(duration - 3.5) < 0.01


def test_file_size_exceeded():
    # 11 MB of zeros
    oversized = b"\x00" * int(11 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        convert_to_16k_mono_wav(oversized, "test.wav")
    assert exc_info.value.status_code == 413


@patch("subprocess.run")
def test_successful_conversion_mocked_ffmpeg(mock_run, tmp_path):
    valid_wav = create_synthetic_wav_bytes(duration_sec=2.5)

    def fake_ffmpeg(cmd, **kwargs):
        # cmd: ['ffmpeg', '-y', '-i', ..., '-c:a', 'pcm_s16le', out_path]
        out_path = cmd[-1]
        with open(out_path, "wb") as f:
            f.write(valid_wav)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = fake_ffmpeg

    out_file, duration = convert_to_16k_mono_wav(valid_wav, "recording.webm")
    assert abs(duration - 2.5) < 0.05
    assert out_file.endswith(".wav")


@patch("subprocess.run")
def test_conversion_too_short(mock_run):
    short_wav = create_synthetic_wav_bytes(duration_sec=0.5)

    def fake_ffmpeg(cmd, **kwargs):
        out_path = cmd[-1]
        with open(out_path, "wb") as f:
            f.write(short_wav)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = fake_ffmpeg

    with pytest.raises(HTTPException) as exc_info:
        convert_to_16k_mono_wav(b"dummy_short_audio", "short.webm")
    assert exc_info.value.status_code == 400
    assert "too short" in exc_info.value.detail.lower()


@patch("subprocess.run")
def test_conversion_too_long(mock_run):
    long_wav = create_synthetic_wav_bytes(duration_sec=185.0)

    def fake_ffmpeg(cmd, **kwargs):
        out_path = cmd[-1]
        with open(out_path, "wb") as f:
            f.write(long_wav)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = fake_ffmpeg

    with pytest.raises(HTTPException) as exc_info:
        convert_to_16k_mono_wav(b"dummy_long_audio", "long.webm")
    assert exc_info.value.status_code == 400
    assert "exceeds maximum allowed" in exc_info.value.detail.lower()

"""Audio conversion and validation utilities using ffmpeg."""

import os
import subprocess
import tempfile
import wave
from pathlib import Path
from fastapi import HTTPException
from app.config import config


def get_audio_duration_wave(wav_path: str | Path) -> float:
    """Extract audio duration in seconds from a standard WAV file."""
    try:
        with wave.open(str(wav_path), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate <= 0:
                return 0.0
            return float(frames) / float(rate)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read converted WAV file duration: {str(e)}",
        )


def convert_to_16k_mono_wav(
    audio_bytes: bytes,
    original_filename: str = "audio.webm",
) -> tuple[str, float]:
    """Validate file size and convert any audio file to 16kHz mono 16-bit PCM WAV.

    Returns:
        tuple[str, float]: (path_to_wav_file, duration_seconds)
    Raises:
        HTTPException: if size or duration boundaries are exceeded or conversion fails.
    """
    max_mb = config.quality.max_file_size_mb
    max_bytes = int(max_mb * 1024 * 1024)
    if len(audio_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file size ({len(audio_bytes) / (1024*1024):.2f} MB) exceeds maximum allowed limit ({max_mb:.1f} MB).",
        )

    # Detect extension
    ext = Path(original_filename).suffix or ".webm"
    if not ext.startswith("."):
        ext = f".{ext}"

    # Create temp files
    temp_in = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    temp_out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_in_path = temp_in.name
    temp_out_path = temp_out.name
    temp_in.close()
    temp_out.close()

    try:
        with open(temp_in_path, "wb") as f:
            f.write(audio_bytes)

        # Execute ffmpeg conversion
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            temp_in_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            temp_out_path,
        ]

        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f"FFmpeg failed to decode audio file. Ensure valid format. Error: {result.stderr.strip()[-200:]}",
            )

        duration = get_audio_duration_wave(temp_out_path)

        if duration < config.quality.min_duration_sec:
            raise HTTPException(
                status_code=400,
                detail="Audio is silent, near-silent, or too short. Please retry.",
            )

        if duration > config.quality.max_duration_sec:
            raise HTTPException(
                status_code=400,
                detail=f"Audio duration ({duration:.1f}s) exceeds maximum allowed {config.quality.max_duration_sec:.1f}s.",
            )

        return temp_out_path, duration

    except HTTPException:
        # Re-raise HTTP exceptions, clean up output if failed
        if os.path.exists(temp_out_path):
            try:
                os.remove(temp_out_path)
            except OSError:
                pass
        raise
    except FileNotFoundError:
        # ffmpeg binary not found
        if os.path.exists(temp_out_path):
            try:
                os.remove(temp_out_path)
            except OSError:
                pass
        raise HTTPException(
            status_code=500,
            detail="ffmpeg is not installed or not found on system PATH.",
        )
    finally:
        if os.path.exists(temp_in_path):
            try:
                os.remove(temp_in_path)
            except OSError:
                pass

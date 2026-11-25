"""Voice Activity Detection (VAD) module using webrtcvad."""

import wave
from typing import Dict, Any, List
import numpy as np

try:
    import webrtcvad
    WEBRTCVAD_AVAILABLE = True
except ImportError:
    WEBRTCVAD_AVAILABLE = False


def frame_generator(frame_duration_ms: int, audio_bytes: bytes, sample_rate: int = 16000) -> List[bytes]:
    """Generates audio frames from raw PCM audio bytes.

    Args:
        frame_duration_ms: Frame duration in ms (10, 20, or 30).
        audio_bytes: Raw 16-bit mono PCM bytes.
        sample_rate: Audio sample rate in Hz (16000).
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)  # 2 bytes per sample
    offset = 0
    frames = []
    while offset + n <= len(audio_bytes):
        frames.append(audio_bytes[offset : offset + n])
        offset += n
    return frames


def energy_based_vad_fallback(frames: List[bytes], threshold: float = 0.01) -> List[bool]:
    """Simple RMS energy-based voice activity detection fallback."""
    results = []
    for frame in frames:
        samples = np.frombuffer(frame, dtype=np.int16).astype(np.float32) / 32768.0
        rms = np.sqrt(np.mean(samples**2)) if len(samples) > 0 else 0.0
        results.append(bool(rms >= threshold))
    return results


def analyze_vad(
    wav_path: str,
    frame_duration_ms: int = 30,
    aggressiveness: int = 2,
) -> Dict[str, Any]:
    """Run VAD on 16kHz mono 16-bit PCM WAV.

    Returns:
        dict containing:
            - voiced_frames (int)
            - unvoiced_frames (int)
            - total_frames (int)
            - speech_ratio (float)
            - silence_ratio (float)
            - speech_duration (float)
            - voiced_frame_flags (List[bool])
    """
    with wave.open(wav_path, "rb") as wf:
        sample_rate = wf.getframerate()
        channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        n_frames = wf.getnframes()
        pcm_bytes = wf.readframes(n_frames)

    # Sanity checks for 16kHz mono 16-bit
    if sample_rate != 16000 or channels != 1 or sampwidth != 2:
        raise ValueError(
            f"VAD expects 16kHz mono 16-bit audio. Found {sample_rate}Hz, {channels}ch, {sampwidth*8}bit."
        )

    frames = frame_generator(frame_duration_ms, pcm_bytes, sample_rate)
    if not frames:
        return {
            "voiced_frames": 0,
            "unvoiced_frames": 0,
            "total_frames": 0,
            "speech_ratio": 0.0,
            "silence_ratio": 1.0,
            "speech_duration": 0.0,
            "voiced_frame_flags": [],
        }

    frame_sec = frame_duration_ms / 1000.0

    if WEBRTCVAD_AVAILABLE:
        try:
            vad = webrtcvad.Vad(aggressiveness)
            voiced_flags = [vad.is_speech(f, sample_rate) for f in frames]
        except Exception:
            voiced_flags = energy_based_vad_fallback(frames)
    else:
        voiced_flags = energy_based_vad_fallback(frames)

    voiced_count = sum(1 for is_speech in voiced_flags if is_speech)
    unvoiced_count = len(frames) - voiced_count
    total_count = len(frames)
    speech_ratio = float(voiced_count) / float(total_count) if total_count > 0 else 0.0
    silence_ratio = 1.0 - speech_ratio
    speech_duration = float(voiced_count) * frame_sec

    return {
        "voiced_frames": voiced_count,
        "unvoiced_frames": unvoiced_count,
        "total_frames": total_count,
        "speech_ratio": speech_ratio,
        "silence_ratio": silence_ratio,
        "speech_duration": speech_duration,
        "voiced_frame_flags": voiced_flags,
    }

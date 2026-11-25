"""Audio quality checks and validation."""

import wave
from typing import List, Tuple
import numpy as np
from fastapi import HTTPException
from app.config import config
from app.audio.vad import analyze_vad


def load_pcm_normalized(wav_path: str) -> np.ndarray:
    """Load 16-bit PCM WAV as normalized float32 numpy array in range [-1.0, 1.0]."""
    with wave.open(wav_path, "rb") as wf:
        n_frames = wf.getnframes()
        pcm_bytes = wf.readframes(n_frames)
    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    return samples


def check_audio_quality(
    wav_path: str,
    duration: float,
) -> Tuple[List[str], float, float]:
    """Inspect audio quality, silence, and energy.

    Returns:
        Tuple[List[str], float, float]: (warnings, silence_ratio, rms_energy)
    Raises:
        HTTPException(400, "Audio is silent, near-silent, or too short. Please retry.")
    """
    if duration < config.quality.min_duration_sec:
        raise HTTPException(
            status_code=400,
            detail="Audio is silent, near-silent, or too short. Please retry.",
        )

    samples = load_pcm_normalized(wav_path)
    if len(samples) == 0:
        raise HTTPException(
            status_code=400,
            detail="Audio is silent, near-silent, or too short. Please retry.",
        )

    rms = float(np.sqrt(np.mean(samples**2)))
    max_amp = float(np.max(np.abs(samples)))

    # Run VAD to compute silence ratio (aggressiveness=1 for balanced voice detection)
    silent_count = np.sum(np.abs(samples) < config.quality.min_rms_amplitude)
    energy_silence_ratio = float(silent_count) / float(len(samples)) if len(samples) > 0 else 1.0

    try:
        vad_results = analyze_vad(wav_path, aggressiveness=1)
        silence_ratio = min(vad_results["silence_ratio"], energy_silence_ratio)
    except Exception:
        silence_ratio = energy_silence_ratio

    # Reject if unusable
    if silence_ratio > 0.90 or rms < 0.001 or max_amp < 0.005:
        raise HTTPException(
            status_code=400,
            detail="Audio is silent, near-silent, or too short. Please retry.",
        )

    warnings: List[str] = []

    if silence_ratio >= config.quality.silence_ratio_threshold:
        warnings.append(
            f"High silence ratio detected ({silence_ratio * 100:.1f}%); audio contains long quiet intervals."
        )

    if rms < config.quality.min_rms_amplitude:
        warnings.append(
            f"Low microphone volume detected (RMS: {rms:.4f}); consider moving closer to the microphone."
        )

    if max_amp >= 0.98:
        warnings.append("Possible audio clipping detected; input volume might be too loud.")

    return warnings, silence_ratio, rms

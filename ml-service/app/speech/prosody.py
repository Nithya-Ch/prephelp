"""Prosody extraction module for pitch variation and volume steadiness."""

from typing import Tuple
import numpy as np
from app.audio.quality import load_pcm_normalized

try:
    import parselmouth
    PARSELMOUTH_AVAILABLE = True
except ImportError:
    PARSELMOUTH_AVAILABLE = False

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False


def extract_pitch_parselmouth(wav_path: str) -> Tuple[float, float]:
    """Extract mean pitch and pitch standard deviation using Praat Parselmouth.

    Returns:
        Tuple[float, float]: (pitch_mean_hz, pitch_std_hz)
    """
    if not PARSELMOUTH_AVAILABLE:
        return 0.0, 0.0

    try:
        snd = parselmouth.Sound(wav_path)
        pitch = snd.to_pitch(time_step=0.01, pitch_floor=75.0, pitch_ceiling=500.0)
        pitch_values = pitch.selected_array["frequency"]
        voiced = pitch_values[pitch_values > 0]
        if len(voiced) == 0:
            return 0.0, 0.0

        pitch_mean = float(np.mean(voiced))
        pitch_std = float(np.std(voiced))
        return round(pitch_mean, 1), round(pitch_std, 1)
    except Exception:
        return 0.0, 0.0


def extract_volume_energy(
    wav_path: str,
    frame_length: int = 1024,
    hop_length: int = 512,
) -> Tuple[float, float]:
    """Extract mean RMS volume energy and standard deviation using librosa or numpy.

    Returns:
        Tuple[float, float]: (volume_mean, volume_std)
    """
    try:
        samples = load_pcm_normalized(wav_path)
        if len(samples) == 0:
            return 0.0, 0.0

        if len(samples) < frame_length:
            rms = float(np.sqrt(np.mean(samples**2)))
            return round(rms, 4), 0.0

        from numpy.lib.stride_tricks import sliding_window_view
        windows = sliding_window_view(samples, window_shape=frame_length)[::hop_length]
        rms_frames = np.sqrt(np.mean(windows**2, axis=-1))

        if len(rms_frames) == 0:
            return 0.0, 0.0

        v_mean = float(np.mean(rms_frames))
        v_std = float(np.std(rms_frames))
        return round(v_mean, 4), round(v_std, 4)
    except Exception:
        return 0.0, 0.0


def extract_prosody(wav_path: str) -> Tuple[float, float, float, float]:
    """Extract prosody metrics: pitch mean, pitch std, volume mean, volume std.

    Returns:
        Tuple[float, float, float, float]:
            (pitch_mean, pitch_std, volume_mean, volume_std)
    """
    pitch_mean, pitch_std = extract_pitch_parselmouth(wav_path)
    volume_mean, volume_std = extract_volume_energy(wav_path)
    return pitch_mean, pitch_std, volume_mean, volume_std

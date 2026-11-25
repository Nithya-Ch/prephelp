"""Test harness for PrepHelp speech analysis pipeline.

Generates 5 synthetic audio clips representing diverse candidate profiles:
1. Ideal Candidate (balanced 135 WPM, natural brief pauses, zero fillers)
2. Hesitant / Halting (long awkward pauses > 1.5s, fragmented runs)
3. Fast & Filler-Heavy (rapid 185 WPM, repeated 'um', 'like', 'you know')
4. Slow & Monotonic (slow 75 WPM, low pitch variation)
5. Low Volume / Quiet Mic (low amplitude energy triggering quality warning)

Runs each through the analysis pipeline and prints a clean ASCII markdown summary table.
"""

import os
import sys
import tempfile
import numpy as np
from scipy.io import wavfile

# Ensure ml-service root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.schemas import WordTimestamp
from app.audio.quality import check_audio_quality
from app.audio.vad import analyze_vad
from app.speech.pace import calculate_pace
from app.speech.fluency import calculate_fluency
from app.speech.fillers import detect_fillers
from app.speech.prosody import extract_prosody
from app.speech.confidence import calculate_composite_confidence


def generate_synthetic_audio(
    duration_sec: float,
    active_intervals: list[tuple[float, float]],
    sample_rate: int = 16000,
    base_freq: float = 140.0,
    amplitude: float = 0.5,
) -> tuple[np.ndarray, str]:
    """Generate 16kHz mono synthetic PCM wav with voiced harmonics during active intervals."""
    total_samples = int(duration_sec * sample_rate)
    audio = np.zeros(total_samples, dtype=np.float32)

    # Slight background noise
    audio += np.random.normal(0, 0.001, total_samples).astype(np.float32)

    for start_sec, end_sec in active_intervals:
        idx_start = int(start_sec * sample_rate)
        idx_end = min(total_samples, int(end_sec * sample_rate))
        t = np.linspace(start_sec, end_sec, idx_end - idx_start, endpoint=False)
        # Fundamental tone + harmonic
        tone = amplitude * (0.7 * np.sin(2 * np.pi * base_freq * t) + 0.3 * np.sin(2 * np.pi * (base_freq * 2) * t))
        audio[idx_start:idx_end] += tone.astype(np.float32)

    # Convert to 16-bit PCM integer
    audio_int16 = np.int16(np.clip(audio, -1.0, 1.0) * 32767)

    # Write to temporary file
    temp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    wavfile.write(temp.name, sample_rate, audio_int16)
    temp.close()
    return audio_int16, temp.name


def define_test_clips():
    """Define 5 synthetic candidate audio scenarios."""
    clips = [
        {
            "name": "1. Ideal Candidate",
            "duration": 12.0,
            "amplitude": 0.45,
            "base_freq": 140.0,
            "transcript": "I am excited to discuss my software engineering background and leading cloud architecture projects.",
            "words": [
                WordTimestamp(w="I", start=0.5, end=0.8),
                WordTimestamp(w="am", start=0.9, end=1.2),
                WordTimestamp(w="excited", start=1.3, end=1.9),
                WordTimestamp(w="to", start=2.0, end=2.2),
                WordTimestamp(w="discuss", start=2.3, end=2.8),
                WordTimestamp(w="my", start=2.9, end=3.2),
                WordTimestamp(w="software", start=3.3, end=3.9),
                WordTimestamp(w="engineering", start=4.0, end=4.8),
                # Brief pause 0.6s
                WordTimestamp(w="background", start=5.4, end=6.2),
                WordTimestamp(w="and", start=6.3, end=6.6),
                WordTimestamp(w="leading", start=6.7, end=7.3),
                WordTimestamp(w="cloud", start=7.4, end=7.8),
                WordTimestamp(w="architecture", start=7.9, end=8.7),
                WordTimestamp(w="projects", start=8.8, end=9.6),
            ],
            "intervals": [(0.5, 4.8), (5.4, 9.6)],
        },
        {
            "name": "2. Hesitant / Long Pauses",
            "duration": 14.0,
            "amplitude": 0.40,
            "base_freq": 130.0,
            "transcript": "My primary language was Python then I transitioned over to TypeScript.",
            "words": [
                WordTimestamp(w="My", start=0.5, end=0.8),
                WordTimestamp(w="primary", start=0.9, end=1.4),
                WordTimestamp(w="language", start=1.5, end=2.1),
                WordTimestamp(w="was", start=2.2, end=2.5),
                WordTimestamp(w="Python", start=2.6, end=3.2),
                # Long pause 2.3s (>1.5s)
                WordTimestamp(w="then", start=5.5, end=5.9),
                WordTimestamp(w="I", start=6.0, end=6.3),
                # Another long pause 2.0s
                WordTimestamp(w="transitioned", start=8.3, end=9.2),
                WordTimestamp(w="over", start=9.3, end=9.7),
                WordTimestamp(w="to", start=9.8, end=10.0),
                WordTimestamp(w="TypeScript", start=10.1, end=11.0),
            ],
            "intervals": [(0.5, 3.2), (5.5, 6.3), (8.3, 11.0)],
        },
        {
            "name": "3. Rapid & Filler-Heavy",
            "duration": 8.0,
            "amplitude": 0.50,
            "base_freq": 155.0,
            "transcript": "Um like you know we basically shipped like kind of fast.",
            "words": [
                WordTimestamp(w="Um", start=0.2, end=0.5),
                WordTimestamp(w="like", start=0.6, end=0.9),
                WordTimestamp(w="you", start=1.0, end=1.2),
                WordTimestamp(w="know", start=1.3, end=1.5),
                WordTimestamp(w="we", start=1.6, end=1.8),
                WordTimestamp(w="basically", start=1.9, end=2.4),
                WordTimestamp(w="shipped", start=2.5, end=2.9),
                WordTimestamp(w="like", start=3.0, end=3.3),
                WordTimestamp(w="kind", start=3.4, end=3.6),
                WordTimestamp(w="of", start=3.7, end=3.9),
                WordTimestamp(w="fast", start=4.0, end=4.4),
            ],
            "intervals": [(0.2, 4.5)],
        },
        {
            "name": "4. Slow / Halting Pace",
            "duration": 15.0,
            "amplitude": 0.35,
            "base_freq": 110.0,
            "transcript": "We ... designed ... microservices.",
            "words": [
                WordTimestamp(w="We", start=1.0, end=1.8),
                # Long pause 2.2s
                WordTimestamp(w="designed", start=4.0, end=5.2),
                # Long pause 2.8s
                WordTimestamp(w="microservices", start=8.0, end=9.8),
            ],
            "intervals": [(1.0, 1.8), (4.0, 5.2), (8.0, 9.8)],
        },
        {
            "name": "5. Quiet Mic / Low Energy",
            "duration": 5.0,
            "amplitude": 0.008,  # Triggers low volume warning (< 0.005 RMS approx)
            "base_freq": 135.0,
            "transcript": "Testing low energy audio clip.",
            "words": [
                WordTimestamp(w="Testing", start=0.5, end=1.2),
                WordTimestamp(w="low", start=1.3, end=1.6),
                WordTimestamp(w="energy", start=1.7, end=2.3),
                WordTimestamp(w="audio", start=2.4, end=2.9),
                WordTimestamp(w="clip", start=3.0, end=3.6),
            ],
            "intervals": [(0.5, 3.6)],
        },
    ]
    return clips


def run_harness():
    """Execute test harness across all scenarios and print results table."""
    print("=" * 80)
    print("PrepHelp Speech Pipeline Test Harness")
    print("Evaluating 5 synthetic scenarios through full analysis pipeline")
    print("=" * 80)

    clips = define_test_clips()
    results = []

    for item in clips:
        name = item["name"]
        duration = item["duration"]
        words = item["words"]
        transcript = item["transcript"]
        intervals = item["intervals"]

        _, temp_wav = generate_synthetic_audio(
            duration_sec=duration,
            active_intervals=intervals,
            amplitude=item["amplitude"],
            base_freq=item["base_freq"],
        )

        try:
            # Quality & VAD
            warnings, silence_ratio, rms_energy = check_audio_quality(temp_wav, duration)
            try:
                vad_res = analyze_vad(temp_wav)
                speech_duration = vad_res["speech_duration"]
            except Exception:
                speech_duration = max(0.5, duration * (1.0 - silence_ratio))

            # Speech metrics
            wpm, art_wpm, pace_score, pace_flags = calculate_pace(words, duration, speech_duration)
            (
                pause_count,
                long_pause_count,
                pause_rate,
                pause_ratio,
                mlr,
                fluency_score,
                fluency_flags,
            ) = calculate_fluency(words, duration)

            (
                filler_count,
                fillers_per_min,
                filler_score,
                filler_flags,
                updated_words,
            ) = detect_fillers(words, transcript, duration)

            pitch_mean, pitch_std, vol_mean, vol_std = extract_prosody(temp_wav)

            confidence_score = calculate_composite_confidence(
                filler_control_score=filler_score,
                fluency_score=fluency_score,
                pace_score=pace_score,
                pitch_std=pitch_std,
                volume_mean=vol_mean,
                volume_std=vol_std,
                transcript=transcript,
            )

            all_flags = pace_flags + fluency_flags + filler_flags
            flag_summary = f"{len(all_flags)} flags"
            if all_flags:
                types = {f.type for f in all_flags}
                flag_summary += f" ({', '.join(types)})"

            warning_summary = "; ".join(warnings) if warnings else "None"

            results.append(
                {
                    "Profile": name,
                    "Dur(s)": f"{duration:.1f}",
                    "WPM": f"{wpm:.1f}",
                    "Pauses": f"{pause_count} ({long_pause_count} lg)",
                    "Fillers": f"{filler_count} ({fillers_per_min}/m)",
                    "Pace": f"{pace_score:.0f}",
                    "Fluency": f"{fluency_score:.0f}",
                    "FillCtrl": f"{filler_score:.0f}",
                    "Confidence": f"{confidence_score:.0f}",
                    "Flags": flag_summary,
                    "Warnings": warning_summary,
                }
            )
        except Exception as e:
            err_msg = getattr(e, "detail", str(e))
            results.append(
                {
                    "Profile": name,
                    "Dur(s)": f"{duration:.1f}",
                    "WPM": "N/A",
                    "Pauses": "N/A",
                    "Fillers": "N/A",
                    "Pace": "N/A",
                    "Fluency": "N/A",
                    "FillCtrl": "N/A",
                    "Confidence": "N/A",
                    "Flags": "Rejected",
                    "Warnings": f"Quality Rejection: {err_msg}",
                }
            )

        finally:
            if os.path.exists(temp_wav):
                try:
                    os.remove(temp_wav)
                except OSError:
                    pass

    # Print ASCII Markdown Table
    print("\n### Speech Pipeline Performance Matrix\n")
    headers = [
        "Profile",
        "Dur(s)",
        "WPM",
        "Pauses",
        "Fillers",
        "Pace",
        "Fluency",
        "FillCtrl",
        "Confidence",
        "Flags",
        "Warnings",
    ]

    col_widths = {h: len(h) for h in headers}
    for row in results:
        for h in headers:
            col_widths[h] = max(col_widths[h], len(str(row[h])))

    header_line = "| " + " | ".join(h.ljust(col_widths[h]) for h in headers) + " |"
    separator_line = "|-" + "-|-".join("-" * col_widths[h] for h in headers) + "-|"

    print(header_line)
    print(separator_line)
    for row in results:
        line = "| " + " | ".join(str(row[h]).ljust(col_widths[h]) for h in headers) + " |"
        print(line)

    print("\nTest harness completed successfully.")


if __name__ == "__main__":
    run_harness()

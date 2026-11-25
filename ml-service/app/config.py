"""Configuration loader for PrepHelp ML Service."""

import os
from pathlib import Path
from typing import Any, Dict, List
import yaml
from pydantic import BaseModel, Field

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "metrics.yaml"

DEFAULT_CONFIG: Dict[str, Any] = {
    "pace": {
        "target_min_wpm": 120.0,
        "target_max_wpm": 160.0,
        "drop_penalty": 0.8,
    },
    "fluency": {
        "pause_threshold_sec": 0.5,
        "long_pause_threshold_sec": 1.5,
        "target_pause_rate_per_min": 12.0,
    },
    "fillers": {
        "filler_words": [
            "um",
            "uh",
            "er",
            "ah",
            "like",
            "you know",
            "i mean",
            "sort of",
            "kind of",
        ],
    },
    "quality": {
        "min_duration_sec": 1.0,
        "max_duration_sec": 180.0,
        "max_file_size_mb": 10.0,
        "silence_ratio_threshold": 0.85,
        "min_rms_amplitude": 0.005,
    },
    "confidence_weights": {
        "filler_control": 0.25,
        "pause_behavior": 0.20,
        "pace_stability": 0.20,
        "pitch_variation": 0.15,
        "volume_steadiness": 0.10,
        "hedging": 0.10,
    },
    "text_confidence_weights": {
        "hedging": 0.40,
        "completeness": 0.35,
        "repetition": 0.25,
    },
    "grammar": {
        "errors_per_100_target": 3.0,
        "max_error_rate": 15.0,
    },
    "vocabulary": {
        "min_words_for_mtld": 50,
        "target_mtld": 70.0,
        "target_b2_ratio": 0.20,
    },
    "structure": {
        "rule_weight": 0.5,
        "llm_weight": 0.5,
    },
    "versions": {
        "formulaVersion": "v1.0.0",
        "promptVersions": {
            "rubric_structure": "rubric_structure_v1",
            "coach_feedback": "coach_feedback_v1",
        },
    },
}


class PaceConfig(BaseModel):
    target_min_wpm: float = 120.0
    target_max_wpm: float = 160.0
    drop_penalty: float = 0.8


class FluencyConfig(BaseModel):
    pause_threshold_sec: float = 0.5
    long_pause_threshold_sec: float = 1.5
    target_pause_rate_per_min: float = 12.0


class FillersConfig(BaseModel):
    filler_words: List[str] = Field(
        default_factory=lambda: [
            "um",
            "uh",
            "er",
            "ah",
            "like",
            "you know",
            "i mean",
            "sort of",
            "kind of",
        ]
    )


class QualityConfig(BaseModel):
    min_duration_sec: float = 1.0
    max_duration_sec: float = 180.0
    max_file_size_mb: float = 10.0
    silence_ratio_threshold: float = 0.85
    min_rms_amplitude: float = 0.005


class ConfidenceWeightsConfig(BaseModel):
    filler_control: float = 0.25
    pause_behavior: float = 0.20
    pace_stability: float = 0.20
    pitch_variation: float = 0.15
    volume_steadiness: float = 0.10
    hedging: float = 0.10


class TextConfidenceWeightsConfig(BaseModel):
    hedging: float = 0.40
    completeness: float = 0.35
    repetition: float = 0.25


class GrammarConfig(BaseModel):
    errors_per_100_target: float = 3.0
    max_error_rate: float = 15.0


class VocabularyConfig(BaseModel):
    min_words_for_mtld: int = 50
    target_mtld: float = 70.0
    target_b2_ratio: float = 0.20


class StructureConfig(BaseModel):
    rule_weight: float = 0.5
    llm_weight: float = 0.5


class AppConfig(BaseModel):
    pace: PaceConfig = Field(default_factory=PaceConfig)
    fluency: FluencyConfig = Field(default_factory=FluencyConfig)
    fillers: FillersConfig = Field(default_factory=FillersConfig)
    quality: QualityConfig = Field(default_factory=QualityConfig)
    confidence_weights: ConfidenceWeightsConfig = Field(default_factory=ConfidenceWeightsConfig)
    text_confidence_weights: TextConfidenceWeightsConfig = Field(default_factory=TextConfidenceWeightsConfig)
    grammar: GrammarConfig = Field(default_factory=GrammarConfig)
    vocabulary: VocabularyConfig = Field(default_factory=VocabularyConfig)
    structure: StructureConfig = Field(default_factory=StructureConfig)
    formula_version: str = "v1.0.0"
    prompt_versions: Dict[str, str] = Field(
        default_factory=lambda: {
            "rubric_structure": "rubric_structure_v1",
            "coach_feedback": "coach_feedback_v1",
        }
    )
    whisper_model: str = "base"


def load_raw_config(config_path: Path | None = None) -> Dict[str, Any]:
    target_path = config_path or DEFAULT_CONFIG_PATH
    if target_path.exists():
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return DEFAULT_CONFIG


def get_config(config_path: Path | None = None) -> AppConfig:
    raw = load_raw_config(config_path)
    pace_data = raw.get("pace", {})
    fluency_data = raw.get("fluency", {})
    fillers_data = raw.get("fillers", {})
    quality_data = raw.get("quality", {})
    weights_data = raw.get("confidence_weights", {})
    text_weights_data = raw.get("text_confidence_weights", {})
    grammar_data = raw.get("grammar", {})
    vocab_data = raw.get("vocabulary", {})
    struct_data = raw.get("structure", {})
    versions_data = raw.get("versions", {})

    whisper_model = os.getenv("WHISPER_MODEL", "base")

    return AppConfig(
        pace=PaceConfig(**pace_data),
        fluency=FluencyConfig(**fluency_data),
        fillers=FillersConfig(**fillers_data),
        quality=QualityConfig(**quality_data),
        confidence_weights=ConfidenceWeightsConfig(**weights_data),
        text_confidence_weights=TextConfidenceWeightsConfig(**text_weights_data),
        grammar=GrammarConfig(**grammar_data),
        vocabulary=VocabularyConfig(**vocab_data),
        structure=StructureConfig(**struct_data),
        formula_version=versions_data.get("formulaVersion", "v1.0.0"),
        prompt_versions=versions_data.get("promptVersions", {
            "rubric_structure": "rubric_structure_v1",
            "coach_feedback": "coach_feedback_v1",
        }),
        whisper_model=whisper_model,
    )


# Global configuration instance
config = get_config()

"""Pydantic schemas for the PrepHelp analysis pipeline (speech and text)."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class WordTimestamp(BaseModel):
    w: str = Field(..., description="The word token")
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    flag: Optional[str] = Field(None, description="Optional flag (e.g., 'filler', 'grammar')")


class FlagItem(BaseModel):
    type: str = Field(..., description="Category of flag (e.g., 'filler', 'long_pause', 'grammar')")
    start: float = Field(..., description="Start timestamp in seconds or character offset")
    end: float = Field(..., description="End timestamp in seconds or character offset")
    detail: str = Field(..., description="Detailed description or context")


class DimensionScores(BaseModel):
    grammar: Optional[float] = Field(None)
    vocabulary: Optional[float] = Field(None)
    fluency: Optional[float] = Field(None)
    pace: Optional[float] = Field(None)
    filler_control: Optional[float] = Field(None)
    structure: Optional[float] = Field(None)
    confidence: Optional[float] = Field(None)


class AnalysisVersions(BaseModel):
    whisperModel: Optional[str] = None
    promptVersions: Dict[str, str] = Field(default_factory=dict)
    formulaVersion: str = "v1.0.0"


class TextAnalysisRequest(BaseModel):
    sessionId: Optional[str] = None
    text: str
    exercisePrompt: Optional[str] = "Interview response"
    exerciseType: Optional[str] = "interview"
    referenceText: Optional[str] = None


class TextAnalysisResponse(BaseModel):
    sessionId: Optional[str] = None
    text: str
    scores: DimensionScores
    metrics: Dict[str, Any]
    flags: List[FlagItem] = Field(default_factory=list)
    errorPatterns: Dict[str, int] = Field(default_factory=dict)
    llmUsed: bool = False
    fallbackUsed: bool = False
    versions: AnalysisVersions


class SpeechMetrics(BaseModel):
    wpm: float = Field(..., description="Words per minute over total audio duration")
    articulation_wpm: float = Field(..., description="Words per minute over speech-only duration")
    pause_count: int = Field(..., description="Total number of detected pauses (>0.5s)")
    long_pause_count: int = Field(..., description="Total number of long pauses (>1.5s)")
    pause_rate_per_min: float = Field(..., description="Number of pauses per minute of speech")
    pause_ratio: float = Field(..., description="Ratio of pause duration to total duration")
    mean_length_of_run: float = Field(..., description="Mean number of words between pauses")
    filler_count: int = Field(..., description="Total count of detected filler words/phrases")
    fillers_per_minute: float = Field(..., description="Filler words count per minute of speech")
    pitch_mean: float = Field(..., description="Mean fundamental pitch in Hz")
    pitch_std: float = Field(..., description="Standard deviation of pitch in Hz")
    volume_mean: float = Field(..., description="Mean RMS volume energy")
    volume_std: float = Field(..., description="Standard deviation of RMS volume energy")
    speech_duration: float = Field(..., description="Duration of speech in seconds")
    total_duration: float = Field(..., description="Total audio duration in seconds")


class SpeechScores(BaseModel):
    pace: float = Field(..., ge=0.0, le=100.0)
    fluency: float = Field(..., ge=0.0, le=100.0)
    filler_control: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=100.0)
    grammar: Optional[float] = None
    vocabulary: Optional[float] = None
    structure: Optional[float] = None


class SpeechVersions(BaseModel):
    whisperModel: str
    formulaVersion: str
    promptVersions: Dict[str, str] = Field(default_factory=dict)


class SpeechAnalysisResponse(BaseModel):
    sessionId: Optional[str] = None
    transcript: str
    words: List[WordTimestamp] = Field(default_factory=list)
    metrics: Dict[str, Any]
    scores: DimensionScores
    flags: List[FlagItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    errorPatterns: Dict[str, int] = Field(default_factory=dict)
    llmUsed: bool = False
    fallbackUsed: bool = False
    versions: SpeechVersions


class CoachFeedbackRequest(BaseModel):
    sessionId: Optional[str] = None
    exercisePrompt: str
    exerciseType: Optional[str] = "interview"
    transcript: str
    scores: DimensionScores
    metrics: Dict[str, Any] = Field(default_factory=dict)


class SentenceExample(BaseModel):
    original: str
    improved: str
    reason: str


class CoachFeedbackResponse(BaseModel):
    sessionId: Optional[str] = None
    summary: str
    strengths: List[str]
    improvements: List[str]
    sentenceExamples: List[SentenceExample] = Field(default_factory=list)
    tip: str
    fallbackUsed: bool = False

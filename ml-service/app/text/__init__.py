"""Text analysis subpackage for PrepHelp."""

from app.text.grammar import analyze_grammar
from app.text.vocabulary import analyze_vocabulary
from app.text.hedging import analyze_hedging_and_structure
from app.text.structure import evaluate_structure
from app.text.read_aloud import evaluate_read_aloud
from app.text.confidence import compute_text_confidence

__all__ = [
    "analyze_grammar",
    "analyze_vocabulary",
    "analyze_hedging_and_structure",
    "evaluate_structure",
    "evaluate_read_aloud",
    "compute_text_confidence",
]

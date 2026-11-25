"""Filler words and phrases detection module with spaCy POS disambiguation."""

import re
from typing import List, Tuple, Set, Optional
from app.config import config
from app.schemas import FlagItem, WordTimestamp

_nlp_model = None


def get_spacy_nlp():
    """Retrieve or lazily initialize the spaCy English model."""
    global _nlp_model
    if _nlp_model is None:
        try:
            import spacy
            try:
                _nlp_model = spacy.load("en_core_web_sm")
            except Exception:
                # If model is not loaded, try blank English or fallback
                _nlp_model = spacy.blank("en")
        except ImportError:
            _nlp_model = None
    return _nlp_model


def clean_token(token: str) -> str:
    """Strip leading/trailing punctuation and lowercase token."""
    return re.sub(r"^[^\w']+|[^\w']+$", "", token.lower()).strip()


def is_like_filler_pos(full_transcript: str, char_start: int, char_end: int) -> bool:
    """Use spaCy POS tagger to check if 'like' is used as a filler (discourse marker/interjection).

    Only counted as filler if NOT VERB, ADP (adposition/preposition), SCONJ, or PREP.
    """
    nlp = get_spacy_nlp()
    if nlp is None or not nlp.has_pipe("tagger") and not nlp.has_pipe("tok2vec"):
        return True

    try:
        doc = nlp(full_transcript)
        for token in doc:
            # Check overlap with word span
            if token.idx <= char_start < (token.idx + len(token.text)) or (
                char_start <= token.idx < char_end
            ):
                pos = token.pos_
                dep = token.dep_
                # If verb or preposition/subordinating conjunction, NOT filler
                if pos in {"VERB", "ADP", "SCONJ"} or dep in {"prep", "ROOT"}:
                    return False
                return True
    except Exception:
        pass
    return True


def detect_fillers(
    words: List[WordTimestamp],
    full_transcript: str,
    total_duration_sec: float,
) -> Tuple[int, float, float, List[FlagItem], List[WordTimestamp]]:
    """Detect single and multi-word filler instances.

    Args:
        words: List of word timestamps.
        full_transcript: Transcribed text string.
        total_duration_sec: Total duration in seconds.

    Returns:
        Tuple:
            - filler_count (int)
            - fillers_per_minute (float)
            - filler_control_score (float, 0-100)
            - flags (List[FlagItem])
            - updated_words (List[WordTimestamp])
    """
    if not words or total_duration_sec <= 0:
        return 0, 0.0, 100.0, [], words

    filler_list = config.fillers.filler_words
    multi_word_fillers: List[List[str]] = []
    single_word_fillers: Set[str] = set()

    for item in filler_list:
        parts = item.lower().split()
        if len(parts) > 1:
            multi_word_fillers.append(parts)
        else:
            single_word_fillers.add(parts[0])

    cleaned_words = [clean_token(w.w) for w in words]
    n = len(words)
    i = 0
    filler_count = 0
    flags: List[FlagItem] = []

    # Map words to character indices in full_transcript for POS tagging
    char_positions: List[Tuple[int, int]] = []
    search_idx = 0
    transcript_lower = full_transcript.lower()
    for w in words:
        clean_w = clean_token(w.w)
        idx = transcript_lower.find(clean_w, search_idx)
        if idx != -1:
            char_positions.append((idx, idx + len(clean_w)))
            search_idx = idx + len(clean_w)
        else:
            char_positions.append((0, 0))

    while i < n:
        matched_multi = False
        # Check multi-word fillers (e.g. "you know", "i mean", "sort of", "kind of")
        for mw in multi_word_fillers:
            k = len(mw)
            if i + k <= n and cleaned_words[i : i + k] == mw:
                filler_count += 1
                start_time = words[i].start
                end_time = words[i + k - 1].end
                phrase = " ".join(mw)
                flags.append(
                    FlagItem(
                        type="filler",
                        start=round(start_time, 2),
                        end=round(end_time, 2),
                        detail=f"Filler phrase: '{phrase}'",
                    )
                )
                for j in range(i, i + k):
                    words[j].flag = "filler"
                i += k
                matched_multi = True
                break

        if matched_multi:
            continue

        token = cleaned_words[i]
        if token in single_word_fillers:
            is_filler = True
            if token == "like":
                c_start, c_end = char_positions[i]
                is_filler = is_like_filler_pos(full_transcript, c_start, c_end)

            if is_filler:
                filler_count += 1
                words[i].flag = "filler"
                flags.append(
                    FlagItem(
                        type="filler",
                        start=round(words[i].start, 2),
                        end=round(words[i].end, 2),
                        detail=f"Filler word: '{words[i].w}'",
                    )
                )

        i += 1

    duration_min = max(total_duration_sec / 60.0, 0.01)
    fillers_per_min = round(float(filler_count) / duration_min, 1)

    # Score: 100 for 0, dropping ~7.5 points per filler per minute
    raw_score = 100.0 - (fillers_per_min * 7.5)
    filler_control_score = round(max(0.0, min(100.0, raw_score)), 1)

    return filler_count, fillers_per_min, filler_control_score, flags, words

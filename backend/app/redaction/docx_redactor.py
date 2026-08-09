"""DOCX redaction via run-level offset mapping.

The previous implementation did a crude whole-paragraph string replace
on `paragraph.text`, which (a) loses per-run formatting and (b) can
mis-match when the same substring appears more than once. This maps
paragraph-text offsets back to the individual runs that make them up and
blacks out only the overlapping portion of each run, so an entity that
happens to straddle two runs (e.g. bold+plain) still redacts correctly.
"""

import logging
from typing import List, Tuple

from docx import Document as DocxDocument

logger = logging.getLogger("smartredact")

REDACTION_CHAR = "█"  # █


def _paragraph_text_and_run_spans(paragraph) -> Tuple[str, List[Tuple[int, int, object]]]:
    spans = []
    offset = 0
    for run in paragraph.runs:
        start = offset
        offset += len(run.text)
        spans.append((start, offset, run))
    return "".join(run.text for run in paragraph.runs), spans


def _find_matches(paragraph_lower: str, needle: str) -> List[Tuple[int, int]]:
    matches = []
    search_from = 0
    while True:
        idx = paragraph_lower.find(needle, search_from)
        if idx == -1:
            break
        matches.append((idx, idx + len(needle)))
        search_from = idx + 1
    return matches


def redact_docx(original_path: str, entities: List[dict], output_path: str) -> int:
    selected = [e for e in entities if e.get("selected", True) and e.get("text", "").strip()]
    doc = DocxDocument(original_path)
    total_redactions = 0

    for paragraph in doc.paragraphs:
        para_text, run_spans = _paragraph_text_and_run_spans(paragraph)
        if not para_text:
            continue
        para_lower = para_text.lower()

        matches: List[Tuple[int, int]] = []
        for entity in selected:
            needle = entity["text"].strip().lower()
            if needle:
                matches.extend(_find_matches(para_lower, needle))

        for match_start, match_end in matches:
            for run_start, run_end, run in run_spans:
                overlap_start = max(match_start, run_start)
                overlap_end = min(match_end, run_end)
                if overlap_start >= overlap_end:
                    continue
                local_start = overlap_start - run_start
                local_end = overlap_end - run_start
                text = run.text
                run.text = (
                    text[:local_start]
                    + REDACTION_CHAR * (local_end - local_start)
                    + text[local_end:]
                )
                total_redactions += 1

    doc.save(output_path)
    logger.info("DOCX redaction: %d run segment(s) redacted", total_redactions)
    return total_redactions

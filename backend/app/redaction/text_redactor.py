"""Bracket-style redaction for the plain-text preview shown in the UI.

The actual output documents (PDF/DOCX/image) are redacted at the
content/pixel level by the dedicated redactors in this package, not by
string substitution - this is only for the `redacted_text` preview field.
"""

from typing import List


def redact_text(text: str, entities: List[dict]) -> str:
    selected = [e for e in entities if e.get("selected", True)]
    if not selected:
        return text

    selected = sorted(selected, key=lambda e: e["start"], reverse=True)
    redacted = text
    for entity in selected:
        redacted = redacted[: entity["start"]] + "[REDACTED]" + redacted[entity["end"] :]
    return redacted

"""Small shared helpers: filename sanitization and JSON-serialization."""

import re
import unicodedata
from pathlib import Path

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename(filename: str) -> str:
    """Strip directory components and any characters outside a safe set,
    preventing path traversal (e.g. '../../etc/passwd') and shell/filesystem
    surprises from unicode or control characters in the original filename."""
    name = Path(filename or "upload").name
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = _UNSAFE_CHARS.sub("_", name).strip("._") or "upload"
    return name[:200]


def make_json_serializable(obj):
    """Convert numpy and other non-JSON-native types to plain Python types."""
    if hasattr(obj, "item"):
        return obj.item()
    if hasattr(obj, "tolist"):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    return obj

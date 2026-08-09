"""Image redaction via OCR word boxes.

The previous implementation matched entities against individual OCR
*words*, so multi-word entities (most names, "New York", street
addresses...) never matched and were never redacted. This version groups
OCR words into lines, reconstructs each line's text with an offset->bbox
map, and matches entities against that reconstructed line text - the same
approach used for PDFs in `pdf_redactor.py` - so multi-word spans redact
correctly. The same building blocks are reused to redact rasterized,
scanned PDF pages.
"""

import logging
from typing import Dict, List, Tuple

import pytesseract
from PIL import Image, ImageDraw

logger = logging.getLogger("smartredact")

Bbox = Tuple[int, int, int, int]

MIN_OCR_CONFIDENCE = 30


def _ocr_lines(
    image: Image.Image, min_confidence: int
) -> Tuple[dict, List[Tuple[tuple, List[int]]]]:
    """Run Tesseract once and group words into lines, in reading order.

    Used by both `ocr_extract_text` (upload-time text extraction, for
    detection) and `find_redaction_boxes` (redact-time). Both must derive
    their text the same way: if extraction used a different Tesseract call
    (e.g. `image_to_string`) than box-lookup, the two OCR passes can
    tokenize/space text slightly differently, so an entity found at
    upload time can silently fail to match a substring at redact time.
    """
    ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    lines: Dict[tuple, List[int]] = {}
    for i in range(len(ocr_data["text"])):
        word = ocr_data["text"][i].strip()
        if not word:
            continue
        try:
            confidence = int(float(ocr_data["conf"][i]))
        except (TypeError, ValueError):
            confidence = -1
        if confidence < min_confidence:
            continue
        key = (ocr_data["block_num"][i], ocr_data["par_num"][i], ocr_data["line_num"][i])
        lines.setdefault(key, []).append(i)
    return ocr_data, sorted(lines.items())


def _line_text_and_spans(
    ocr_data: dict, indices: List[int]
) -> Tuple[str, List[Tuple[int, int, Bbox]]]:
    text_parts = []
    spans: List[Tuple[int, int, Bbox]] = []
    offset = 0
    for n, i in enumerate(indices):
        if n > 0:
            text_parts.append(" ")
            offset += 1
        word = ocr_data["text"][i]
        start = offset
        text_parts.append(word)
        offset += len(word)
        x, y, w, h = (
            ocr_data["left"][i],
            ocr_data["top"][i],
            ocr_data["width"][i],
            ocr_data["height"][i],
        )
        spans.append((start, offset, (x, y, x + w, y + h)))
    return "".join(text_parts), spans


def ocr_extract_text(image: Image.Image, min_confidence: int = MIN_OCR_CONFIDENCE) -> str:
    """OCR `image` and reconstruct its text using the exact same
    line-grouping `find_redaction_boxes` uses, so any entity found in this
    text is guaranteed findable as a substring when redaction runs later."""
    ocr_data, ordered_lines = _ocr_lines(image, min_confidence)
    line_texts = [
        _line_text_and_spans(ocr_data, indices)[0] for _key, indices in ordered_lines
    ]
    return "\n".join(line_texts)


def find_redaction_boxes(
    image: Image.Image, entities: List[dict], min_confidence: int = MIN_OCR_CONFIDENCE
) -> List[Bbox]:
    """Return bounding boxes covering every occurrence of every selected
    entity's text, found by reconstructing OCR'd lines (not single words)."""
    ocr_data, ordered_lines = _ocr_lines(image, min_confidence)

    boxes: List[Bbox] = []
    for _key, indices in ordered_lines:
        line_text, spans = _line_text_and_spans(ocr_data, indices)
        line_lower = line_text.lower()

        for entity in entities:
            needle = entity.get("text", "").strip().lower()
            if not needle:
                continue
            search_from = 0
            while True:
                idx = line_lower.find(needle, search_from)
                if idx == -1:
                    break
                match_end = idx + len(needle)
                for span_start, span_end, bbox in spans:
                    if span_start < match_end and span_end > idx:
                        boxes.append(bbox)
                search_from = idx + 1

    return boxes


def draw_boxes(image: Image.Image, boxes: List[Bbox]) -> None:
    draw = ImageDraw.Draw(image)
    for box in boxes:
        draw.rectangle(list(box), fill="black")


def redact_image(original_path: str, entities: List[dict], output_path: str) -> int:
    selected = [e for e in entities if e.get("selected", True) and e.get("text", "").strip()]
    image = Image.open(original_path).convert("RGB")

    boxes = find_redaction_boxes(image, selected)
    draw_boxes(image, boxes)
    image.save(output_path)

    logger.info("Image redaction: %d region(s) redacted", len(boxes))
    return len(boxes)

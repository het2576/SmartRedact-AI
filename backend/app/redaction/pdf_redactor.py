"""PDF redaction via word/bbox offset mapping.

The previous implementation re-searched the page for each entity's
literal text via `page.search_for(text)`. That's fragile: it depends on
exact substring/case matches against however PyMuPDF happens to expose
searchable text, and treats each entity independently with no shared
understanding of the page layout.

This version reconstructs each page's text once from PyMuPDF's per-word
bounding boxes, keeping an offset->bbox map, then locates every entity as
a substring of that reconstructed text and redacts the union of word
boxes it overlaps - which correctly handles multi-word and wrapped
matches. Pages with no real text layer (scanned pages) are rasterized,
OCR'd and redacted with the same line-reconstruction approach used for
image files, then the page content is replaced with the redacted image.
"""

import io
import logging
from typing import List, Tuple

import pymupdf as fitz  # PyMuPDF; `fitz` is the deprecated import alias

from app.extraction.text_extractor import (
    MIN_TEXT_CHARS_PER_PAGE,
    pixmap_to_pil,
)
from app.redaction.image_redactor import draw_boxes, find_redaction_boxes

logger = logging.getLogger("smartredact")

Bbox = Tuple[float, float, float, float]
Span = Tuple[int, int, Bbox]

SCAN_RENDER_DPI = 200


def _page_text_and_spans(page: "fitz.Page") -> Tuple[str, List[Span]]:
    """Reconstruct a page's text from its words, in reading order, with an
    offset->bbox map so character spans can be mapped back to boxes."""
    words = page.get_text("words")  # x0,y0,x1,y1,word,block_no,line_no,word_no
    words.sort(key=lambda w: (w[5], w[6], w[7]))

    text_parts: List[str] = []
    spans: List[Span] = []
    offset = 0
    last_block_line = None

    for x0, y0, x1, y1, word, block_no, line_no, _word_no in words:
        block_line = (block_no, line_no)
        if last_block_line is not None:
            separator = "\n" if block_line != last_block_line else " "
            text_parts.append(separator)
            offset += len(separator)
        start = offset
        text_parts.append(word)
        offset += len(word)
        spans.append((start, offset, (x0, y0, x1, y1)))
        last_block_line = block_line

    return "".join(text_parts), spans


def _boxes_for_page_text(
    page_text: str, spans: List[Span], entities: List[dict]
) -> List[Bbox]:
    page_lower = page_text.lower()
    boxes: List[Bbox] = []

    for entity in entities:
        needle = entity.get("text", "").strip().lower()
        if not needle:
            continue
        search_from = 0
        while True:
            idx = page_lower.find(needle, search_from)
            if idx == -1:
                break
            match_end = idx + len(needle)
            boxes.extend(
                bbox for (s, e, bbox) in spans if s < match_end and e > idx
            )
            search_from = idx + 1

    return boxes


def _redact_scanned_page(page: "fitz.Page", entities: List[dict]) -> int:
    """Rasterize a page with no usable text layer, OCR + redact it as an
    image, and replace the page's content with the redacted rasterization."""
    pix = page.get_pixmap(dpi=SCAN_RENDER_DPI)
    image = pixmap_to_pil(pix)

    boxes = find_redaction_boxes(image, entities)
    if not boxes:
        return 0

    # OCR boxes are in raster pixel space; scale back to PDF point space.
    scale_x = page.rect.width / pix.width
    scale_y = page.rect.height / pix.height
    pdf_boxes = [
        (x0 * scale_x, y0 * scale_y, x1 * scale_x, y1 * scale_y) for x0, y0, x1, y1 in boxes
    ]

    draw_boxes(image, boxes)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    rect = page.rect
    # Clear the page's existing content, then drop in the redacted image.
    page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()
    page.insert_image(rect, stream=buffer.getvalue())

    return len(pdf_boxes)


def redact_pdf(original_path: str, entities: List[dict], output_path: str) -> int:
    selected = [e for e in entities if e.get("selected", True) and e.get("text", "").strip()]
    if not selected:
        return 0

    total_redactions = 0
    doc = fitz.open(original_path)
    try:
        for page in doc:
            page_text, spans = _page_text_and_spans(page)

            if len(page_text.strip()) < MIN_TEXT_CHARS_PER_PAGE:
                total_redactions += _redact_scanned_page(page, selected)
                continue

            boxes = _boxes_for_page_text(page_text, spans, selected)
            for bbox in boxes:
                page.add_redact_annot(fitz.Rect(bbox), fill=(0, 0, 0))
            if boxes:
                page.apply_redactions()
            total_redactions += len(boxes)

        doc.save(output_path, garbage=4, deflate=True, clean=True)
    finally:
        doc.close()

    logger.info("PDF redaction: %d region(s) redacted", total_redactions)
    return total_redactions

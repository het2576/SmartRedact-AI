"""End-to-end tests through the real HTTP API: upload -> detect -> redact
-> download -> verify the PII is actually gone from the output file. This
exercises the full pipeline the frontend drives, not just the detector.
"""

import io

import pymupdf


def _build_pdf_bytes(text: str) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text, fontsize=11)
    buffer = io.BytesIO()
    doc.save(buffer)
    doc.close()
    return buffer.getvalue()


def test_pdf_upload_redact_download_removes_pii(api_client):
    pii_text = (
        "Patient Name: Robert Johnson\n"
        "Email: robert.johnson@example.com\n"
        "SSN: 234-56-7890\n"
        "This document confirms a routine checkup with no other findings."
    )
    pdf_bytes = _build_pdf_bytes(pii_text)

    upload_resp = api_client.post(
        "/api/upload", files={"file": ("sample.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_resp.status_code == 200, upload_resp.text
    upload_data = upload_resp.json()
    document_id = upload_data["document_id"]
    assert upload_data["entity_count"] > 0

    detected_types = {e["type"] for e in upload_data["entities"]}
    assert "EMAIL_ADDRESS" in detected_types
    assert "US_SSN" in detected_types

    redact_resp = api_client.post("/api/redact", json={"document_id": document_id})
    assert redact_resp.status_code == 200, redact_resp.text
    assert redact_resp.json()["redacted_count"] > 0

    download_resp = api_client.get(f"/api/download/{document_id}")
    assert download_resp.status_code == 200

    redacted_doc = pymupdf.open(stream=download_resp.content, filetype="pdf")
    redacted_text = "".join(page.get_text() for page in redacted_doc)
    redacted_doc.close()

    assert "robert.johnson@example.com" not in redacted_text
    assert "234-56-7890" not in redacted_text
    assert "routine checkup" in redacted_text


def test_redact_respects_deselected_entities(api_client):
    """Only entities the caller marks selected=True should be redacted -
    this is how the frontend's review-before-redact step works."""
    pii_text = "Email: keep.this@example.com\nSSN: 234-56-7890"
    pdf_bytes = _build_pdf_bytes(pii_text)

    upload_resp = api_client.post(
        "/api/upload", files={"file": ("sample2.pdf", pdf_bytes, "application/pdf")}
    )
    upload_data = upload_resp.json()
    document_id = upload_data["document_id"]

    entities = upload_data["entities"]
    for entity in entities:
        entity["selected"] = entity["type"] != "EMAIL_ADDRESS"

    redact_resp = api_client.post(
        "/api/redact", json={"document_id": document_id, "entities": entities}
    )
    assert redact_resp.status_code == 200, redact_resp.text

    download_resp = api_client.get(f"/api/download/{document_id}")
    redacted_doc = pymupdf.open(stream=download_resp.content, filetype="pdf")
    redacted_text = "".join(page.get_text() for page in redacted_doc)
    redacted_doc.close()

    assert "keep.this@example.com" in redacted_text
    assert "234-56-7890" not in redacted_text


def test_upload_rejects_unsupported_extension(api_client):
    resp = api_client.post(
        "/api/upload", files={"file": ("malware.exe", b"not a real exe", "application/octet-stream")}
    )
    assert resp.status_code == 400


def test_upload_sanitizes_path_traversal_filename(api_client):
    resp = api_client.post(
        "/api/upload",
        files={"file": ("../../etc/passwd.txt", b"hello world", "text/plain")},
    )
    assert resp.status_code == 200
    filename = resp.json()["filename"]
    assert "/" not in filename and ".." not in filename


def test_download_requires_existing_document(api_client):
    resp = api_client.get("/api/download/does-not-exist")
    assert resp.status_code == 404


def test_health_check(api_client):
    resp = api_client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["features"]["detection_engine"] is True

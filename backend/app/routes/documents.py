"""API routes.

Paths and response shapes intentionally match the original app.py exactly
(see src/services/api.ts) so the existing frontend needs no changes.
"""

import json
import logging
import mimetypes
import os
import shutil
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.config import settings
from app.detection.engine import PiiDetectionEngine
from app.extraction.text_extractor import ExtractionError, extract_text
from app.redaction.docx_redactor import redact_docx
from app.redaction.image_redactor import redact_image
from app.redaction.pdf_redactor import redact_pdf
from app.redaction.text_redactor import redact_text
from app.schemas import ConfigUpdateRequest, RedactionRequest
from app.storage import DocumentStore
from app.utils import make_json_serializable, sanitize_filename

logger = logging.getLogger("blacken")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".bmp"}


def get_store(request: Request) -> DocumentStore:
    return request.app.state.store


def get_engine(request: Request) -> PiiDetectionEngine:
    return request.app.state.engine


async def require_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    """No-op unless the API_KEY env var is set, so the existing frontend
    keeps working with zero config changes; set API_KEY to require callers
    to send a matching X-API-Key header."""
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def get_owner_id(x_owner_id: Optional[str] = Header(default=None)) -> str:
    """Every document is scoped to the anonymous owner token the browser sends
    in the X-Owner-Id header (persisted in localStorage). This is what keeps one
    visitor's uploads out of another's history — the app has no login, so this
    per-client token is the isolation boundary.

    IMPORTANT: We intentionally do NOT fall back to a shared "anonymous" bucket
    when the header is absent or empty. Doing so caused every user without a
    valid token (private-browsing, CORS header stripped, etc.) to see each
    other's documents. Instead we use a sentinel value that will simply match
    no stored documents, giving those clients an empty history."""
    owner = (x_owner_id or "").strip()
    # Use a sentinel that can never be stored (contains a null byte) so
    # unauthenticated callers see an empty list rather than a shared bucket.
    return owner if owner else "__no_owner__\x00"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


public_router = APIRouter()
router = APIRouter(dependencies=[Depends(require_api_key)])


@public_router.get("/health")
async def health_check(request: Request):
    engine_ready = getattr(request.app.state, "engine", None) is not None
    return {
        "status": "healthy" if engine_ready else "degraded",
        "timestamp": _now_iso(),
        "features": {
            "ocr": shutil.which("tesseract") is not None,
            "pdf": True,
            "docx": True,
            "detection_engine": engine_ready,
        },
    }


@router.get("/documents")
async def list_documents(
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    docs = await store.list_all(owner_id)
    retention_seconds = settings.retention_hours * 3600
    documents = [
        {
            "document_id": doc["id"],
            "filename": doc["filename"],
            "upload_time": doc["upload_time"],
            "status": doc.get("status", "processed"),
            "entity_count": len(doc.get("entities", [])),
            "redacted_count": doc.get("redacted_count") or 0,
            "expires_at": datetime.fromtimestamp(
                doc["created_at"] + retention_seconds, tz=timezone.utc
            )
            .isoformat()
            .replace("+00:00", "Z"),
        }
        for doc in docs
    ]
    return {"success": True, "documents": documents}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    store: DocumentStore = Depends(get_store),
    engine: PiiDetectionEngine = Depends(get_engine),
    owner_id: str = Depends(get_owner_id),
):
    safe_name = sanitize_filename(file.filename or "upload")
    ext = Path(safe_name).suffix.lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext or 'unknown'}")

    content = await file.read()
    max_bytes = int(settings.max_upload_mb * 1024 * 1024)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413, detail=f"File too large (max {settings.max_upload_mb} MB)"
        )
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    document_id = str(uuid.uuid4())
    upload_path = settings.upload_dir / f"{document_id}_{safe_name}"
    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(content)

    try:
        extracted_text = await extract_text(str(upload_path), safe_name)
    except ExtractionError as exc:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    entities = make_json_serializable(engine.detect(extracted_text))

    await store.create(
        document_id,
        {
            "owner_id": owner_id,
            "filename": safe_name,
            "upload_time": _now_iso(),
            "original_path": str(upload_path),
            "extracted_text": extracted_text,
            "entities": entities,
            "status": "processed",
        },
    )

    logger.info("Uploaded '%s' -> %d entities detected", safe_name, len(entities))

    return {
        "success": True,
        "document_id": document_id,
        "filename": safe_name,
        "extracted_text": extracted_text,
        "entities": entities,
        "entity_count": len(entities),
    }


@router.post("/redact")
async def redact_document(
    request: RedactionRequest,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(request.document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    original_text = doc_info["extracted_text"]

    if not request.entities:
        entities_to_redact = doc_info.get("entities", [])
    else:
        entities_to_redact = [
            {"text": e.text, "type": e.type, "start": e.start, "end": e.end, "selected": True}
            for e in request.entities
            if e.selected
        ]

    selected_count = len(entities_to_redact)
    redacted_text = redact_text(original_text, entities_to_redact)

    original_filename = doc_info["filename"]
    file_ext = Path(original_filename).suffix.lower()
    redacted_filename = f"redacted_{Path(original_filename).stem}{file_ext}"

    temp_file = tempfile.NamedTemporaryFile(
        delete=False, suffix=file_ext, prefix=f"{request.document_id}_", dir=settings.data_dir
    )
    redacted_path = Path(temp_file.name)
    temp_file.close()

    try:
        if file_ext == ".pdf":
            redact_pdf(doc_info["original_path"], entities_to_redact, str(redacted_path))
        elif file_ext in {".docx", ".doc"}:
            redact_docx(doc_info["original_path"], entities_to_redact, str(redacted_path))
        elif file_ext in IMAGE_EXTENSIONS:
            redact_image(doc_info["original_path"], entities_to_redact, str(redacted_path))
        else:
            raise HTTPException(
                status_code=400, detail=f"File type {file_ext} not supported for redaction"
            )
    except HTTPException:
        redacted_path.unlink(missing_ok=True)
        raise
    except Exception as exc:  # noqa: BLE001
        redacted_path.unlink(missing_ok=True)
        logger.exception("Redaction failed for document %s", request.document_id)
        raise HTTPException(status_code=500, detail=f"Redaction failed: {exc}") from exc

    if not redacted_path.exists() or redacted_path.stat().st_size == 0:
        redacted_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Redaction produced no output file")

    await store.update(
        request.document_id,
        redacted_text=redacted_text,
        redacted_path=str(redacted_path),
        redacted_filename=redacted_filename,
        redacted_count=selected_count,
        redacted_entities=entities_to_redact,
        redaction_time=_now_iso(),
        status="redacted",
    )

    return {
        "success": True,
        "document_id": request.document_id,
        "redacted_text": redacted_text,
        "redacted_count": selected_count,
        "download_url": f"/api/download/{request.document_id}",
    }


@router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    original: bool = False,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if original:
        file_path = doc_info.get("original_path")
        filename = doc_info.get("filename")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Original file not found")
    else:
        file_path = doc_info.get("redacted_path")
        filename = doc_info.get("redacted_filename")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="No redacted file available. Document must be successfully redacted before download.",
            )

    media_type = mimetypes.guess_type(filename or "")[0] or "application/octet-stream"
    return FileResponse(path=file_path, filename=filename, media_type=media_type)


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    for path_key in ("original_path", "redacted_path"):
        path = doc_info.get(path_key)
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                logger.warning("Failed to remove file for deleted document: %s", path)

    await store.delete(document_id, owner_id)
    logger.info("Deleted document %s ('%s') on request", document_id, doc_info["filename"])
    return {"success": True, "document_id": document_id}


@router.get("/document/{document_id}/preview")
async def get_document_preview(
    document_id: str,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    extracted_text = doc_info.get("extracted_text") or ""
    text_preview = (
        extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
    )

    return {
        "success": True,
        "document_id": document_id,
        "filename": doc_info["filename"],
        "upload_time": doc_info["upload_time"],
        "status": doc_info.get("status", "processed"),
        "entity_count": len(doc_info.get("entities", [])),
        "extracted_text_preview": text_preview,
        "entities": doc_info.get("entities", []),
        "redacted_count": doc_info.get("redacted_count") or 0,
    }


@router.get("/document/{document_id}/redacted-preview")
async def get_redacted_document_preview(
    document_id: str,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc_info.get("status") != "redacted":
        raise HTTPException(status_code=400, detail="Document has not been redacted yet")

    redacted_text = doc_info.get("redacted_text") or ""
    redacted_text_preview = (
        redacted_text[:500] + "..." if len(redacted_text) > 500 else redacted_text
    )

    return {
        "success": True,
        "document_id": document_id,
        "filename": doc_info["filename"],
        "redacted_filename": doc_info.get("redacted_filename")
        or f"redacted_{doc_info['filename']}",
        "redacted_count": doc_info.get("redacted_count") or 0,
        "redacted_text_preview": redacted_text_preview,
        "download_url": f"/api/download/{document_id}",
        "status": doc_info.get("status", "redacted"),
    }


def _build_audit_entries(doc_info: dict) -> list[dict]:
    entries = [
        {
            "timestamp": doc_info["upload_time"],
            "action": "DOCUMENT_UPLOADED",
            "details": f"Uploaded file: {doc_info['filename']}",
            "status": "completed",
        }
    ]

    entities = doc_info.get("entities", [])
    if entities:
        entries.append(
            {
                "timestamp": doc_info["upload_time"],
                "action": "ENTITIES_DETECTED",
                "details": f"Detected {len(entities)} sensitive entities",
                "status": "completed",
                "entities": entities,
            }
        )

    if doc_info.get("status") == "redacted":
        entries.append(
            {
                "timestamp": doc_info.get("redaction_time") or doc_info["upload_time"],
                "action": "DOCUMENT_REDACTED",
                "details": f"Redacted {doc_info.get('redacted_count') or 0} entities",
                "status": "completed",
                "redacted_count": doc_info.get("redacted_count") or 0,
                "redacted_entities": doc_info.get("redacted_entities", []),
            }
        )

    return entries


@router.get("/document/{document_id}/audit-log")
async def get_audit_log(
    document_id: str,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    audit_entries = _build_audit_entries(doc_info)
    return {
        "success": True,
        "document_id": document_id,
        "filename": doc_info["filename"],
        "audit_entries": audit_entries,
        "total_entries": len(audit_entries),
    }


@router.get("/document/{document_id}/download-audit-log")
async def download_audit_log(
    document_id: str,
    store: DocumentStore = Depends(get_store),
    owner_id: str = Depends(get_owner_id),
):
    doc_info = await store.get(document_id, owner_id)
    if doc_info is None:
        raise HTTPException(status_code=404, detail="Document not found")

    audit_entries = _build_audit_entries(doc_info)
    redacted_text = doc_info.get("redacted_text") or ""
    audit_log = {
        "document_id": document_id,
        "filename": doc_info["filename"],
        "upload_time": doc_info["upload_time"],
        "status": doc_info.get("status", "processed"),
        "audit_timestamp": _now_iso(),
        "entities_detected": len(doc_info.get("entities", [])),
        "entities_redacted": doc_info.get("redacted_count") or 0,
        "entities": doc_info.get("entities", []),
        "redacted_text_preview": (
            redacted_text[:1000] + "..." if len(redacted_text) > 1000 else redacted_text
        ),
        "audit_entries": audit_entries,
    }

    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    audit_filename = f"audit_log_{document_id}_{timestamp_str}.json"
    audit_path = settings.data_dir / audit_filename
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(audit_log, f, indent=2, ensure_ascii=False)

    return FileResponse(
        path=str(audit_path),
        filename=audit_filename,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={audit_filename}"},
    )


def _config_snapshot() -> dict:
    return {
        "retention_hours": settings.retention_hours,
        "cleanup_interval_minutes": settings.cleanup_interval_minutes,
        "max_upload_mb": settings.max_upload_mb,
        "allowed_extensions": sorted(settings.allowed_extensions),
        "detection_language": settings.detection_language,
        "spacy_model": settings.spacy_model,
        "api_key_required": settings.api_key is not None,
    }


@router.get("/config")
async def get_config():
    return _config_snapshot()


@router.patch("/config")
async def update_config(update: ConfigUpdateRequest):
    if update.retention_hours is not None:
        if not (0.1 <= update.retention_hours <= 720):
            raise HTTPException(
                status_code=400, detail="retention_hours must be between 0.1 and 720"
            )
        settings.retention_hours = update.retention_hours

    if update.max_upload_mb is not None:
        if not (0.1 <= update.max_upload_mb <= 500):
            raise HTTPException(
                status_code=400, detail="max_upload_mb must be between 0.1 and 500"
            )
        settings.max_upload_mb = update.max_upload_mb

    logger.info("Runtime config updated: %s", update.model_dump(exclude_none=True))
    return _config_snapshot()


api_router = APIRouter(prefix="/api")
api_router.include_router(public_router)
api_router.include_router(router)

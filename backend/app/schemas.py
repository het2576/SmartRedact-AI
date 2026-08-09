"""Pydantic request/response models. Shapes mirror the existing frontend
contract in src/services/api.ts exactly, so the frontend needs no changes."""

from typing import Any, List, Optional

from pydantic import BaseModel


class EntitySelection(BaseModel):
    text: str
    type: str
    start: int
    end: int
    selected: bool = True


class RedactionRequest(BaseModel):
    document_id: str
    entities: Optional[List[EntitySelection]] = None


class RedactionResponse(BaseModel):
    success: bool
    document_id: str
    redacted_text: str
    redacted_count: int
    download_url: str


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    upload_time: str
    status: str
    entity_count: int
    redacted_count: int
    expires_at: str


class DocumentListResponse(BaseModel):
    success: bool
    documents: List[DocumentInfo]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    features: dict[str, Any]


class ConfigResponse(BaseModel):
    retention_hours: float
    cleanup_interval_minutes: float
    max_upload_mb: float
    allowed_extensions: List[str]
    detection_language: str
    spacy_model: str
    api_key_required: bool


class ConfigUpdateRequest(BaseModel):
    retention_hours: Optional[float] = None
    max_upload_mb: Optional[float] = None

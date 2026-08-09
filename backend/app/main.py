"""FastAPI application entrypoint: CORS, lifespan (load the detector, open
the document store, start the retention cleanup loop), and route wiring."""

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.detection.engine import PiiDetectionEngine
from app.routes.documents import api_router
from app.storage import DocumentStore

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("smartredact")


def _purge_stray_audit_logs() -> None:
    """Audit-log downloads are written to disk on demand and aren't tracked
    in the document store, so sweep them by file age here too."""
    cutoff_seconds = settings.retention_hours * 3600
    now = time.time()
    for path in settings.data_dir.glob("audit_log_*.json"):
        try:
            if now - path.stat().st_mtime > cutoff_seconds:
                path.unlink()
        except OSError:
            continue


async def _purge_expired_documents(store: DocumentStore) -> None:
    expired = await store.purge_expired(settings.retention_hours)
    for doc in expired:
        for path_key in ("original_path", "redacted_path"):
            path = doc.get(path_key)
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    logger.warning("Failed to remove expired file: %s", path)

    _purge_stray_audit_logs()

    if expired:
        logger.info("Retention cleanup: purged %d expired document(s)", len(expired))


async def _cleanup_loop(app: FastAPI) -> None:
    interval_seconds = settings.cleanup_interval_minutes * 60
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await _purge_expired_documents(app.state.store)
        except asyncio.CancelledError:
            break
        except Exception:  # noqa: BLE001
            logger.exception("Retention cleanup loop iteration failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SmartRedact API...")
    app.state.store = DocumentStore(settings.db_path)
    app.state.engine = PiiDetectionEngine(
        spacy_model=settings.spacy_model, language=settings.detection_language
    )

    # Purge anything already past retention from a previous run before
    # starting the periodic loop.
    await _purge_expired_documents(app.state.store)
    cleanup_task = asyncio.create_task(_cleanup_loop(app))

    logger.info("SmartRedact API ready.")
    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("SmartRedact API shut down.")


app = FastAPI(
    title="SmartRedact API",
    description="AI-powered document PII detection and redaction",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

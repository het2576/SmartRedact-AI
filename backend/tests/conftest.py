"""Shared pytest fixtures. `pythonpath = .` in pytest.ini (backend/) makes
the `app` package importable without a manual sys.path hack."""

import pytest

from app.detection.engine import PiiDetectionEngine


@pytest.fixture(scope="session")
def engine() -> PiiDetectionEngine:
    return PiiDetectionEngine(spacy_model="en_core_web_lg")


@pytest.fixture()
def api_client(tmp_path, monkeypatch):
    """A TestClient wired to isolated, per-test upload/data directories so
    tests never touch the real backend/uploads or backend/data."""
    from app.config import settings

    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")
    monkeypatch.setattr(settings, "data_dir", tmp_path / "data")
    monkeypatch.setattr(settings, "db_path", tmp_path / "data" / "test.db")
    monkeypatch.setattr(settings, "retention_hours", 1_000_000.0)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.data_dir.mkdir(parents=True, exist_ok=True)

    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        yield client

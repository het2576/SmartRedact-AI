"""Application configuration, driven by environment variables."""

import json
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # NLP / detection
    spacy_model: str = "en_core_web_lg"
    detection_language: str = "en"

    # Storage / retention
    upload_dir: Path = BACKEND_DIR / "uploads"
    data_dir: Path = BACKEND_DIR / "data"
    db_path: Path = BACKEND_DIR / "data" / "blacken.db"
    retention_hours: float = 6.0
    cleanup_interval_minutes: float = 15.0

    # Upload limits
    max_upload_mb: float = 25.0
    allowed_extensions: frozenset[str] = frozenset(
        {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".txt"}
    )

    # Security
    api_key: str | None = None

    # CORS — override via the CORS_ORIGINS env var in production. Plain,
    # comma-separated values are accepted (e.g.
    # `CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173`) - a
    # JSON array string also still works, but isn't required. Deliberately
    # typed as `str`, not `list[str]`: pydantic-settings auto-JSON-decodes
    # any complex-typed field read from an env var, so a plain
    # comma-separated value in a `list[str]` field crashes the app on
    # startup with a SettingsError before it can even bind to a port -
    # this is parsed by hand in `cors_origins_list` below instead.
    cors_origins: str = (
        "http://localhost:3000,http://localhost:5173,http://localhost:5174,"
        "http://localhost:5175,http://localhost:5176"
    )

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                return [str(origin).strip() for origin in json.loads(raw)]
            except (json.JSONDecodeError, TypeError):
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.data_dir.mkdir(parents=True, exist_ok=True)

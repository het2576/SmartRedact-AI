"""Application configuration, driven by environment variables."""

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

    # CORS — override via CORS_ORIGINS env var (JSON array string) in production, e.g.:
    #   CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:5173"]
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.data_dir.mkdir(parents=True, exist_ok=True)

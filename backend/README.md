# SmartRedact Backend

FastAPI service that detects and redacts personal data (PII) in PDF, Word,
image, and text documents.

## Detection engine

PII detection is built on [Microsoft Presidio](https://microsoft.github.io/presidio/)
(`presidio-analyzer` + `presidio-anonymizer`) - free, MIT-licensed, and runs
entirely locally with no external API calls. It combines:

- A spaCy NLP model (`en_core_web_lg` by default) for PERSON, LOCATION,
  ORGANIZATION, and date/time entities.
- Presidio's built-in, checksum/pattern-validated recognizers for email,
  phone, credit cards, IBAN, crypto wallets, IP addresses, and a wide range
  of country-specific ID formats (US SSN/passport/driver's license, UK NHS,
  India Aadhaar, etc.) - see `app/detection/engine.py`.
- Custom recognizers for domain-specific identifiers not covered by
  Presidio out of the box: medical record numbers, patient/account IDs,
  ages, street addresses, and zip/PIN codes (`app/detection/recognizers.py`).

## Architecture

```
backend/
├── app/
│   ├── config.py            # env-driven settings
│   ├── main.py               # FastAPI app, CORS, startup/cleanup lifespan
│   ├── schemas.py             # request/response models
│   ├── storage.py              # SQLite-backed document store + retention purge
│   ├── utils.py                 # filename sanitization, JSON helpers
│   ├── detection/
│   │   ├── engine.py             # Presidio-based PiiDetectionEngine
│   │   └── recognizers.py         # custom pattern recognizers
│   ├── extraction/
│   │   └── text_extractor.py       # PDF/DOCX/image/txt -> text, OCR fallback
│   ├── redaction/
│   │   ├── text_redactor.py         # bracket redaction for text preview
│   │   ├── pdf_redactor.py           # word/bbox offset-mapped PDF redaction
│   │   ├── docx_redactor.py           # run-level offset-mapped DOCX redaction
│   │   └── image_redactor.py           # OCR line-reconstruction image redaction
│   └── routes/
│       └── documents.py               # all /api/* endpoints
├── run.py                     # dev entrypoint (`python run.py`)
├── requirements.txt
└── tests/                      # pytest suite
```

## Quick Start

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_lg

python run.py
```

The API is then available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs

For production, run `uvicorn app.main:app --host 0.0.0.0 --port 8000`
directly instead of `run.py` (which enables `--reload` for development).

### System dependency: Tesseract OCR

Image and scanned-PDF text extraction need the Tesseract binary (not just
the `pytesseract` pip package):

```bash
brew install tesseract          # macOS
apt-get install tesseract-ocr   # Debian/Ubuntu
```

`GET /api/health` reports whether Tesseract is actually on `PATH`.

## Configuration

Copy `.env.example` to `.env` to override any of these (all have working
defaults):

| Variable | Default | Purpose |
|---|---|---|
| `SPACY_MODEL` | `en_core_web_lg` | NLP model for detection |
| `RETENTION_HOURS` | `6` | how long uploaded documents are kept before auto-deletion |
| `CLEANUP_INTERVAL_MINUTES` | `15` | how often the retention sweep runs |
| `MAX_UPLOAD_MB` | `25` | max upload size |
| `API_KEY` | unset | if set, requires a matching `X-API-Key` header on all `/api/*` routes except `/api/health` |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | server bind address |
| `CORS_ORIGINS` | localhost only | allowed frontend origins, as a JSON array string, e.g. `["https://your-app.vercel.app"]` |

## Deployment

`Dockerfile` builds a memory-slimmed image, aimed at free-tier hosts like
Railway or Render (typically 512MB-1GB RAM):

- Full `en_core_web_lg` loads to ~800MB RAM - its 342k-entry word-vector
  table dominates that, even though the actual trained NER weights are a
  small fraction of it. Stage 1 of the Dockerfile downloads `lg`, then runs
  spaCy's own supported `vocab.prune_vectors(20000)` to collapse rare
  vectors onto their nearest neighbor, and saves the result. Stage 2 (the
  image that actually ships) copies in only that ~54MB pruned model, never
  the original ~560MB download.
- Measured locally: 799MB -> 426MB RSS, with no measurable NER accuracy
  loss on real documents (it's the same trained weights) - noticeably
  *better* results than either `en_core_web_sm` or `en_core_web_md`, which
  both introduced false positives (e.g. tagging an address fragment like
  "Silverpark Soc" as a PERSON) that neither full nor pruned `lg` did.
- `SPACY_MODEL` is set in the image to the pruned model's path
  (`/app/models/en_core_web_lg_pruned`) rather than a package name - spaCy
  loads either the same way. Override it (e.g. back to `en_core_web_lg`) via
  a platform env var if you move to a host with >= 1.5GB RAM.
- Structured PII - SSN, email, phone, credit card, IP, dates, and this
  repo's custom recognizers - comes from Presidio's own pattern/checksum
  recognizers, not spaCy, so none of this affects their accuracy either way;
  only PERSON/ORGANIZATION/LOCATION quality depends on which model is used.

## API Endpoints

Unchanged from before, so the existing frontend (`frontend/src/services/api.ts`)
needs no changes:

- `GET /api/health`
- `POST /api/upload`
- `POST /api/redact`
- `GET /api/download/{document_id}`
- `GET /api/document/{document_id}/preview`
- `GET /api/document/{document_id}/redacted-preview`
- `GET /api/document/{document_id}/audit-log`
- `GET /api/document/{document_id}/download-audit-log`

## Data handling

- Uploaded files live in `backend/uploads/`; document metadata (extracted
  text, detected entities, redaction state) lives in a local SQLite file at
  `backend/data/smartredact.db`.
- A background task purges documents (DB rows + files) older than
  `RETENTION_HOURS` on an interval of `CLEANUP_INTERVAL_MINUTES`. This is a
  PII-handling tool, so documents are not retained indefinitely by default.
- Uploaded filenames are sanitized (no path traversal), and both file
  extension and size are validated on upload.

## Testing

```bash
source venv/bin/activate
pytest -v
```

`tests/test_detection.py` covers detection accuracy and false-positive
regressions directly against the engine. `tests/test_redaction_e2e.py`
drives the real HTTP API end to end (upload -> redact -> download) and
verifies the PII is actually gone from the output file, not just flagged.

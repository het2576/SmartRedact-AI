# SmartRedact Backend

FastAPI-based document redaction service with AI-powered entity detection.

## Features

- **Document Processing**: PDF, DOCX, and image file support
- **AI Entity Detection**: Uses Transformers and spaCy models for NER
- **Healthcare-Specific**: Optimized for medical document redaction
- **Temporary File Management**: Secure file handling with auto-cleanup
- **RESTful API**: Complete API with documentation

## Quick Start

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python app.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs

## API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `POST /api/upload` - Upload document
- `POST /api/redact` - Redact document
- `GET /api/download/{document_id}` - Download redacted file

### Preview & Audit Endpoints
- `GET /api/document/{document_id}/preview` - Document preview
- `GET /api/document/{document_id}/redacted-preview` - Redacted preview
- `GET /api/document/{document_id}/audit-log` - Audit log
- `GET /api/document/{document_id}/download-audit-log` - Download audit log

## Configuration

### Environment Variables
- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

### File Storage
- **Uploads**: `backend/uploads/` - Original documents
- **Temporary**: System temp directory - Redacted files (auto-deleted)

## Models Used

- **Transformers**: `dbmdz/bert-large-cased-finetuned-conll03-english`
- **spaCy**: `en_core_web_sm` or `en_core_web_md`

## Development

### Running in Development Mode
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Testing
```bash
python test_api.py
```

## Architecture

```
backend/
├── app.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
├── uploads/           # Original document storage
├── README.md          # This file
└── venv/             # Virtual environment (created)
```

## Security Features

- **Temporary Files**: Redacted files are stored temporarily and auto-deleted
- **Entity Filtering**: Advanced filtering to prevent over-detection
- **Confidence Thresholds**: High-confidence entity detection only
- **Field Label Exclusion**: Prevents redaction of form labels

## Performance

- **GPU Support**: Uses MPS (Apple Silicon) or CUDA when available
- **Model Caching**: Models are loaded once and reused
- **Background Tasks**: File cleanup runs in background
- **Memory Efficient**: Temporary file management












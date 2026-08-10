# Blacken - Document Redaction Platform

A powerful AI-powered document redaction platform that automatically detects and redacts sensitive information from PDF documents using advanced machine learning models.

## 🚀 Features

- **AI-Powered Detection**: Advanced NLP models detect sensitive entities like SSNs, emails, phone numbers, addresses, and more
- **PDF Redaction**: Secure visual redaction of PDF documents with black bars
- **Interactive Review**: Review and select which entities to redact before processing
- **Audit Trail**: Complete audit logs of all redaction activities
- **Modern UI**: A document-native interface built with React and Tailwind CSS — case-file typography, literal redaction bars, no generic dashboard chrome
- **Real-time Processing**: Fast document processing with progress indicators

## 🏗️ Architecture

```
blacken/
├── backend/                 # FastAPI Backend
│   ├── app/                # Application package (see backend/README.md)
│   │   ├── detection/      # Presidio-based PII detection engine
│   │   ├── extraction/     # PDF/DOCX/image/txt text extraction
│   │   ├── redaction/      # PDF/DOCX/image redactors
│   │   └── routes/         # /api/* endpoints
│   ├── run.py               # dev entrypoint (`python run.py`)
│   ├── requirements.txt    # Python dependencies
│   ├── tests/               # pytest suite
│   ├── uploads/            # uploaded document storage (gitignored)
│   ├── data/                # SQLite document store (gitignored)
│   ├── venv/                # Virtual environment
│   └── README.md           # Backend documentation
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/     # React components (incl. components/ui primitives)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── pages/          # Page components
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration
└── README.md            # This file
```

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python (in `backend/` folder)
- **AI/PII Detection**: [Microsoft Presidio](https://microsoft.github.io/presidio/) (free, MIT-licensed, runs 100% locally) + spaCy NLP, with custom recognizers for identifiers Presidio doesn't cover out of the box
- **Document Processing**: PyMuPDF (PDF), python-docx (Word), Tesseract (OCR, incl. scanned-PDF fallback)
- **Storage**: SQLite document store with automatic retention-based cleanup (see backend/README.md)

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🛠️ Quick Start

### Option 1: Quick Setup

```bash
# Clone the repository
git clone https://github.com/het2576/blacken.git
cd blacken

# Setup and start both frontend and backend
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python -m spacy download en_core_web_lg && python run.py &
cd ../frontend && npm install && npm run dev
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_lg

# Also requires the Tesseract OCR system binary (not a pip package):
#   macOS:  brew install tesseract
#   Ubuntu: apt-get install tesseract-ocr

# Start the backend
python run.py
```

#### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Alternative API Docs**: http://localhost:8000/api/redoc

## 📖 API Endpoints

### Health Check
```
GET /api/health
```
Returns API status and available features.

### Upload Document
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (PDF, DOCX, or image)
```
Uploads a document and returns detected entities.

### Redact Document
```
POST /api/redact
Content-Type: application/json
Body: {
  "document_id": "string",
  "entities": [{"text": "string", "type": "string", "start": number, "end": number, "selected": boolean}]
}
```
Redacts selected entities from the document.

### Download Document
```
GET /api/download/{document_id}
```
Downloads the redacted document.

## 🔧 Configuration

### Environment Variables

Backend settings live in `backend/.env` (copy `backend/.env.example` to start). The frontend
talks to the backend through Vite's dev proxy (`frontend/vite.config.ts`), so no frontend
`.env` is required for local development; set `VITE_API_URL` in `frontend/.env` only if you're
pointing the built frontend at a non-default API origin.

### Backend Configuration

The FastAPI backend is configured via `backend/app/config.py` and environment variables:

- **CORS Origins**: Update allowed origins in the CORS middleware
- **File Upload Limits**: Modify file size limits
- **Retention Window**: `RETENTION_HOURS` controls how long uploads and extracted data are kept

## 🧪 Testing

### Backend Testing

```bash
# Navigate to backend folder
cd backend

# Activate virtual environment
source venv/bin/activate

# Run tests (if available)
python -m pytest tests/
```

### Frontend Checks

```bash
cd frontend
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # production build
```

## 📦 Dependencies

### Backend Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Presidio** (analyzer + anonymizer): free, MIT-licensed PII detection engine
- **spaCy**: NLP library backing Presidio's entity recognition
- **PyMuPDF**: PDF processing and manipulation
- **Tesseract** (via pytesseract): OCR engine for image and scanned-PDF text extraction
- **Pillow**: Image processing library
- **python-docx**: Word document processing

### Frontend Dependencies

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client
- **Lucide React**: Icon library

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in `frontend/dist/`
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt && python -m spacy download en_core_web_lg

# Copy application
COPY backend/ .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Security Features

- **Time-Limited Retention**: Documents (files + extracted text + entities) are automatically deleted after a configurable retention window (`RETENTION_HOURS`, default 6h) - not kept indefinitely
- **Secure Redaction**: Uses PyMuPDF's secure redaction features, which actually removes the underlying text/image data, not just draws over it
- **CORS Protection**: Configured CORS policies
- **Filename Sanitization & Upload Limits**: Uploaded filenames are sanitized against path traversal; file type and size are validated
- **Optional API Key**: Set `API_KEY` to require an `X-API-Key` header on all endpoints except `/api/health`
- **Input Validation**: Comprehensive input validation using Pydantic

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check if Python 3.8+ is installed
   - Navigate to backend folder: `cd backend`
   - Verify virtual environment is activated
   - Install missing dependencies: `pip install -r requirements.txt`

2. **Frontend won't start**
   - Check if Node.js 16+ is installed
   - Navigate to frontend folder: `cd frontend`
   - Install dependencies: `npm install`
   - Clear cache: `npm run dev -- --force`

3. **API connection issues**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Verify proxy settings in `frontend/vite.config.ts`

4. **Document processing fails**
   - Check file format (PDF, DOCX, images supported)
   - Verify file size limits
   - Check AI model availability

### Debug Mode

Enable debug logging by setting environment variables:

```bash
export DEBUG=1
export LOG_LEVEL=DEBUG
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at http://localhost:8000/api/docs
- Review the troubleshooting section above

---

**Blacken** - Secure document redaction powered by artificial intelligence.


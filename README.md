# SmartRedact AI - Document Redaction Platform

A powerful AI-powered document redaction platform that automatically detects and redacts sensitive information from PDF documents using advanced machine learning models.

## 🚀 Features

- **AI-Powered Detection**: Advanced NLP models detect sensitive entities like SSNs, emails, phone numbers, addresses, and more
- **PDF Redaction**: Secure visual redaction of PDF documents with black bars
- **Interactive Review**: Review and select which entities to redact before processing
- **Audit Trail**: Complete audit logs of all redaction activities
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Fast document processing with progress indicators

## 🏗️ Architecture

```
SmartRedact/
├── backend/                 # FastAPI Backend
│   ├── app.py              # Main application
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/           # Document storage
│   ├── venv/              # Virtual environment
│   └── README.md          # Backend documentation
├── src/                   # React Frontend
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API services
│   └── pages/            # Page components
├── package.json          # Frontend dependencies
├── vite.config.ts        # Vite configuration
└── README.md            # This file
```

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python (in `backend/` folder)
- **AI Models**: Transformers (BERT-based NER) + spaCy + Regex patterns
- **Document Processing**: PyMuPDF (PDF), python-docx (Word), Tesseract (OCR)

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🛠️ Quick Start

### Option 1: Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd SmartRedact

# Setup and start both frontend and backend
npm install
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python app.py &
cd .. && npm run dev
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

# Start the backend
python app.py
```

#### Frontend Setup

```bash
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

Create a `.env` file in the root directory:

```env
# API Configuration
API_BASE_URL=http://localhost:8000/api

# Development
NODE_ENV=development
VITE_API_URL=http://localhost:8000/api
```

### Backend Configuration

The FastAPI backend can be configured by modifying `backend/app.py`:

- **CORS Origins**: Update allowed origins in the CORS middleware
- **File Upload Limits**: Modify file size limits
- **AI Models**: Enable/disable specific AI models

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

### Frontend Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Dependencies

### Backend Dependencies

- **FastAPI**: Modern web framework for building APIs
- **PyMuPDF**: PDF processing and manipulation
- **Transformers**: Hugging Face transformers for NLP
- **spaCy**: Advanced NLP library
- **Tesseract**: OCR engine for image text extraction
- **Pillow**: Image processing library
- **python-docx**: Word document processing

### Frontend Dependencies

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Axios**: HTTP client
- **Lucide React**: Icon library

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# The built files will be in the `dist/` directory
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
COPY requirements_api.txt .
RUN pip install -r requirements_api.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "app.py"]
```

## 🔒 Security Features

- **No Data Persistence**: Documents are processed in memory and not stored
- **Secure Redaction**: Uses PyMuPDF's secure redaction features
- **CORS Protection**: Configured CORS policies
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
   - Install dependencies: `npm install`
   - Clear cache: `npm run dev -- --force`

3. **API connection issues**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Verify proxy settings in `vite.config.ts`

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

**SmartRedact AI** - Secure document redaction powered by artificial intelligence.


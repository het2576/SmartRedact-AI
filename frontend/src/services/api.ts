/**
 * API Service Layer for Document Redaction
 * Handles all communication with the FastAPI backend
 */

import axios, { AxiosResponse } from 'axios';

// API Configuration
// In production, set VITE_API_URL in Vercel to your Render backend URL, e.g.:
//   VITE_API_URL=https://your-backend.onrender.com/api
// In local dev, the Vite proxy (vite.config.ts) forwards /api → localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
  source: string;
  selected?: boolean;
}

export interface UploadResponse {
  success: boolean;
  document_id: string;
  filename: string;
  extracted_text: string;
  entities: Entity[];
  entity_count: number;
}

export interface RedactionRequest {
  document_id: string;
  entities?: Entity[];
}

export interface RedactionResponse {
  success: boolean;
  document_id: string;
  redacted_text: string;
  redacted_count: number;
  download_url: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  features: {
    ocr: boolean;
    pdf: boolean;
    docx: boolean;
  };
}

export interface DocumentPreviewResponse {
  success: boolean;
  document_id: string;
  filename: string;
  upload_time: string;
  status: string;
  entity_count: number;
  extracted_text_preview: string;
  entities: Entity[];
  redacted_count: number;
}

export interface RedactedPreviewResponse {
  success: boolean;
  document_id: string;
  filename: string;
  redacted_filename: string;
  redacted_count: number;
  redacted_text_preview: string;
  download_url: string;
  status: string;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  details: string;
  status: string;
  entities?: Entity[];
  selected_entities?: Entity[];
  redacted_entities?: Entity[];
  redacted_count?: number;
}

export interface AuditLogResponse {
  success: boolean;
  document_id: string;
  filename: string;
  audit_entries: AuditLogEntry[];
  total_entries: number;
}

export interface DocumentSummary {
  document_id: string;
  filename: string;
  upload_time: string;
  status: string;
  entity_count: number;
  redacted_count: number;
  expires_at: string;
}

export interface DocumentListResponse {
  success: boolean;
  documents: DocumentSummary[];
}

export interface ConfigResponse {
  retention_hours: number;
  cleanup_interval_minutes: number;
  max_upload_mb: number;
  allowed_extensions: string[];
  detection_language: string;
  spacy_model: string;
  api_key_required: boolean;
}

export interface ConfigUpdateRequest {
  retention_hours?: number;
  max_upload_mb?: number;
}

// API Service Class
class DocumentRedactionAPI {
  /**
   * Check API health and available features
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response: AxiosResponse<HealthResponse> = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API is not available. Please ensure the backend server is running.');
    }
  }

  /**
   * Upload document and extract text with entity detection
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response: AxiosResponse<UploadResponse> = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file processing
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          throw new Error('File too large. Please choose a smaller file.');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid file format. Please upload a PDF, DOCX, or image file.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to upload document. Please try again.');
    }
  }

  /**
   * Redact selected entities from document
   */
  async redactDocument(documentId: string, entities: Entity[]): Promise<RedactionResponse> {
    try {
      const requestData: RedactionRequest = {
        document_id: documentId,
        entities: entities.map(entity => ({
          text: entity.text,
          type: entity.type,
          start: entity.start,
          end: entity.end,
          confidence: entity.confidence,
          source: entity.source,
          selected: entity.selected !== false, // Default to true if not specified
        })),
      };

      const response: AxiosResponse<RedactionResponse> = await apiClient.post('/redact', requestData, {
        timeout: 120000, // 2 minutes for redaction processing
      });

      return response.data;
    } catch (error) {
      console.error('Document redaction failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid redaction request. Please check your selections.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to redact document. Please try again.');
    }
  }

  /**
   * Download redacted document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await apiClient.get(`/download/${documentId}`, {
        responseType: 'blob',
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Document download failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Redacted document not found. Please complete the redaction process first.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to download document. Please try again.');
    }
  }

  /**
   * Helper method to trigger file download
   */
  async downloadAndSaveDocument(documentId: string, filename: string): Promise<void> {
    try {
      const blob = await this.downloadDocument(documentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download and save failed:', error);
      throw error;
    }
  }

  /**
   * Get document preview information
   */
  async getDocumentPreview(documentId: string): Promise<DocumentPreviewResponse> {
    try {
      console.log('API: Getting document preview for ID:', documentId);
      const response: AxiosResponse<DocumentPreviewResponse> = await apiClient.get(`/document/${documentId}/preview`);
      console.log('API: Document preview response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Document preview failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to get document preview. Please try again.');
    }
  }

  /**
   * Get redacted document preview information
   */
  async getRedactedPreview(documentId: string): Promise<RedactedPreviewResponse> {
    try {
      console.log('API: Getting redacted preview for ID:', documentId);
      const response: AxiosResponse<RedactedPreviewResponse> = await apiClient.get(`/document/${documentId}/redacted-preview`);
      console.log('API: Redacted preview response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Redacted preview failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.status === 400) {
          throw new Error('Document has not been redacted yet.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to get redacted preview. Please try again.');
    }
  }

  /**
   * Get audit log for a document
   */
  async getAuditLog(documentId: string): Promise<AuditLogResponse> {
    try {
      console.log('API: Getting audit log for ID:', documentId);
      const response: AxiosResponse<AuditLogResponse> = await apiClient.get(`/document/${documentId}/audit-log`);
      console.log('API: Audit log response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Audit log failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to get audit log. Please try again.');
    }
  }

  /**
   * Get document URL for viewing (original or redacted)
   */
  async getDocumentUrl(documentId: string, isRedacted: boolean = false): Promise<string> {
    try {
      const endpoint = `/download/${documentId}${!isRedacted ? '?original=true' : ''}`;
      const response = await apiClient.get(endpoint, {
        responseType: 'blob',
      });
      
      // Create blob URL for PDF viewing
      const blob = new Blob([response.data], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Get document URL failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to get document URL. Please try again.');
    }
  }

  /**
   * Download audit log as JSON file
   */
  async downloadAuditLog(documentId: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await apiClient.get(`/document/${documentId}/download-audit-log`, {
        responseType: 'blob',
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Audit log download failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found. Please upload the document again.');
        } else if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      throw new Error('Failed to download audit log. Please try again.');
    }
  }

  /**
   * Helper method to download and save audit log
   */
  async downloadAndSaveAuditLog(documentId: string, filename: string): Promise<void> {
    try {
      const blob = await this.downloadAuditLog(documentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download and save audit log failed:', error);
      throw error;
    }
  }

  /**
   * List every document currently held by the server
   */
  async listDocuments(): Promise<DocumentSummary[]> {
    try {
      const response: AxiosResponse<DocumentListResponse> = await apiClient.get('/documents');
      return response.data.documents;
    } catch (error) {
      console.error('List documents failed:', error);
      throw new Error('Failed to load document history. Please try again.');
    }
  }

  /**
   * Permanently delete a document and its files before its retention window ends
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(`/document/${documentId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Document not found. It may have already expired.');
      }
      throw new Error('Failed to delete document. Please try again.');
    }
  }

  /**
   * Get the server's current effective configuration
   */
  async getConfig(): Promise<ConfigResponse> {
    try {
      const response: AxiosResponse<ConfigResponse> = await apiClient.get('/config');
      return response.data;
    } catch (error) {
      console.error('Get config failed:', error);
      throw new Error('Failed to load server configuration. Please try again.');
    }
  }

  /**
   * Update mutable server settings (takes effect immediately, resets on server restart)
   */
  async updateConfig(update: ConfigUpdateRequest): Promise<ConfigResponse> {
    try {
      const response: AxiosResponse<ConfigResponse> = await apiClient.patch('/config', update);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update server configuration. Please try again.');
    }
  }
}

// Create singleton instance
export const documentRedactionAPI = new DocumentRedactionAPI();

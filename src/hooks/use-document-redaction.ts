/**
 * Custom hook for document redaction workflow
 * Manages state and API calls for the complete redaction process
 */

import { useState, useCallback } from 'react';
import { documentRedactionAPI, Entity, UploadResponse, RedactionResponse } from '../services/api';

export interface DocumentState {
  // Upload state
  isUploading: boolean;
  uploadError: string | null;
  documentId: string | null;
  filename: string | null;
  extractedText: string | null;
  
  // Entity detection state
  entities: Entity[];
  isDetecting: boolean;
  detectionError: string | null;
  
  // Redaction state
  isRedacting: boolean;
  redactionError: string | null;
  redactedText: string | null;
  redactedCount: number;
  
  // Download state
  isDownloading: boolean;
  downloadError: string | null;
}

export interface DocumentActions {
  uploadDocument: (file: File) => Promise<void>;
  toggleEntity: (index: number) => void;
  redactDocument: () => Promise<void>;
  downloadDocument: () => Promise<void>;
  resetState: () => void;
}

export function useDocumentRedaction(): DocumentState & DocumentActions {
  const [state, setState] = useState<DocumentState>({
    isUploading: false,
    uploadError: null,
    documentId: null,
    filename: null,
    extractedText: null,
    entities: [],
    isDetecting: false,
    detectionError: null,
    isRedacting: false,
    redactionError: null,
    redactedText: null,
    redactedCount: 0,
    isDownloading: false,
    downloadError: null,
  });

  const uploadDocument = useCallback(async (file: File) => {
    setState(prev => ({
      ...prev,
      isUploading: true,
      uploadError: null,
      isDetecting: true,
      detectionError: null,
    }));

    try {
      const response: UploadResponse = await documentRedactionAPI.uploadDocument(file);
      
      const mappedEntities = response.entities.map(entity => ({
        ...entity,
        selected: true, // Default all entities to selected
      }));
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        documentId: response.document_id,
        filename: response.filename,
        extractedText: response.extracted_text,
        entities: mappedEntities,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        uploadError: errorMessage,
        detectionError: errorMessage,
      }));
    }
  }, []);

  const toggleEntity = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      entities: prev.entities.map((entity, i) => 
        i === index ? { ...entity, selected: !entity.selected } : entity
      ),
    }));
  }, []);

  const redactDocument = useCallback(async () => {
    if (!state.documentId) {
      setState(prev => ({
        ...prev,
        redactionError: 'No document ID available',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isRedacting: true,
      redactionError: null,
    }));

    try {
      const selectedEntities = state.entities.filter(entity => entity.selected);
      const response: RedactionResponse = await documentRedactionAPI.redactDocument(
        state.documentId,
        selectedEntities
      );

      setState(prev => ({
        ...prev,
        isRedacting: false,
        redactedText: response.redacted_text,
        redactedCount: response.redacted_count,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redaction failed';
      setState(prev => ({
        ...prev,
        isRedacting: false,
        redactionError: errorMessage,
      }));
    }
  }, [state.documentId, state.entities]);

  const downloadDocument = useCallback(async () => {
    if (!state.documentId || !state.filename) {
      setState(prev => ({
        ...prev,
        downloadError: 'No document available for download',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isDownloading: true,
      downloadError: null,
    }));

    try {
      const redactedFilename = `redacted_${state.filename}`;
      await documentRedactionAPI.downloadAndSaveDocument(state.documentId, redactedFilename);
      
      setState(prev => ({
        ...prev,
        isDownloading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setState(prev => ({
        ...prev,
        isDownloading: false,
        downloadError: errorMessage,
      }));
    }
  }, [state.documentId, state.filename]);

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadError: null,
      documentId: null,
      filename: null,
      extractedText: null,
      entities: [],
      isDetecting: false,
      detectionError: null,
      isRedacting: false,
      redactionError: null,
      redactedText: null,
      redactedCount: 0,
      isDownloading: false,
      downloadError: null,
    });
  }, []);

  return {
    ...state,
    uploadDocument,
    toggleEntity,
    redactDocument,
    downloadDocument,
    resetState,
  };
}

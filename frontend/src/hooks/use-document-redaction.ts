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

export type AddManualEntityResult =
  | { status: 'added'; count: number }
  | { status: 'already-covered' }
  | { status: 'not-found' };

export interface DocumentActions {
  uploadDocument: (file: File) => Promise<void>;
  toggleEntity: (index: number) => void;
  addManualEntity: (searchText: string) => AddManualEntityResult;
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
        // Respect the backend's confidence-based default: high-confidence
        // hits (a real name, email, SSN...) start checked, low-confidence
        // guesses start unchecked for the user to opt into instead of
        // opt out of. Only fall back to true if the field is missing.
        selected: entity.selected ?? true,
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

  // Detection is never exhaustive - this is the manual fallback: find every
  // occurrence of text the user points at (case-insensitive) that the model
  // missed, and add it as its own entity with the same shape a detected one
  // would have. Real offsets into extractedText are what make the plain-text
  // preview (redact_text on the backend) and the PDF/DOCX/image redactors
  // (which search the page's own text for entity.text, not these offsets)
  // both work correctly, so only text that actually appears in the
  // extracted document is accepted.
  const addManualEntity = useCallback(
    (searchText: string): AddManualEntityResult => {
      const needle = searchText.trim();
      if (!needle || !state.extractedText) return { status: 'not-found' };

      const haystack = state.extractedText;
      const haystackLower = haystack.toLowerCase();
      const needleLower = needle.toLowerCase();

      const isCovered = (start: number, end: number) =>
        state.entities.some((e) => start < e.end && end > e.start);

      const newEntities: Entity[] = [];
      let searchFrom = 0;
      let matchCount = 0;
      while (true) {
        const idx = haystackLower.indexOf(needleLower, searchFrom);
        if (idx === -1) break;
        const end = idx + needle.length;
        matchCount += 1;
        if (!isCovered(idx, end)) {
          newEntities.push({
            text: haystack.slice(idx, end),
            type: 'CUSTOM',
            start: idx,
            end,
            confidence: 1,
            source: 'manual',
            selected: true,
          });
        }
        searchFrom = idx + 1;
      }

      if (matchCount === 0) return { status: 'not-found' };
      if (newEntities.length === 0) return { status: 'already-covered' };

      setState((prev) => ({
        ...prev,
        entities: [...prev.entities, ...newEntities].sort((a, b) => a.start - b.start),
      }));
      return { status: 'added', count: newEntities.length };
    },
    [state.extractedText, state.entities],
  );

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
    addManualEntity,
    redactDocument,
    downloadDocument,
    resetState,
  };
}

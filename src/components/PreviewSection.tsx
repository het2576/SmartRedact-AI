import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { documentRedactionAPI, DocumentPreviewResponse, RedactedPreviewResponse } from '@/services/api';
import { FileText, Download, Eye, AlertCircle, FileImage } from 'lucide-react';

interface PreviewSectionProps {
  documentId?: string;
  summary: {
    entitiesRedacted: number;
    avgConfidence: number;
  };
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function PreviewSection({ documentId, summary, refreshTrigger }: PreviewSectionProps) {
  const [documentPreview, setDocumentPreview] = useState<DocumentPreviewResponse | null>(null);
  const [redactedPreview, setRedactedPreview] = useState<RedactedPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      console.log('PreviewSection: Loading document data, refreshTrigger:', refreshTrigger);
      loadDocumentData();
    }
  }, [documentId, refreshTrigger]);

  const loadDocumentData = async () => {
    if (!documentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('PreviewSection: Loading document data for ID:', documentId);
      
      // Load document preview
      const preview = await documentRedactionAPI.getDocumentPreview(documentId);
      console.log('PreviewSection: Document preview loaded:', preview);
      console.log('PreviewSection: Document status:', preview.status);
      setDocumentPreview(preview);
      
      // Try to load redacted preview if document is redacted
      if (preview.status === 'redacted') {
        try {
          console.log('PreviewSection: Loading redacted preview...');
          const redacted = await documentRedactionAPI.getRedactedPreview(documentId);
          console.log('PreviewSection: Redacted preview loaded:', redacted);
          setRedactedPreview(redacted);
        } catch (err) {
          console.warn('PreviewSection: Could not load redacted preview:', err);
        }
      } else {
        console.log('PreviewSection: Document not redacted yet, status:', preview.status);
      }
    } catch (err) {
      console.error('PreviewSection: Error loading document data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId) return;
    
    try {
      const preview = redactedPreview || documentPreview;
      if (preview) {
        await documentRedactionAPI.downloadAndSaveDocument(documentId, preview.filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleViewDocument = async (isRedacted: boolean = false) => {
    if (!documentId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Loading document - isRedacted: ${isRedacted}, documentId: ${documentId}`);
      const url = await documentRedactionAPI.getDocumentUrl(documentId, isRedacted);
      console.log('Document URL created:', url);
      setPdfUrl(url);
      setShowPdfViewer(true);
    } catch (err) {
      console.error('Document loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  // Determine document type and appropriate labels
  const getDocumentType = () => {
    if (!documentPreview) return { type: 'unknown', label: 'Document', viewLabel: 'View Document' };
    
    const filename = documentPreview.filename.toLowerCase();
    if (filename.endsWith('.pdf')) {
      return { type: 'pdf', label: 'PDF', viewLabel: 'View PDF' };
    } else if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return { type: 'image', label: 'Image', viewLabel: 'View Image' };
    } else if (filename.match(/\.(docx?|doc)$/)) {
      return { type: 'document', label: 'Document', viewLabel: 'View Document' };
    }
    return { type: 'document', label: 'Document', viewLabel: 'View Document' };
  };

  const documentType = getDocumentType();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-red-500/20 border border-red-400/40 rounded-3xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Document</h3>
          <p className="text-red-400/90">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border border-green-200/40 backdrop-blur-xl shadow-2xl shadow-green-200/20 p-8"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Document Summary</h3>
          <p className="text-green-600/90">
            {documentPreview?.filename || 'Document has been successfully processed'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {documentPreview?.entity_count || 0}
              </span>
            </div>
            <p className="text-sm text-green-600/90 font-medium">Entities Detected</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {summary.entitiesRedacted}
              </span>
            </div>
            <p className="text-sm text-green-600/90 font-medium">Entities Redacted</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-2xl font-bold text-white">{summary.avgConfidence}%</span>
            </div>
            <p className="text-sm text-green-600/90 font-medium">Average Confidence</p>
          </div>
        </div>
      </motion.div>

      {/* Document Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Original Document Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Original Document</span>
          </h4>
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm h-80">
            {documentPreview ? (
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700">{documentPreview.filename}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {documentPreview.entity_count} entities detected
                  </div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed mb-4">
                  {documentPreview.extracted_text_preview}
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleViewDocument(false)}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>View Original {documentType.label}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 text-sm">No document loaded</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Redacted Document Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Redacted Document</span>
          </h4>
          <div className="border-2 border-green-300/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm h-80">
            {redactedPreview ? (
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">{redactedPreview.redacted_filename}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {redactedPreview.redacted_count} entities redacted
                  </div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed mb-4">
                  {redactedPreview.redacted_text_preview}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => handleViewDocument(true)}
                    className="w-full bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>View Redacted {documentType.label}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Redacted {documentType.label}</span>
                  </button>
                </div>
              </div>
            ) : documentPreview?.status === 'redacted' ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 text-sm">Loading redacted preview...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <p className="text-gray-600 text-sm">Document not redacted yet</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* PDF Viewer Modal */}
      {showPdfViewer && pdfUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePdfViewer}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-200 w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {documentType.label} Viewer
              </h3>
              <button
                onClick={closePdfViewer}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 p-4">
              {documentType.type === 'image' ? (
                <img
                  src={pdfUrl}
                  alt="Document Preview"
                  className="w-full h-full object-contain rounded-lg border border-gray-300"
                />
              ) : (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg border border-gray-300"
                  title={`${documentType.label} Viewer`}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

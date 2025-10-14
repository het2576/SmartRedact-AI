import { Download, FileText, RotateCcw, Shield, CheckCircle, Eye, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { documentRedactionAPI, AuditLogEntry } from '@/services/api';

interface DownloadButtonsProps {
  documentId?: string;
  onDownloadPdf: () => void;
  onReVerify: () => void;
  onBackToReview?: () => void;
  isDownloading?: boolean;
  downloadError?: string | null;
}

export default function DownloadButtons({ 
  documentId,
  onDownloadPdf, 
  onReVerify, 
  onBackToReview,
  isDownloading = false,
  downloadError = null
}: DownloadButtonsProps) {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogData, setAuditLogData] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && showAuditLog) {
      loadAuditLog();
    }
  }, [documentId, showAuditLog]);

  const loadAuditLog = async () => {
    if (!documentId) return;
    
    setAuditLoading(true);
    setAuditError(null);
    
    try {
      console.log('Loading audit log for document ID:', documentId);
      const response = await documentRedactionAPI.getAuditLog(documentId);
      console.log('Audit log response:', response);
      setAuditLogData(response.audit_entries);
    } catch (err) {
      console.error('Error loading audit log:', err);
      setAuditError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleDownloadAuditLog = async () => {
    if (!documentId) return;
    
    try {
      const filename = `audit_log_${documentId}_${new Date().toISOString().split('T')[0]}.json`;
      await documentRedactionAPI.downloadAndSaveAuditLog(documentId, filename);
      // Show success message
      setAuditError(null);
      setAuditSuccess(`Audit log downloaded: ${filename}`);
      console.log('Audit log downloaded successfully:', filename);
      
      // Clear success message after 3 seconds
      setTimeout(() => setAuditSuccess(null), 3000);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Failed to download audit log');
      setAuditSuccess(null);
    }
  };

  return (
    <div 
      className="space-y-8"
      style={{ 
        position: 'relative', 
        zIndex: 10,
        paddingBottom: '100px' // Space for mobile navbar
      }}
    >
      {/* Back to Review Button */}
      {onBackToReview && (
        <div className="flex justify-center mb-6">
          <Button
            onClick={onBackToReview}
            variant="outline"
            className="flex items-center space-x-2 px-6 py-3 btn-secondary"
            style={{ 
              position: 'relative', 
              zIndex: 10,
              pointerEvents: 'auto'
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Review</span>
          </Button>
        </div>
      )}

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border border-green-200/40 backdrop-blur-xl shadow-2xl shadow-green-200/20"
      >
        <div className="flex items-center justify-center space-x-3 mb-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-green-700">Redaction Complete!</h3>
        </div>
        <p className="text-base text-green-600/90">
          Your document has been successfully processed and is ready for download
        </p>
      </motion.div>

      {/* Error Display */}
      {downloadError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-700">Download Error</h3>
          </div>
          <p className="text-red-600">{downloadError}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-6 justify-center">
        <Button
          onClick={onDownloadPdf}
          disabled={isDownloading}
          className="relative px-8 py-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            position: 'relative', 
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          <Download className="w-5 h-5 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download Redacted PDF'}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="flex items-center space-x-3 px-8 py-4 btn-secondary"
          style={{ 
            position: 'relative', 
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          <Eye className="w-5 h-5" />
          <span>{showAuditLog ? 'Hide' : 'View'} Audit Log</span>
          {auditLogData.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {auditLogData.length}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadAuditLog}
          className="flex items-center space-x-3 px-8 py-4 btn-secondary"
          style={{ 
            position: 'relative', 
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          <Download className="w-5 h-5" />
          <span>Download Log</span>
        </Button>

        <Button
          variant="ghost"
          onClick={onReVerify}
          className="flex items-center space-x-3 px-8 py-4 btn-secondary"
          style={{ 
            position: 'relative', 
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Re-verify Document</span>
        </Button>
      </div>

      {/* Audit Log Viewer */}
      {showAuditLog && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 shadow-2xl"
          style={{ 
            position: 'relative', 
            zIndex: 1001
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Audit Log</h3>
                <p className="text-sm text-gray-400">Detailed processing information</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuditLog(false)}
              className="text-gray-400 hover:text-white"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>

          {/* Loading State */}
          {auditLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-gray-400">Loading audit log...</span>
            </div>
          )}

          {/* Error State */}
          {auditError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm">{auditError}</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {auditSuccess && (
            <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-300 text-sm">{auditSuccess}</p>
              </div>
            </div>
          )}

          {/* Audit Log Entries */}
          {!auditLoading && !auditError && (
            <div className="space-y-3">
              {auditLogData.length > 0 ? (
                auditLogData.map((entry, index) => (
                  <motion.div
                    key={`${entry.action}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-2xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                        <Clock className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {entry.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-300">{entry.details}</p>
                        {entry.entities && entry.entities.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {entry.entities.length} entities detected
                          </p>
                        )}
                        {entry.redacted_entities && entry.redacted_entities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Redacted entities:</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.redacted_entities.map((entity, idx) => (
                                <span key={idx} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                                  {entity.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.redacted_count && (
                          <p className="text-xs text-gray-500">
                            {entry.redacted_count} entities redacted
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {entry.status.toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No audit log entries found</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center space-x-3 text-sm text-gray-500 bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-800/50"
      >
        <Shield className="w-5 h-5 text-cyan-400" />
        <span>Your document is processed securely and never stored on our servers</span>
      </motion.div>
    </div>
  );
}
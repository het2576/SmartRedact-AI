import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, ChevronLeft, FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import UploadSection from '../components/UploadSection';
import VerifyList from '../components/VerifyList';
import ProgressLoader from '../components/ProgressLoader';
import PreviewSection from '../components/PreviewSection';
import DownloadButtons from '../components/DownloadButtons';
import { Button } from '../components/ui/button';
import { useDocumentRedaction } from '../hooks/use-document-redaction';
import { documentRedactionAPI } from '../services/api';

type Stage = 'upload' | 'verify' | 'processing' | 'preview';

interface DashboardProps {
  onBackToHome?: () => void;
}

export default function Dashboard({ onBackToHome }: DashboardProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiHealth, setApiHealth] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Use the custom hook for document redaction workflow
  const {
    isUploading,
    uploadError,
    documentId,
    filename,
    extractedText,
    entities,
    isDetecting,
    detectionError,
    isRedacting,
    redactionError,
    redactedText,
    redactedCount,
    isDownloading,
    downloadError,
    uploadDocument,
    toggleEntity,
    redactDocument,
    downloadDocument,
    resetState,
  } = useDocumentRedaction();

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await documentRedactionAPI.checkHealth();
        setApiHealth(true);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiHealth(false);
      }
    };
    checkHealth();
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setStage('processing');

    try {
      await uploadDocument(file);
      setStage('verify');
    } catch (error) {
      console.error('Upload failed:', error);
      // Stay on processing stage to show error
    }
  };

  const handleToggleEntity = (index: number) => {
    toggleEntity(index);
  };

  const handleProceedToRedact = async () => {
    setStage('processing');

    try {
      await redactDocument();
      console.log('Dashboard: Redaction completed, triggering refresh');
      setRefreshTrigger(prev => {
        const newValue = prev + 1;
        console.log('Dashboard: Refresh trigger updated to:', newValue);
        return newValue;
      });
      setStage('preview');
    } catch (error) {
      console.error('Redaction failed:', error);
      // Stay on processing stage to show error
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadDocument();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadLog = () => {
    // Create and download audit log
    const auditLog = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      filename: filename,
      entities: entities.filter(e => e.selected),
      summary: {
        entitiesRedacted: redactedCount,
        avgConfidence: entities.length > 0 
          ? Math.round(entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length * 100)
          : 0,
      }
    };
    
    const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReVerify = () => {
    setStage('verify');
  };

  const handleBackToUpload = () => {
    setStage('upload');
    setSelectedFile(null);
    resetState();
  };

  const handleBackToVerify = () => {
    setStage('verify');
  };

  // Calculate preview data for display
  const previewData = {
    originalUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
    redactedUrl: selectedFile ? URL.createObjectURL(selectedFile) : '', // Placeholder
    summary: {
      entitiesRedacted: redactedCount,
      avgConfidence: entities.length > 0 
        ? Math.round(entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length * 100)
        : 0,
    },
  };

  return (
    <div className="min-h-screen gradient-bg relative">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
      </div>
      
      <div className="relative z-10 pt-8 pb-8 sm:pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Enhanced Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {stage !== 'upload' && stage !== 'processing' && (
                <Button
                  variant="ghost"
                  onClick={handleBackToUpload}
                  className="flex items-center space-x-2 px-4 py-2 btn-secondary"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>New Document</span>
                </Button>
              )}
            </div>
            
            {/* Stage Indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stage === 'upload' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-xs text-gray-600">Upload</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stage === 'verify' ? 'bg-blue-500' : stage === 'processing' || stage === 'preview' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-600">Verify</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stage === 'processing' ? 'bg-blue-500' : stage === 'preview' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-600">Process</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${stage === 'preview' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-600">Preview</span>
              </div>
            </div>
          </div>

          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-gradient">
                Smart Redact AI
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload your document and let our advanced AI detect and redact sensitive information with precision
            </p>
            
            {/* API Health Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              {apiHealth ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">API Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">API Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="glass-card rounded-3xl shadow-2xl p-8">
          {stage === 'upload' && (
            <UploadSection
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          )}

          {stage === 'verify' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gradient mb-2">Review Detected Information</h2>
                <p className="text-gray-600">
                  Review and select which sensitive information should be redacted from your document
                </p>
              </div>
              
              <VerifyList entities={entities} onToggle={handleToggleEntity} />
              
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleBackToUpload}
                  className="flex items-center space-x-2 px-6 py-3 btn-secondary"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Upload</span>
                </Button>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">
                      {entities.filter(e => e.selected).length}
                    </span> of {entities.length} items selected
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: {entities.length} total, {entities.filter(e => e.selected).length} selected
                    </div>
                  </div>
                  <Button
                    onClick={handleProceedToRedact}
                    disabled={entities.filter(e => e.selected).length === 0}
                    className="px-8 py-3 btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Proceed to Redact
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <div className="space-y-6">
              <ProgressLoader />
              
              {/* Error Display */}
              {(uploadError || detectionError || redactionError) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-300">Processing Error</h3>
                  </div>
                  <p className="text-red-200 mb-4">
                    {uploadError || detectionError || redactionError}
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleBackToUpload}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </Button>
                    {!uploadError && !detectionError && (
                      <Button
                        onClick={handleBackToVerify}
                        variant="outline"
                        className="px-4 py-2 border-red-400 text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Back to Review
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {stage === 'preview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 pb-32"
              style={{ position: 'relative', zIndex: 10 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gradient mb-2">Redaction Complete</h2>
                <p className="text-gray-600">
                  Your document has been successfully processed. Review the results and download your redacted document.
                </p>
              </div>
              
              <PreviewSection
                documentId={documentId}
                summary={{
                  entitiesRedacted: redactedCount,
                  avgConfidence: entities.length > 0 ? Math.round(entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length * 100) : 0
                }}
                refreshTrigger={refreshTrigger}
              />
              
              
              <DownloadButtons
                documentId={documentId}
                onDownloadPdf={handleDownloadPdf}
                onReVerify={handleReVerify}
                onBackToReview={handleBackToVerify}
                isDownloading={isDownloading}
                downloadError={downloadError}
              />
            </motion.div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

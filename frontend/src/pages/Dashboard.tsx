import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import UploadSection from '../components/UploadSection';
import VerifyList from '../components/VerifyList';
import ProgressLoader from '../components/ProgressLoader';
import PreviewSection from '../components/PreviewSection';
import DownloadButtons from '../components/DownloadButtons';
import { Button } from '../components/ui/button';
import { Docket } from '../components/ui/docket';
import { useDocumentRedaction } from '../hooks/use-document-redaction';
import { documentRedactionAPI } from '../services/api';

type Stage = 'upload' | 'verify' | 'processing' | 'preview';

const STAGE_INDEX: Record<Stage, number> = {
  upload: 0,
  verify: 1,
  processing: 2,
  preview: 3,
};

const DOCKET_STEPS = [
  { label: 'Upload' },
  { label: 'Review' },
  { label: 'Redact' },
  { label: 'Download' },
];

export default function Dashboard() {
  const [stage, setStage] = useState<Stage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiHealth, setApiHealth] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const {
    uploadError,
    documentId,
    entities,
    detectionError,
    redactionError,
    redactedCount,
    isDownloading,
    downloadError,
    uploadDocument,
    toggleEntity,
    addManualEntity,
    redactDocument,
    downloadDocument,
    resetState,
  } = useDocumentRedaction();

  useEffect(() => {
    documentRedactionAPI
      .checkHealth()
      .then(() => setApiHealth(true))
      .catch(() => setApiHealth(false));
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setStage('processing');
    try {
      await uploadDocument(file);
      setStage('verify');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleProceedToRedact = async () => {
    setStage('processing');
    try {
      await redactDocument();
      setRefreshTrigger((prev) => prev + 1);
      setStage('preview');
    } catch (error) {
      console.error('Redaction failed:', error);
    }
  };

  const handleBackToUpload = () => {
    setStage('upload');
    setSelectedFile(null);
    resetState();
  };

  const selectedCount = entities.filter((e) => e.selected).length;
  const avgConfidence =
    entities.length > 0
      ? Math.round((entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {stage !== 'upload' && stage !== 'processing' && (
            <Button variant="ghost" size="sm" onClick={handleBackToUpload}>
              <ArrowLeft className="h-4 w-4" />
              New document
            </Button>
          )}
        </div>

        <span className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.08em] text-ink-faint">
          <span className={`h-1.5 w-1.5 rounded-full ${apiHealth ? 'bg-confirm' : 'bg-alert'}`} />
          {apiHealth ? 'Detection engine online' : 'Detection engine unreachable'}
        </span>
      </div>

      <Docket steps={DOCKET_STEPS} current={STAGE_INDEX[stage]} className="mb-10" />

      <div className="border border-line bg-paper-raised p-6 sm:p-10">
        {stage === 'upload' && <UploadSection onFileSelect={handleFileSelect} selectedFile={selectedFile} />}

        {stage === 'verify' && (
          <div className="space-y-8">
            <VerifyList entities={entities} onToggle={toggleEntity} onAddManual={addManualEntity} />
            <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
              <Button variant="outline" onClick={handleBackToUpload}>
                <ArrowLeft className="h-4 w-4" />
                Back to upload
              </Button>
              <Button variant="flag" size="lg" onClick={handleProceedToRedact} disabled={selectedCount === 0}>
                Redact {selectedCount} item{selectedCount === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        )}

        {stage === 'processing' && (
          <div className="space-y-6">
            <ProgressLoader
              label={
                stage === 'processing' && documentId
                  ? 'Removing the selected text from the file'
                  : 'Reading the document and flagging what it finds'
              }
            />
            {(uploadError || detectionError || redactionError) && (
              <div className="flex items-start gap-3 border border-alert bg-alert-soft/40 p-6">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold text-alert">Something went wrong</p>
                  <p className="mt-1 font-serif text-sm text-ink-soft">
                    {uploadError || detectionError || redactionError}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm" onClick={handleBackToUpload}>
                      Try again
                    </Button>
                    {!uploadError && !detectionError && (
                      <Button size="sm" variant="outline" onClick={() => setStage('verify')}>
                        Back to review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === 'preview' && (
          <div className="space-y-8">
            <PreviewSection
              documentId={documentId ?? undefined}
              summary={{ entitiesRedacted: redactedCount, avgConfidence }}
              refreshTrigger={refreshTrigger}
            />
            <DownloadButtons
              documentId={documentId ?? undefined}
              onDownloadPdf={downloadDocument}
              onReVerify={() => setStage('verify')}
              onBackToReview={() => setStage('verify')}
              isDownloading={isDownloading}
              downloadError={downloadError}
            />
          </div>
        )}
      </div>
    </div>
  );
}

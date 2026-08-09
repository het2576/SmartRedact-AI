import { useState, useEffect } from 'react';
import { documentRedactionAPI, DocumentPreviewResponse, RedactedPreviewResponse } from '@/services/api';
import { AlertCircle, Download, FileImage, X } from 'lucide-react';
import { Panel } from './ui/panel';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PreviewSectionProps {
  documentId?: string;
  summary: {
    entitiesRedacted: number;
    avgConfidence: number;
  };
  refreshTrigger?: number;
}

export default function PreviewSection({ documentId, summary, refreshTrigger }: PreviewSectionProps) {
  const [documentPreview, setDocumentPreview] = useState<DocumentPreviewResponse | null>(null);
  const [redactedPreview, setRedactedPreview] = useState<RedactedPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    loadDocumentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, refreshTrigger]);

  const loadDocumentData = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const preview = await documentRedactionAPI.getDocumentPreview(documentId);
      setDocumentPreview(preview);
      if (preview.status === 'redacted') {
        try {
          const redacted = await documentRedactionAPI.getRedactedPreview(documentId);
          setRedactedPreview(redacted);
        } catch {
          // redacted preview not ready yet — original preview still renders
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId) return;
    try {
      const preview = redactedPreview || documentPreview;
      if (preview) await documentRedactionAPI.downloadAndSaveDocument(documentId, preview.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleViewDocument = async (isRedacted: boolean) => {
    if (!documentId) return;
    try {
      setLoading(true);
      setError(null);
      const url = await documentRedactionAPI.getDocumentUrl(documentId, isRedacted);
      setPdfUrl(url);
      setShowViewer(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const closeViewer = () => {
    setShowViewer(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const isImage = (documentPreview?.filename ?? '').toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

  if (loading && !documentPreview) {
    return (
      <div className="flex h-48 items-center justify-center border border-line bg-paper-raised">
        <span className="font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
          Loading exhibit…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 border border-alert bg-alert-soft/40 p-6">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
        <div>
          <p className="font-display text-sm font-semibold text-alert">Couldn't load this document</p>
          <p className="mt-1 font-serif text-sm text-ink-soft">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 divide-x divide-line border border-line bg-paper-raised">
        <div className="p-6 text-center">
          <p className="font-display text-3xl font-semibold text-ink">
            {documentPreview?.entity_count ?? 0}
          </p>
          <p className="mt-1 font-display text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            Entities detected
          </p>
        </div>
        <div className="p-6 text-center">
          <p className="font-display text-3xl font-semibold text-flag">{summary.entitiesRedacted}</p>
          <p className="mt-1 font-display text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            Entities redacted
          </p>
        </div>
        <div className="p-6 text-center">
          <p className="font-display text-3xl font-semibold text-confirm">{summary.avgConfidence}%</p>
          <p className="mt-1 font-display text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            Average confidence
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Panel tab="EXHIBIT A — ORIGINAL" className="flex h-72 flex-col p-5">
          {documentPreview ? (
            <>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="truncate font-display text-xs font-medium text-ink">
                  {documentPreview.filename}
                </span>
                <Badge tone="muted">{documentPreview.entity_count} found</Badge>
              </div>
              <p className="mt-3 flex-1 overflow-y-auto font-serif text-sm leading-relaxed text-ink-soft">
                {documentPreview.extracted_text_preview}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => handleViewDocument(false)}
              >
                <FileImage className="h-3.5 w-3.5" />
                View original
              </Button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
              No document loaded
            </div>
          )}
        </Panel>

        <Panel tab="EXHIBIT B — REDACTED" className="flex h-72 flex-col p-5">
          {redactedPreview ? (
            <>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="truncate font-display text-xs font-medium text-ink">
                  {redactedPreview.redacted_filename}
                </span>
                <Badge tone="flag">{redactedPreview.redacted_count} redacted</Badge>
              </div>
              <p className="mt-3 flex-1 overflow-y-auto font-serif text-sm leading-relaxed text-ink-soft">
                {redactedPreview.redacted_text_preview}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewDocument(true)}
                >
                  <FileImage className="h-3.5 w-3.5" />
                  View redacted
                </Button>
                <Button size="sm" className="flex-1" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </>
          ) : documentPreview?.status === 'redacted' ? (
            <div className="flex flex-1 items-center justify-center font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
              Loading redacted exhibit…
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
              Not redacted yet
            </div>
          )}
        </Panel>
      </div>

      {showViewer && pdfUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={closeViewer}
        >
          <div
            className="flex h-[90vh] w-full max-w-6xl flex-col border border-ink bg-paper-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="font-display text-sm font-semibold text-ink">Document viewer</span>
              <button onClick={closeViewer} className="text-ink-faint hover:text-ink" aria-label="Close viewer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              {isImage ? (
                <img src={pdfUrl} alt="Document preview" className="h-full w-full object-contain" />
              ) : (
                <iframe src={pdfUrl} className="h-full w-full border border-line" title="Document viewer" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Download, FileText, RotateCcw, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { documentRedactionAPI, AuditLogEntry } from '@/services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
  downloadError = null,
}: DownloadButtonsProps) {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogData, setAuditLogData] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && showAuditLog) loadAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, showAuditLog]);

  const loadAuditLog = async () => {
    if (!documentId) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await documentRedactionAPI.getAuditLog(documentId);
      setAuditLogData(response.audit_entries);
    } catch (err) {
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
      setAuditError(null);
      setAuditSuccess(`Downloaded ${filename}`);
      setTimeout(() => setAuditSuccess(null), 3000);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Failed to download audit log');
      setAuditSuccess(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {onBackToReview && (
        <button
          onClick={onBackToReview}
          className="flex items-center gap-2 font-display text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to review
        </button>
      )}

      <div className="flex items-center gap-4 border border-ink bg-paper-raised p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink bg-ink">
          <CheckCircle2 className="h-5 w-5 text-paper-raised" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Redaction complete</h3>
          <p className="font-serif text-[15px] text-ink-soft">
            The file is ready. Download it below, or file the audit log alongside it.
          </p>
        </div>
      </div>

      {downloadError && (
        <div className="flex items-start gap-3 border border-alert bg-alert-soft/40 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
          <div>
            <p className="font-display text-sm font-semibold text-alert">Download failed</p>
            <p className="mt-1 font-serif text-sm text-ink-soft">{downloadError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="flag" onClick={onDownloadPdf} disabled={isDownloading}>
          <Download className="h-4 w-4" />
          {isDownloading ? 'Downloading…' : 'Download redacted file'}
        </Button>
        <Button variant="outline" onClick={() => setShowAuditLog((v) => !v)}>
          <FileText className="h-4 w-4" />
          {showAuditLog ? 'Hide audit log' : 'View audit log'}
          {showAuditLog ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="outline" onClick={handleDownloadAuditLog}>
          <Download className="h-4 w-4" />
          Download log
        </Button>
        <Button variant="ghost" onClick={onReVerify}>
          <RotateCcw className="h-4 w-4" />
          Re-verify document
        </Button>
      </div>

      {auditSuccess && (
        <p className="font-display text-[11px] uppercase tracking-[0.08em] text-confirm">{auditSuccess}</p>
      )}

      {showAuditLog && (
        <div className="border border-line bg-paper-raised">
          <div className="border-b border-line p-5">
            <h4 className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-ink">
              Docket log
            </h4>
            <p className="mt-1 font-serif text-sm text-ink-soft">Every action taken on this document, in order.</p>
          </div>

          {auditLoading && (
            <p className="p-6 font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
              Loading entries…
            </p>
          )}

          {auditError && (
            <p className="p-6 font-display text-xs uppercase tracking-[0.08em] text-alert">{auditError}</p>
          )}

          {!auditLoading && !auditError && (
            <ul className="divide-y divide-line">
              {auditLogData.length > 0 ? (
                auditLogData.map((entry, index) => (
                  <li key={`${entry.action}-${index}`} className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <p className="font-display text-sm font-medium text-ink">
                        {entry.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="mt-1 font-display text-[11px] uppercase tracking-[0.05em] text-ink-faint">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-2 font-serif text-sm text-ink-soft">{entry.details}</p>
                    </div>
                    <Badge tone={entry.status === 'completed' ? 'confirm' : 'flag'}>{entry.status}</Badge>
                  </li>
                ))
              ) : (
                <li className="p-6 font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
                  No entries yet
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      <p className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.06em] text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-flag" />
        Processed locally · deleted automatically once the retention window ends
      </p>
    </div>
  );
}

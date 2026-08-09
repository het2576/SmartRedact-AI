import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { documentRedactionAPI, DocumentSummary } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PreviewSection from '@/components/PreviewSection';

function formatWhen(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatExpiry(iso: string): { label: string; expired: boolean; soon: boolean } {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return { label: 'expiring now', expired: true, soon: true };
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return { label: `expires in ${mins}m`, expired: false, soon: true };
  const hours = Math.round(mins / 60);
  return { label: `expires in ${hours}h`, expired: false, soon: hours < 1 };
}

export default function History() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSummary, setExpandedSummary] = useState<{ entitiesRedacted: number; avgConfidence: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentRedactionAPI.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = async (doc: DocumentSummary) => {
    if (expandedId === doc.document_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(doc.document_id);
    try {
      const preview = await documentRedactionAPI.getDocumentPreview(doc.document_id);
      const avgConfidence =
        preview.entities.length > 0
          ? Math.round(
              (preview.entities.reduce((sum, e) => sum + e.confidence, 0) / preview.entities.length) * 100,
            )
          : 0;
      setExpandedSummary({ entitiesRedacted: doc.redacted_count, avgConfidence });
    } catch {
      setExpandedSummary({ entitiesRedacted: doc.redacted_count, avgConfidence: 0 });
    }
  };

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await documentRedactionAPI.deleteDocument(documentId);
      setDocuments((docs) => docs.filter((d) => d.document_id !== documentId));
      if (expandedId === documentId) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
        Docket 03
      </span>
      <h1 className="mt-3 font-display text-display-2 font-semibold text-ink">Document history</h1>
      <p className="mt-3 max-w-lg font-serif text-lg leading-relaxed text-ink-soft">
        Every document currently held by this server, until its retention window ends it for you.
      </p>

      <div className="mt-10">
        {loading && (
          <p className="border border-line bg-paper-raised p-8 text-center font-display text-xs uppercase tracking-[0.08em] text-ink-faint">
            Loading history…
          </p>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 border border-alert bg-alert-soft/40 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
            <div>
              <p className="font-display text-sm font-semibold text-alert">Couldn't load history</p>
              <p className="mt-1 font-serif text-sm text-ink-soft">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="border border-dashed border-line bg-paper-raised p-12 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-ink">
              Nothing on file
            </p>
            <p className="mt-2 font-serif text-[15px] text-ink-soft">
              Redact a document and it'll show up here until it expires.
            </p>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <ul className="divide-y divide-line border border-line">
            {documents.map((doc) => {
              const expiry = formatExpiry(doc.expires_at);
              const isExpanded = expandedId === doc.document_id;
              return (
                <li key={doc.document_id} className="bg-paper-raised">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <button
                      onClick={() => toggleExpand(doc)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink text-ink-faint">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-medium text-ink">{doc.filename}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge tone={doc.status === 'redacted' ? 'confirm' : 'flag'}>{doc.status}</Badge>
                          <span className="font-display text-[10px] uppercase tracking-[0.06em] text-ink-faint">
                            {doc.entity_count} found · {doc.redacted_count} redacted
                          </span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-display text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                          {formatWhen(doc.upload_time)}
                        </p>
                        <p
                          className={`mt-1 font-display text-[11px] uppercase tracking-[0.06em] ${expiry.soon ? 'text-alert' : 'text-ink-faint'}`}
                        >
                          {expiry.label}
                        </p>
                      </div>
                    </button>

                    {confirmDeleteId === doc.document_id ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.document_id)} disabled={deletingId === doc.document_id}>
                          {deletingId === doc.document_id ? 'Shredding…' : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(doc.document_id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-faint hover:text-alert"
                        aria-label={`Delete ${doc.filename}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-line px-5 py-6">
                      <PreviewSection
                        documentId={doc.document_id}
                        summary={expandedSummary ?? { entitiesRedacted: doc.redacted_count, avgConfidence: 0 }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { AddManualEntityResult } from '@/hooks/use-document-redaction';

interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
  source: string;
  selected?: boolean;
}

interface VerifyListProps {
  entities: Entity[];
  onToggle: (index: number) => void;
  onAddManual: (searchText: string) => AddManualEntityResult;
}

function confidenceTone(confidence: number): 'confirm' | 'flag' | 'alert' {
  if (confidence >= 0.8) return 'confirm';
  if (confidence >= 0.6) return 'flag';
  return 'alert';
}

function ManualAddForm({ onAddManual }: { onAddManual: (searchText: string) => AddManualEntityResult }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'confirm' | 'alert'; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;

    const result = onAddManual(text);
    if (result.status === 'added') {
      setFeedback({
        tone: 'confirm',
        message: `Added ${result.count} match${result.count === 1 ? '' : 'es'} of "${text}".`,
      });
      setValue('');
    } else if (result.status === 'already-covered') {
      setFeedback({ tone: 'confirm', message: `"${text}" is already flagged above.` });
      setValue('');
    } else {
      setFeedback({
        tone: 'alert',
        message: `Couldn't find "${text}" in this document's extracted text — check the spelling matches exactly.`,
      });
    }
  };

  return (
    <div className="border border-dashed border-line bg-paper p-5">
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
        Missed something?
      </p>
      <p className="mt-1 font-serif text-sm text-ink-soft">
        No detector catches everything. Type or paste the exact text and it'll be added for redaction.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback(null);
          }}
          placeholder="e.g. a name, ID, or phrase from the document"
          className="min-w-0 flex-1 border border-line bg-paper-raised px-3 py-2 font-serif text-sm text-ink placeholder:text-ink-faint focus-visible:border-ink"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!value.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Add to redact
        </Button>
      </form>
      {feedback && (
        <p
          className={cn(
            'mt-3 font-display text-[11px] uppercase tracking-[0.06em]',
            feedback.tone === 'confirm' ? 'text-confirm' : 'text-alert',
          )}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

export default function VerifyList({ entities, onToggle, onAddManual }: VerifyListProps) {
  const selectedCount = entities.filter((e) => e.selected).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
            {entities.length} item{entities.length === 1 ? '' : 's'} flagged for review
          </h3>
          <p className="mt-1 font-serif text-[15px] text-ink-soft">
            Click a row to keep it visible instead of redacting it.
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 sm:block sm:text-right">
          <p className="font-display text-2xl font-semibold text-ink">{selectedCount}</p>
          <p className="font-display text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            will be redacted
          </p>
        </div>
      </div>

      <ul className="divide-y divide-line border border-line">
        {entities.map((entity, index) => {
          const willRedact = entity.selected ?? true;
          return (
            <li key={`${entity.start}-${entity.end}-${entity.text}`}>
              <button
                onClick={() => onToggle(index)}
                className={cn(
                  'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-paper',
                  willRedact ? 'bg-paper-raised' : 'bg-paper-raised/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border',
                    willRedact ? 'border-ink bg-ink' : 'border-line bg-transparent',
                  )}
                  aria-hidden="true"
                >
                  {willRedact ? (
                    <EyeOff className="h-4 w-4 text-paper-raised" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="ink">{entity.type}</Badge>
                    {entity.source === 'manual' ? (
                      <Badge tone="confirm">added by you</Badge>
                    ) : (
                      <>
                        <Badge tone={confidenceTone(entity.confidence)}>
                          {(entity.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge tone="muted">{entity.source}</Badge>
                      </>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-2 truncate font-serif text-base',
                      willRedact ? 'text-ink' : 'text-ink-soft line-through decoration-1',
                    )}
                  >
                    {entity.text}
                  </p>
                </div>

                <span className="mt-1 shrink-0 font-display text-[10px] uppercase tracking-[0.06em] text-ink-faint">
                  {willRedact ? 'Redact' : 'Keep'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ManualAddForm onAddManual={onAddManual} />
    </div>
  );
}

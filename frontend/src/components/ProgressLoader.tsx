const LINES = [
  { width: '92%', bar: '38%', delay: '0s' },
  { width: '78%', bar: '55%', delay: '0.3s' },
  { width: '85%', bar: '20%', delay: '0.6s' },
  { width: '64%', bar: '70%', delay: '0.9s' },
  { width: '88%', bar: '45%', delay: '1.2s' },
];

interface ProgressLoaderProps {
  label?: string;
}

export default function ProgressLoader({ label = 'Reading the document and flagging what it finds' }: ProgressLoaderProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <div className="w-full max-w-md border border-line bg-paper-raised p-7">
        <div className="space-y-3.5">
          {LINES.map((line, i) => (
            <div key={i} className="relative h-3" style={{ width: line.width }}>
              <div className="absolute inset-0 bg-line" />
              <div
                className="absolute inset-y-0 left-0 origin-left animate-redact-loop bg-ink"
                style={{ width: line.bar, animationDelay: line.delay }}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-1 font-display text-[13px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
        <span className="inline-block h-[1em] w-[0.55em] translate-y-px animate-blink bg-flag" />
      </p>
    </div>
  );
}

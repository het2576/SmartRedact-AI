export default function Footer() {
  return (
    <footer className="border-t border-ink/15 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 font-display text-[10px] uppercase tracking-[0.06em] text-ink-faint sm:flex-row sm:items-center sm:px-8">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-flag" />
          Nothing is retained past the retention window
        </span>
        <span>SmartRedact — document redaction, kept honest</span>
      </div>
    </footer>
  );
}

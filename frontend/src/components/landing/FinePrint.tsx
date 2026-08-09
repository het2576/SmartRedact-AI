const NOTES = [
  "Detection runs on Microsoft Presidio and spaCy, both open-source, both executing on this server — no document text is sent to a third-party API to find what's sensitive.",
  "Redaction uses PyMuPDF's secure redaction path, which deletes the underlying text and image data. A blacked-out box drawn on top would still leave the original text selectable underneath; this doesn't.",
  "Uploaded files, extracted text, and detected entities are held only for a fixed retention window, then deleted automatically. Nothing is kept indefinitely.",
  "Filenames are sanitized against path traversal, and both file type and size are validated before anything is written to disk.",
];

export default function FinePrint() {
  return (
    <section className="bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          The fine print
        </span>
        <h2 className="mt-3 max-w-lg font-display text-display-2 font-semibold text-ink">
          Read it before you trust it with something real.
        </h2>

        <ol className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {NOTES.map((note, i) => (
            <li key={note} className="flex gap-4">
              <span className="mt-1 shrink-0 font-display text-xs font-semibold text-ink-faint">
                {i + 1}
              </span>
              <p className="font-serif text-[15px] leading-relaxed text-ink-soft">{note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

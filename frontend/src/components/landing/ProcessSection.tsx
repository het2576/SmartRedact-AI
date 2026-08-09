const STEPS = [
  {
    n: "01",
    label: "Upload",
    body: "Drop in a PDF, Word document, or a photo of a printed page. Scanned pages run through OCR automatically.",
  },
  {
    n: "02",
    label: "Review",
    body: "Every detected name, ID, and contact detail is listed with its confidence score. Uncheck anything that should stay.",
  },
  {
    n: "03",
    label: "Redact",
    body: "Selected text and image regions are stripped from the underlying file — genuinely removed, not painted over.",
  },
  {
    n: "04",
    label: "Download",
    body: "Get the clean file back, plus an audit log of exactly what was found and what was taken out.",
  },
];

export default function ProcessSection() {
  return (
    <section className="border-b border-ink/15 bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          The docket
        </span>
        <h2 className="mt-3 max-w-lg font-display text-display-2 font-semibold text-ink">
          Four steps, in this order, every time.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col bg-paper-raised p-6">
              <span className="font-display text-3xl font-semibold text-ink-faint">{step.n}</span>
              <span className="mt-3 font-display text-sm font-semibold uppercase tracking-[0.06em] text-ink">
                {step.label}
              </span>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

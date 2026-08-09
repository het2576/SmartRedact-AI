import { Redacted } from "@/components/ui/redacted";

const ENTITIES: { type: string; example: string }[] = [
  { type: "Full name", example: "Priya Anand Kulkarni" },
  { type: "SSN", example: "417-63-0298" },
  { type: "Email address", example: "priya.k@northbridge.org" },
  { type: "Phone number", example: "(414) 555-0136" },
  { type: "Street address", example: "88 Colby Terrace, Apt 3B" },
  { type: "Date of birth", example: "11/02/1991" },
  { type: "Credit card", example: "4539 7712 0043 1188" },
  { type: "Account number", example: "AC-2201-887714" },
  { type: "Medical record no.", example: "MRN 0043-9921" },
  { type: "IP address", example: "203.0.113.42" },
];

export default function CatchGrid() {
  return (
    <section id="catch" className="border-b border-ink/15">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          What it catches
        </span>
        <h2 className="mt-3 max-w-xl font-display text-display-2 font-semibold text-ink">
          Ten kinds of detail, gone before anyone sees them.
        </h2>
        <p className="mt-4 max-w-lg font-serif text-lg leading-relaxed text-ink-soft">
          A sample of the identifiers SmartRedact is trained to find. Hover a line to see what's
          underneath — that's the same bar your reviewers will see and clear by hand.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {ENTITIES.map((entity) => (
            <div key={entity.type} className="flex flex-col gap-2.5 bg-paper-raised p-5">
              <span className="font-display text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
                {entity.type}
              </span>
              <span className="font-serif text-[15px] text-ink">
                <Redacted tone="flag">
                  {entity.example}
                </Redacted>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

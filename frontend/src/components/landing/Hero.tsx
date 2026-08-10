import { Redacted } from "@/components/ui/redacted";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  onGetStarted: () => void;
}

const RECORD_LINES: { label: string; value: React.ReactNode }[] = [
  { label: "Patient", value: <Redacted delay={700}>John Alden</Redacted> },
  { label: "DOB", value: <Redacted delay={900}>03 / 14 / 1988</Redacted> },
  { label: "SSN", value: <Redacted delay={1100}>531-08-2274</Redacted> },
  {
    label: "Address",
    value: <Redacted delay={1300}>214 Larkspur Ave, Unit 4, Madison WI</Redacted>,
  },
  { label: "Contact", value: <Redacted delay={1500}>j.alden88@fastmail.com</Redacted> },
];

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="border-b border-ink/15">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-flag" />
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
              Runs locally on Presidio + spaCy — nothing leaves this machine
            </span>
          </div>

          <h1 className="mt-6 font-display text-display-1 font-semibold text-ink">
            Blacken what
            <br />
            doesn't belong in the open.
          </h1>

          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-ink-soft">
            Upload a PDF, DOCX, or scanned image. Blacken finds every name, number, and
            address hiding in it, then removes it from the file itself — not a black box drawn
            over the text.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="flag" onClick={onGetStarted}>
              Redact a document
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => document.getElementById("catch")?.scrollIntoView({ behavior: "smooth" })}
            >
              See what it catches
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <Panel tab="EXHIBIT — INTAKE FORM.PDF" className="w-full p-6 shadow-lift sm:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
              <span className="font-display text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                Page 1 of 1 · hover a line
              </span>
              <Badge tone="flag">5 found</Badge>
            </div>
            <dl className="space-y-4">
              {RECORD_LINES.map((row) => (
                <div key={row.label} className="flex items-baseline gap-4">
                  <dt className="w-20 shrink-0 font-display text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                    {row.label}
                  </dt>
                  <dd className="font-serif text-base text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </section>
  );
}

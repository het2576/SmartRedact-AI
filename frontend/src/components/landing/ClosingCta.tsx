import { Button } from "@/components/ui/button";

interface ClosingCtaProps {
  onGetStarted: () => void;
}

export default function ClosingCta({ onGetStarted }: ClosingCtaProps) {
  return (
    <section className="border-t border-ink/15 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:flex-row sm:items-center sm:px-8">
        <div>
          <h2 className="font-display text-display-2 font-semibold text-paper-raised">
            Got a document sitting open right now?
          </h2>
          <p className="mt-3 max-w-md font-serif text-lg leading-relaxed text-paper-raised/70">
            Upload it. See what SmartRedact finds before you decide what to do with it.
          </p>
        </div>
        <Button size="lg" variant="flag" onClick={onGetStarted} className="shrink-0">
          Redact a document
        </Button>
      </div>
    </section>
  );
}

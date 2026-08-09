import { cn } from "@/lib/utils";

export interface DocketStep {
  label: string;
  detail?: string;
}

interface DocketProps {
  steps: DocketStep[];
  /** index of the current step, -1 if none active yet */
  current: number;
  className?: string;
}

/**
 * The four stages of a redaction job, numbered because the process really is
 * sequential — you cannot verify before you upload, or download before you redact.
 */
export function Docket({ steps, current, className }: DocketProps) {
  return (
    <ol className={cn("flex items-stretch", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "pending";
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center border font-display text-[10px] font-semibold",
                  state === "done" && "border-ink bg-ink text-paper-raised",
                  state === "active" && "border-flag bg-flag text-paper-raised",
                  state === "pending" && "border-line text-ink-faint",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "font-display text-[11px] font-medium uppercase tracking-[0.08em] whitespace-nowrap",
                  state === "pending" ? "text-ink-faint" : "text-ink",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-px flex-1 min-w-4",
                  i < current ? "bg-ink" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

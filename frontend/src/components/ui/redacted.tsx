import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RedactedProps {
  children: React.ReactNode;
  /** ms before the bar auto-lifts once on mount, for a staggered reveal sequence. Omit to require a hover/tap instead. */
  delay?: number;
  className?: string;
  /** color of the bar itself */
  tone?: "ink" | "flag";
}

/**
 * A word or phrase hidden under a solid bar, exactly like a marker stroke on
 * a physical document. Optionally lifts once on mount after `delay`, then
 * always toggles on hover/focus so the visitor can put the bar back down.
 */
export function Redacted({ children, delay, className, tone = "ink" }: RedactedProps) {
  const [revealed, setRevealed] = useState(false);
  const [everRevealed, setEverRevealed] = useState(false);

  useEffect(() => {
    if (delay === undefined) return;
    const t = setTimeout(() => {
      setRevealed(true);
      setEverRevealed(true);
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span
      className={cn("relative inline-block cursor-pointer select-none align-baseline", className)}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => everRevealed && setRevealed(false)}
      onClick={() => setRevealed((r) => !r)}
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={revealed ? "Hide text" : "Reveal text"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed((r) => !r);
        }
      }}
    >
      <span aria-hidden={!revealed}>{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-[6%] inset-x-[-3%] origin-right transition-transform duration-500 ease-stamp",
          tone === "ink" ? "bg-ink" : "bg-flag",
          revealed ? "scale-x-0" : "scale-x-100",
        )}
      />
    </span>
  );
}

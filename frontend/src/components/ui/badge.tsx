import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "ink" | "flag" | "confirm" | "alert" | "muted";
  className?: string;
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  ink: "border-ink text-ink",
  flag: "border-flag text-flag bg-flag-soft/60",
  confirm: "border-confirm text-confirm bg-confirm-soft/60",
  alert: "border-alert text-alert bg-alert-soft/60",
  muted: "border-line text-ink-soft",
};

export function Badge({ children, tone = "muted", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-display text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  /** Folder-tab label printed above the panel's top-left corner, e.g. "EXHIBIT A" */
  tab?: string;
}

export function Panel({ children, className, tab }: PanelProps) {
  return (
    <div className={cn("relative", tab && "mt-4")}>
      {tab && (
        <div className="absolute -top-4 left-5 z-10 border border-b-0 border-line bg-paper-raised px-3 py-1 font-display text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          {tab}
        </div>
      )}
      <div className={cn("border border-line bg-paper-raised", className)}>{children}</div>
    </div>
  );
}

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Page = "landing" | "dashboard" | "history" | "settings";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: "Home", page: "landing" },
  { label: "Redact", page: "dashboard" },
  { label: "History", page: "history" },
  { label: "Settings", page: "settings" },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => go("landing")}
          className="flex items-center gap-2.5 font-display text-sm font-semibold tracking-[0.02em] text-ink"
        >
          <span className="flex h-6 w-6 items-center justify-center bg-ink">
            <span className="h-[3px] w-3 bg-paper-raised" />
          </span>
          BLACKEN
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => go(item.page)}
                className={cn(
                  "relative px-4 py-2 font-display text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-px h-[2px] bg-flag" />}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => go("dashboard")}
          className="hidden border border-ink px-4 py-2 font-display text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-paper-raised sm:inline-flex"
        >
          New document
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center border border-ink text-ink sm:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-ink/15 bg-paper-raised px-5 py-3 sm:hidden">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => go(item.page)}
                className={cn(
                  "flex w-full items-center justify-between border-b border-line py-3 font-display text-[11px] font-medium uppercase tracking-[0.08em] transition-colors last:border-b-0",
                  active ? "text-ink" : "text-ink-soft",
                )}
              >
                {item.label}
                {active && <span className="h-1.5 w-1.5 rounded-full bg-flag" />}
              </button>
            );
          })}
          <button
            onClick={() => go("dashboard")}
            className="mt-3 w-full border border-ink px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-paper-raised"
          >
            New document
          </button>
        </nav>
      )}
    </header>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, ChevronRight, Users, X } from "lucide-react";

/* ═══════════════════════════════════════════════
   CommandPalette — ⌘K / Ctrl+K
   Glass overlay with search + quick actions.
   ═══════════════════════════════════════════════ */

interface CommandPaletteProps {
  /** External control — if omitted, component manages own state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Action {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onSelect?: () => void;
}

const DEFAULT_ACTIONS: Action[] = [
  { id: "create-task", icon: Plus, label: "Create Task", shortcut: "C" },
  { id: "jump-project", icon: ChevronRight, label: "Jump to Project", shortcut: "P" },
  { id: "assign-task", icon: Users, label: "Assign Task", shortcut: "A" },
];

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      onOpenChange?.(v);
      setInternalOpen(v);
    },
    [onOpenChange]
  );

  /* ── Keyboard: open / close ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  /* ── Focus input when opened ── */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  /* ── Filter actions ── */
  const filtered = query
    ? DEFAULT_ACTIONS.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      )
    : DEFAULT_ACTIONS;

  /* ── Keyboard navigation inside palette ── */
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].onSelect?.();
      setOpen(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh]"
      style={{ background: "var(--overlay-dim)", zIndex: 100 }}
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-overlay rounded-xl w-full max-w-lg overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--glass-border)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tasks, projects, people..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[11px] font-mono shrink-0"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-3)",
              border: "1px solid var(--border)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results / actions */}
        <div className="p-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-center" style={{ color: "var(--text-3)" }}>
              No results found
            </p>
          ) : (
            <>
              <p
                className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-3)" }}
              >
                Actions
              </p>
              {filtered.map((action, i) => {
                const Icon = action.icon;
                const isActive = i === selectedIndex;
                return (
                  <button
                    key={action.id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-100"
                    style={{
                      color: "var(--text)",
                      background: isActive ? "var(--surface-2)" : "transparent",
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => {
                      action.onSelect?.();
                      setOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                    <span className="text-sm flex-1 text-left">{action.label}</span>
                    {action.shortcut && (
                      <kbd
                        className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

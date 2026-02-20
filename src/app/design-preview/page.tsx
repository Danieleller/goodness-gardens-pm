"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Check,
  AlertTriangle,
  Clock,
  Ban,
  ChevronRight,
  Search,
  Plus,
  X,
  Sparkles,
  Command,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   /design-preview — Regression check page
   Renders component states in one view.
   ═══════════════════════════════════════════════════ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2
        className="text-base font-semibold mb-4 pb-2"
        style={{ color: "var(--text)", borderBottom: "1px solid var(--border)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── Buttons ─── */
function ButtonShowcase() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Primary */}
      <button
        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-smooth"
        style={{ background: "var(--accent)" }}
        onMouseOver={(e) =>
          (e.currentTarget.style.background = "var(--accent-hover)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.background = "var(--accent)")
        }
      >
        Primary
      </button>
      {/* Secondary */}
      <button
        className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth"
        style={{
          background: "var(--surface-2)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        }}
      >
        Secondary
      </button>
      {/* Ghost */}
      <button
        className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth"
        style={{ color: "var(--text-2)", background: "transparent" }}
      >
        Ghost
      </button>
      {/* Disabled */}
      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
        style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
      >
        Disabled
      </button>
    </div>
  );
}

/* ─── Chips / Status Pills ─── */
function ChipShowcase() {
  const statuses = [
    { label: "Not Started", color: "var(--text-3)", bg: "var(--surface-2)" },
    { label: "In Progress", color: "var(--progress)", bg: "rgba(37,99,235,0.1)" },
    { label: "Blocked", color: "var(--blocked)", bg: "rgba(249,115,22,0.1)" },
    { label: "Done", color: "var(--done)", bg: "rgba(22,163,74,0.1)" },
    { label: "Overdue", color: "var(--overdue)", bg: "rgba(220,38,38,0.1)" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map((s) => (
        <span
          key={s.label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ color: s.color, background: s.bg }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: s.color }}
          />
          {s.label}
        </span>
      ))}
      {/* Filter chip active/inactive */}
      <span
        className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-smooth"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
          border: "1px solid var(--accent)",
        }}
      >
        Today (active)
      </span>
      <span
        className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-smooth"
        style={{
          background: "var(--surface-2)",
          color: "var(--text-2)",
          border: "1px solid var(--border)",
        }}
      >
        This Week
      </span>
    </div>
  );
}

/* ─── Task Row ─── */
function TaskRowDemo({
  title,
  project,
  due,
  status,
  variant,
}: {
  title: string;
  project: string;
  due: string;
  status: string;
  variant: "normal" | "hover" | "selected" | "overdue" | "blocked" | "done";
}) {
  const statusMap: Record<string, { color: string; bg: string }> = {
    "Not Started": { color: "var(--text-3)", bg: "var(--surface-2)" },
    "In Progress": { color: "var(--progress)", bg: "rgba(37,99,235,0.1)" },
    Blocked: { color: "var(--blocked)", bg: "rgba(249,115,22,0.1)" },
    Done: { color: "var(--done)", bg: "rgba(22,163,74,0.1)" },
  };

  const s = statusMap[status] || statusMap["Not Started"];
  const isSelected = variant === "selected";
  const isHover = variant === "hover";
  const isOverdue = variant === "overdue";
  const isDone = variant === "done";

  return (
    <div
      className="flex items-center gap-3 px-4 rounded-lg transition-smooth"
      style={{
        height: 52,
        background: isHover || isSelected ? "var(--surface-2)" : "transparent",
        borderLeft: isSelected ? "4px solid var(--accent)" : "4px solid transparent",
      }}
    >
      <input
        type="checkbox"
        checked={isDone}
        readOnly
        className="w-4 h-4 rounded accent-[var(--accent)]"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate"
          style={{
            color: isDone ? "var(--text-3)" : "var(--text)",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {project} ·{" "}
          <span style={{ color: isOverdue ? "var(--overdue)" : "inherit" }}>
            {due}
          </span>
        </p>
      </div>
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ color: s.color, background: s.bg }}
      >
        {status}
      </span>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
        style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
      >
        DE
      </div>
    </div>
  );
}

/* ─── Drawer Preview ─── */
function DrawerPreview({ populated }: { populated: boolean }) {
  return (
    <div
      className="rounded-xl p-5 w-full max-w-sm"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {populated ? "Update landing page copy" : "Empty Task"}
        </h3>
        <X className="w-4 h-4" style={{ color: "var(--text-3)" }} />
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-2)" }}>
          Summary
        </p>
        <p className="text-sm" style={{ color: "var(--text)" }}>
          {populated
            ? "Rewrite hero section for spring campaign."
            : "No summary yet."}
        </p>
      </div>

      {/* Description — only if populated */}
      {populated && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-2)" }}>
            Description
          </p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Focus on seasonal varieties and CSA signup benefits. Keep under 50 words.
          </p>
        </div>
      )}

      {/* Checklist — only if populated */}
      {populated && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-2)" }}>
            Checklist
          </p>
          <div className="space-y-1">
            {["Draft copy", "Review with team", "Publish"].map((item, i) => (
              <label key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                <input type="checkbox" readOnly checked={i === 0} className="w-3.5 h-3.5 rounded" />
                <span style={{ textDecoration: i === 0 ? "line-through" : "none", color: i === 0 ? "var(--text-3)" : "var(--text)" }}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Activity — collapsed */}
      {populated && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-2)" }}>
            Activity
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Daniel assigned this · 2h ago
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Heidi Bubble ─── */
function HeidiBubblePreview({ expanded }: { expanded: boolean }) {
  return (
    <div className="relative inline-block">
      {expanded && (
        <div
          className="glass-overlay absolute bottom-14 right-0 w-72 rounded-xl p-4 mb-2"
          style={{ zIndex: 50 }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--text)" }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>⌘K</kbd> to jump to any project.
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              Show me
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: "var(--text-2)", background: "var(--surface-2)" }}
            >
              Got it
            </button>
          </div>
          <button
            className="mt-2 text-[11px] underline"
            style={{ color: "var(--text-3)" }}
          >
            Don&apos;t show again
          </button>
        </div>
      )}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        style={{ background: "var(--accent)", color: "white" }}
      >
        <Sparkles className="w-5 h-5" />
      </div>
    </div>
  );
}

/* ─── Command Palette ─── */
function CommandPalettePreview({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh]"
      style={{ background: "var(--overlay-dim)", zIndex: 100 }}
    >
      <div className="glass-overlay rounded-xl w-full max-w-lg overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--glass-border)" }}
        >
          <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          <span className="text-sm" style={{ color: "var(--text-3)" }}>
            Search tasks, projects, people...
          </span>
          <kbd
            className="ml-auto px-1.5 py-0.5 rounded text-[11px] font-mono"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-3)",
              border: "1px solid var(--border)",
            }}
          >
            ESC
          </kbd>
        </div>
        <div className="p-2">
          <p
            className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-3)" }}
          >
            Actions
          </p>
          {[
            { icon: Plus, label: "Create Task" },
            { icon: ChevronRight, label: "Jump to Project" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-smooth"
              style={{ color: "var(--text)" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "var(--surface-2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Icon className="w-4 h-4" style={{ color: "var(--text-3)" }} />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Page ═══ */
export default function DesignPreviewPage() {
  const { resolvedTheme } = useTheme();
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div
      className="min-h-screen p-8 max-w-4xl mx-auto"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Design Preview
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Regression check — design-system-v2 · {resolvedTheme} mode
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Section title="Buttons: primary / secondary / ghost / disabled">
        <ButtonShowcase />
      </Section>

      <Section title="Chips: status pills + filter chips">
        <ChipShowcase />
      </Section>

      <Section title="TaskRow: normal / hover / selected / overdue / blocked / done">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
          }}
        >
          <TaskRowDemo title="Write Q2 newsletter" project="Marketing" due="Mar 15" status="Not Started" variant="normal" />
          <TaskRowDemo title="Order seed trays" project="Operations" due="Mar 10" status="In Progress" variant="hover" />
          <TaskRowDemo title="Update pricing sheet" project="Sales" due="Mar 8" status="In Progress" variant="selected" />
          <TaskRowDemo title="Fix irrigation valve" project="Field Ops" due="Feb 28" status="In Progress" variant="overdue" />
          <TaskRowDemo title="Waiting on soil report" project="Product Dev" due="Mar 20" status="Blocked" variant="blocked" />
          <TaskRowDemo title="Complete safety training" project="HR" due="Feb 15" status="Done" variant="done" />
        </div>
      </Section>

      <Section title="Drawer: populated vs empty">
        <div className="flex flex-wrap gap-4">
          <DrawerPreview populated={true} />
          <DrawerPreview populated={false} />
        </div>
      </Section>

      <Section title="Heidi Bubble: collapsed / expanded">
        <div className="flex items-end gap-8">
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
              Collapsed
            </p>
            <HeidiBubblePreview expanded={false} />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
              Expanded
            </p>
            <HeidiBubblePreview expanded={true} />
          </div>
        </div>
      </Section>

      <Section title="Command Palette: closed / open">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth"
          style={{
            background: "var(--surface-2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          <Command className="w-3.5 h-3.5 inline mr-1.5" />
          {showPalette ? "Close" : "Open"} Command Palette
        </button>
        <CommandPalettePreview open={showPalette} />
      </Section>

      {/* Token swatches */}
      <Section title="Token Swatches">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "--bg", var: "var(--bg)" },
            { name: "--surface-1", var: "var(--surface-1)" },
            { name: "--surface-2", var: "var(--surface-2)" },
            { name: "--border", var: "var(--border)" },
            { name: "--accent", var: "var(--accent)" },
            { name: "--accent-soft", var: "var(--accent-soft)" },
            { name: "--done", var: "var(--done)" },
            { name: "--progress", var: "var(--progress)" },
            { name: "--blocked", var: "var(--blocked)" },
            { name: "--overdue", var: "var(--overdue)" },
          ].map((t) => (
            <div key={t.name} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border"
                style={{
                  background: t.var,
                  borderColor: "var(--border)",
                }}
              />
              <span className="text-xs font-mono" style={{ color: "var(--text-2)" }}>
                {t.name}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

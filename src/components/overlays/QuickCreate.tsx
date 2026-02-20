"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════
   QuickCreate — Rapid task creation overlay
   Glass overlay for creating a task without leaving context.
   ═══════════════════════════════════════════════ */

interface QuickCreateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateTask?: (task: { title: string; project: string; status: string }) => void;
}

const PROJECTS = ["Marketing", "Operations", "Sales", "Field Ops", "Product Dev", "HR"];
const STATUSES = ["Not Started", "In Progress", "Blocked", "Done"];

export function QuickCreate({ open: controlledOpen, onOpenChange, onCreateTask }: QuickCreateProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(PROJECTS[0]);
  const [status, setStatus] = useState(STATUSES[0]);
  const titleRef = useRef<HTMLInputElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      onOpenChange?.(v);
      setInternalOpen(v);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setProject(PROJECTS[0]);
      setStatus(STATUSES[0]);
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, setOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onCreateTask?.({ title: title.trim(), project, status });
      setOpen(false);
    },
    [title, project, status, onCreateTask, setOpen]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[18vh]"
      style={{ background: "var(--overlay-dim)", zIndex: 100 }}
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-overlay rounded-xl w-full max-w-md overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quick create task"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--glass-border)" }}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Quick Create
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md transition-colors"
            style={{ color: "var(--text-3)" }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-transparent text-sm outline-none px-3 py-2 rounded-lg transition-colors"
              style={{
                color: "var(--text)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full appearance-none text-xs px-3 py-2 pr-7 rounded-lg outline-none cursor-pointer"
                style={{
                  color: "var(--text-2)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {PROJECTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                style={{ color: "var(--text-3)" }}
              />
            </div>

            <div className="relative flex-1">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none text-xs px-3 py-2 pr-7 rounded-lg outline-none cursor-pointer"
                style={{
                  color: "var(--text-2)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                style={{ color: "var(--text-3)" }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: "var(--text-2)", background: "var(--surface-2)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

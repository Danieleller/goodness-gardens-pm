"use client";

import { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   TaskRow — ~52px dense task row
   Design spec: checkbox | title + meta | status chip | avatar
   Progressive disclosure: click → opens detail drawer.
   ═══════════════════════════════════════════════════ */

export interface TaskRowData {
  id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Blocked" | "Done";
  project?: string;
  dueDate?: string; // ISO string
  assignee?: {
    name: string;
    image?: string | null;
  };
  isOverdue?: boolean;
}

interface TaskRowProps {
  task: TaskRowData;
  selected?: boolean;
  onSelect?: (taskId: string) => void;
  onToggleDone?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
}

const STATUS_CONFIG: Record<
  TaskRowData["status"],
  { label: string; colorVar: string; bgClass: string }
> = {
  "Not Started": { label: "Not Started", colorVar: "var(--text-3)", bgClass: "surface-2" },
  "In Progress": { label: "In Progress", colorVar: "var(--progress)", bgClass: "accent-soft" },
  Blocked: { label: "Blocked", colorVar: "var(--blocked)", bgClass: "accent-soft" },
  Done: { label: "Done", colorVar: "var(--done)", bgClass: "accent-soft" },
};

function formatDueDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 7) return `${diff}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskRow({ task, selected, onSelect, onToggleDone, onClick }: TaskRowProps) {
  const [hovered, setHovered] = useState(false);
  const isDone = task.status === "Done";
  const statusCfg = STATUS_CONFIG[task.status];

  const handleCheckbox = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleDone?.(task.id);
    },
    [task.id, onToggleDone]
  );

  const handleClick = useCallback(() => {
    onClick?.(task.id);
  }, [task.id, onClick]);

  const dueDateStr = formatDueDate(task.dueDate);
  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && !isDone);

  return (
    <div
      className="flex items-center gap-3 px-4 cursor-pointer transition-smooth"
      style={{
        height: 52,
        background: selected
          ? "var(--accent-soft)"
          : hovered
          ? "var(--surface-2)"
          : "transparent",
        borderLeft: selected ? "3px solid var(--accent)" : "3px solid transparent",
        borderBottom: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* Checkbox */}
      <div
        className="shrink-0 w-4 h-4 rounded border flex items-center justify-center cursor-pointer"
        style={{
          borderColor: isDone ? "var(--done)" : "var(--border)",
          background: isDone ? "var(--done)" : "transparent",
        }}
        onClick={handleCheckbox}
        role="checkbox"
        aria-checked={isDone}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Title + metadata */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate leading-tight"
          style={{
            color: isDone ? "var(--text-3)" : "var(--text)",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && (
            <span className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
              {task.project}
            </span>
          )}
          {dueDateStr && (
            <>
              {task.project && (
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>·</span>
              )}
              <span
                className="text-[11px]"
                style={{ color: isOverdue ? "var(--overdue)" : "var(--text-3)" }}
              >
                {dueDateStr}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status chip */}
      <span
        className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{
          color: statusCfg.colorVar,
          background:
            task.status === "Not Started"
              ? "var(--surface-2)"
              : `color-mix(in srgb, ${statusCfg.colorVar} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${statusCfg.colorVar} 20%, transparent)`,
        }}
      >
        {statusCfg.label}
      </span>

      {/* Assignee avatar */}
      {task.assignee && (
        <div
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium overflow-hidden"
          style={{
            background: task.assignee.image ? "transparent" : "var(--accent-soft)",
            color: "var(--accent)",
          }}
          title={task.assignee.name}
        >
          {task.assignee.image ? (
            <img
              src={task.assignee.image}
              alt={task.assignee.name}
              className="w-full h-full object-cover"
            />
          ) : (
            task.assignee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>
      )}
    </div>
  );
}

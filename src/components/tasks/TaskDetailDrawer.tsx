"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Calendar, User, Tag, CheckSquare, MessageSquare, ChevronDown } from "lucide-react";
import type { TaskRowData } from "./TaskRow";

/* ═══════════════════════════════════════════════════
   TaskDetailDrawer — Right-side slide-in panel
   220ms animation · glass-free (opaque surface-1)
   Shows task title, summary, description, checklist,
   activity log. Empty state when nothing selected.
   ═══════════════════════════════════════════════════ */

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface TaskDetail extends TaskRowData {
  summary?: string;
  description?: string;
  checklist?: ChecklistItem[];
  activity?: ActivityItem[];
  category?: string;
  createdBy?: string;
  createdAt?: string;
}

interface TaskDetailDrawerProps {
  task: TaskDetail | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<TaskDetail>) => void;
}

export function TaskDetailDrawer({ task, open, onClose, onUpdateTask }: TaskDetailDrawerProps) {
  const [activityExpanded, setActivityExpanded] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* ── Escape to close ── */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  /* ── Toggle checklist item ── */
  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      if (!task?.checklist) return;
      const updated = task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      onUpdateTask?.(task.id, { checklist: updated });
    },
    [task, onUpdateTask]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop (subtle dim, click to close) */}
      <div
        className="fixed inset-0"
        style={{ background: "var(--overlay-dim)", zIndex: 80 }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full drawer-enter overflow-y-auto"
        style={{
          width: "min(420px, 90vw)",
          background: "var(--surface-1)",
          borderLeft: "1px solid var(--border)",
          zIndex: 81,
        }}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{
            background: "var(--surface-1)",
            borderBottom: "1px solid var(--border)",
            zIndex: 1,
          }}
        >
          <h2
            className="text-base font-semibold truncate pr-3"
            style={{ color: "var(--text)" }}
          >
            {task?.title || "Task Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "var(--text-3)" }}
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content ── */}
        {!task ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Select a task to view details
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* ── Metadata pills ── */}
            <div className="flex flex-wrap gap-2">
              {task.status && (
                <MetadataPill
                  icon={<Tag className="w-3 h-3" />}
                  label={task.status}
                />
              )}
              {task.project && (
                <MetadataPill
                  icon={<Tag className="w-3 h-3" />}
                  label={task.project}
                />
              )}
              {task.dueDate && (
                <MetadataPill
                  icon={<Calendar className="w-3 h-3" />}
                  label={new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  isOverdue={task.isOverdue}
                />
              )}
              {task.assignee && (
                <MetadataPill
                  icon={<User className="w-3 h-3" />}
                  label={task.assignee.name}
                />
              )}
            </div>

            {/* ── Summary ── */}
            {task.summary && (
              <Section title="Summary">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {task.summary}
                </p>
              </Section>
            )}

            {/* ── Description ── */}
            {task.description && (
              <Section title="Description">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {task.description}
                </p>
              </Section>
            )}

            {/* ── Checklist ── */}
            {task.checklist && task.checklist.length > 0 && (
              <Section
                title="Checklist"
                badge={`${task.checklist.filter((c) => c.done).length}/${task.checklist.length}`}
              >
                <div className="space-y-1.5">
                  {task.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2.5 py-1 cursor-pointer group"
                    >
                      <div
                        className="shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors"
                        style={{
                          borderColor: item.done ? "var(--done)" : "var(--border)",
                          background: item.done ? "var(--done)" : "transparent",
                        }}
                        onClick={() => toggleChecklistItem(item.id)}
                      >
                        {item.done && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 5L4.5 7.5L8 3"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm leading-snug"
                        style={{
                          color: item.done ? "var(--text-3)" : "var(--text)",
                          textDecoration: item.done ? "line-through" : "none",
                        }}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Activity log (collapsed by default) ── */}
            {task.activity && task.activity.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-2 w-full py-2 transition-colors"
                  onClick={() => setActivityExpanded(!activityExpanded)}
                  style={{ color: "var(--text-2)" }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    Activity ({task.activity.length})
                  </span>
                  <ChevronDown
                    className="w-3 h-3 ml-auto transition-transform"
                    style={{
                      transform: activityExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {activityExpanded && (
                  <div className="space-y-2.5 pt-1 pl-5">
                    {task.activity.map((item) => (
                      <div key={item.id}>
                        <p className="text-xs" style={{ color: "var(--text)" }}>
                          <span className="font-medium">{item.user}</span>{" "}
                          <span style={{ color: "var(--text-2)" }}>{item.action}</span>
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                          {new Date(item.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── No summary fallback ── */}
            {!task.summary && !task.description && (
              <p className="text-sm italic" style={{ color: "var(--text-3)" }}>
                No summary yet. Click to add details.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Helper: Section wrapper ── */
function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          {title}
        </h3>
        {badge && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Helper: Metadata pill ── */
function MetadataPill({
  icon,
  label,
  isOverdue,
}: {
  icon: React.ReactNode;
  label: string;
  isOverdue?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{
        background: "var(--surface-2)",
        color: isOverdue ? "var(--overdue)" : "var(--text-2)",
        border: "1px solid var(--border)",
      }}
    >
      {icon}
      {label}
    </span>
  );
}

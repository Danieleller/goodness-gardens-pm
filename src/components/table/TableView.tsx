"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  formatDate,
  isOverdue,
  getStatusBorderClass,
} from "@/lib/utils";
import { updateTask } from "@/actions/tasks";
import Link from "next/link";
import type { TaskWithRelations } from "@/lib/types";
import type { User } from "@/db/schema";

type SortField = "title" | "status" | "priority" | "assignee" | "category" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER = { Backlog: 0, Doing: 1, Blocked: 2, Done: 3 } as const;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function TableView({
  tasks,
  users,
  onUpdateTask,
}: {
  tasks: TaskWithRelations[];
  users: User[];
  onUpdateTask?: (taskId: string, data: Record<string, unknown>) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...tasks];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      switch (sortField) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "status":
          return dir * ((STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] ?? 9) - (STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] ?? 9));
        case "priority":
          return dir * ((PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 9) - (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 9));
        case "assignee": {
          const aName = a.assignedTo?.name || a.assignedTo?.email || "zzz";
          const bName = b.assignedTo?.name || b.assignedTo?.email || "zzz";
          return dir * aName.localeCompare(bName);
        }
        case "category":
          return dir * a.category.localeCompare(b.category);
        case "dueDate": {
          const aDate = a.dueDate || "9999-12-31";
          const bDate = b.dueDate || "9999-12-31";
          return dir * aDate.localeCompare(bDate);
        }
        case "createdAt": {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dir * (aTime - bTime);
        }
        default:
          return 0;
      }
    });
    return arr;
  }, [tasks, sortField, sortDir]);

  const handleStatusChange = async (taskId: string, status: string) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { status });
    }
    await updateTask(taskId, { status });
  };

  const handlePriorityChange = async (taskId: string, priority: string) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { priority });
    }
    await updateTask(taskId, { priority });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const columns: { key: SortField; label: string; width: string }[] = [
    { key: "title", label: "Title", width: "flex-1 min-w-[200px]" },
    { key: "status", label: "Status", width: "w-[120px]" },
    { key: "priority", label: "Priority", width: "w-[110px]" },
    { key: "assignee", label: "Assignee", width: "w-[160px]" },
    { key: "category", label: "Category", width: "w-[120px]" },
    { key: "dueDate", label: "Due Date", width: "w-[120px]" },
    { key: "createdAt", label: "Created", width: "w-[100px]" },
  ];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 view-enter">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--surface-2)" }}>
          <ArrowUpDown className="w-6 h-6" style={{ color: "var(--text-3)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>No tasks to display</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Tasks will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 view-enter">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
        {/* Header row */}
        <div className="flex items-center gap-0" style={{ borderBottom: "2px solid var(--border)", background: "var(--surface-2)" }}>
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => toggleSort(col.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide shrink-0 transition-smooth hover:bg-[var(--surface-1)] ${col.width}`}
              style={{ color: sortField === col.key ? "var(--accent)" : "var(--text-3)" }}
            >
              {col.label}
              <SortIcon field={col.key} />
            </button>
          ))}
        </div>

        {/* Rows */}
        {sorted.map((task) => {
          const overdue = isOverdue(task.dueDate) && task.status !== "Done";

          return (
            <div
              key={task.id}
              className={`flex items-center gap-0 transition-smooth hover:bg-[var(--surface-2)] ${getStatusBorderClass(task.status)}`}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {/* Title */}
              <div className="flex-1 min-w-[200px] px-3 py-2.5">
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm font-medium transition-smooth truncate block"
                  style={{ color: "var(--text)" }}
                >
                  {task.title}
                </Link>
              </div>

              {/* Status */}
              <div className="w-[120px] px-3 py-2.5 shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="text-xs rounded-md px-2 py-1 w-full cursor-pointer focus:outline-none focus:ring-1 transition-smooth"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-2)" }}
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Doing">Doing</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div className="w-[110px] px-3 py-2.5 shrink-0">
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                  className="text-xs rounded-md px-2 py-1 w-full cursor-pointer focus:outline-none focus:ring-1 transition-smooth"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-2)" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Assignee */}
              <div className="w-[160px] px-3 py-2.5 shrink-0">
                {task.assignedTo ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                      style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
                    >
                      {(task.assignedTo.name || task.assignedTo.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                      {task.assignedTo.name || task.assignedTo.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>Unassigned</span>
                )}
              </div>

              {/* Category */}
              <div className="w-[120px] px-3 py-2.5 shrink-0">
                <span className="text-xs" style={{ color: "var(--text-2)" }}>{task.category}</span>
              </div>

              {/* Due Date */}
              <div className="w-[120px] px-3 py-2.5 shrink-0">
                {task.dueDate ? (
                  <span className={`text-xs ${overdue ? "font-semibold" : ""}`} style={{ color: overdue ? "var(--overdue)" : "var(--text-2)" }}>
                    {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
                )}
              </div>

              {/* Created */}
              <div className="w-[100px] px-3 py-2.5 shrink-0">
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] mt-2 px-1" style={{ color: "var(--text-3)" }}>
        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

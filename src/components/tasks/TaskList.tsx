"use client";

import { useState, useMemo, useCallback } from "react";
import { TaskRow, type TaskRowData } from "./TaskRow";
import { TaskDetailDrawer, type TaskDetail } from "./TaskDetailDrawer";
import { Search, SlidersHorizontal } from "lucide-react";

/* ═══════════════════════════════════════════════════
   TaskList — "My Work" list view
   Flat task list with search, filter chips, and
   integrated detail drawer. Renders TaskRow items.
   ═══════════════════════════════════════════════════ */

type FilterStatus = "all" | "active" | "overdue" | "done";

interface TaskListProps {
  tasks: TaskDetail[];
  onUpdateTask?: (taskId: string, updates: Partial<TaskDetail>) => void;
  onToggleDone?: (taskId: string) => void;
}

const FILTER_CHIPS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "done", label: "Done" },
];

export function TaskList({ tasks, onUpdateTask, onToggleDone }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Filtered + searched tasks ── */
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by status
    if (filter === "active") {
      result = result.filter((t) => t.status !== "Done");
    } else if (filter === "overdue") {
      result = result.filter(
        (t) => t.isOverdue || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done")
      );
    } else if (filter === "done") {
      result = result.filter((t) => t.status === "Done");
    }

    // Search by title
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, filter, search]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── Search + filters ── */}
      <div
        className="shrink-0 px-4 py-3 space-y-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
              style={{
                background: filter === chip.value ? "var(--accent)" : "var(--surface-2)",
                color: filter === chip.value ? "white" : "var(--text-2)",
                border:
                  filter === chip.value
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
              }}
            >
              {chip.label}
            </button>
          ))}

          {/* Task count */}
          <span className="text-[11px] ml-auto" style={{ color: "var(--text-3)" }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Task list ── */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-8">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {search ? "No tasks match your search" : "No tasks in this view"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onToggleDone={onToggleDone}
              onClick={handleTaskClick}
            />
          ))
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
}

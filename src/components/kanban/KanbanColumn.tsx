"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import type { Task, User } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  isRocks = false,
}: {
  id: string;
  title: string;
  tasks: TaskWithRelations[];
  color?: string;
  isRocks?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] shrink-0 rounded-xl overflow-hidden ${
        isRocks ? "glass-rocks-column" : ""
      }`}
      style={
        isRocks
          ? undefined
          : {
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
            }
      }
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h3
          className="text-xs font-semibold uppercase tracking-wide truncate"
          style={{ color: isRocks ? "white" : "var(--text-2)" }}
        >
          {title}
        </h3>
        <span
          className="text-[11px] font-medium rounded-md px-2 py-0.5"
          style={
            isRocks
              ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
              : { background: "var(--surface-2)", color: "var(--text-3)" }
          }
        >
          {tasks.length}
        </span>
      </div>

      {/* Task list drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-smooth"
        style={
          isOver
            ? isRocks
              ? { background: "rgba(255,255,255,0.05)" }
              : { background: "color-mix(in srgb, var(--accent) 8%, transparent)" }
            : undefined
        }
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isRocksColumn={isRocks} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div
            className="text-center text-[11px] py-8"
            style={{ color: isRocks ? "rgba(255,255,255,0.3)" : "var(--text-3)" }}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

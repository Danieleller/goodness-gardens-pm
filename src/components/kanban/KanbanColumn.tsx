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
        isRocks
          ? "glass-rocks-column"
          : `border ${color || "bg-stone-50/50 border-[#e8e0d4]"}`
      }`}
    >
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 ${
          isRocks ? "border-b border-white/10" : "border-b border-[#e8e0d4]/60"
        }`}
      >
        <h3
          className={`text-xs font-semibold uppercase tracking-wide truncate ${
            isRocks ? "text-white" : "text-stone-500"
          }`}
        >
          {title}
        </h3>
        <span
          className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${
            isRocks
              ? "bg-white/10 text-white/60"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-smooth ${
          isOver
            ? isRocks
              ? "bg-white/5"
              : "bg-emerald-50/30"
            : ""
        }`}
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
            className={`text-center text-[11px] py-8 ${
              isRocks ? "text-white/30" : "text-stone-300"
            }`}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

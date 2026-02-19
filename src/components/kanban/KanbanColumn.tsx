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
          : `border ${color || "bg-slate-50 border-slate-200"}`
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2.5 border-b ${
          isRocks ? "border-white/10" : "border-inherit"
        }`}
      >
        <h3
          className={`text-sm font-semibold truncate ${
            isRocks ? "text-white" : "text-slate-700"
          }`}
        >
          {title}
        </h3>
        <span
          className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            isRocks
              ? "bg-white/10 text-gray-300"
              : "bg-white text-slate-400"
          }`}
        >
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${
          isOver
            ? isRocks
              ? "bg-white/5"
              : "bg-green-50/50"
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
            className={`text-center text-xs py-8 ${
              isRocks ? "text-gray-500" : "text-slate-400"
            }`}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

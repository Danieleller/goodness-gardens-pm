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
}: {
  id: string;
  title: string;
  tasks: TaskWithRelations[];
  color?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] shrink-0 ${
        color || "bg-slate-50 border-slate-200"
      } border rounded-xl`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <h3 className="text-sm font-semibold text-slate-700 truncate">
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-white rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${
          isOver ? "bg-green-50/50" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-8">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

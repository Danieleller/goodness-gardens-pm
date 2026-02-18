"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  formatDate,
  isOverdue,
} from "@/lib/utils";
import { Calendar, GripVertical } from "lucide-react";
import Link from "next/link";
import type { Task, User } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate) && task.status !== "Done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <Link
            href={`/tasks/${task.id}`}
            className="text-sm font-medium text-slate-900 hover:text-[#1a3a2a] line-clamp-2 block"
          >
            {task.title}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {task.priority}
            </Badge>
            <Badge className={STATUS_COLORS[task.status]}>{task.status}</Badge>
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  overdue ? "text-red-600 font-medium" : "text-slate-500"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <p className="text-xs text-slate-400 mt-1.5 truncate">
              → {task.assignedTo.name || task.assignedTo.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

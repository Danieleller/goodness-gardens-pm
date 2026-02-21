"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  formatDate,
  isOverdue,
  getStatusBorderClass,
} from "@/lib/utils";
import { Calendar, GripVertical } from "lucide-react";
import Link from "next/link";
import type { Task, User, TaskAssignee, TaskGroupAssignment, UserGroup } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
  additionalAssignees?: (TaskAssignee & { user: User })[];
  groupAssignments?: (TaskGroupAssignment & { group: UserGroup })[];
};

export function TaskCard({
  task,
  isRocksColumn = false,
}: {
  task: TaskWithRelations;
  isRocksColumn?: boolean;
}) {
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
  const isRockTask = task.id.startsWith("R-");
  const isDarkCard = isRocksColumn || (isRockTask && !isRocksColumn);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl transition-smooth ${
        isDragging ? "opacity-50 scale-[1.02]" : ""
      } ${isDarkCard ? "glass-dark" : "glass"} ${
        !isDarkCard ? getStatusBorderClass(task.status) : ""
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className={`mt-0.5 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-smooth ${
            isDarkCard
              ? "text-white/30 hover:text-white/60"
              : "[color:var(--text-3)]"
          }`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <Link
            href={`/tasks/${task.id}`}
            className={`text-sm font-medium line-clamp-2 block transition-smooth ${
              isDarkCard
                ? "text-white/90 hover:text-white"
                : "[color:var(--text)]"
            }`}
          >
            {task.title}
          </Link>

          {/* Metadata row: category Â· deadline Â· assignee */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge className={STATUS_COLORS[task.status]}>{task.status}</Badge>
            {task.category && (
              <span className={`text-[11px] ${isDarkCard ? "text-white/40" : ""}`} style={!isDarkCard ? { color: "var(--text-3)" } : undefined}>
                {task.category}
              </span>
            )}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  overdue
                    ? "text-red-500 font-medium"
                    : isDarkCard
                      ? "text-white/40"
                      : ""
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Assignee row */}
          {task.assignedTo && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                  isDarkCard
                    ? "bg-white/10 text-white/60"
                    : "bg-[var(--surface-2)] [color:var(--text-2)]"
                }`}
              >
                {(task.assignedTo.name || task.assignedTo.email || "?")[0].toUpperCase()}
              </div>
              <p
                className={`text-[11px] truncate ${isDarkCard ? "text-white/40" : ""}`} style={!isDarkCard ? { color: "var(--text-3)" } : undefined}
              >
                {task.assignedTo.name || task.assignedTo.email}
              </p>
              {(task.additionalAssignees?.length ?? 0) > 0 && (
                <span
                  className={`inline-flex items-center justify-center text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                    isDarkCard
                      ? "bg-white/10 text-white/50"
                      : "bg-[var(--surface-2)] [color:var(--text-3)]"
                  }`}
                >
                  +{task.additionalAssignees!.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

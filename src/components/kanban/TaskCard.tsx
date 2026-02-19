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

  // Detect if this task originated from Ultimate Rocks (R-prefixed ID)
  const isRockTask = task.id.startsWith("R-");

  // Determine card style:
  // - In the Rocks column: dark glass (glass-dark)
  // - Rock task in a non-Rocks column: black glass (glass-dark) for visual distinction
  // - Normal task in normal column: light glass (glass)
  const isDarkCard = isRocksColumn || (isRockTask && !isRocksColumn);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl p-3 transition-all ${
        isDragging ? "opacity-50 scale-[1.02]" : "hover:shadow-lg"
      } ${isDarkCard ? "glass-dark" : "glass"}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className={`mt-0.5 cursor-grab active:cursor-grabbing shrink-0 ${
            isDarkCard
              ? "text-gray-500 hover:text-gray-300"
              : "text-slate-300 hover:text-slate-500"
          }`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <Link
            href={`/tasks/${task.id}`}
            className={`text-sm font-medium line-clamp-2 block ${
              isDarkCard
                ? "text-white hover:text-gray-300"
                : "text-slate-900 hover:text-[#1a3a2a]"
            }`}
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
                  overdue
                    ? "text-red-600 font-medium"
                    : isDarkCard
                      ? "text-gray-400"
                      : "text-slate-500"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <div className="flex items-center gap-1 mt-1.5">
              <p
                className={`text-xs truncate ${
                  isDarkCard ? "text-gray-500" : "text-slate-400"
                }`}
              >
                â {task.assignedTo.name || task.assignedTo.email}
              </p>
              {(task.additionalAssignees?.length ?? 0) > 0 && (
                <span
                  className={`inline-flex items-center justify-center text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                    isDarkCard
                      ? "bg-gray-700 text-gray-300"
                      : "bg-slate-100 text-slate-500"
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

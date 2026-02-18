"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { updateTask } from "@/actions/tasks";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/utils";
import { Users, LayoutGrid } from "lucide-react";
import type { Task, User } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

type ViewMode = "person" | "category";

export function KanbanBoard({
  initialTasks,
  users,
}: {
  initialTasks: TaskWithRelations[];
  users: User[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<ViewMode>("person");
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = (event.active.data.current as any)?.task;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const taskId = active.id as string;
      const columnId = over.id as string;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (view === "person") {
        const newAssignee = columnId === "unassigned" ? null : columnId;
        if (newAssignee === task.assignedToUserId) return;

        // Optimistic update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  assignedToUserId: newAssignee,
                  assignedTo: newAssignee
                    ? users.find((u) => u.id === newAssignee) || null
                    : null,
                }
              : t
          )
        );
        await updateTask(taskId, { assignedToUserId: newAssignee });
      } else {
        const newCategory = columnId as Task["category"];
        if (newCategory === task.category) return;

        // Optimistic update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, category: newCategory } : t
          )
        );
        await updateTask(taskId, { category: newCategory });
      }
    },
    [view, tasks, users]
  );

  // Build columns based on view
  const columns =
    view === "person"
      ? [
          {
            id: "unassigned",
            title: "Unassigned",
            tasks: filteredTasks.filter((t) => !t.assignedToUserId),
            color: "bg-slate-50 border-slate-200",
          },
          ...users.map((user) => ({
            id: user.id,
            title: user.name || user.email,
            tasks: filteredTasks.filter(
              (t) => t.assignedToUserId === user.id
            ),
            color: "bg-slate-50 border-slate-200",
          })),
        ]
      : CATEGORIES.map((cat) => ({
          id: cat,
          title: cat === "ProductDev" ? "Product Dev" : cat,
          tasks: filteredTasks.filter((t) => t.category === cat),
          color: CATEGORY_COLORS[cat],
        }));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-wrap">
        {/* View toggle */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("person")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "person"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            By Person
          </button>
          <button
            onClick={() => setView("category")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "category"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            By Category
          </button>
        </div>

        {/* Filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 bg-white"
        >
          <option value="">All statuses</option>
          <option value="Backlog">Backlog</option>
          <option value="Doing">Doing</option>
          <option value="Blocked">Blocked</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 bg-white"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={col.tasks}
                color={col.color}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

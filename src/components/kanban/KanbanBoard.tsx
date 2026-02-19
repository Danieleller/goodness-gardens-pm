"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCorners,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { RocksView } from "../rocks/RocksView";
import { updateTask } from "@/actions/tasks";
import { Users, LayoutGrid, Target } from "lucide-react";
import type { Task, User, Category, Rock } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

type RockWithOwner = Rock & { owner: User };

type ViewMode = "person" | "category" | "rocks";

export function KanbanBoard({
  initialTasks,
  users,
  categories,
  rocks = [],
}: {
  initialTasks: TaskWithRelations[];
  users: User[];
  categories: Category[];
  rocks?: RockWithOwner[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<ViewMode>("person");
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  // Build column IDs set for resolving drop targets
  const columnIds = useMemo(() => {
    if (view === "person") {
      const ids = new Set<string>(["unassigned"]);
      users.forEach((u) => ids.add(u.id));
      return ids;
    } else {
      const ids = new Set<string>();
      categories.forEach((c) => ids.add(c.name));
      return ids;
    }
  }, [view, users, categories]);

  // Custom collision detection: try pointerWithin first (detects empty columns
  // when the cursor is inside their bounds), then fall back to closestCorners
  // for fine-grained positioning among task cards within a column.
  const customCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      // First check pointerWithin â this reliably detects column droppables
      // even when they're empty, because it checks if pointer is inside rect
      const pointerCollisions = pointerWithin(args);

      // If pointer is inside a column droppable, prefer that
      if (pointerCollisions.length > 0) {
        // Check if any collision is a column (not a task card)
        const columnCollision = pointerCollisions.find((c) =>
          columnIds.has(c.id as string)
        );
        if (columnCollision) {
          // Also include any task collisions for sorting within the column
          return pointerCollisions;
        }
        return pointerCollisions;
      }

      // Fall back to closestCorners for edge cases
      return closestCorners(args);
    },
    [columnIds]
  );

  // Find which column a task belongs to
  const findColumnForTask = useCallback(
    (taskId: string): string | null => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return null;
      if (view === "person") {
        return task.assignedToUserId || "unassigned";
      } else {
        return task.category;
      }
    },
    [tasks, view]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = (event.active.data.current as any)?.task;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Resolve the target column: if overId is a column, use it directly;
      // if overId is a task, find which column that task belongs to
      let targetColumnId: string;
      if (columnIds.has(overId)) {
        targetColumnId = overId;
      } else {
        // overId is a task â find its column
        const col = findColumnForTask(overId);
        if (!col) return;
        targetColumnId = col;
      }

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (view === "person") {
        const newAssignee = targetColumnId === "unassigned" ? null : targetColumnId;
        if (newAssignee === task.assignedToUserId) return;

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
        const newCategory = targetColumnId;
        if (newCategory === task.category) return;

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, category: newCategory } : t
          )
        );
        await updateTask(taskId, { category: newCategory });
      }
    },
    [view, tasks, users, columnIds, findColumnForTask]
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
            isRocks: false,
          },
          ...users.map((user) => ({
            id: user.id,
            title: user.name || user.email,
            tasks: filteredTasks.filter(
              (t) => t.assignedToUserId === user.id
            ),
            color: "bg-slate-50 border-slate-200",
            isRocks: false,
          })),
        ]
      : categories.map((cat) => ({
          id: cat.name,
          title: cat.displayName,
          tasks: filteredTasks.filter((t) => t.category === cat.name),
          color: cat.name === "Rocks" ? "bg-black border-black" : cat.color,
          isRocks: cat.name === "Rocks",
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
          <button
            onClick={() => setView("rocks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "rocks"
                ? "bg-black text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Target className="w-4 h-4" />
            Ultimate Rocks
          </button>
        </div>

        {view !== "rocks" && (
          <>
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
          </>
        )}
      </div>

      {/* Board or Rocks View */}
      {view === "rocks" ? (
        <RocksView rocks={rocks} users={users} />
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
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
                  isRocks={col.isRocks}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  isRocksColumn={activeTask.id.startsWith("R-")}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}


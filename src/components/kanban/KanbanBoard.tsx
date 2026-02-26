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
import { ProjectsView } from "../projects/ProjectsView";
import { CalendarView } from "../calendar/CalendarView";
import { updateTask } from "@/actions/tasks";
import { Users, LayoutGrid, Target, CalendarDays, AlertTriangle, Clock, CheckCircle2, FolderOpen } from "lucide-react";
import type { Task, User, Category, Rock, Project, ProjectMember } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

type RockWithOwner = Rock & { owner: User };
type ProjectWithMembers = Project & { owner: User | null; members: (ProjectMember & { user: User })[] };

type ViewMode = "person" | "category" | "projects" | "calendar";

export function KanbanBoard({
  initialTasks,
  users,
  categories,
  rocks = [],
  projects = [],
}: {
  initialTasks: TaskWithRelations[];
  users: User[];
  categories: Category[];
  rocks?: RockWithOwner[];
  projects?: ProjectWithMembers[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<ViewMode>("person");
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Company Snapshot metrics
  const totalOpen = tasks.filter((t) => t.status !== "Done").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "Done" && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())
  ).length;
  const blockedTasks = tasks.filter((t) => t.status === "Blocked").length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
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

  const customCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        const columnCollision = pointerCollisions.find((c) =>
          columnIds.has(c.id as string)
        );
        if (columnCollision) {
          return pointerCollisions;
        }
        return pointerCollisions;
      }
      return closestCorners(args);
    },
    [columnIds]
  );

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

      let targetColumnId: string;
      if (columnIds.has(overId)) {
        targetColumnId = overId;
      } else {
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
            color: "",
            isRocks: false,
          },
          ...users.map((user) => ({
            id: user.id,
            title: user.name || user.email,
            tasks: filteredTasks.filter(
              (t) => t.assignedToUserId === user.id
            ),
            color: "",
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
      {/* Company Snapshot */}
      {(view === "person" || view === "category") && (
        <div className="grid grid-cols-4 gap-3 px-5 pt-4 pb-2">
          <div className="snapshot-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Open</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: "var(--text)" }}>{totalOpen}</p>
          </div>
          <div className="snapshot-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--overdue, #f87171)" }} />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Overdue</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: overdueTasks > 0 ? "var(--overdue, #ef4444)" : "var(--text)" }}>{overdueTasks}</p>
          </div>
          <div className="snapshot-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--blocked, #fbbf24)" }} />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Blocked</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: blockedTasks > 0 ? "var(--blocked, #d97706)" : "var(--text)" }}>{blockedTasks}</p>
          </div>
          <div className="snapshot-card">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Complete</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: "var(--text)" }}>{completionRate}%</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        {/* View toggle */}
        <div className="flex rounded-lg p-0.5" style={{ background: "var(--surface-2)" }}>
          <button
            onClick={() => setView("person")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
              view === "person"
                ? "shadow-sm"
                : ""
            }`}
          >
            <Users className="w-4 h-4" />
            By Person
          </button>
          <button
            onClick={() => setView("category")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
              view === "category"
                ? "shadow-sm"
                : ""
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            By Category
          </button>
          <button
            onClick={() => setView("projects")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
              view === "projects"
                ? "shadow-sm"
                : ""
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
              view === "calendar"
                ? "shadow-sm"
                : ""
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {(view === "person" || view === "category") && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 transition-smooth" style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--surface-1)", boxShadow: "0 0 0 0 transparent" }}
          >
            <option value="">All statuses</option>
            <option value="Backlog">Backlog</option>
            <option value="Doing">Doing</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
          </select>
        )}
      </div>

      {/* Board, Rocks, or Calendar View */}
      {view === "projects" ? (
        <ProjectsView projects={projects} users={users} />
      ) : view === "calendar" ? (
        <CalendarView tasks={tasks} />
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

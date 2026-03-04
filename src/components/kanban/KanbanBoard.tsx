"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { FilterPanel } from "../filters/FilterPanel";
import { FilterChips } from "../filters/FilterChips";
import { QuickAddModal } from "../tasks/QuickAddModal";
import { updateTask } from "@/actions/tasks";
import {
  Users, LayoutGrid, Filter,
} from "lucide-react";
import type { User, Category } from "@/db/schema";
import type { TaskWithRelations, ProjectWithMembers, FilterCriteria } from "@/lib/types";
import { emptyFilters, hasActiveFilters, countActiveFilters } from "@/lib/types";

type ViewMode = "person" | "category";

export function KanbanBoard({
  initialTasks,
  users,
  categories,
  projects = [],
  currentUserId,
}: {
  initialTasks: TaskWithRelations[];
  users: User[];
  categories: Category[];
  projects?: ProjectWithMembers[];
  currentUserId?: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<ViewMode>("person");
  const [personFilter, setPersonFilter] = useState<"mine" | "all">("mine");
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>(emptyFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaults, setQuickAddDefaults] = useState<{ assignee?: string; category?: string }>({});

  const handleColumnAddTask = useCallback((columnId: string) => {
    if (view === "person") {
      setQuickAddDefaults({ assignee: columnId === "unassigned" ? undefined : columnId });
    } else {
      setQuickAddDefaults({ category: columnId });
    }
    setQuickAddOpen(true);
  }, [view]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.assignee) {
        if (filters.assignee === "__unassigned__") {
          if (t.assignedToUserId) return false;
        } else {
          if (t.assignedToUserId !== filters.assignee) return false;
        }
      }
      if (filters.category && t.category !== filters.category) return false;
      if (filters.project) {
        if (filters.project === "__none__") {
          if (t.projectId) return false;
        } else {
          if (t.projectId !== filters.project) return false;
        }
      }
      if (filters.dateFrom && t.dueDate && t.dueDate < filters.dateFrom) return false;
      if (filters.dateTo && t.dueDate && t.dueDate > filters.dateTo) return false;
      return true;
    });
  }, [tasks, filters]);

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

  // Optimistic update handler for inline edits (Table view, Done button, etc.)
  const handleOptimisticUpdate = useCallback((taskId: string, data: Record<string, unknown>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data } as TaskWithRelations : t))
    );
  }, []);

  const handleStatusChange = useCallback((taskId: string, newStatus: string) => {
    handleOptimisticUpdate(taskId, { status: newStatus });
  }, [handleOptimisticUpdate]);

  // Exclude service accounts (e.g., "IT") from person view columns
  const humanUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      return name !== "it" && !name.startsWith("itsupport");
    });
  }, [users]);

  // Users to display in person view: current user, reports, or all
  const personViewUsers = useMemo(() => {
    if (view !== "person" || !currentUserId) return humanUsers;
    if (personFilter === "all") return humanUsers;
    return humanUsers.filter((u) => u.id === currentUserId || u.managerId === currentUserId);
  }, [view, personFilter, currentUserId, humanUsers]);

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
          ...personViewUsers.map((user) => ({
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
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        {/* View toggle */}
        <div className="flex rounded-lg p-0.5 flex-wrap" style={{ background: "var(--surface-2)" }}>
          {([
            { key: "person" as const, icon: Users, label: "By Person" },
            { key: "category" as const, icon: LayoutGrid, label: "By Category" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
                view === key ? "shadow-sm" : ""
              }`}
              style={{
                background: view === key ? "var(--surface-1)" : "transparent",
                color: view === key ? "var(--text)" : "var(--text-3)",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* My Tasks / My Reports / All toggle for person view */}
        {view === "person" && currentUserId && (
          <div className="flex rounded-lg p-0.5" style={{ background: "var(--surface-2)" }}>
            {([
              { key: "mine" as const, label: "My Tasks" },
              { key: "all" as const, label: "All Tasks" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPersonFilter(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-smooth ${personFilter === key ? "shadow-sm" : ""}`}
                style={{
                  background: personFilter === key ? "var(--surface-1)" : "transparent",
                  color: personFilter === key ? "var(--text)" : "var(--text-3)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Filter toggle + chips */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setShowFilterPanel((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth"
            style={{
              border: "1px solid var(--border)",
              background: hasActiveFilters(filters) ? "var(--accent-soft)" : "var(--surface-1)",
              color: hasActiveFilters(filters) ? "var(--accent)" : "var(--text-2)",
            }}
          >
            <Filter className="w-4 h-4" />
            Filter
            {countActiveFilters(filters) > 0 && (
              <span
                className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {countActiveFilters(filters)}
              </span>
            )}
          </button>
          <FilterChips
            filters={filters}
            onChange={setFilters}
            onClearAll={() => setFilters(emptyFilters)}
            users={users}
            categories={categories}
            projects={projects}
          />
        </div>
      </div>

      {/* Filter panel (collapsible) */}
      {showFilterPanel && (
        <div className="px-5 pt-3">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            users={users}
            categories={categories}
            projects={projects}
            onClose={() => setShowFilterPanel(false)}
          />
        </div>
      )}

      {/* Kanban view */}
      <div className="flex-1 overflow-x-auto p-4 view-enter">
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
                  onStatusChange={handleStatusChange}
                  onAddTask={handleColumnAddTask}
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

      <QuickAddModal
        key={`${quickAddDefaults.assignee}-${quickAddDefaults.category}`}
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        users={users}
        categories={categories}
        projects={projects as any}
        defaultAssignee={quickAddDefaults.assignee}
        defaultCategory={quickAddDefaults.category}
      />
    </div>
  );
}

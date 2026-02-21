"use client";

import { useState, useTransition } from "react";
import { updateTask, deleteTask, assignTaskToUsers, unassignTaskFromUser, assignTaskToGroup, unassignTaskFromGroup, createSubtask, toggleSubtask, deleteSubtask } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import {
  STATUSES,
  STATUS_COLORS,
  formatDate,
  isOverdue,
} from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  FolderOpen,
  Trash2,
  Activity,
  Users,
  UsersRound,
  Plus,
  X,
  ListChecks,
  Check,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task, User, AuditLog, Category, TaskAssignee, TaskGroupAssignment, UserGroup, Subtask } from "@/db/schema";

type TaskFull = Task & {
  assignedTo: User | null;
  createdBy: User;
  auditLogs: (AuditLog & { user: User })[];
  additionalAssignees?: (TaskAssignee & { user: User })[];
  groupAssignments?: (TaskGroupAssignment & { group: UserGroup })[];
  subtasks?: Subtask[];
};

const ACTION_LABELS: Record<string, string> = {
  created: "created this task",
  assignment_changed: "changed assignee",
  category_changed: "changed category",
  status_changed: "changed status",
  priority_changed: "changed priority",
  due_date_changed: "changed deadline",
  title_changed: "changed title",
  description_changed: "changed description",
};

export function TaskDetailClient({
  task: initialTask,
  users,
  categories,
  groups = [],
}: {
  task: TaskFull;
  users: User[];
  categories: Category[];
  groups?: (UserGroup & { members: any[] })[];
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const handleUpdate = (field: string, value: any) => {
    startTransition(async () => {
      await updateTask(task.id, { [field]: value });
      setTask((prev) => ({ ...prev, [field]: value }));
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => {
      await deleteTask(task.id);
      router.push("/");
    });
  };

  const handleAddAssignee = (userId: string) => {
    startTransition(async () => {
      await assignTaskToUsers(task.id, [userId]);
      router.refresh();
    });
    setShowAddAssignee(false);
  };

  const handleRemoveAssignee = (userId: string) => {
    startTransition(async () => {
      await unassignTaskFromUser(task.id, userId);
      router.refresh();
    });
  };

  const handleAddGroup = (groupId: string) => {
    startTransition(async () => {
      await assignTaskToGroup(task.id, groupId);
      router.refresh();
    });
    setShowAddGroup(false);
  };

  const handleRemoveGroup = (groupId: string) => {
    startTransition(async () => {
      await unassignTaskFromGroup(task.id, groupId);
      router.refresh();
    });
  };

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    startTransition(async () => {
      await createSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      router.refresh();
    });
  };

  const handleToggleSubtask = (subtaskId: string, completed: boolean) => {
    startTransition(async () => {
      await toggleSubtask(subtaskId, completed);
      router.refresh();
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    startTransition(async () => {
      await deleteSubtask(subtaskId);
      router.refresh();
    });
  };

  const overdue = isOverdue(task.dueDate) && task.status !== "Done";

  const assignedUserIds = new Set([
    task.assignedToUserId,
    ...(task.additionalAssignees?.map((a) => a.userId) || []),
  ].filter(Boolean));
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id));

  const assignedGroupIds = new Set(task.groupAssignments?.map((g) => g.groupId) || []);
  const availableGroups = groups.filter((g) => !assignedGroupIds.has(g.id));

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top bar */}
      <div className="bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm [color:var(--text-3)] hover:[color:var(--text-2)] transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to board
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-sm [color:var(--text-3)] hover:text-red-500 transition-smooth"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          {/* Left column â Main content */}
          <div className="space-y-5">
            {/* Title + description */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-5">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold w-full border-b-2 border-[var(--border)] bg-transparent px-1 py-2 [color:var(--text)] focus:outline-none focus:border-[var(--accent)] transition-smooth"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full border-b border-[var(--border)] bg-transparent px-1 py-2 text-sm [color:var(--text)] placeholder:[color:var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-smooth resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleUpdate("title", title);
                        handleUpdate("description", description);
                        setEditing(false);
                      }}
                      className="px-3 py-1.5 bg-[var(--accent)] text-white text-sm rounded-lg hover:bg-[var(--accent)]/90 transition-smooth"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTitle(task.title);
                        setDescription(task.description || "");
                        setEditing(false);
                      }}
                      className="px-3 py-1.5 [color:var(--text-2)] text-sm hover:bg-[var(--surface-2)] rounded-lg transition-smooth"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditing(true)}
                  className="cursor-pointer group"
                >
                  <h1 className="text-xl font-semibold [color:var(--text)] group-hover:[color:var(--accent)] transition-smooth">
                    {task.title}
                  </h1>
                  {task.description ? (
                    <p className="mt-2 text-sm [color:var(--text-2)] leading-relaxed">{task.description}</p>
                  ) : (
                    <p className="mt-2 text-sm [color:var(--text-3)] italic">
                      Click to add a description...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sub-tasks */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold [color:var(--text-2)] uppercase tracking-wide">
                  <ListChecks className="w-4 h-4" />
                  Sub-tasks
                  {(task.subtasks?.length ?? 0) > 0 && (
                    <span className="[color:var(--text-3)] font-normal normal-case">
                      {task.subtasks?.filter((s) => s.completed).length}/{task.subtasks?.length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowAddSubtask(!showAddSubtask)}
                  className="flex items-center gap-1 text-xs [color:var(--accent)] hover:[color:var(--accent)] transition-smooth"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {(task.subtasks?.length ?? 0) > 0 && (
                <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 mb-3">
                  <div
                    className="bg-[var(--accent)] h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((task.subtasks?.filter((s) => s.completed).length ?? 0) /
                          (task.subtasks?.length ?? 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              )}

              {showAddSubtask && (
                <div className="flex gap-2 mb-3">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateSubtask()}
                    placeholder="What needs to be done?"
                    className="flex-1 border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-smooth"
                  />
                  <button
                    onClick={handleCreateSubtask}
                    disabled={isPending || !newSubtaskTitle.trim()}
                    className="px-3 py-1.5 bg-[var(--accent)] text-white text-sm rounded-lg disabled:opacity-50 hover:bg-[var(--accent)]/90 transition-smooth"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {(!task.subtasks || task.subtasks.length === 0) && !showAddSubtask && (
                  <p className="text-xs [color:var(--text-3)]">No sub-tasks yet</p>
                )}
                {task.subtasks
                  ?.sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 group py-1"
                    >
                      <button
                        onClick={() => handleToggleSubtask(sub.id, !sub.completed)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-smooth ${
                          sub.completed
                            ? "bg-[var(--accent)] border-[#1a3a2a] text-white"
                            : "border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {sub.completed && <Check className="w-3 h-3" />}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          sub.completed
                            ? "[color:var(--text-3)] line-through"
                            : "[color:var(--text)]"
                        }`}
                      >
                        {sub.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 [color:var(--text-3)] hover:text-red-500 transition-smooth"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Activity / Audit Trail â collapsible */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-1)] transition-smooth"
              >
                <h2 className="flex items-center gap-2 text-xs font-semibold [color:var(--text-2)] uppercase tracking-wide">
                  <Activity className="w-4 h-4" />
                  Activity
                  <span className="[color:var(--text-3)] font-normal normal-case">({task.auditLogs.length})</span>
                </h2>
                <ChevronDown className={`w-4 h-4 [color:var(--text-3)] transition-smooth ${showActivity ? "rotate-180" : ""}`} />
              </button>

              {showActivity && (
                <div className="px-5 pb-4 space-y-3 border-t border-[var(--border)]/60">
                  <div className="pt-3" />
                  {task.auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-medium [color:var(--text-2)] shrink-0 mt-0.5">
                        {(log.user?.name || log.user?.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm [color:var(--text-2)]">
                          <span className="font-medium [color:var(--text)]">
                            {log.user?.name || log.user?.email}
                          </span>{" "}
                          {ACTION_LABELS[log.action] || log.action}
                          {log.oldValue && log.newValue && (
                            <span className="[color:var(--text-3)]">
                              {" "}
                              from{" "}
                              <span className="line-through">{log.oldValue}</span> to{" "}
                              <span className="font-medium [color:var(--text-2)]">{log.newValue}</span>
                            </span>
                          )}
                          {!log.oldValue && log.newValue && log.action !== "created" && (
                            <span className="[color:var(--text-3)]">
                              {" "}
                              to <span className="font-medium [color:var(--text-2)]">{log.newValue}</span>
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] [color:var(--text-3)] mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {task.auditLogs.length === 0 && (
                    <p className="text-sm [color:var(--text-3)] text-center py-4">
                      No activity yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column â Properties sidebar */}
          <div className="space-y-4">
            {/* Status & Priority */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1.5 block">
                  Status
                </label>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdate("status", e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm [color:var(--text)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-smooth"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  Primary Assignee
                </label>
                <select
                  value={task.assignedToUserId || ""}
                  onChange={(e) =>
                    handleUpdate("assignedToUserId", e.target.value || null)
                  }
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm [color:var(--text)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-smooth"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Category
                </label>
                <select
                  value={task.category}
                  onChange={(e) => handleUpdate("category", e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm [color:var(--text)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-smooth"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Deadline
                </label>
                <input
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) =>
                    handleUpdate("dueDate", e.target.value || null)
                  }
                  className={`w-full border rounded-lg px-3 py-1.5 text-sm bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-smooth ${
                    overdue
                      ? "border-red-300 text-red-500"
                      : "border-[var(--border)] [color:var(--text)]"
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Created
                </label>
                <p className="text-sm [color:var(--text-2)] px-1">
                  {formatDate(task.createdAt?.toString())} by{" "}
                  {task.createdBy?.name || task.createdBy?.email}
                </p>
              </div>
            </div>

            {/* Additional Assignees */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold [color:var(--text-3)] uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5" />
                  Team
                </h2>
                {availableUsers.length > 0 && (
                  <button
                    onClick={() => setShowAddAssignee(!showAddAssignee)}
                    className="[color:var(--text-3)] hover:[color:var(--accent)] transition-smooth"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {showAddAssignee && (
                <div className="mb-2">
                  <select
                    value=""
                    onChange={(e) => e.target.value && handleAddAssignee(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm [color:var(--text)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
                  >
                    <option value="">Select a person...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                {(!task.additionalAssignees || task.additionalAssignees.length === 0) && (
                  <p className="text-[11px] [color:var(--text-3)]">No additional assignees</p>
                )}
                {task.additionalAssignees?.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    {a.user?.image ? (
                      <img src={a.user.image} alt="" className="w-5 h-5 rounded-full ring-1 ring-[var(--border)]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-medium [color:var(--text-2)]">
                        {(a.user?.name || a.user?.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-[11px] [color:var(--text-2)] truncate">{a.user?.name || a.user?.email}</span>
                    <button
                      onClick={() => handleRemoveAssignee(a.userId)}
                      disabled={isPending}
                      className="p-0.5 rounded hover:bg-red-50 [color:var(--text-3)] hover:text-red-500 transition-smooth"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Assignments */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold [color:var(--text-3)] uppercase tracking-wide">
                  <UsersRound className="w-3.5 h-3.5" />
                  Groups
                </h2>
                {availableGroups.length > 0 && (
                  <button
                    onClick={() => setShowAddGroup(!showAddGroup)}
                    className="[color:var(--text-3)] hover:[color:var(--accent)] transition-smooth"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {showAddGroup && (
                <div className="mb-2">
                  <select
                    value=""
                    onChange={(e) => e.target.value && handleAddGroup(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm [color:var(--text)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
                  >
                    <option value="">Select a group...</option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.members.length} members)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                {(!task.groupAssignments || task.groupAssignments.length === 0) && (
                  <p className="text-[11px] [color:var(--text-3)]">No group assignments</p>
                )}
                {task.groupAssignments?.map((ga) => (
                  <div key={ga.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded border shrink-0 ${ga.group?.color || "bg-stone-50 border-[var(--border)]"}`} />
                    <span className="flex-1 text-[11px] [color:var(--text-2)] truncate">{ga.group?.name}</span>
                    <button
                      onClick={() => handleRemoveGroup(ga.groupId)}
                      disabled={isPending}
                      className="p-0.5 rounded hover:bg-red-50 [color:var(--text-3)] hover:text-red-500 transition-smooth"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

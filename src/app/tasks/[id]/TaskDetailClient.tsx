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

  // Get users not already assigned
  const assignedUserIds = new Set([
    task.assignedToUserId,
    ...(task.additionalAssignees?.map((a) => a.userId) || []),
  ].filter(Boolean));
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id));

  // Get groups not already assigned
  const assignedGroupIds = new Set(task.groupAssignments?.map((g) => g.groupId) || []);
  const availableGroups = groups.filter((g) => !assignedGroupIds.has(g.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to board
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Title + description */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {editing ? (
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleUpdate("title", title);
                    handleUpdate("description", description);
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 bg-[#1a3a2a] text-white text-sm rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitle(task.title);
                    setDescription(task.description || "");
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
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
              <h1 className="text-xl font-semibold text-slate-900 group-hover:text-[#1a3a2a]">
                {task.title}
              </h1>
              {task.description ? (
                <p className="mt-2 text-sm text-slate-600">{task.description}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">
                  Click to add a description...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Properties */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Primary Assignee
              </label>
              <select
                value={task.assignedToUserId || ""}
                onChange={(e) =>
                  handleUpdate(
                    "assignedToUserId",
                    e.target.value || null
                  )
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
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
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                Category
              </label>
              <select
                value={task.category}
                onChange={(e) => handleUpdate("category", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleUpdate("status", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Deadline
              </label>
              <input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) =>
                  handleUpdate("dueDate", e.target.value || null)
                }
                className={`w-full border rounded-lg px-3 py-1.5 text-sm ${
                  overdue
                    ? "border-red-300 text-red-600"
                    : "border-slate-200"
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                Created
              </label>
              <p className="text-sm text-slate-700 px-1">
                {formatDate(task.createdAt?.toString())} by{" "}
                {task.createdBy?.name || task.createdBy?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Assignees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users className="w-4 h-4" />
              Additional Assignees
            </h2>
            {availableUsers.length > 0 && (
              <button
                onClick={() => setShowAddAssignee(!showAddAssignee)}
                className="flex items-center gap-1 text-xs text-[#1a3a2a] hover:text-[#1a3a2a]/80"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          {showAddAssignee && (
            <div className="mb-3">
              <select
                value=""
                onChange={(e) => e.target.value && handleAddAssignee(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
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

          <div className="space-y-2">
            {(!task.additionalAssignees || task.additionalAssignees.length === 0) && (
              <p className="text-xs text-slate-400">No additional assignees</p>
            )}
            {task.additionalAssignees?.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                {a.user?.image ? (
                  <img src={a.user.image} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500">
                    {(a.user?.name || a.user?.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-slate-700">{a.user?.name || a.user?.email}</span>
                <button
                  onClick={() => handleRemoveAssignee(a.userId)}
                  disabled={isPending}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Group Assignments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UsersRound className="w-4 h-4" />
              Group Assignments
            </h2>
            {availableGroups.length > 0 && (
              <button
                onClick={() => setShowAddGroup(!showAddGroup)}
                className="flex items-center gap-1 text-xs text-[#1a3a2a] hover:text-[#1a3a2a]/80"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          {showAddGroup && (
            <div className="mb-3">
              <select
                value=""
                onChange={(e) => e.target.value && handleAddGroup(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
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

          <div className="space-y-2">
            {(!task.groupAssignments || task.groupAssignments.length === 0) && (
              <p className="text-xs text-slate-400">No group assignments</p>
            )}
            {task.groupAssignments?.map((ga) => (
              <div key={ga.id} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded border-2 shrink-0 ${ga.group?.color || "bg-slate-50 border-slate-200"}`} />
                <span className="flex-1 text-slate-700">{ga.group?.name}</span>
                <button
                  onClick={() => handleRemoveGroup(ga.groupId)}
                  disabled={isPending}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ListChecks className="w-4 h-4" />
              Sub-tasks
              {(task.subtasks?.length ?? 0) > 0 && (
                <span className="text-xs font-normal text-slate-400">
                  {task.subtasks?.filter((s) => s.completed).length}/{task.subtasks?.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowAddSubtask(!showAddSubtask)}
              className="flex items-center gap-1 text-xs text-[#1a3a2a] hover:text-[#1a3a2a]/80"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Progress bar */}
          {(task.subtasks?.length ?? 0) > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
              <div
                className="bg-[#1a3a2a] h-1.5 rounded-full transition-all"
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
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
              />
              <button
                onClick={handleCreateSubtask}
                disabled={isPending || !newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-[#1a3a2a] text-white text-sm rounded-lg disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-1">
            {(!task.subtasks || task.subtasks.length === 0) && !showAddSubtask && (
              <p className="text-xs text-slate-400">No sub-tasks yet</p>
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
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      sub.completed
                        ? "bg-[#1a3a2a] border-[#1a3a2a] text-white"
                        : "border-slate-300 hover:border-[#1a3a2a]"
                    }`}
                  >
                    {sub.completed && <Check className="w-3 h-3" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      sub.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Activity / Audit Trail */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
            <Activity className="w-4 h-4" />
            Activity
          </h2>
          <div className="space-y-3">
            {task.auditLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500 shrink-0 mt-0.5">
                  {(log.user?.name || log.user?.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">
                      {log.user?.name || log.user?.email}
                    </span>{" "}
                    {ACTION_LABELS[log.action] || log.action}
                    {log.oldValue && log.newValue && (
                      <span className="text-slate-500">
                        {" "}
                        from{" "}
                        <span className="line-through">{log.oldValue}</span> to{" "}
                        <span className="font-medium">{log.newValue}</span>
                      </span>
                    )}
                    {!log.oldValue && log.newValue && log.action !== "created" && (
                      <span className="text-slate-500">
                        {" "}
                        to <span className="font-medium">{log.newValue}</span>
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
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
              <p className="text-sm text-slate-400 text-center py-4">
                No activity yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

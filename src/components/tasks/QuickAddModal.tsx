"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { createTask } from "@/actions/tasks";
import { STATUSES } from "@/lib/utils";
import { X } from "lucide-react";
import type { User, Category, UserGroup, UserGroupMember } from "@/db/schema";

type GroupWithMembers = UserGroup & {
  members: (UserGroupMember & { user: User })[];
};

export function QuickAddModal({
  open,
  onClose,
  users,
  categories,
  groups = [],
}: {
  open: boolean;
  onClose: () => void;
  users: User[];
  categories: Category[];
  groups?: GroupWithMembers[];
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [additionalAssignees, setAdditionalAssignees] = useState<string[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(categories[0]?.name || "Operations");
  const [status, setStatus] = useState<string>("Backlog");
  const [dueDate, setDueDate] = useState("");

  const toggleAssignee = (userId: string) => {
    setAdditionalAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleGroup = (groupId: string) => {
    setAssignedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createTask({
        title: title.trim(),
        assignedToUserId: assignee || undefined,
        category: category as any,
        status: status as any,
        dueDate: dueDate || undefined,
        additionalAssigneeIds: additionalAssignees.length > 0 ? additionalAssignees : undefined,
        assignedGroupIds: assignedGroups.length > 0 ? assignedGroups : undefined,
      });
      setTitle("");
      setAssignee("");
      setAdditionalAssignees([]);
      setAssignedGroups([]);
      setCategory(categories[0]?.name || "Operations");
      setStatus("Backlog");
      setDueDate("");
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick Add Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30 focus:border-[#1a3a2a]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Assignees */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Assignees
          </label>
          <div className="flex flex-wrap gap-1.5">
            {users
              .filter((u) => u.id !== assignee)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    additionalAssignees.includes(u.id)
                      ? "bg-[#1a3a2a] text-white border-[#1a3a2a]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {additionalAssignees.includes(u.id) && "\u2713 "}
                  {u.name || u.email}
                </button>
              ))}
          </div>
        </div>

        {/* Assign to Groups */}
        {groups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assign to Groups
            </label>
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    assignedGroups.includes(g.id)
                      ? "bg-[#1a3a2a] text-white border-[#1a3a2a]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {assignedGroups.includes(g.id) && "\u2713 "}
                  {g.name} ({g.members.length})
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

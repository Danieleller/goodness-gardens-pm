"use client";

import { useState, useTransition } from "react";
import { updateUserManager } from "@/actions/admin";
import { ChevronDown, ChevronRight, UserCog, X } from "lucide-react";
import type { User } from "@/db/schema";

type UserWithManager = User & { manager: User | null };

interface TeamDirectoryProps {
  users: UserWithManager[];
  currentUserRole: string;
}

export function TeamDirectory({ users, currentUserRole }: TeamDirectoryProps) {
  const isAdmin = currentUserRole === "admin";
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(
    new Set(users.filter((u) => users.some((r) => r.managerId === u.id)).map((u) => u.id))
  );

  // Group users: managers (people who have reports) and their direct reports
  const managersWithReports = new Map<string, UserWithManager[]>();
  const unassigned: UserWithManager[] = [];

  for (const user of users) {
    if (user.managerId) {
      const reports = managersWithReports.get(user.managerId) || [];
      reports.push(user);
      managersWithReports.set(user.managerId, reports);
    } else {
      // Check if this person is a manager (has reports) — they'll show as a section header
      if (!users.some((u) => u.managerId === user.id)) {
        unassigned.push(user);
      }
    }
  }

  // Get managers (users who have direct reports assigned to them)
  const managerIds = Array.from(managersWithReports.keys());
  const managers = managerIds
    .map((id) => users.find((u) => u.id === id)!)
    .filter(Boolean)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const toggleExpand = (managerId: string) => {
    setExpandedManagers((prev) => {
      const next = new Set(prev);
      if (next.has(managerId)) next.delete(managerId);
      else next.add(managerId);
      return next;
    });
  };

  const handleSetManager = (userId: string, managerId: string | null) => {
    startTransition(async () => {
      await updateUserManager(userId, managerId);
      setEditingUser(null);
      // Force refresh
      window.location.reload();
    });
  };

  const UserCard = ({ user, indent = false }: { user: UserWithManager; indent?: boolean }) => (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        marginLeft: indent ? 32 : 0,
      }}
    >
      {/* Avatar */}
      {user.image ? (
        <img
          src={user.image}
          alt=""
          className="w-10 h-10 rounded-full shrink-0"
          style={{ border: "1px solid var(--border)" }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {(user.name || user.email || "?")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
          {user.name || user.email}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
          {user.email}
        </p>
      </div>

      {/* Role badge */}
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
        style={{
          background: "var(--surface-2)",
          color: "var(--text-3)",
          border: "1px solid var(--border)",
        }}
      >
        {user.role}
      </span>

      {/* Manager assignment (admin only) */}
      {isAdmin && (
        <>
          {editingUser === user.id ? (
            <div className="flex items-center gap-1">
              <select
                value={user.managerId || ""}
                onChange={(e) => handleSetManager(user.id, e.target.value || null)}
                disabled={isPending}
                className="text-xs rounded-lg px-2 py-1.5 border"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                <option value="">No manager</option>
                {users
                  .filter((u) => u.id !== user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded"
                style={{ color: "var(--text-3)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingUser(user.id)}
              className="p-1.5 rounded-lg transition-smooth shrink-0"
              style={{ color: "var(--text-3)" }}
              title="Set manager"
            >
              <UserCog className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Manager sections */}
      {managers.map((manager) => {
        const reports = managersWithReports.get(manager.id) || [];
        const expanded = expandedManagers.has(manager.id);

        return (
          <div key={manager.id}>
            {/* Manager header */}
            <button
              onClick={() => toggleExpand(manager.id)}
              className="flex items-center gap-2 mb-2 px-1"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-3)" }} />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                {manager.name || manager.email}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-3)",
                  border: "1px solid var(--border)",
                }}
              >
                {reports.length} direct {reports.length === 1 ? "report" : "reports"}
              </span>
            </button>

            {expanded && (
              <div className="space-y-2">
                {/* The manager's own card */}
                <UserCard user={manager} />
                {/* Direct reports */}
                {reports
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .map((report) => (
                    <UserCard key={report.id} user={report} indent />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned section */}
      {unassigned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              No Manager Assigned
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-3)",
                border: "1px solid var(--border)",
              }}
            >
              {unassigned.length}
            </span>
          </div>
          <div className="space-y-2">
            {unassigned
              .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
              .map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No team members yet.
          </p>
        </div>
      )}
    </div>
  );
}

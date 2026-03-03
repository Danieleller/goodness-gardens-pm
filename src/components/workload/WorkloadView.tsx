"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { isOverdue } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";
import type { User } from "@/db/schema";

type UserWorkload = {
  id: string;
  name: string;
  email: string;
  total: number;
  overdue: number;
  backlog: number;
  doing: number;
  blocked: number;
  done: number;
};

export function WorkloadView({
  tasks,
  users,
}: {
  tasks: TaskWithRelations[];
  users: User[];
}) {
  const workloads = useMemo(() => {
    const map = new Map<string, UserWorkload>();

    // Initialize all users
    for (const user of users) {
      map.set(user.id, {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        total: 0,
        overdue: 0,
        backlog: 0,
        doing: 0,
        blocked: 0,
        done: 0,
      });
    }

    // Unassigned bucket
    map.set("__unassigned__", {
      id: "__unassigned__",
      name: "Unassigned",
      email: "",
      total: 0,
      overdue: 0,
      backlog: 0,
      doing: 0,
      blocked: 0,
      done: 0,
    });

    for (const task of tasks) {
      const key = task.assignedToUserId || "__unassigned__";
      let entry = map.get(key);
      if (!entry) {
        // User exists in tasks but wasn't in users list
        entry = {
          id: key,
          name: task.assignedTo?.name || task.assignedTo?.email || "Unknown",
          email: task.assignedTo?.email || "",
          total: 0,
          overdue: 0,
          backlog: 0,
          doing: 0,
          blocked: 0,
          done: 0,
        };
        map.set(key, entry);
      }

      entry.total++;
      if (task.status !== "Done" && isOverdue(task.dueDate)) entry.overdue++;

      switch (task.status) {
        case "Backlog": entry.backlog++; break;
        case "Doing": entry.doing++; break;
        case "Blocked": entry.blocked++; break;
        case "Done": entry.done++; break;
      }
    }

    // Sort by active task count descending, keep Unassigned at end
    return Array.from(map.values())
      .filter((w) => w.total > 0 || w.id !== "__unassigned__")
      .sort((a, b) => {
        if (a.id === "__unassigned__") return 1;
        if (b.id === "__unassigned__") return -1;
        return (b.total - b.done) - (a.total - a.done);
      });
  }, [tasks, users]);

  if (workloads.every((w) => w.total === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 view-enter">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--surface-2)" }}>
          <BarChart3 className="w-6 h-6" style={{ color: "var(--text-3)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>No workload data</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Assign tasks to team members to see their workload</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-5 view-enter">
      <div className="grid gap-3 max-w-4xl">
        {workloads.map((w) => {
          const active = w.total - w.done;
          const barTotal = w.total || 1;

          return (
            <div
              key={w.id}
              className="rounded-xl p-4 transition-smooth hover:shadow-sm"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{
                      background: w.id === "__unassigned__" ? "var(--surface-2)" : "var(--accent-soft)",
                      color: w.id === "__unassigned__" ? "var(--text-3)" : "var(--accent)",
                    }}
                  >
                    {w.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{w.name}</p>
                    {w.email && (
                      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{w.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{active}</p>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Active</p>
                  </div>
                  {w.overdue > 0 && (
                    <div>
                      <p className="text-lg font-semibold" style={{ color: "var(--overdue)" }}>{w.overdue}</p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Overdue</p>
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{w.total}</p>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Total</p>
                  </div>
                </div>
              </div>

              {/* Stacked status bar */}
              <div className="flex rounded-full h-3 overflow-hidden" style={{ background: "var(--surface-2)" }}>
                {w.backlog > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(w.backlog / barTotal) * 100}%`, background: "var(--text-3)" }}
                    title={`Backlog: ${w.backlog}`}
                  />
                )}
                {w.doing > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(w.doing / barTotal) * 100}%`, background: "var(--progress)" }}
                    title={`Doing: ${w.doing}`}
                  />
                )}
                {w.blocked > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(w.blocked / barTotal) * 100}%`, background: "var(--blocked)" }}
                    title={`Blocked: ${w.blocked}`}
                  />
                )}
                {w.done > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(w.done / barTotal) * 100}%`, background: "var(--done)" }}
                    title={`Done: ${w.done}`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                {w.backlog > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--text-3)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Backlog {w.backlog}</span>
                  </div>
                )}
                {w.doing > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--progress)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Doing {w.doing}</span>
                  </div>
                )}
                {w.blocked > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--blocked)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Blocked {w.blocked}</span>
                  </div>
                )}
                {w.done > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--done)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Done {w.done}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

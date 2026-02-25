"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { QuickAddModal } from "@/components/tasks/QuickAddModal";
import { Plus, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { User, Notification, Task, Category, UserGroup, UserGroupMember } from "@/db/schema";

type NotifWithTask = Notification & { task: Task | null };
type GroupWithMembers = UserGroup & { members: (UserGroupMember & { user: User })[] };

export function Header({
  user,
  users,
  notifications,
  categories,
  groups = [],
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  users: User[];
  notifications: NotifWithTask[];
  categories: Category[];
  groups?: GroupWithMembers[];
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <header
        className="backdrop-blur-md sticky top-0 z-40"
        style={{
          background: "color-mix(in srgb, var(--surface-1) 80%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-4 px-5 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <span className="text-white font-bold text-xs tracking-tight">GG</span>
            </div>
            <div className="hidden sm:block">
              <p
                className="text-sm font-semibold leading-none"
                style={{ color: "var(--text)" }}
              >
                Goodness Gardens
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                Task Manager
              </p>
            </div>
          </div>

          {/* Search */}
          <SearchBar />

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-smooth"
              style={{ background: "var(--accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            <NotificationBell notifications={notifications} />

            {user.role === "admin" && (
              <Link
                href="/settings"
                className="p-2 rounded-lg transition-smooth"
                style={{ color: "var(--text-3)" }}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}

            <div
              className="flex items-center gap-2 ml-2 pl-3"
              style={{ borderLeft: "1px solid var(--border)" }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  style={{ border: "1px solid var(--border)" }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-3)",
                  }}
                >
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <span
                className="hidden md:block text-sm max-w-[120px] truncate"
                style={{ color: "var(--text-2)" }}
              >
                {user.name || user.email}
              </span>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
                className="p-1.5 rounded-lg transition-smooth"
                style={{ color: "var(--text-3)" }}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <QuickAddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        users={users}
        categories={categories}
        groups={groups}
      />
    </>
  );
}

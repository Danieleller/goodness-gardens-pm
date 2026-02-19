"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { QuickAddModal } from "@/components/tasks/QuickAddModal";
import { Plus, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-4 px-4 py-2.5">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#1a3a2a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">GG</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                Goodness Gardens
              </p>
              <p className="text-[11px] text-slate-400">Task Manager</p>
            </div>
          </div>

          {/* Search */}
          <SearchBar />

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            <NotificationBell notifications={notifications} />

            {user.role === "admin" && (
              <Link
                href="/settings"
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}

            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="hidden md:block text-sm text-slate-600 max-w-[120px] truncate">
                {user.name || user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"
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

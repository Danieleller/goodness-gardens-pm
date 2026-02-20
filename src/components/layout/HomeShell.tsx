"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout";
import { saveUserPrefs } from "@/actions/userPrefs";

/* ═══════════════════════════════════════════════════
   HomeShell — Client wrapper for sidebar + content
   Manages sidebar collapsed state and provides
   the flex-row layout (sidebar left, content right).
   ═══════════════════════════════════════════════════ */

interface HomeShellProps {
  children: React.ReactNode;
  currentPath?: string;
  taskCount?: number;
  projectCount?: number;
  teamCount?: number;
  userName?: string;
  userImage?: string | null;
  /** Server-fetched initial sidebar state */
  initialCollapsed?: boolean;
}

export function HomeShell({
  children,
  currentPath = "/",
  taskCount,
  projectCount,
  teamCount,
  userName,
  userImage,
  initialCollapsed = false,
}: HomeShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      // Persist to database (fire-and-forget)
      saveUserPrefs({ sidebarCollapsed: next }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <div className="flex h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar
        currentPath={currentPath}
        taskCount={taskCount}
        projectCount={projectCount}
        teamCount={teamCount}
        userName={userName}
        userImage={userImage}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

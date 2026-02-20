"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout";

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
}

export function HomeShell({
  children,
  currentPath = "/",
  taskCount,
  projectCount,
  teamCount,
  userName,
  userImage,
}: HomeShellProps) {
  const [collapsed, setCollapsed] = useState(false);

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
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

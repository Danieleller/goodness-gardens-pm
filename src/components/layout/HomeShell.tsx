"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { Sidebar } from "@/components/layout";
import { saveUserPrefs } from "@/actions/userPrefs";

/* ═══════════════════════════════════════════════════
   HomeShell — Client wrapper for sidebar + content
   Manages sidebar collapsed state and provides
   the flex-row layout (sidebar left, content right).
   ═══════════════════════════════════════════════════ */

// Context so Header can trigger mobile sidebar
const MobileMenuContext = createContext<(() => void) | null>(null);
export function useMobileMenu() {
  return useContext(MobileMenuContext);
}

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      saveUserPrefs({ sidebarCollapsed: next }).catch(() => {});
      return next;
    });
  }, []);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <MobileMenuContext.Provider value={handleMobileToggle}>
      <div className="flex h-screen" style={{ background: "var(--bg)" }}>
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
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
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-slide-in-left">
              <Sidebar
                currentPath={currentPath}
                taskCount={taskCount}
                projectCount={projectCount}
                teamCount={teamCount}
                userName={userName}
                userImage={userImage}
                collapsed={false}
                onToggleCollapse={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}

        <div className="flex flex-col flex-1 min-w-0">
          {children}
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
}

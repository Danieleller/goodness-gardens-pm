"use client";

import { useState, useCallback } from "react";
import { CheckSquare, FolderKanban, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";

/* ═══════════════════════════════════════════════════
   Sidebar — Persistent left navigation
   Design spec: 220px expanded · 56px collapsed
   Nav items: My Work | Projects | Team
   Bottom: theme toggle + user mini-avatar
   ═══════════════════════════════════════════════════ */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface SidebarProps {
  currentPath?: string;
  taskCount?: number;
  projectCount?: number;
  teamCount?: number;
  userName?: string;
  userImage?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentPath = "/",
  taskCount,
  projectCount,
  teamCount,
  userName,
  userImage,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: "my-work",
      label: "My Work",
      icon: <CheckSquare className="w-4 h-4" />,
      href: "/",
      badge: taskCount,
    },
    {
      id: "projects",
      label: "Projects",
      icon: <FolderKanban className="w-4 h-4" />,
      href: "/projects",
      badge: projectCount,
    },
    {
      id: "team",
      label: "Team",
      icon: <Users className="w-4 h-4" />,
      href: "/team",
      badge: teamCount,
    },
  ];

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return currentPath === "/";
      return currentPath.startsWith(href);
    },
    [currentPath]
  );

  return (
    <aside
      className="flex flex-col h-full shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? 56 : 220,
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ── Logo + collapse toggle ── */}
      <div
        className="flex items-center shrink-0 px-3"
        style={{
          height: 56,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center shrink-0 rounded-lg font-bold text-sm"
          style={{
            width: 32,
            height: 32,
            background: "var(--accent)",
            color: "white",
          }}
        >
          GG
        </div>

        {!collapsed && (
          <span
            className="ml-2.5 text-sm font-semibold truncate"
            style={{ color: "var(--text)" }}
          >
            Goodness Gardens
          </span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded-md transition-colors"
          style={{ color: "var(--text-3)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ── Navigation items ── */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const hovered = hoveredItem === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 rounded-lg transition-colors relative"
              style={{
                height: 40,
                padding: collapsed ? "0 8px" : "0 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active
                  ? "var(--accent-soft)"
                  : hovered
                  ? "var(--surface-2)"
                  : "transparent",
                color: active ? "var(--accent)" : "var(--text-2)",
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                  style={{
                    width: 3,
                    height: 20,
                    background: "var(--accent)",
                  }}
                />
              )}

              <span className="shrink-0">{item.icon}</span>

              {!collapsed && (
                <>
                  <span className="text-sm truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-3)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </a>
          );
        })}
      </nav>

      {/* ── Bottom section: theme toggle + user ── */}
      <div
        className="shrink-0 px-2 py-3 space-y-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Theme toggle */}
        <div
          className="flex items-center rounded-lg px-2"
          style={{
            height: 36,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          {collapsed ? (
            <ThemeToggle />
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                Theme
              </span>
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* User mini-profile */}
        {userName && (
          <div
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            style={{
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium overflow-hidden"
              style={{
                background: userImage ? "transparent" : "var(--accent-soft)",
                color: "var(--accent)",
              }}
              title={userName}
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            {!collapsed && (
              <span
                className="text-xs truncate"
                style={{ color: "var(--text-2)" }}
              >
                {userName}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

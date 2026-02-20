"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Bell, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════
   NotificationTray — 4th glass overlay
   Right-side slide-in tray with backdrop-filter blur.
   Shows task assignments, due-date reminders, and
   status changes. Glass morphism per design spec.
   ═══════════════════════════════════════════════════ */

export interface NotificationItem {
  id: string;
  type: "assignment" | "due-soon" | "status-change" | "mention" | "overdue";
  title: string;
  body: string;
  timestamp: string; // ISO
  read: boolean;
  taskId?: string;
}

interface NotificationTrayProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead?: (notifId: string) => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notifId: string, taskId?: string) => void;
}

const TYPE_ICON: Record<NotificationItem["type"], React.ReactNode> = {
  assignment: <Bell className="w-3.5 h-3.5" />,
  "due-soon": <Clock className="w-3.5 h-3.5" />,
  "status-change": <Check className="w-3.5 h-3.5" />,
  mention: <AlertCircle className="w-3.5 h-3.5" />,
  overdue: <AlertCircle className="w-3.5 h-3.5" />,
};

const TYPE_COLOR: Record<NotificationItem["type"], string> = {
  assignment: "var(--accent)",
  "due-soon": "var(--progress)",
  "status-change": "var(--done)",
  mention: "var(--accent)",
  overdue: "var(--overdue)",
};

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationTray({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
}: NotificationTrayProps) {
  const trayRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Escape to close ── */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleNotifClick = useCallback(
    (notif: NotificationItem) => {
      if (!notif.read) {
        onMarkRead?.(notif.id);
      }
      onNotificationClick?.(notif.id, notif.taskId);
    },
    [onMarkRead, onNotificationClick]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: "var(--overlay-dim)", zIndex: 80 }}
        onClick={onClose}
      />

      {/* Tray — glass morphism */}
      <div
        ref={trayRef}
        className="fixed top-0 right-0 h-full drawer-enter overflow-hidden flex flex-col"
        style={{
          width: "min(380px, 90vw)",
          zIndex: 81,
        }}
      >
        {/* Glass background */}
        <div
          className="absolute inset-0 glass-overlay"
          style={{ borderRadius: 0 }}
        />

        {/* Content (above glass) */}
        <div className="relative flex flex-col h-full" style={{ zIndex: 1 }}>
          {/* ── Header ── */}
          <div
            className="shrink-0 flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--glass-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4" style={{ color: "var(--text)" }} />
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--accent)",
                    color: "white",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    color: "var(--accent)",
                    background: "transparent",
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  All read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-3)" }}
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Notification list ── */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 px-8 text-center">
                <Bell
                  className="w-8 h-8 mb-3"
                  style={{ color: "var(--text-3)", opacity: 0.4 }}
                />
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  No notifications yet
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-3)", opacity: 0.7 }}
                >
                  You&apos;ll see task updates here
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                  style={{
                    background: notif.read
                      ? "transparent"
                      : "color-mix(in srgb, var(--accent) 5%, transparent)",
                    borderBottom: "1px solid var(--glass-border)",
                  }}
                  onClick={() => handleNotifClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNotifClick(notif)
                  }
                >
                  {/* Icon */}
                  <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{
                      background: `color-mix(in srgb, ${TYPE_COLOR[notif.type]} 12%, transparent)`,
                      color: TYPE_COLOR[notif.type],
                    }}
                  >
                    {TYPE_ICON[notif.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: "var(--text)",
                        fontWeight: notif.read ? 400 : 600,
                      }}
                    >
                      {notif.title}
                    </p>
                    <p
                      className="text-[12px] leading-snug mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-2)" }}
                    >
                      {notif.body}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--text-3)" }}
                    >
                      {formatTimeAgo(notif.timestamp)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div
                      className="shrink-0 w-2 h-2 rounded-full mt-2"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

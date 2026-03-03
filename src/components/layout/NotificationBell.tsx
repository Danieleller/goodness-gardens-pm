"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/tasks";
import Link from "next/link";
import type { Notification, Task } from "@/db/schema";

type NotifWithTask = Notification & { task: Task | null };

export function NotificationBell({
  notifications: initialNotifications,
}: {
  notifications: NotifWithTask[];
}) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unread = localNotifications.filter((n) => !n.read).length;

  // Sync when props change (e.g. after revalidation)
  useEffect(() => {
    setLocalNotifications(initialNotifications);
  }, [initialNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use click (not mousedown) to avoid race with the toggle button
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const handleMarkAllRead = useCallback(async () => {
    // Optimistically clear unread state
    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    await markAllNotificationsRead();
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg transition-smooth hover:bg-[var(--surface-2)]"
        style={{ color: "var(--text-3)" }}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-80 backdrop-blur-md rounded-xl shadow-lg z-50"
          style={{
            background: "color-mix(in srgb, var(--surface-1) 95%, transparent)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div
                className="p-4 text-center text-sm"
                style={{ color: "var(--text-3)" }}
              >
                No notifications
              </div>
            ) : (
              localNotifications.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: !n.read
                      ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                      : "transparent",
                  }}
                >
                  {n.task ? (
                    <Link
                      href={`/tasks/${n.taskId}`}
                      onClick={async () => {
                        if (!n.read) {
                          setLocalNotifications((prev) =>
                            prev.map((notif) =>
                              notif.id === n.id ? { ...notif, read: true } : notif
                            )
                          );
                          await markNotificationRead(n.id);
                        }
                        setOpen(false);
                      }}
                      className="text-sm transition-smooth"
                      style={{ color: "var(--text-2)" }}
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-2)" }}>
                      {n.message}
                    </p>
                  )}
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

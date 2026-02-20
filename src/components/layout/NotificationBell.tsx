"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/tasks";
import Link from "next/link";
import type { Notification, Task } from "@/db/schema";

type NotifWithTask = Notification & { task: Task | null };

export function NotificationBell({
  notifications,
}: {
  notifications: NotifWithTask[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-smooth"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e0d4] shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8e0d4]/60">
            <span className="text-sm font-semibold text-[#2d2520]">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead();
                }}
                className="text-xs text-[#1a3a2a] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-stone-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-stone-50 last:border-0 ${
                    !n.read ? "bg-emerald-50/30" : ""
                  }`}
                >
                  {n.task ? (
                    <Link
                      href={`/tasks/${n.taskId}`}
                      onClick={async () => {
                        if (!n.read) await markNotificationRead(n.id);
                        setOpen(false);
                      }}
                      className="text-sm text-stone-600 hover:text-[#2d2520] transition-smooth"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <p className="text-sm text-stone-600">{n.message}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-0.5">
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

"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import type { Task, User } from "@/db/schema";

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ tasks }: { tasks: TaskWithRelations[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Group tasks by their deadline date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const dateStr = task.dueDate;
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(task);
    }
    return map;
  }, [tasks]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold [color:var(--text)]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium rounded-lg [color:var(--text-2)] transition-smooth"
            style={{ border: "1px solid var(--border)" }}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] [color:var(--text-3)] transition-smooth"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] [color:var(--text-3)] transition-smooth"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
        }}>
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-[11px] font-medium [color:var(--text-3)] text-center uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-b border-r border-[var(--border)]"
                style={{ background: "var(--surface-1)", opacity: 0.5 }}
              />
            );
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          const isPast = new Date(dateStr) < new Date(todayStr);

          return (
            <div
              key={dateStr}
              className="border-b border-r border-[var(--border)] p-1 overflow-hidden"
              style={
                isToday
                  ? {
                      background:
                        "color-mix(in srgb, var(--accent) 8%, transparent)",
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                    isToday
                      ? "bg-[var(--accent)] text-white font-bold"
                      : ""
                  }`}
                  style={
                    !isToday
                      ? {
                          color: isPast
                            ? "var(--text-3)"
                            : "var(--text-2)",
                        }
                      : undefined
                  }
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] [color:var(--text-3)]">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 overflow-y-auto max-h-[calc(100%-24px)]">
                {dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`block px-1.5 py-0.5 rounded text-[11px] leading-tight truncate transition-smooth ${
                      task.status === "Done"
                        ? "bg-[var(--surface-2)] [color:var(--text-3)] line-through"
                        : task.status === "Blocked"
                          ? "bg-[color-mix(in_srgb,var(--status-blocked)_10%,transparent)] [color:var(--status-blocked)]"
                          : isPast
                            ? "bg-[color-mix(in_srgb,var(--status-overdue)_10%,transparent)] [color:var(--status-overdue)] font-medium"
                            : "bg-[var(--surface-1)] [color:var(--text-2)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

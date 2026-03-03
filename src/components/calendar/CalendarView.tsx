"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import type { TaskWithRelations } from "@/lib/types";

type CalendarViewMode = "month" | "week" | "day";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(today));
  const [currentDay, setCurrentDay] = useState(today);

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

  // Week navigation
  const goToPrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };
  const goToNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  // Day navigation
  const goToPrevDay = () => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() - 1);
    setCurrentDay(d);
  };
  const goToNextDay = () => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() + 1);
    setCurrentDay(d);
  };

  const goTodayAll = () => {
    const t = new Date();
    setCurrentMonth(t.getMonth());
    setCurrentYear(t.getFullYear());
    setCurrentWeekStart(getWeekStart(t));
    setCurrentDay(t);
  };

  // Week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  // Header title based on view
  const headerTitle = viewMode === "month"
    ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
    : viewMode === "week"
      ? `${MONTH_NAMES[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} – ${MONTH_NAMES[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
      : `${DAY_NAMES[currentDay.getDay()]}, ${MONTH_NAMES[currentDay.getMonth()]} ${currentDay.getDate()}, ${currentDay.getFullYear()}`;

  const goPrev = viewMode === "month" ? goToPrevMonth : viewMode === "week" ? goToPrevWeek : goToPrevDay;
  const goNext = viewMode === "month" ? goToNextMonth : viewMode === "week" ? goToNextWeek : goToNextDay;

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold [color:var(--text)]">
            {headerTitle}
          </h2>
          <button
            onClick={goTodayAll}
            className="px-2.5 py-1 text-xs font-medium rounded-lg [color:var(--text-2)] transition-smooth"
            style={{ border: "1px solid var(--border)" }}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg p-0.5" style={{ background: "var(--surface-2)" }}>
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-smooth ${viewMode === mode ? "shadow-sm" : ""}`}
                style={{
                  background: viewMode === mode ? "var(--surface-1)" : "transparent",
                  color: viewMode === mode ? "var(--text)" : "var(--text-3)",
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] [color:var(--text-3)] transition-smooth"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] [color:var(--text-3)] transition-smooth"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month View */}
      {viewMode === "month" && (
        <>
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
                              ? "bg-[color-mix(in_srgb,var(--blocked)_10%,transparent)] [color:var(--blocked)]"
                              : isPast
                                ? "bg-[color-mix(in_srgb,var(--overdue)_10%,transparent)] [color:var(--overdue)] font-medium"
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
        </>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <>
          <div className="grid grid-cols-7"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
            {weekDays.map((d) => {
              const dateStr = formatDateStr(d);
              const isT = dateStr === todayStr;
              return (
                <div key={dateStr} className="px-2 py-2 text-center"
                  style={isT ? { background: "color-mix(in srgb, var(--accent) 8%, transparent)" } : undefined}>
                  <div className="text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide">{DAY_NAMES[d.getDay()]}</div>
                  <div className={`text-sm font-semibold ${isT ? "[color:var(--accent)]" : "[color:var(--text)]"}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {weekDays.map((d) => {
              const dateStr = formatDateStr(d);
              const dayTasks = tasksByDate.get(dateStr) || [];
              const isT = dateStr === todayStr;
              const isPast = new Date(dateStr) < new Date(todayStr);
              return (
                <div key={dateStr} className="border-r border-b border-[var(--border)] p-2 overflow-y-auto"
                  style={isT ? { background: "color-mix(in srgb, var(--accent) 4%, transparent)" } : undefined}>
                  <div className="space-y-1">
                    {dayTasks.length === 0 && (
                      <p className="text-[11px] [color:var(--text-3)] text-center mt-4">No tasks</p>
                    )}
                    {dayTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className={`block px-2 py-1.5 rounded-lg text-sm transition-smooth ${
                          task.status === "Done"
                            ? "bg-[var(--surface-2)] [color:var(--text-3)] line-through"
                            : isPast
                              ? "bg-[color-mix(in_srgb,var(--overdue)_10%,transparent)] [color:var(--overdue)]"
                              : "bg-[var(--surface-1)] [color:var(--text)] hover:bg-[var(--surface-2)]"
                        }`}
                        style={{ border: "1px solid var(--border)" }}
                      >
                        {task.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Day View */}
      {viewMode === "day" && (() => {
        const dateStr = formatDateStr(currentDay);
        const dayTasks = tasksByDate.get(dateStr) || [];
        const isT = dateStr === todayStr;
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-2">
              {dayTasks.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm [color:var(--text-3)]">No tasks due on this day</p>
                </div>
              ) : (
                dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth hover:shadow-sm ${
                      task.status === "Done"
                        ? "[color:var(--text-3)] line-through"
                        : "[color:var(--text)]"
                    }`}
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Badge className={STATUS_COLORS[task.status]}>{task.status}</Badge>
                    <span className="text-sm font-medium flex-1">{task.title}</span>
                    {task.assignedTo && (
                      <span className="text-xs [color:var(--text-3)]">{task.assignedTo.name || task.assignedTo.email}</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

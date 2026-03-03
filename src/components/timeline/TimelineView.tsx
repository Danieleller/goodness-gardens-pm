"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarRange, Users, LayoutGrid } from "lucide-react";
import { addDays, startOfWeek, format, isSameDay, isToday, differenceInCalendarDays } from "date-fns";
import { STATUS_COLORS, isOverdue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TaskWithRelations } from "@/lib/types";
import type { User, Category } from "@/db/schema";

type GroupBy = "assignee" | "category";

const DAYS_VISIBLE = 28; // 4 weeks

export function TimelineView({
  tasks,
  users,
  categories,
}: {
  tasks: TaskWithRelations[];
  users: User[];
  categories: Category[];
}) {
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [groupBy, setGroupBy] = useState<GroupBy>("assignee");

  const days = useMemo(() => {
    return Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  const goBack = () => setStartDate((d) => addDays(d, -7));
  const goForward = () => setStartDate((d) => addDays(d, 7));
  const goToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Group tasks
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; tasks: TaskWithRelations[] }>();

    if (groupBy === "assignee") {
      map.set("__unassigned__", { label: "Unassigned", tasks: [] });
      for (const user of users) {
        map.set(user.id, { label: user.name || user.email, tasks: [] });
      }
    } else {
      for (const cat of categories) {
        map.set(cat.name, { label: cat.displayName, tasks: [] });
      }
    }

    // Separate scheduled vs unscheduled
    const unscheduled: TaskWithRelations[] = [];

    for (const task of tasks) {
      if (!task.dueDate) {
        unscheduled.push(task);
        continue;
      }

      const key = groupBy === "assignee"
        ? (task.assignedToUserId || "__unassigned__")
        : task.category;

      let group = map.get(key);
      if (!group) {
        group = { label: key, tasks: [] };
        map.set(key, group);
      }
      group.tasks.push(task);
    }

    // Filter out empty groups
    const result = Array.from(map.entries())
      .filter(([, g]) => g.tasks.length > 0)
      .map(([id, g]) => ({ id, ...g }));

    if (unscheduled.length > 0) {
      result.push({ id: "__unscheduled__", label: "Unscheduled", tasks: unscheduled });
    }

    return result;
  }, [tasks, users, categories, groupBy]);

  // Week labels for header
  const weekLabels = useMemo(() => {
    const labels: { label: string; span: number; startIdx: number }[] = [];
    let currentWeek = "";
    let span = 0;
    let startIdx = 0;

    days.forEach((day, idx) => {
      const weekLabel = `${format(day, "MMM d")}`;
      const weekNum = Math.floor(idx / 7);
      const weekKey = `w${weekNum}`;

      if (weekKey !== currentWeek) {
        if (currentWeek) {
          labels.push({ label: `${format(days[startIdx], "MMM d")} – ${format(days[startIdx + span - 1], "MMM d")}`, span, startIdx });
        }
        currentWeek = weekKey;
        span = 1;
        startIdx = idx;
      } else {
        span++;
      }
    });
    // Push last
    if (span > 0) {
      labels.push({ label: `${format(days[startIdx], "MMM d")} – ${format(days[startIdx + span - 1], "MMM d")}`, span, startIdx });
    }

    return labels;
  }, [days]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 view-enter">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--surface-2)" }}>
          <CalendarRange className="w-6 h-6" style={{ color: "var(--text-3)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>No tasks to display</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Create tasks with due dates to see them on the timeline</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full view-enter">
      {/* Timeline toolbar */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-smooth"
              style={{ color: "var(--text-3)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg transition-smooth"
              style={{ color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              Today
            </button>
            <button
              onClick={goForward}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-smooth"
              style={{ color: "var(--text-3)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {format(startDate, "MMM d")} – {format(addDays(startDate, DAYS_VISIBLE - 1), "MMM d, yyyy")}
          </span>
        </div>

        {/* Group by toggle */}
        <div className="flex rounded-lg p-0.5" style={{ background: "var(--surface-2)" }}>
          <button
            onClick={() => setGroupBy("assignee")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-smooth ${groupBy === "assignee" ? "shadow-sm" : ""}`}
            style={{
              background: groupBy === "assignee" ? "var(--surface-1)" : "transparent",
              color: groupBy === "assignee" ? "var(--text)" : "var(--text-3)",
            }}
          >
            <Users className="w-3.5 h-3.5" />
            Assignee
          </button>
          <button
            onClick={() => setGroupBy("category")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-smooth ${groupBy === "category" ? "shadow-sm" : ""}`}
            style={{
              background: groupBy === "category" ? "var(--surface-1)" : "transparent",
              color: groupBy === "category" ? "var(--text)" : "var(--text-3)",
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Category
          </button>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          {/* Week headers */}
          <div className="flex sticky top-0 z-10" style={{ background: "var(--surface-1)" }}>
            <div className="w-[180px] shrink-0 px-3 py-1.5" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
            {weekLabels.map((wl, idx) => (
              <div
                key={idx}
                className="text-[10px] font-medium text-center py-1.5 uppercase tracking-wide"
                style={{
                  width: `${wl.span * 40}px`,
                  color: "var(--text-3)",
                  borderBottom: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                }}
              >
                {wl.label}
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="flex sticky top-[33px] z-10" style={{ background: "var(--surface-2)" }}>
            <div className="w-[180px] shrink-0 px-3 py-1" style={{ borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)" }} />
            {days.map((day, idx) => {
              const today = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={idx}
                  className="w-[40px] shrink-0 text-center py-1"
                  style={{
                    borderBottom: today ? "2px solid var(--accent)" : "2px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    color: today ? "var(--accent)" : isWeekend ? "var(--text-3)" : "var(--text-2)",
                    background: today ? "color-mix(in srgb, var(--accent) 6%, transparent)" : undefined,
                  }}
                >
                  <div className="text-[10px] font-medium">{format(day, "EEE")}</div>
                  <div className={`text-[11px] ${today ? "font-bold" : ""}`}>{format(day, "d")}</div>
                </div>
              );
            })}
          </div>

          {/* Group rows */}
          {groups.map((group) => (
            <div key={group.id} className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
              {/* Group label */}
              <div
                className="w-[180px] shrink-0 px-3 py-2.5 sticky left-0 z-[5]"
                style={{
                  borderRight: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{group.label}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Day cells with bar overlay */}
              <div className="flex relative" style={{ minHeight: "48px" }}>
                {/* Background day cells */}
                {days.map((day, dayIdx) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={dayIdx}
                      className="w-[40px] shrink-0"
                      style={{
                        borderRight: "1px solid var(--border)",
                        background: isToday(day)
                          ? "color-mix(in srgb, var(--accent) 4%, transparent)"
                          : isWeekend
                            ? "color-mix(in srgb, var(--surface-2) 50%, transparent)"
                            : undefined,
                      }}
                    />
                  );
                })}

                {/* Task bars overlay */}
                {group.id !== "__unscheduled__" && (
                  <div className="absolute inset-0 py-1 px-0.5 flex flex-col gap-1 pointer-events-none">
                    {group.tasks.map((task) => {
                      const taskStart = task.startDate || task.dueDate;
                      const taskEnd = task.dueDate || task.startDate;
                      if (!taskStart || !taskEnd) return null;

                      const startDay = differenceInCalendarDays(new Date(taskStart), startDate);
                      const endDay = differenceInCalendarDays(new Date(taskEnd), startDate);

                      // Skip if entirely outside visible range
                      if (endDay < 0 || startDay >= DAYS_VISIBLE) return null;

                      const clampedStart = Math.max(0, startDay);
                      const clampedEnd = Math.min(DAYS_VISIBLE - 1, endDay);
                      const leftPx = clampedStart * 40;
                      const widthPx = Math.max(80, (clampedEnd - clampedStart + 1) * 40 - 4);

                      const overdue = isOverdue(task.dueDate) && task.status !== "Done";

                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="absolute rounded-md px-2 py-0.5 text-[10px] font-medium leading-tight truncate transition-smooth hover:opacity-80 pointer-events-auto"
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                            top: undefined,
                            position: "relative",
                            background: task.status === "Done"
                              ? "color-mix(in srgb, var(--done) 20%, transparent)"
                              : task.status === "Blocked"
                                ? "color-mix(in srgb, var(--blocked) 20%, transparent)"
                                : overdue
                                  ? "color-mix(in srgb, var(--overdue) 20%, transparent)"
                                  : "color-mix(in srgb, var(--progress) 20%, transparent)",
                            color: task.status === "Done"
                              ? "var(--done)"
                              : task.status === "Blocked"
                                ? "var(--blocked)"
                                : overdue
                                  ? "var(--overdue)"
                                  : "var(--progress)",
                            borderLeft: `3px solid ${task.status === "Done" ? "var(--done)" : task.status === "Blocked" ? "var(--blocked)" : overdue ? "var(--overdue)" : "var(--progress)"}`,
                          }}
                          title={`${task.title}${task.startDate ? ` (${task.startDate} → ${task.dueDate})` : ` (Due: ${task.dueDate})`}`}
                        >
                          {task.title}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Unscheduled tasks shown as a row of pills */}
                {group.id === "__unscheduled__" && (
                  <div className="absolute inset-0 flex items-center gap-1 px-2 overflow-x-auto">
                    {group.tasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-smooth hover:opacity-80"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {task.title.length > 20 ? task.title.slice(0, 18) + "…" : task.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

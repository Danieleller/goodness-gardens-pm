"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { searchTasks } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Task, User } from "@/db/schema";

type TaskResult = Task & { assignedTo: User | null; createdBy: User };

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchTasks(query);
      setResults(data as TaskResult[]);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--text-3)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-transparent rounded-lg focus:outline-none focus:ring-2 transition-smooth"
          style={{
            background: "var(--surface-2)",
            color: "var(--text)",
            borderColor: "transparent",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.background = "var(--surface-1)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 transition-smooth"
            style={{ color: "var(--text-3)" }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 backdrop-blur-md rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          style={{
            background: "color-mix(in srgb, var(--surface-1) 95%, transparent)",
            border: "1px solid var(--border)",
          }}
        >
          {loading ? (
            <div className="p-4 text-center text-sm" style={{ color: "var(--text-3)" }}>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: "var(--text-3)" }}>
              No tasks found
            </div>
          ) : (
            results.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-smooth"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={PRIORITY_COLORS[task.priority]}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {task.category}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

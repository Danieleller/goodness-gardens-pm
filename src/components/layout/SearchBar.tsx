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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-stone-100/60 border border-transparent rounded-lg focus:bg-white focus:border-[#e8e0d4] focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10 transition-smooth placeholder:text-stone-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-[#e8e0d4] shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-stone-400">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-stone-400">
              No tasks found
            </div>
          ) : (
            results.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-smooth"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2d2520] truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={PRIORITY_COLORS[task.priority]}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-stone-400">
                      {task.category}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-stone-400">
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

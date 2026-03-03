"use client";

import { X, RotateCcw } from "lucide-react";
import { STATUSES, PRIORITIES } from "@/lib/utils";
import type { FilterCriteria } from "@/lib/types";
import { emptyFilters, hasActiveFilters } from "@/lib/types";
import type { User, Category } from "@/db/schema";
import type { ProjectWithMembers } from "@/lib/types";

export function FilterPanel({
  filters,
  onChange,
  users,
  categories,
  projects,
  onClose,
}: {
  filters: FilterCriteria;
  onChange: (filters: FilterCriteria) => void;
  users: User[];
  categories: Category[];
  projects: ProjectWithMembers[];
  onClose: () => void;
}) {
  const set = (key: keyof FilterCriteria, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const selectClass =
    "text-xs rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 transition-smooth";
  const selectStyle = {
    border: "1px solid var(--border)",
    color: "var(--text-2)",
    background: "var(--surface-1)",
  };
  const labelClass = "text-[11px] font-medium uppercase tracking-wide mb-1 block";
  const labelStyle = { color: "var(--text-3)" };

  return (
    <div
      className="rounded-xl p-4 animate-in"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          Filters
        </span>
        <div className="flex items-center gap-2">
          {hasActiveFilters(filters) && (
            <button
              onClick={() => onChange(emptyFilters)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-smooth hover:bg-[var(--surface-2)]"
              style={{ color: "var(--accent)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-smooth hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text-3)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Status */}
        <div>
          <label className={labelClass} style={labelStyle}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className={labelClass} style={labelStyle}>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => set("priority", e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label className={labelClass} style={labelStyle}>Assignee</label>
          <select
            value={filters.assignee}
            onChange={(e) => set("assignee", e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All</option>
            <option value="__unassigned__">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass} style={labelStyle}>Category</label>
          <select
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.displayName}</option>
            ))}
          </select>
        </div>

        {/* Project */}
        <div>
          <label className={labelClass} style={labelStyle}>Project</label>
          <select
            value={filters.project}
            onChange={(e) => set("project", e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All</option>
            <option value="__none__">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className={labelClass} style={labelStyle}>Due After</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className={selectClass}
            style={selectStyle}
          />
        </div>

        {/* Date To */}
        <div>
          <label className={labelClass} style={labelStyle}>Due Before</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className={selectClass}
            style={selectStyle}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import type { FilterCriteria } from "@/lib/types";
import type { User, Category } from "@/db/schema";
import type { ProjectWithMembers } from "@/lib/types";

type ChipData = { key: keyof FilterCriteria; label: string };

function getChips(
  filters: FilterCriteria,
  users: User[],
  categories: Category[],
  projects: ProjectWithMembers[]
): ChipData[] {
  const chips: ChipData[] = [];

  if (filters.status) chips.push({ key: "status", label: `Status: ${filters.status}` });
  if (filters.priority) chips.push({ key: "priority", label: `Priority: ${filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}` });
  if (filters.assignee) {
    if (filters.assignee === "__unassigned__") {
      chips.push({ key: "assignee", label: "Unassigned" });
    } else {
      const user = users.find((u) => u.id === filters.assignee);
      chips.push({ key: "assignee", label: `Assignee: ${user?.name || user?.email || "Unknown"}` });
    }
  }
  if (filters.category) {
    const cat = categories.find((c) => c.name === filters.category);
    chips.push({ key: "category", label: `Category: ${cat?.displayName || filters.category}` });
  }
  if (filters.project) {
    if (filters.project === "__none__") {
      chips.push({ key: "project", label: "No Project" });
    } else {
      const proj = projects.find((p) => p.id === filters.project);
      chips.push({ key: "project", label: `Project: ${proj?.title || "Unknown"}` });
    }
  }
  if (filters.dateFrom) chips.push({ key: "dateFrom", label: `Due after: ${filters.dateFrom}` });
  if (filters.dateTo) chips.push({ key: "dateTo", label: `Due before: ${filters.dateTo}` });

  return chips;
}

export function FilterChips({
  filters,
  onChange,
  onClearAll,
  users,
  categories,
  projects,
}: {
  filters: FilterCriteria;
  onChange: (filters: FilterCriteria) => void;
  onClearAll: () => void;
  users: User[];
  categories: Category[];
  projects: ProjectWithMembers[];
}) {
  const chips = getChips(filters, users, categories, projects);
  if (chips.length === 0) return null;

  const removeChip = (key: keyof FilterCriteria) => {
    onChange({ ...filters, [key]: "" });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-[11px] font-medium transition-smooth"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          {chip.label}
          <button
            onClick={() => removeChip(chip.key)}
            className="p-0.5 rounded-full hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] transition-smooth"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] font-medium px-2 py-1 rounded-md transition-smooth hover:bg-[var(--surface-2)]"
        style={{ color: "var(--text-3)" }}
      >
        Clear all
      </button>
    </div>
  );
}

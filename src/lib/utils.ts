import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  "Sales",
  "ProductDev",
  "Operations",
  "Finance",
  "Other",
] as const;

export const STATUSES = ["Backlog", "Doing", "Blocked", "Done"] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;

export const PRIORITY_COLORS = {
  low: "bg-stone-100 text-stone-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
} as const;

export const STATUS_COLORS = {
  Backlog: "bg-stone-100 text-stone-500",
  Doing: "bg-emerald-50 text-emerald-700",
  Blocked: "bg-amber-50 text-amber-700",
  Done: "bg-stone-100 text-stone-400",
} as const;

export const CATEGORY_COLORS = {
  Sales: "bg-rose-50 border-rose-200",
  ProductDev: "bg-sky-50 border-sky-200",
  Operations: "bg-emerald-50 border-emerald-200",
  Finance: "bg-amber-50 border-amber-200",
  Other: "bg-stone-50 border-stone-200",
} as const;

export function getStatusBorderClass(status: string): string {
  const map: Record<string, string> = {
    Backlog: "status-border-backlog",
    Doing: "status-border-doing",
    Blocked: "status-border-blocked",
    Done: "status-border-done",
  };
  return map[status] || "status-border-backlog";
}

/** Parse a YYYY-MM-DD string into a local Date (no UTC shift). */
function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return parseLocalDate(date) < new Date(new Date().toDateString());
}

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
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
} as const;

export const STATUS_COLORS = {
  Backlog: "bg-slate-100 text-slate-600",
  Doing: "bg-blue-100 text-blue-700",
  Blocked: "bg-red-100 text-red-700",
  Done: "bg-green-100 text-green-700",
} as const;

export const CATEGORY_COLORS = {
  Sales: "bg-purple-50 border-purple-200",
  ProductDev: "bg-blue-50 border-blue-200",
  Operations: "bg-emerald-50 border-emerald-200",
  Finance: "bg-amber-50 border-amber-200",
  Other: "bg-slate-50 border-slate-200",
} as const;

export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
}

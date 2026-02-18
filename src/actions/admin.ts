"use server";

import { db } from "@/db";
import { users, categories, tasks, accounts, sessions, notifications, auditLogs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Auth guard ─────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || dbUser.role !== "admin") throw new Error("Admin access required");
  return dbUser;
}

// ── User Management ────────────────────────────────────
export async function inviteUser(data: {
  email: string;
  name: string;
  role: "admin" | "manager" | "member";
}) {
  await requireAdmin();

  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  if (existing) throw new Error("User with this email already exists");

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: new Date(),
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { id };
}

export async function updateUserRole(userId: string, role: "admin" | "manager" | "member") {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot change your own role");

  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function removeUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot remove yourself");

  // Unassign tasks from this user
  await db.update(tasks).set({ assignedToUserId: null }).where(eq(tasks.assignedToUserId, userId));

  // Delete related records
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/settings");
  revalidatePath("/");
}

// ── Category Management ────────────────────────────────
export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return db.query.categories.findMany({
    orderBy: asc(categories.sortOrder),
  });
}

export async function createCategory(data: {
  name: string;
  displayName: string;
  color?: string;
}) {
  await requireAdmin();

  const existing = await db.query.categories.findFirst({
    where: eq(categories.name, data.name),
  });
  if (existing) throw new Error("Category with this name already exists");

  // Get max sort order
  const all = await db.query.categories.findMany();
  const maxOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), 0);

  const id = crypto.randomUUID();
  await db.insert(categories).values({
    id,
    name: data.name,
    displayName: data.displayName,
    color: data.color || "bg-slate-50 border-slate-200",
    sortOrder: maxOrder + 1,
    createdAt: new Date(),
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { id };
}

export async function renameCategory(categoryId: string, displayName: string) {
  await requireAdmin();
  await db.update(categories).set({ displayName }).where(eq(categories.id, categoryId));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updateCategoryColor(categoryId: string, color: string) {
  await requireAdmin();
  await db.update(categories).set({ color }).where(eq(categories.id, categoryId));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });
  if (!cat) throw new Error("Category not found");

  // Move tasks in this category to "Other" (or first available category)
  const allCats = await db.query.categories.findMany();
  const fallback = allCats.find((c) => c.id !== categoryId);
  if (fallback) {
    await db.update(tasks).set({ category: fallback.name as any }).where(eq(tasks.category, cat.name as any));
  }

  await db.delete(categories).where(eq(categories.id, categoryId));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function getAllUsers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return db.query.users.findMany();
}

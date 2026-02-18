"use server";

import { db } from "@/db";
import { tasks, auditLogs, notifications, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, like, or, desc, and, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendAssignmentEmail } from "@/lib/email";

// ── Create Task ────────────────────────────────────────
export async function createTask(data: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignedToUserId?: string;
  category?: "Sales" | "ProductDev" | "Operations" | "Finance" | "Other";
  status?: "Backlog" | "Doing" | "Blocked" | "Done";
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(tasks).values({
    id,
    title: data.title,
    description: data.description || null,
    priority: data.priority || "medium",
    dueDate: data.dueDate || null,
    assignedToUserId: data.assignedToUserId || null,
    category: data.category || "Operations",
    status: data.status || "Backlog",
    createdByUserId: session.user.id,
    createdAt: now,
    updatedAt: now,
  });

  // Audit log
  await db.insert(auditLogs).values({
    taskId: id,
    userId: session.user.id,
    action: "created",
    newValue: data.title,
    createdAt: now,
  });

  // Notification if assigned
  if (data.assignedToUserId) {
    await createAssignmentNotification(
      id,
      data.title,
      null,
      data.assignedToUserId,
      session.user.id
    );
  }

  revalidatePath("/");
  return { id };
}

// ── Update Task ────────────────────────────────────────
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    dueDate: string | null;
    assignedToUserId: string | null;
    category: "Sales" | "ProductDev" | "Operations" | "Finance" | "Other";
    status: "Backlog" | "Doing" | "Blocked" | "Done";
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!existing) throw new Error("Task not found");

  const now = new Date();
  const changes: { action: string; oldValue: string | null; newValue: string | null }[] = [];

  if (data.title !== undefined && data.title !== existing.title) {
    changes.push({ action: "title_changed", oldValue: existing.title, newValue: data.title });
  }
  if (data.assignedToUserId !== undefined && data.assignedToUserId !== existing.assignedToUserId) {
    changes.push({
      action: "assignment_changed",
      oldValue: existing.assignedToUserId,
      newValue: data.assignedToUserId,
    });
  }
  if (data.category !== undefined && data.category !== existing.category) {
    changes.push({ action: "category_changed", oldValue: existing.category, newValue: data.category });
  }
  if (data.status !== undefined && data.status !== existing.status) {
    changes.push({ action: "status_changed", oldValue: existing.status, newValue: data.status });
  }
  if (data.priority !== undefined && data.priority !== existing.priority) {
    changes.push({ action: "priority_changed", oldValue: existing.priority, newValue: data.priority });
  }
  if (data.dueDate !== undefined && data.dueDate !== existing.dueDate) {
    changes.push({ action: "due_date_changed", oldValue: existing.dueDate, newValue: data.dueDate });
  }

  await db
    .update(tasks)
    .set({ ...data, updatedAt: now })
    .where(eq(tasks.id, taskId));

  // Audit logs
  for (const change of changes) {
    await db.insert(auditLogs).values({
      taskId,
      userId: session.user.id,
      action: change.action as any,
      oldValue: change.oldValue,
      newValue: change.newValue,
      createdAt: now,
    });
  }

  // Notification on assignment change
  const assignChange = changes.find((c) => c.action === "assignment_changed");
  if (assignChange && data.assignedToUserId) {
    await createAssignmentNotification(
      taskId,
      existing.title,
      existing.assignedToUserId,
      data.assignedToUserId,
      session.user.id
    );
  }

  revalidatePath("/");
}

// ── Delete Task ────────────────────────────────────────
export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

// ── Search Tasks ───────────────────────────────────────
export async function searchTasks(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const results = await db.query.tasks.findMany({
    where: or(
      like(tasks.title, `%${query}%`),
      like(tasks.description, `%${query}%`)
    ),
    with: { assignedTo: true, createdBy: true },
    orderBy: desc(tasks.updatedAt),
    limit: 20,
  });

  return results;
}

// ── Get Task with Audit Trail ──────────────────────────
export async function getTaskWithAudit(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      assignedTo: true,
      createdBy: true,
      auditLogs: {
        orderBy: desc(auditLogs.createdAt),
        with: { user: true },
      },
    },
  });

  return task;
}

// ── Get All Tasks ──────────────────────────────────────
export async function getTasks(filters?: {
  assignedToUserId?: string;
  category?: string;
  status?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conditions: SQL[] = [];
  if (filters?.assignedToUserId) {
    conditions.push(eq(tasks.assignedToUserId, filters.assignedToUserId));
  }
  if (filters?.category) {
    conditions.push(eq(tasks.category, filters.category as any));
  }
  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as any));
  }

  const result = await db.query.tasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { assignedTo: true, createdBy: true },
    orderBy: desc(tasks.updatedAt),
  });

  return result;
}

// ── Get Users ──────────────────────────────────────────
export async function getUsers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return db.query.users.findMany();
}

// ── Notification helpers ───────────────────────────────
async function createAssignmentNotification(
  taskId: string,
  taskTitle: string,
  oldUserId: string | null,
  newUserId: string,
  actorId: string
) {
  const actor = await db.query.users.findFirst({
    where: eq(users.id, actorId),
  });
  const actorName = actor?.name || "Someone";

  const message = oldUserId
    ? `${actorName} reassigned "${taskTitle}" to you`
    : `${actorName} assigned "${taskTitle}" to you`;

  await db.insert(notifications).values({
    userId: newUserId,
    taskId,
    type: oldUserId ? "reassignment" : "assignment",
    message,
    createdAt: new Date(),
  });

  // Send email
  const assignee = await db.query.users.findFirst({
    where: eq(users.id, newUserId),
  });
  if (assignee?.email) {
    try {
      await sendAssignmentEmail({
        to: assignee.email,
        assigneeName: assignee.name || "there",
        taskTitle,
        actorName,
        taskId,
      });
    } catch (e) {
      console.error("Email failed:", e);
    }
  }
}

// ── Notifications ──────────────────────────────────────
export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    with: { task: true },
    orderBy: desc(notifications.createdAt),
    limit: 20,
  });
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));

  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.read, false)
      )
    );

  revalidatePath("/");
}

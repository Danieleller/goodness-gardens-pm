"use server";

import { db } from "@/db";
import { tasks, auditLogs, notifications, users, taskAssignees, taskGroupAssignments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, like, or, desc, and, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendAssignmentEmail } from "@/lib/email";

// ââ Create Task ââââââââââââââââââââââââââââââââââââââââ
export async function createTask(data: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignedToUserId?: string;
  category?: string;
  status?: "Backlog" | "Doing" | "Blocked" | "Done";
  additionalAssigneeIds?: string[];
  assignedGroupIds?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Generate unique ID: R-prefix for Rocks tasks, auto UUID for others
  const uuid = crypto.randomUUID();
  const id = data.category === "Rocks" ? `R-${uuid}` : uuid;
  const now = new Date();

  await db.insert(tasks).values({
    id,
    title: data.title,
    description: data.description || null,
    priority: data.priority || "medium",
    dueDate: data.dueDate || null,
    assignedToUserId: data.assignedToUserId || null,
    category: (data.category || "Operations") as any,
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

  // Additional assignees
  if (data.additionalAssigneeIds && data.additionalAssigneeIds.length > 0) {
    for (const userId of data.additionalAssigneeIds) {
      if (userId !== data.assignedToUserId) {
        await db.insert(taskAssignees).values({
          taskId: id,
          userId,
          assignedByUserId: session.user.id,
          assignedAt: now,
        });
        await createAssignmentNotification(id, data.title, null, userId, session.user.id);
      }
    }
  }

  // Group assignments
  if (data.assignedGroupIds && data.assignedGroupIds.length > 0) {
    for (const groupId of data.assignedGroupIds) {
      await db.insert(taskGroupAssignments).values({
        taskId: id,
        groupId,
        assignedByUserId: session.user.id,
        assignedAt: now,
      });
    }
  }

  revalidatePath("/");
  return { id };
}

// ââ Update Task ââââââââââââââââââââââââââââââââââââââââ
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    dueDate: string | null;
    assignedToUserId: string | null;
    category: string;
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
    .set({ ...data, updatedAt: now } as any)
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

// ââ Delete Task ââââââââââââââââââââââââââââââââââââââââ
export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

// ââ Search Tasks âââââââââââââââââââââââââââââââââââââââ
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

// ââ Get Task with Audit Trail ââââââââââââââââââââââââââ
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
      additionalAssignees: {
        with: { user: true },
      },
      groupAssignments: {
        with: { group: true },
      },
    },
  });

  return task;
}

// ââ Get All Tasks ââââââââââââââââââââââââââââââââââââââ
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
    with: {
      assignedTo: true,
      createdBy: true,
      additionalAssignees: { with: { user: true } },
      groupAssignments: { with: { group: true } },
    },
    orderBy: desc(tasks.updatedAt),
  });

  return result;
}

// ââ Get Users ââââââââââââââââââââââââââââââââââââââââââ
export async function getUsers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return db.query.users.findMany();
}

// ââ Multi-Assign Functions âââââââââââââââââââââââââââââ
export async function assignTaskToUsers(taskId: string, userIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("Task not found");

  const now = new Date();
  for (const userId of userIds) {
    // Skip if this user is the primary assignee
    if (userId === task.assignedToUserId) continue;

    // Check if already assigned
    const existing = await db.query.taskAssignees.findFirst({
      where: and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)),
    });
    if (existing) continue;

    await db.insert(taskAssignees).values({
      taskId,
      userId,
      assignedByUserId: session.user.id,
      assignedAt: now,
    });

    await createAssignmentNotification(taskId, task.title, null, userId, session.user.id);
  }

  // Audit log
  await db.insert(auditLogs).values({
    taskId,
    userId: session.user.id,
    action: "assignment_changed" as any,
    newValue: `Added ${userIds.length} assignee(s)`,
    createdAt: now,
  });

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

export async function unassignTaskFromUser(taskId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)));

  await db.insert(auditLogs).values({
    taskId,
    userId: session.user.id,
    action: "assignment_changed" as any,
    newValue: `Removed an assignee`,
    createdAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

export async function assignTaskToGroup(taskId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.query.taskGroupAssignments.findFirst({
    where: and(
      eq(taskGroupAssignments.taskId, taskId),
      eq(taskGroupAssignments.groupId, groupId)
    ),
  });
  if (existing) return;

  await db.insert(taskGroupAssignments).values({
    taskId,
    groupId,
    assignedByUserId: session.user.id,
    assignedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

export async function unassignTaskFromGroup(taskId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(taskGroupAssignments)
    .where(
      and(
        eq(taskGroupAssignments.taskId, taskId),
        eq(taskGroupAssignments.groupId, groupId)
      )
    );

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

// ââ Notification helpers âââââââââââââââââââââââââââââââ
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

// ââ Notifications ââââââââââââââââââââââââââââââââââââââ
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

"use server";

import { db } from "@/db";
import {
  tasks,
  auditLogs,
  notifications,
  users,
  taskAssignees,
  taskGroupAssignments,
  taskMembers,
  subtasks,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { visibleTasksWhere, canAccessTask } from "@/lib/visibility";
import { eq, like, or, desc, and, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendAssignmentEmail } from "@/lib/email";

// -- Create Task --------------------------------------------------
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
  visibility?: "private" | "project" | "public";
  projectId?: string;
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
    visibility: data.visibility || "private",
    projectId: data.projectId || null,
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

// -- Update Task --------------------------------------------------
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    priority: string;
    dueDate: string | null;
    assignedToUserId: string | null;
    category: string;
    status: string;
    visibility: "private" | "project" | "public";
    projectId: string | null;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Access check
  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

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
  if (data.visibility !== undefined && data.visibility !== existing.visibility) {
    changes.push({ action: "visibility_changed", oldValue: existing.visibility, newValue: data.visibility });
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

// -- Delete Task --------------------------------------------------
export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only creator or admin can delete
  const existing = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { createdByUserId: true },
  });
  if (!existing) throw new Error("Task not found");
  if (session.user.role !== "admin" && existing.createdByUserId !== session.user.id) {
    throw new Error("Only the task creator or an admin can delete this task");
  }

  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

// -- Search Tasks -------------------------------------------------
export async function searchTasks(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const visCondition = visibleTasksWhere(session.user.id, session.user.role);
  const searchCondition = or(
    like(tasks.title, `%${query}%`),
    like(tasks.description, `%${query}%`)
  );

  const results = await db.query.tasks.findMany({
    where: visCondition ? and(searchCondition, visCondition) : searchCondition,
    with: { assignedTo: true, createdBy: true },
    orderBy: desc(tasks.updatedAt),
    limit: 20,
  });

  return results;
}

// -- Get Task with Audit Trail ------------------------------------
export async function getTaskWithAudit(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Access check
  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      assignedTo: true,
      createdBy: true,
      project: true,
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
      members: {
        with: { user: true },
      },
    },
  });

  return task;
}

// -- Get All Tasks ------------------------------------------------
export async function getTasks(filters?: {
  assignedToUserId?: string;
  category?: string;
  status?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conditions: (SQL | undefined)[] = [];

  // Visibility filter
  const visCondition = visibleTasksWhere(session.user.id, session.user.role);
  if (visCondition) conditions.push(visCondition);

  if (filters?.assignedToUserId) {
    conditions.push(eq(tasks.assignedToUserId, filters.assignedToUserId));
  }
  if (filters?.category) {
    conditions.push(eq(tasks.category, filters.category as any));
  }
  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as any));
  }

  const validConditions = conditions.filter(Boolean) as SQL[];

  const result = await db.query.tasks.findMany({
    where: validConditions.length > 0 ? and(...validConditions) : undefined,
    with: {
      assignedTo: true,
      createdBy: true,
      additionalAssignees: { with: { user: true } },
      groupAssignments: { with: { group: true } },
      members: { with: { user: true } },
    },
    orderBy: desc(tasks.updatedAt),
  });

  return result;
}

// -- Get Users ----------------------------------------------------
export async function getUsers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return db.query.users.findMany();
}

// -- Multi-Assign Functions ---------------------------------------
export async function assignTaskToUsers(taskId: string, userIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

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

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

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

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

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

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

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

// -- Task Members (Collaborators) ---------------------------------
export async function addTaskMember(taskId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

  // Check if already a member
  const existing = await db.query.taskMembers.findFirst({
    where: and(eq(taskMembers.taskId, taskId), eq(taskMembers.userId, userId)),
  });
  if (existing) return;

  await db.insert(taskMembers).values({
    taskId,
    userId,
    addedByUserId: session.user.id,
    addedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

export async function removeTaskMember(taskId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

  await db
    .delete(taskMembers)
    .where(and(eq(taskMembers.taskId, taskId), eq(taskMembers.userId, userId)));

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
}

// -- Notification helpers -----------------------------------------
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

// -- Notifications ------------------------------------------------
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

// -- Sub-tasks ----------------------------------------------------
export async function createSubtask(taskId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Access check on parent task
  const allowed = await canAccessTask(session.user.id, session.user.role, taskId);
  if (!allowed) throw new Error("Access denied");

  const existing = await db.query.subtasks.findMany({
    where: eq(subtasks.taskId, taskId),
  });
  const maxOrder = existing.reduce((max, s) => Math.max(max, s.sortOrder), -1);

  const id = crypto.randomUUID();
  await db.insert(subtasks).values({
    id,
    taskId,
    title,
    completed: false,
    sortOrder: maxOrder + 1,
    createdAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
  return { id };
}

export async function toggleSubtask(subtaskId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const subtask = await db.query.subtasks.findFirst({
    where: eq(subtasks.id, subtaskId),
  });
  if (!subtask) throw new Error("Subtask not found");

  // Access check on parent task
  const allowed = await canAccessTask(session.user.id, session.user.role, subtask.taskId);
  if (!allowed) throw new Error("Access denied");

  await db
    .update(subtasks)
    .set({ completed })
    .where(eq(subtasks.id, subtaskId));

  revalidatePath("/");
  revalidatePath(`/tasks/${subtask.taskId}`);
}

export async function deleteSubtask(subtaskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const subtask = await db.query.subtasks.findFirst({
    where: eq(subtasks.id, subtaskId),
  });
  if (!subtask) throw new Error("Subtask not found");

  // Access check on parent task
  const allowed = await canAccessTask(session.user.id, session.user.role, subtask.taskId);
  if (!allowed) throw new Error("Access denied");

  await db.delete(subtasks).where(eq(subtasks.id, subtaskId));

  revalidatePath("/");
  revalidatePath(`/tasks/${subtask.taskId}`);
}

import { db } from "@/db";
import {
  tasks,
  taskAssignees,
  taskMembers,
  projectMembers,
} from "@/db/schema";
import { eq, or, and, inArray, isNotNull, SQL } from "drizzle-orm";

/**
 * Returns a Drizzle SQL condition that filters tasks to only those
 * the given user is allowed to see.
 *
 * Returns `undefined` for admins (no restriction).
 *
 * Visibility rules:
 *  1. Admin sees everything
 *  2. task.visibility === "public"
 *  3. User is the task creator
 *  4. User is the primary assignee
 *  5. User is in task_assignees (additional assignees)
 *  6. User is in task_members (collaborators)
 *  7. task.visibility === "project" AND user is a member of that project
 */
export function visibleTasksWhere(
  userId: string,
  role: string
): SQL | undefined {
  if (role === "admin") return undefined; // no restriction

  return or(
    // Rule 2: public tasks visible to all
    eq(tasks.visibility, "public"),

    // Rule 3: task creator
    eq(tasks.createdByUserId, userId),

    // Rule 4: primary assignee
    eq(tasks.assignedToUserId, userId),

    // Rule 5: additional assignee
    inArray(
      tasks.id,
      db
        .select({ id: taskAssignees.taskId })
        .from(taskAssignees)
        .where(eq(taskAssignees.userId, userId))
    ),

    // Rule 6: task collaborator (task_members)
    inArray(
      tasks.id,
      db
        .select({ id: taskMembers.taskId })
        .from(taskMembers)
        .where(eq(taskMembers.userId, userId))
    ),

    // Rule 7: project-scoped task where user is a project member
    and(
      eq(tasks.visibility, "project"),
      isNotNull(tasks.projectId),
      inArray(
        tasks.id,
        db
          .select({ id: tasks.id })
          .from(tasks)
          .innerJoin(
            projectMembers,
            and(
              eq(tasks.projectId, projectMembers.projectId),
              eq(projectMembers.userId, userId)
            )
          )
      )
    )
  );
}

/**
 * Check whether a specific user can access a specific task.
 * Returns true if access is allowed, false otherwise.
 */
export async function canAccessTask(
  userId: string,
  role: string,
  taskId: string
): Promise<boolean> {
  if (role === "admin") return true;

  const condition = visibleTasksWhere(userId, role);
  const result = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), condition),
    columns: { id: true },
  });

  return !!result;
}

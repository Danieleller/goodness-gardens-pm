"use server";

import { db } from "@/db";
import { userGroups, userGroupMembers, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ââ Create Group ââââââââââââââââââââââââââââââââââââââ
export async function createUserGroup(data: {
  name: string;
  description?: string;
  color?: string;
  memberIds?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Check admin/manager role
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "manager")) {
    throw new Error("Only admins and managers can create groups");
  }

  const now = new Date();

  const [group] = await db.insert(userGroups).values({
    name: data.name,
    description: data.description || null,
    color: data.color || "bg-slate-50 border-slate-200",
    createdByUserId: session.user.id,
    createdAt: now,
    updatedAt: now,
  }).returning();

  // Add members if provided
  if (data.memberIds && data.memberIds.length > 0) {
    for (const userId of data.memberIds) {
      await db.insert(userGroupMembers).values({
        groupId: group.id,
        userId,
        addedAt: now,
      });
    }
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return group;
}

// ââ Update Group ââââââââââââââââââââââââââââââââââââââ
export async function updateUserGroup(
  groupId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "manager")) {
    throw new Error("Only admins and managers can update groups");
  }

  await db
    .update(userGroups)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userGroups.id, groupId));

  revalidatePath("/settings");
  revalidatePath("/");
}

// ââ Delete Group ââââââââââââââââââââââââââââââââââââââ
export async function deleteUserGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Only admins can delete groups");
  }

  await db.delete(userGroups).where(eq(userGroups.id, groupId));

  revalidatePath("/settings");
  revalidatePath("/");
}

// ââ Add Member to Group âââââââââââââââââââââââââââââââ
export async function addGroupMember(groupId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "manager")) {
    throw new Error("Only admins and managers can manage group members");
  }

  // Check if already a member
  const existing = await db.query.userGroupMembers.findFirst({
    where: and(
      eq(userGroupMembers.groupId, groupId),
      eq(userGroupMembers.userId, userId)
    ),
  });
  if (existing) return; // Already a member

  await db.insert(userGroupMembers).values({
    groupId,
    userId,
    addedAt: new Date(),
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

// ââ Remove Member from Group ââââââââââââââââââââââââââ
export async function removeGroupMember(groupId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "manager")) {
    throw new Error("Only admins and managers can manage group members");
  }

  await db
    .delete(userGroupMembers)
    .where(
      and(
        eq(userGroupMembers.groupId, groupId),
        eq(userGroupMembers.userId, userId)
      )
    );

  revalidatePath("/settings");
  revalidatePath("/");
}

// ââ Get All Groups ââââââââââââââââââââââââââââââââââââ
export async function getUserGroups() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.query.userGroups.findMany({
    with: {
      members: {
        with: { user: true },
      },
      createdBy: true,
    },
  });
}

// ââ Get Group by ID âââââââââââââââââââââââââââââââââââ
export async function getUserGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.query.userGroups.findFirst({
    where: eq(userGroups.id, groupId),
    with: {
      members: {
        with: { user: true },
      },
      createdBy: true,
    },
  });
}

"use server";

import { db } from "@/db";
import { projects, projectMembers, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, asc, or, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// -- Get Projects -------------------------------------------------
export async function getProjects(quarter?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Admins see all projects; others see public + their own memberships
  let visCondition;
  if (session.user.role !== "admin") {
    visCondition = or(
      eq(projects.visibility, "public"),
      eq(projects.ownerUserId, session.user.id),
      inArray(
        projects.id,
        db
          .select({ id: projectMembers.projectId })
          .from(projectMembers)
          .where(eq(projectMembers.userId, session.user.id))
      )
    );
  }

  const conditions = [];
  if (quarter) conditions.push(eq(projects.quarter, quarter));
  if (visCondition) conditions.push(visCondition);

  return db.query.projects.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      owner: true,
      members: { with: { user: true } },
    },
    orderBy: [asc(projects.ownerUserId), asc(projects.rockNumber)],
  });
}

// -- Get Project Quarters -----------------------------------------
export async function getProjectQuarters() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allProjects = await db.query.projects.findMany({
    columns: { quarter: true },
  });
  const quarters = [
    ...new Set(allProjects.map((p) => p.quarter).filter(Boolean)),
  ].sort().reverse();
  return quarters as string[];
}

// -- Create Project -----------------------------------------------
export async function createProject(data: {
  title: string;
  description?: string;
  ownerUserId?: string | null;
  quarter?: string;
  rockNumber?: number;
  type?: "rock" | "project";
  visibility?: "private" | "members" | "public";
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();
  const id = crypto.randomUUID();

  // Auto-assign rock number if needed
  let rockNumber = data.rockNumber;
  if (!rockNumber && data.quarter) {
    const ownerFilter = data.ownerUserId
      ? eq(projects.ownerUserId, data.ownerUserId)
      : isNull(projects.ownerUserId);
    const existing = await db.query.projects.findMany({
      where: and(ownerFilter, eq(projects.quarter, data.quarter)),
    });
    rockNumber = existing.length + 1;
  }

  await db.insert(projects).values({
    id,
    title: data.title,
    description: data.description || null,
    ownerUserId: data.ownerUserId ?? null,
    quarter: data.quarter || null,
    rockNumber: rockNumber || 0,
    status: "not_started",
    progress: 0,
    type: data.type || "project",
    visibility: data.visibility || "members",
    createdAt: now,
    updatedAt: now,
  });

  // Add creator as owner member
  await db.insert(projectMembers).values({
    projectId: id,
    userId: session.user.id,
    role: "owner",
    addedAt: now,
  });

  // If ownerUserId is different from creator, add them too
  if (data.ownerUserId && data.ownerUserId !== session.user.id) {
    await db.insert(projectMembers).values({
      projectId: id,
      userId: data.ownerUserId,
      role: "owner",
      addedAt: now,
    });
  }

  revalidatePath("/");
  revalidatePath("/projects");
  return { id };
}

// -- Update Project -----------------------------------------------
export async function updateProject(
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    status: "on_track" | "off_track" | "complete" | "at_risk" | "not_started";
    progress: number;
    notes: string;
    ownerUserId: string;
    visibility: "private" | "members" | "public";
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owner or admin can update
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) throw new Error("Project not found");

  if (session.user.role !== "admin") {
    const membership = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, session.user.id),
        eq(projectMembers.role, "owner")
      ),
    });
    if (!membership && project.ownerUserId !== session.user.id) {
      throw new Error("Only project owners or admins can update this project");
    }
  }

  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(projects.id, projectId));

  revalidatePath("/");
  revalidatePath("/projects");
}

// -- Delete Project -----------------------------------------------
export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owner or admin can delete
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) throw new Error("Project not found");

  if (session.user.role !== "admin" && project.ownerUserId !== session.user.id) {
    throw new Error("Only the project owner or an admin can delete this project");
  }

  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/");
  revalidatePath("/projects");
}

// -- Project Members ----------------------------------------------
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: "viewer" | "member" | "owner" = "member"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owner or admin can add members
  if (session.user.role !== "admin") {
    const membership = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, session.user.id),
        eq(projectMembers.role, "owner")
      ),
    });
    if (!membership) {
      throw new Error("Only project owners or admins can add members");
    }
  }

  // Check if already a member
  const existing = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ),
  });
  if (existing) return;

  await db.insert(projectMembers).values({
    projectId,
    userId,
    role,
    addedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/projects");
}

export async function removeProjectMember(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owner or admin can remove members
  if (session.user.role !== "admin") {
    const membership = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, session.user.id),
        eq(projectMembers.role, "owner")
      ),
    });
    if (!membership) {
      throw new Error("Only project owners or admins can remove members");
    }
  }

  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );

  revalidatePath("/");
  revalidatePath("/projects");
}

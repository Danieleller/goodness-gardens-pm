"use server";

import { db } from "@/db";
import { rocks, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, asc, desc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRocks(quarter?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conditions = quarter ? eq(rocks.quarter, quarter) : undefined;

  return db.query.rocks.findMany({
    where: conditions,
    with: { owner: true },
    orderBy: [asc(rocks.ownerUserId), asc(rocks.rockNumber)],
  });
}

export async function getQuarters() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allRocks = await db.query.rocks.findMany({
    columns: { quarter: true },
  });
  const quarters = [...new Set(allRocks.map((r) => r.quarter))].sort().reverse();
  return quarters;
}

export async function createRock(data: {
  title: string;
  ownerUserId?: string | null;
  quarter: string;
  rockNumber?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Auto-assign rock number if not provided
  let rockNumber = data.rockNumber;
  if (!rockNumber) {
    const ownerFilter = data.ownerUserId
      ? eq(rocks.ownerUserId, data.ownerUserId)
      : isNull(rocks.ownerUserId);
    const existingRocks = await db.query.rocks.findMany({
      where: and(
        ownerFilter,
        eq(rocks.quarter, data.quarter)
      ),
    });
    rockNumber = existingRocks.length + 1;
  }

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(rocks).values({
    id,
    title: data.title,
    ownerUserId: data.ownerUserId ?? null,
    quarter: data.quarter,
    rockNumber,
    status: "not_started",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  return { id };
}

export async function updateRock(
  rockId: string,
  data: Partial<{
    title: string;
    status: "on_track" | "off_track" | "complete" | "at_risk" | "not_started";
    progress: number;
    notes: string;
    ownerUserId: string;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(rocks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rocks.id, rockId));

  revalidatePath("/");
}

export async function deleteRock(rockId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(rocks).where(eq(rocks.id, rockId));
  revalidatePath("/");
}

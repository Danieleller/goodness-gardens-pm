"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userPrefs } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserPrefsData = {
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  heidiEnabled: boolean;
};

const DEFAULTS: UserPrefsData = {
  theme: "system",
  sidebarCollapsed: false,
  heidiEnabled: true,
};

/** Fetch current user prefs (returns defaults if none saved) */
export async function getUserPrefs(): Promise<UserPrefsData> {
  const session = await auth();
  if (!session?.user?.id) return DEFAULTS;

  const row = await db.query.userPrefs.findFirst({
    where: eq(userPrefs.userId, session.user.id),
  });

  if (!row) return DEFAULTS;

  return {
    theme: row.theme as UserPrefsData["theme"],
    sidebarCollapsed: row.sidebarCollapsed,
    heidiEnabled: row.heidiEnabled,
  };
}

/** Upsert user prefs (partial update) */
export async function saveUserPrefs(
  data: Partial<UserPrefsData>
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const existing = await db.query.userPrefs.findFirst({
    where: eq(userPrefs.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userPrefs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userPrefs.userId, session.user.id));
  } else {
    await db.insert(userPrefs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      ...DEFAULTS,
      ...data,
      updatedAt: new Date(),
    });
  }
}

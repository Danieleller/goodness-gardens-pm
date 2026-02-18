import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id!),
  });

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  const [allUsers, allCategories] = await Promise.all([
    db.query.users.findMany(),
    db.query.categories.findMany({ orderBy: asc(categories.sortOrder) }),
  ]);

  return (
    <SettingsClient
      currentUser={dbUser}
      users={allUsers}
      categories={allCategories}
    />
  );
}

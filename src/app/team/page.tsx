import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { desc, asc } from "drizzle-orm";
import { notifications, categories, userGroups, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { HomeShell } from "@/components/layout/HomeShell";
import { getUserPrefs } from "@/actions/userPrefs";
import { TeamDirectory } from "@/components/team/TeamDirectory";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const prefs = await getUserPrefs();

  const [allUsers, userNotifications, allCategories, allGroups, allProjects] =
    await Promise.all([
      db.query.users.findMany({
        with: { manager: true },
      }),
      db.query.notifications.findMany({
        where: eq(notifications.userId, session.user.id!),
        with: { task: true },
        orderBy: desc(notifications.createdAt),
        limit: 20,
      }),
      db.query.categories.findMany({ orderBy: asc(categories.sortOrder) }),
      db.query.userGroups.findMany({
        with: { members: { with: { user: true } } },
      }),
      db.query.projects.findMany({
        with: { owner: true, members: { with: { user: true } } },
        orderBy: [asc(projects.ownerUserId), asc(projects.rockNumber)],
      }),
    ]);

  return (
    <HomeShell
      currentPath="/team"
      teamCount={allUsers.length}
      userName={session.user.name ?? undefined}
      userImage={session.user.image}
      initialCollapsed={prefs.sidebarCollapsed}
    >
      <Header
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as any).role,
        }}
        users={allUsers}
        notifications={userNotifications as any}
        categories={allCategories}
        groups={allGroups as any}
        projects={allProjects as any}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-xl font-semibold mb-6"
            style={{ color: "var(--text)" }}
          >
            Team Directory
          </h1>
          <TeamDirectory
            users={allUsers as any}
            currentUserRole={(session.user as any).role}
          />
        </div>
      </main>
    </HomeShell>
  );
}

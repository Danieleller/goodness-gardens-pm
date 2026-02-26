import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { desc, asc } from "drizzle-orm";
import { tasks, notifications, categories, rocks, userGroups, projects, projectMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { HomeShell } from "@/components/layout/HomeShell";
import { getUserPrefs } from "@/actions/userPrefs";
import { visibleTasksWhere } from "@/lib/visibility";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const prefs = await getUserPrefs();

  // Build visibility condition for the current user
  const visCondition = visibleTasksWhere(session.user.id, (session.user as any).role);

  const [allTasks, allUsers, userNotifications, allCategories, allRocks, allGroups, allProjects] = await Promise.all([
    db.query.tasks.findMany({
      where: visCondition,
      with: {
        assignedTo: true,
        createdBy: true,
        additionalAssignees: { with: { user: true } },
        groupAssignments: { with: { group: true } },
        members: { with: { user: true } },
      },
      orderBy: desc(tasks.updatedAt),
    }),
    db.query.users.findMany(),
    db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id!),
      with: { task: true },
      orderBy: desc(notifications.createdAt),
      limit: 20,
    }),
    db.query.categories.findMany({ orderBy: asc(categories.sortOrder) }),
    db.query.rocks.findMany({
      with: { owner: true },
      orderBy: [asc(rocks.ownerUserId), asc(rocks.rockNumber)],
    }),
    db.query.userGroups.findMany({
      with: {
        members: { with: { user: true } },
      },
    }),
    db.query.projects.findMany({
      with: {
        owner: true,
        members: { with: { user: true } },
      },
      orderBy: [asc(projects.ownerUserId), asc(projects.rockNumber)],
    }),
  ]);

  return (
    <HomeShell
      currentPath="/"
      taskCount={allTasks.length}
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
      <main className="flex-1 overflow-hidden">
        <KanbanBoard
          initialTasks={allTasks as any}
          users={allUsers}
          categories={allCategories}
          rocks={allRocks as any}
          projects={allProjects as any}
        />
      </main>
    </HomeShell>
  );
}

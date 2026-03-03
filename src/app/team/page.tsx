import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { desc, asc } from "drizzle-orm";
import { notifications, categories, userGroups, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { HomeShell } from "@/components/layout/HomeShell";
import { getUserPrefs } from "@/actions/userPrefs";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const prefs = await getUserPrefs();

  const [allUsers, userNotifications, allCategories, allGroups, allProjects] =
    await Promise.all([
      db.query.users.findMany(),
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
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-xl font-semibold mb-6"
            style={{ color: "var(--text)" }}
          >
            Team Members
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                }}
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="w-10 h-10 rounded-full shrink-0"
                    style={{ border: "1px solid var(--border)" }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    {(user.name || user.email || "?")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {user.name || user.email}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--text-3)" }}
                  >
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-3)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {allUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users
                className="w-10 h-10"
                style={{ color: "var(--text-3)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No team members yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </HomeShell>
  );
}

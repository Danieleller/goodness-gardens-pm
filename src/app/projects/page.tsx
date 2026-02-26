import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjects } from "@/actions/projects";
import { getUsers } from "@/actions/tasks";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { HomeShell } from "@/components/layout/HomeShell";
import { getUserPrefs } from "@/actions/userPrefs";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const prefs = await getUserPrefs();
  const [projects, users] = await Promise.all([
    getProjects(),
    getUsers(),
  ]);

  return (
    <HomeShell
      currentPath="/projects"
      taskCount={0}
      userName={session.user.name ?? undefined}
      userImage={session.user.image}
      initialCollapsed={prefs.sidebarCollapsed}
    >
      <div className="flex-1 overflow-hidden">
        <ProjectsView projects={projects as any} users={users} />
      </div>
    </HomeShell>
  );
}

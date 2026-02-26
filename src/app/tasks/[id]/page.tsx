import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTaskWithAudit, getUsers } from "@/actions/tasks";
import { getCategories } from "@/actions/admin";
import { getUserGroups } from "@/actions/groups";
import { getProjects } from "@/actions/projects";
import { TaskDetailClient } from "./TaskDetailClient";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [task, users, categories, groups, projects] = await Promise.all([
    getTaskWithAudit(id),
    getUsers(),
    getCategories(),
    getUserGroups(),
    getProjects(),
  ]);

  if (!task) redirect("/");

  return (
    <TaskDetailClient
      task={task as any}
      users={users}
      categories={categories}
      groups={groups as any}
      projects={projects as any}
    />
  );
}

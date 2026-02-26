"use client";

import { useState, useTransition } from "react";
import {
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
  Users,
} from "lucide-react";
import { createProject, updateProject, deleteProject } from "@/actions/projects";
import type { User, Project, ProjectMember } from "@/db/schema";

type ProjectWithMembers = Project & {
  owner: User | null;
  members: (ProjectMember & { user: User })[];
};

const STATUS_CONFIG = {
  not_started: { label: "Not Started", bg: "bg-[var(--surface-2)]", text: "[color:var(--text-2)]", dot: "bg-[var(--text-3)]" },
  on_track: { label: "On Track", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  at_risk: { label: "At Risk", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  off_track: { label: "Off Track", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  complete: { label: "Complete", bg: "bg-[var(--accent)]", text: "text-white", dot: "bg-white" },
};

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q}-${now.getFullYear()}`;
}

export function ProjectsView({
  projects,
  users,
}: {
  projects: ProjectWithMembers[];
  users: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newType, setNewType] = useState<"project" | "rock">("project");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(
    new Set([...users.map((u) => u.id), "__unassigned__"])
  );

  // Get unique quarters from projects
  const allQuarters = [...new Set(projects.map((p) => p.quarter).filter(Boolean))] as string[];
  if (!allQuarters.includes(selectedQuarter)) allQuarters.push(selectedQuarter);
  allQuarters.sort().reverse();

  // Filter projects for selected quarter
  const quarterProjects = projects.filter((p) => p.quarter === selectedQuarter);

  // Group by user
  const projectsByUser = new Map<string | null, ProjectWithMembers[]>();
  const unassignedProjects: ProjectWithMembers[] = [];
  for (const project of quarterProjects) {
    if (project.ownerUserId === null) {
      unassignedProjects.push(project);
      const existing = projectsByUser.get(null) || [];
      existing.push(project);
      projectsByUser.set(null, existing);
    } else {
      const existing = projectsByUser.get(project.ownerUserId) || [];
      existing.push(project);
      projectsByUser.set(project.ownerUserId, existing);
    }
  }

  const usersWithProjects = users.filter((u) => projectsByUser.has(u.id));
  const usersWithoutProjects = users.filter((u) => !projectsByUser.has(u.id));

  // Stats
  const totalProjects = quarterProjects.length;
  const completedProjects = quarterProjects.filter((p) => p.status === "complete").length;
  const onTrackProjects = quarterProjects.filter((p) => p.status === "on_track").length;
  const atRiskProjects = quarterProjects.filter(
    (p) => p.status === "at_risk" || p.status === "off_track"
  ).length;

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim() || newOwner === "") return;
    startTransition(async () => {
      await createProject({
        title: newTitle.trim(),
        ownerUserId: newOwner === "null" ? null : newOwner,
        quarter: selectedQuarter,
        type: newType,
      });
      setNewTitle("");
      setNewOwner("");
      setNewType("project");
      setShowAddForm(false);
    });
  };

  const handleStatusChange = (projectId: string, status: string) => {
    startTransition(async () => {
      await updateProject(projectId, {
        status: status as any,
        progress: status === "complete" ? 100 : undefined,
      });
    });
  };

  const handleSaveEdit = (projectId: string) => {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateProject(projectId, { title: editTitle.trim() });
      setEditingProject(null);
    });
  };

  const handleDelete = (projectId: string) => {
    if (!confirm("Delete this project?")) return;
    startTransition(async () => {
      await deleteProject(projectId);
    });
  };

  const renderProjectRow = (project: ProjectWithMembers) => {
    const statusConf = STATUS_CONFIG[project.status] || STATUS_CONFIG.not_started;
    const isEditing = editingProject === project.id;
    const isRock = project.type === "rock";

    return (
      <div
        key={project.id}
        className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-1)] group transition-smooth"
      >
        {/* Number badge */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
          isRock ? "bg-[var(--accent)] text-white" : "bg-blue-600 text-white"
        }`}>
          {project.rockNumber || "#"}
        </div>

        {/* Title */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(project.id);
                if (e.key === "Escape") setEditingProject(null);
              }}
            />
            <button
              onClick={() => handleSaveEdit(project.id)}
              className="text-emerald-600 hover:text-emerald-800 transition-smooth"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingProject(null)}
              className="[color:var(--text-3)] hover:[color:var(--text-2)] transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${
              project.status === "complete" ? "line-through [color:var(--text-3)]" : "[color:var(--text)]"
            }`}>
              {project.title}
            </p>
            {project.members.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3 [color:var(--text-3)]" />
                <span className="text-[10px] [color:var(--text-3)]">
                  {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Type badge */}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isRock
            ? "bg-[var(--accent)]/10 [color:var(--accent)]"
            : "bg-blue-50 text-blue-600"
        }`}>
          {isRock ? "Rock" : "Project"}
        </span>

        {/* Status dropdown */}
        <select
          value={project.status}
          onChange={(e) => handleStatusChange(project.id, e.target.value)}
          className={`text-[11px] font-medium rounded-md px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 ${statusConf.bg} ${statusConf.text}`}
        >
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
          <button
            onClick={() => {
              setEditingProject(project.id);
              setEditTitle(project.title);
            }}
            className="p-1 [color:var(--text-3)] hover:[color:var(--text-2)] rounded transition-smooth"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(project.id)}
            className="p-1 [color:var(--text-3)] hover:text-red-500 rounded transition-smooth"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderUserSection = (
    key: string,
    label: string,
    avatar: React.ReactNode,
    userProjects: ProjectWithMembers[],
    userCompleted: number
  ) => (
    <div key={key} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] overflow-hidden hover-lift">
      <button
        onClick={() => toggleUser(key)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-1)] transition-smooth"
      >
        {expandedUsers.has(key) ? (
          <ChevronDown className="w-4 h-4 [color:var(--text-3)] shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 [color:var(--text-3)] shrink-0" />
        )}
        {avatar}
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold [color:var(--text)]">{label}</p>
          <p className="text-[11px] [color:var(--text-3)]">
            {userProjects.length} project{userProjects.length !== 1 ? "s" : ""} &middot; {userCompleted} complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-[var(--surface-2)] rounded-full h-1.5">
            <div
              className="bg-[var(--accent)] rounded-full h-1.5 transition-all"
              style={{
                width: `${userProjects.length > 0 ? (userCompleted / userProjects.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold [color:var(--text-2)] w-8 text-right">
            {userProjects.length > 0 ? Math.round((userCompleted / userProjects.length) * 100) : 0}%
          </span>
        </div>
      </button>

      {expandedUsers.has(key) && (
        <div className="border-t border-[var(--border)]">
          {userProjects
            .sort((a, b) => a.rockNumber - b.rockNumber)
            .map(renderProjectRow)}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="rocks-header-gradient text-white px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-white/60" />
              <h2 className="text-xl font-bold tracking-tight">Projects &amp; Rocks</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-white/10 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {allQuarters.map((q) => (
                  <option key={q} value={q} className="text-black">
                    {q.replace("-", " ")}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-white [color:var(--accent)] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/90 transition-smooth"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold">{totalProjects}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-emerald-400">{completedProjects}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">Completed</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-emerald-400">{onTrackProjects}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">On Track</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-amber-400">{atRiskProjects}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">At Risk</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalProjects > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-white/40 mb-1">
                <span>Overall Progress</span>
                <span className="font-semibold text-white/70">
                  {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="progress-emerald rounded-full h-2 progress-bar"
                  style={{ width: `${totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[var(--surface-1)] border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1">Title</label>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What's the goal or project?"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 bg-[var(--surface-1)]"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="w-36">
              <label className="block text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "project" | "rock")}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 bg-[var(--surface-1)]"
              >
                <option value="project">Project</option>
                <option value="rock">Rock</option>
              </select>
            </div>
            <div className="w-48">
              <label className="block text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1">Owner</label>
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 bg-[var(--surface-1)]"
              >
                <option value="">Select owner...</option>
                <option value="null">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={isPending || !newTitle.trim() || newOwner === ""}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent)]/90 disabled:opacity-50 transition-smooth"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 [color:var(--text-2)] text-sm hover:bg-[var(--surface-2)] rounded-lg transition-smooth"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects by Person */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Unassigned section */}
        {unassignedProjects.length > 0 &&
          renderUserSection(
            "__unassigned__",
            "Unassigned",
            <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] [color:var(--text-2)] flex items-center justify-center text-xs font-bold shrink-0">
              ?
            </div>,
            unassignedProjects,
            unassignedProjects.filter((p) => p.status === "complete").length
          )}

        {usersWithProjects.map((user) => {
          const userProjects = projectsByUser.get(user.id) || [];
          const userCompleted = userProjects.filter((p) => p.status === "complete").length;

          return renderUserSection(
            user.id,
            user.name || user.email,
            user.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full shrink-0 ring-1 ring-[var(--border)]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user.name || user.email || "?")[0].toUpperCase()}
              </div>
            ),
            userProjects,
            userCompleted
          );
        })}

        {/* Users without projects */}
        {usersWithoutProjects.length > 0 && usersWithProjects.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[11px] [color:var(--text-3)] mb-2 font-medium uppercase tracking-wide">No Projects Assigned</p>
            <div className="flex flex-wrap gap-2">
              {usersWithoutProjects.map((u) => (
                <span key={u.id} className="text-[11px] [color:var(--text-2)] bg-[var(--surface-2)] rounded-md px-2.5 py-1">
                  {u.name || u.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {totalProjects === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 [color:var(--text-3)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold [color:var(--text-2)]">No Projects for {selectedQuarter.replace("-", " ")}</h3>
            <p className="text-sm [color:var(--text-3)] mt-1">
              Projects and rocks are your company&apos;s goals. Click &quot;Add&quot; to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

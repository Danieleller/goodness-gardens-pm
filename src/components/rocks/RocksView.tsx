"use client";

import { useState, useTransition } from "react";
import {
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { createRock, updateRock, deleteRock } from "@/actions/rocks";
import type { User, Rock } from "@/db/schema";

type RockWithOwner = Rock & { owner: User };

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

export function RocksView({
  rocks,
  users,
}: {
  rocks: RockWithOwner[];
  users: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRockTitle, setNewRockTitle] = useState("");
  const [newRockOwner, setNewRockOwner] = useState("");
  const [editingRock, setEditingRock] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set([...users.map((u) => u.id), "__unassigned__"]));

  // Get unique quarters from rocks
  const allQuarters = [...new Set(rocks.map((r) => r.quarter))];
  if (!allQuarters.includes(selectedQuarter)) allQuarters.push(selectedQuarter);
  allQuarters.sort().reverse();

  // Filter rocks for selected quarter
  const quarterRocks = rocks.filter((r) => r.quarter === selectedQuarter);

  // Group rocks by user
  const rocksByUser = new Map<string | null, RockWithOwner[]>();
  const unassignedRocks: RockWithOwner[] = [];
  for (const rock of quarterRocks) {
    if (rock.ownerUserId === null) {
      unassignedRocks.push(rock);
      const existing = rocksByUser.get(null) || [];
      existing.push(rock);
      rocksByUser.set(null, existing);
    } else {
      const existing = rocksByUser.get(rock.ownerUserId) || [];
      existing.push(rock);
      rocksByUser.set(rock.ownerUserId, existing);
    }
  }

  const usersWithRocks = users.filter((u) => rocksByUser.has(u.id));
  const usersWithoutRocks = users.filter((u) => !rocksByUser.has(u.id));

  // Stats
  const totalRocks = quarterRocks.length;
  const completedRocks = quarterRocks.filter((r) => r.status === "complete").length;
  const onTrackRocks = quarterRocks.filter((r) => r.status === "on_track").length;
  const atRiskRocks = quarterRocks.filter((r) => r.status === "at_risk" || r.status === "off_track").length;

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddRock = () => {
    if (!newRockTitle.trim() || newRockOwner === "") return;
    startTransition(async () => {
      await createRock({
        title: newRockTitle.trim(),
        ownerUserId: newRockOwner === "null" ? null : newRockOwner,
        quarter: selectedQuarter,
      });
      setNewRockTitle("");
      setNewRockOwner("");
      setShowAddForm(false);
    });
  };

  const handleStatusChange = (rockId: string, status: string) => {
    startTransition(async () => {
      await updateRock(rockId, {
        status: status as any,
        progress: status === "complete" ? 100 : undefined,
      });
    });
  };

  const handleSaveEdit = (rockId: string) => {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateRock(rockId, { title: editTitle.trim() });
      setEditingRock(null);
    });
  };

  const handleDeleteRock = (rockId: string) => {
    if (!confirm("Delete this rock?")) return;
    startTransition(async () => {
      await deleteRock(rockId);
    });
  };

  const renderRockRow = (rock: RockWithOwner) => {
    const statusConf = STATUS_CONFIG[rock.status] || STATUS_CONFIG.not_started;
    const isEditing = editingRock === rock.id;

    return (
      <div
        key={rock.id}
        className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-1)] group transition-smooth"
      >
        {/* Rock number */}
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {rock.rockNumber}
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
                if (e.key === "Enter") handleSaveEdit(rock.id);
                if (e.key === "Escape") setEditingRock(null);
              }}
            />
            <button
              onClick={() => handleSaveEdit(rock.id)}
              className="text-emerald-600 hover:text-emerald-800 transition-smooth"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingRock(null)}
              className="[color:var(--text-3)] hover:[color:var(--text-2)] transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className={`flex-1 text-sm ${
            rock.status === "complete" ? "line-through [color:var(--text-3)]" : "[color:var(--text)]"
          }`}>
            {rock.title}
          </p>
        )}

        {/* Status dropdown */}
        <select
          value={rock.status}
          onChange={(e) => handleStatusChange(rock.id, e.target.value)}
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
              setEditingRock(rock.id);
              setEditTitle(rock.title);
            }}
            className="p-1 [color:var(--text-3)] hover:[color:var(--text-2)] rounded transition-smooth"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteRock(rock.id)}
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
    userRocks: RockWithOwner[],
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
            {userRocks.length} rock{userRocks.length !== 1 ? "s" : ""} Â· {userCompleted} complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-[var(--surface-2)] rounded-full h-1.5">
            <div
              className="bg-[var(--accent)] rounded-full h-1.5 transition-all"
              style={{
                width: `${userRocks.length > 0 ? (userCompleted / userRocks.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold [color:var(--text-2)] w-8 text-right">
            {userRocks.length > 0 ? Math.round((userCompleted / userRocks.length) * 100) : 0}%
          </span>
        </div>
      </button>

      {expandedUsers.has(key) && (
        <div className="border-t border-[var(--border)]">
          {userRocks
            .sort((a, b) => a.rockNumber - b.rockNumber)
            .map(renderRockRow)}
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
              <Target className="w-6 h-6 text-white/60" />
              <h2 className="text-xl font-bold tracking-tight">Company Rocks</h2>
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
                Add Rock
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold">{totalRocks}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">Total Rocks</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-emerald-400">{completedRocks}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">Completed</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-emerald-400">{onTrackRocks}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">On Track</p>
            </div>
            <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/6">
              <p className="text-2xl font-bold text-amber-400">{atRiskRocks}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide">At Risk</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalRocks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-white/40 mb-1">
                <span>Overall Progress</span>
                <span className="font-semibold text-white/70">{totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="progress-emerald rounded-full h-2 progress-bar"
                  style={{ width: `${totalRocks > 0 ? (completedRocks / totalRocks) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Rock Form */}
      {showAddForm && (
        <div className="bg-[var(--surface-1)] border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1">Rock Title</label>
              <input
                autoFocus
                value={newRockTitle}
                onChange={(e) => setNewRockTitle(e.target.value)}
                placeholder="What's the company goal?"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 bg-[var(--surface-1)]"
                onKeyDown={(e) => e.key === "Enter" && handleAddRock()}
              />
            </div>
            <div className="w-48">
              <label className="block text-[11px] font-medium [color:var(--text-3)] uppercase tracking-wide mb-1">Owner</label>
              <select
                value={newRockOwner}
                onChange={(e) => setNewRockOwner(e.target.value)}
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
              onClick={handleAddRock}
              disabled={isPending || !newRockTitle.trim() || newRockOwner === ""}
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

      {/* Rocks by Person */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Unassigned rocks section */}
        {unassignedRocks.length > 0 &&
          renderUserSection(
            "__unassigned__",
            "Unassigned",
            <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] [color:var(--text-2)] flex items-center justify-center text-xs font-bold shrink-0">
              ?
            </div>,
            unassignedRocks,
            unassignedRocks.filter((r) => r.status === "complete").length
          )}

        {usersWithRocks.map((user) => {
          const userRocks = rocksByUser.get(user.id) || [];
          const userCompleted = userRocks.filter((r) => r.status === "complete").length;

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
            userRocks,
            userCompleted
          );
        })}

        {/* Users without rocks */}
        {usersWithoutRocks.length > 0 && usersWithRocks.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[11px] [color:var(--text-3)] mb-2 font-medium uppercase tracking-wide">No Rocks Assigned</p>
            <div className="flex flex-wrap gap-2">
              {usersWithoutRocks.map((u) => (
                <span key={u.id} className="text-[11px] [color:var(--text-2)] bg-[var(--surface-2)] rounded-md px-2.5 py-1">
                  {u.name || u.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {totalRocks === 0 && (
          <div className="text-center py-16">
            <Target className="w-12 h-12 [color:var(--text-3)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold [color:var(--text-2)]">No Rocks for {selectedQuarter.replace("-", " ")}</h3>
            <p className="text-sm [color:var(--text-3)] mt-1">
              Rocks are your company&apos;s ultimate goals. Click &quot;Add Rock&quot; to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  not_started: { label: "Not Started", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  on_track: { label: "On Track", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  at_risk: { label: "At Risk", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  off_track: { label: "Off Track", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  complete: { label: "Complete", bg: "bg-black", text: "text-white", dot: "bg-white" },
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

  // Group rocks by user (including null for unassigned)
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

  // Get users who have rocks, plus all users for the dropdown
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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="rocks-header-gradient text-white px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <h2 className="text-xl font-bold">Company Rocks</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {allQuarters.map((q) => (
                  <option key={q} value={q}>
                    {q.replace("-", " ")}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Rock
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-2xl font-bold">{totalRocks}</p>
              <p className="text-xs text-gray-400">Total Rocks</p>
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-2xl font-bold text-emerald-400">{completedRocks}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-2xl font-bold text-emerald-400">{onTrackRocks}</p>
              <p className="text-xs text-gray-400">On Track</p>
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <p className="text-2xl font-bold text-amber-400">{atRiskRocks}</p>
              <p className="text-xs text-gray-400">At Risk</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalRocks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Overall Progress</span>
                <span>{totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
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
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Rock Title</label>
              <input
                autoFocus
                value={newRockTitle}
                onChange={(e) => setNewRockTitle(e.target.value)}
                placeholder="What's the company goal?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                onKeyDown={(e) => e.key === "Enter" && handleAddRock()}
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-slate-600 mb-1">Owner</label>
              <select
                value={newRockOwner}
                onChange={(e) => setNewRockOwner(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
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
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rocks by Person */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Unassigned rocks section */}
        {unassignedRocks.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Unassigned header */}
            <button
              onClick={() => toggleUser("__unassigned__")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              {expandedUsers.has("__unassigned__") ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-bold shrink-0">
                ?
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">Unassigned</p>
                <p className="text-xs text-slate-400">
                  {unassignedRocks.length} rock{unassignedRocks.length !== 1 ? "s" : ""} Â· {unassignedRocks.filter((r) => r.status === "complete").length} complete
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-black rounded-full h-1.5 transition-all"
                    style={{
                      width: `${unassignedRocks.length > 0 ? (unassignedRocks.filter((r) => r.status === "complete").length / unassignedRocks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 w-8 text-right">
                  {unassignedRocks.length > 0 ? Math.round((unassignedRocks.filter((r) => r.status === "complete").length / unassignedRocks.length) * 100) : 0}%
                </span>
              </div>
            </button>

            {/* Rocks list */}
            {expandedUsers.has("__unassigned__") && (
              <div className="border-t border-slate-100">
                {unassignedRocks
                  .sort((a, b) => a.rockNumber - b.rockNumber)
                  .map((rock) => {
                    const statusConf = STATUS_CONFIG[rock.status] || STATUS_CONFIG.not_started;
                    const isEditing = editingRock === rock.id;

                    return (
                      <div
                        key={rock.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 group"
                      >
                        {/* Rock number */}
                        <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {rock.rockNumber}
                        </div>

                        {/* Title */}
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(rock.id);
                                if (e.key === "Escape") setEditingRock(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(rock.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingRock(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className={`flex-1 text-sm ${
                            rock.status === "complete" ? "line-through text-slate-400" : "text-slate-800"
                          }`}>
                            {rock.title}
                          </p>
                        )}

                        {/* Status dropdown */}
                        <select
                          value={rock.status}
                          onChange={(e) => handleStatusChange(rock.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 ${statusConf.bg} ${statusConf.text}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val.label}
                            </option>
                          ))}
                        </select>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingRock(rock.id);
                              setEditTitle(rock.title);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRock(rock.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {usersWithRocks.map((user) => {
          const userRocks = rocksByUser.get(user.id) || [];
          const isExpanded = expandedUsers.has(user.id);
          const userCompleted = userRocks.filter((r) => r.status === "complete").length;

          return (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* User header */}
              <button
                onClick={() => toggleUser(user.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                {user.image ? (
                  <img src={user.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">
                    {userRocks.length} rock{userRocks.length !== 1 ? "s" : ""} Â· {userCompleted} complete
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-black rounded-full h-1.5 transition-all"
                      style={{
                        width: `${userRocks.length > 0 ? (userCompleted / userRocks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 w-8 text-right">
                    {userRocks.length > 0 ? Math.round((userCompleted / userRocks.length) * 100) : 0}%
                  </span>
                </div>
              </button>

              {/* Rocks list */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {userRocks
                    .sort((a, b) => a.rockNumber - b.rockNumber)
                    .map((rock) => {
                      const statusConf = STATUS_CONFIG[rock.status] || STATUS_CONFIG.not_started;
                      const isEditing = editingRock === rock.id;

                      return (
                        <div
                          key={rock.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 group"
                        >
                          {/* Rock number */}
                          <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {rock.rockNumber}
                          </div>

                          {/* Title */}
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(rock.id);
                                  if (e.key === "Escape") setEditingRock(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(rock.id)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRock(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <p className={`flex-1 text-sm ${
                              rock.status === "complete" ? "line-through text-slate-400" : "text-slate-800"
                            }`}>
                              {rock.title}
                            </p>
                          )}

                          {/* Status dropdown */}
                          <select
                            value={rock.status}
                            onChange={(e) => handleStatusChange(rock.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 ${statusConf.bg} ${statusConf.text}`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label}
                              </option>
                            ))}
                          </select>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingRock(rock.id);
                                setEditTitle(rock.title);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRock(rock.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        {/* Users without rocks */}
        {usersWithoutRocks.length > 0 && usersWithRocks.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">No Rocks Assigned</p>
            <div className="flex flex-wrap gap-2">
              {usersWithoutRocks.map((u) => (
                <span key={u.id} className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                  {u.name || u.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {totalRocks === 0 && (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600">No Rocks for {selectedQuarter.replace("-", " ")}</h3>
            <p className="text-sm text-slate-400 mt-1">
              Rocks are your company&apos;s ultimate goals. Click &quot;Add Rock&quot; to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

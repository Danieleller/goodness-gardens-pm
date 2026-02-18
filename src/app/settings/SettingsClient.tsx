"use client";

import { useState, useTransition } from "react";
import {
  inviteUser,
  updateUserRole,
  removeUser,
  createCategory,
  renameCategory,
  deleteCategory,
} from "@/actions/admin";
import {
  ArrowLeft,
  Users,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User, Category } from "@/db/schema";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldCheck,
  manager: Shield,
  member: UserIcon,
};

const COLOR_OPTIONS = [
  { value: "bg-slate-50 border-slate-200", label: "Gray" },
  { value: "bg-purple-50 border-purple-200", label: "Purple" },
  { value: "bg-blue-50 border-blue-200", label: "Blue" },
  { value: "bg-emerald-50 border-emerald-200", label: "Green" },
  { value: "bg-amber-50 border-amber-200", label: "Amber" },
  { value: "bg-red-50 border-red-200", label: "Red" },
  { value: "bg-pink-50 border-pink-200", label: "Pink" },
  { value: "bg-cyan-50 border-cyan-200", label: "Cyan" },
];

export function SettingsClient({
  currentUser,
  users: initialUsers,
  categories: initialCategories,
}: {
  currentUser: User;
  users: User[];
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "categories">("users");
  const [isPending, startTransition] = useTransition();

  // User state
  const [usersList, setUsersList] = useState(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [userError, setUserError] = useState("");

  // Category state
  const [catsList, setCatsList] = useState(initialCategories);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDisplay, setNewCatDisplay] = useState("");
  const [newCatColor, setNewCatColor] = useState("bg-slate-50 border-slate-200");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [catError, setCatError] = useState("");

  const handleInviteUser = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setUserError("");
    startTransition(async () => {
      try {
        await inviteUser({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole });
        setInviteEmail("");
        setInviteName("");
        setInviteRole("member");
        setShowInvite(false);
        router.refresh();
      } catch (e: any) {
        setUserError(e.message || "Failed to invite user");
      }
    });
  };

  const handleUpdateRole = (userId: string, role: "admin" | "manager" | "member") => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        router.refresh();
      } catch (e: any) {
        setUserError(e.message);
      }
    });
  };

  const handleRemoveUser = (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName}? Their tasks will become unassigned.`)) return;
    startTransition(async () => {
      try {
        await removeUser(userId);
        router.refresh();
      } catch (e: any) {
        setUserError(e.message);
      }
    });
  };

  const handleAddCategory = () => {
    const name = newCatName.trim().replace(/\s+/g, "");
    const displayName = newCatDisplay.trim() || newCatName.trim();
    if (!name) return;
    setCatError("");
    startTransition(async () => {
      try {
        await createCategory({ name, displayName, color: newCatColor });
        setNewCatName("");
        setNewCatDisplay("");
        setNewCatColor("bg-slate-50 border-slate-200");
        setShowAddCat(false);
        router.refresh();
      } catch (e: any) {
        setCatError(e.message || "Failed to create category");
      }
    });
  };

  const handleRenameCategory = (catId: string) => {
    if (!editCatName.trim()) return;
    startTransition(async () => {
      try {
        await renameCategory(catId, editCatName.trim());
        setEditingCat(null);
        router.refresh();
      } catch (e: any) {
        setCatError(e.message);
      }
    });
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (!confirm(`Delete "${catName}"? Tasks in this category will be moved to another category.`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(catId);
        router.refresh();
      } catch (e: any) {
        setCatError(e.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to board
          </Link>
          <h1 className="text-sm font-semibold text-slate-900">Settings</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 mb-6 w-fit">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "users"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "categories"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Categories
          </button>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Team Members
              </h2>
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Invite User
              </button>
            </div>

            {userError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                {userError}
              </div>
            )}

            {/* Invite form */}
            {showInvite && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Invite New User
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-create a user account. They will be able to sign in with Google using this email.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@goodnessgardens.net"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleInviteUser}
                    disabled={isPending || !inviteEmail.trim() || !inviteName.trim()}
                    className="px-4 py-2 bg-[#1a3a2a] text-white text-sm rounded-lg hover:bg-[#1a3a2a]/90 disabled:opacity-50"
                  >
                    {isPending ? "Inviting..." : "Send Invite"}
                  </button>
                  <button
                    onClick={() => { setShowInvite(false); setUserError(""); }}
                    className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Users list */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {initialUsers.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role] || UserIcon;
                const isCurrentUser = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="w-9 h-9 rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.name || "Unnamed"}
                        {isCurrentUser && (
                          <span className="text-xs text-slate-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                        disabled={isCurrentUser || isPending}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white disabled:opacity-50"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleRemoveUser(user.id, user.name || user.email)}
                          disabled={isPending}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Task Categories
              </h2>
              <button
                onClick={() => setShowAddCat(true)}
                className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {catError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                {catError}
              </div>
            )}

            {/* Add category form */}
            {showAddCat && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  New Category
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Internal Name (no spaces)
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value.replace(/\s/g, ""))}
                      placeholder="e.g. Marketing"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newCatDisplay}
                      onChange={(e) => setNewCatDisplay(e.target.value)}
                      placeholder="e.g. Marketing & Outreach"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewCatColor(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs border-2 transition-all ${opt.value} ${
                          newCatColor === opt.value
                            ? "ring-2 ring-[#1a3a2a] ring-offset-1"
                            : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCategory}
                    disabled={isPending || !newCatName.trim()}
                    className="px-4 py-2 bg-[#1a3a2a] text-white text-sm rounded-lg hover:bg-[#1a3a2a]/90 disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "Create Category"}
                  </button>
                  <button
                    onClick={() => { setShowAddCat(false); setCatError(""); }}
                    className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Categories list */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {initialCategories.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No categories yet. Add your first category above.
                </div>
              )}
              {initialCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 shrink-0 ${cat.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    {editingCat === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameCategory(cat.id);
                            if (e.key === "Escape") setEditingCat(null);
                          }}
                          className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/30"
                        />
                        <button
                          onClick={() => handleRenameCategory(cat.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCat(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {cat.displayName}
                        </p>
                        <p className="text-xs text-slate-400">
                          Key: {cat.name}
                        </p>
                      </div>
                    )}
                  </div>
                  {editingCat !== cat.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCat(cat.id);
                          setEditCatName(cat.displayName);
                        }}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.displayName)}
                        disabled={isPending}
                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

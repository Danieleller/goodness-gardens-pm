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
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  addGroupMember,
  removeGroupMember,
} from "@/actions/groups";
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
  UsersRound,
  UserPlus,
  UserMinus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User, Category, UserGroup, UserGroupMember } from "@/db/schema";

type GroupWithMembers = UserGroup & {
  members: (UserGroupMember & { user: User })[];
  createdBy: User;
};

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
  { value: "bg-stone-50 border-[#e8e0d4]", label: "Gray" },
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
  groups: initialGroups = [],
}: {
  currentUser: User;
  users: User[];
  categories: Category[];
  groups?: GroupWithMembers[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "categories" | "groups">("users");
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
  const [newCatColor, setNewCatColor] = useState("bg-stone-50 border-[#e8e0d4]");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [catError, setCatError] = useState("");

  // Group state
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("bg-stone-50 border-[#e8e0d4]");
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);

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
        setNewCatColor("bg-stone-50 border-[#e8e0d4]");
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

  // ââ Group handlers ââââââââââââââââââââââââââââââââââ
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    setGroupError("");
    startTransition(async () => {
      try {
        await createUserGroup({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || undefined,
          color: newGroupColor,
          memberIds: newGroupMembers,
        });
        setNewGroupName("");
        setNewGroupDesc("");
        setNewGroupColor("bg-stone-50 border-[#e8e0d4]");
        setNewGroupMembers([]);
        setShowAddGroup(false);
        router.refresh();
      } catch (e: any) {
        setGroupError(e.message || "Failed to create group");
      }
    });
  };

  const handleRenameGroup = (groupId: string) => {
    if (!editGroupName.trim()) return;
    startTransition(async () => {
      try {
        await updateUserGroup(groupId, { name: editGroupName.trim() });
        setEditingGroup(null);
        router.refresh();
      } catch (e: any) {
        setGroupError(e.message);
      }
    });
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (!confirm(`Delete "${groupName}"? Task assignments to this group will be removed.`)) return;
    startTransition(async () => {
      try {
        await deleteUserGroup(groupId);
        router.refresh();
      } catch (e: any) {
        setGroupError(e.message);
      }
    });
  };

  const handleAddMember = (groupId: string, userId: string) => {
    startTransition(async () => {
      try {
        await addGroupMember(groupId, userId);
        router.refresh();
      } catch (e: any) {
        setGroupError(e.message);
      }
    });
  };

  const handleRemoveMember = (groupId: string, userId: string) => {
    startTransition(async () => {
      try {
        await removeGroupMember(groupId, userId);
        router.refresh();
      } catch (e: any) {
        setGroupError(e.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <div className="bg-[#faf8f5]/80 backdrop-blur-md border-b border-[#e8e0d4] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to board
          </Link>
          <h1 className="text-sm font-semibold text-[#2d2520]">Settings</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Tabs */}
        <div className="flex bg-stone-100/60 rounded-lg p-0.5 mb-6 w-fit">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-smooth ${
              tab === "users"
                ? "bg-white text-[#2d2520] shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-smooth ${
              tab === "categories"
                ? "bg-white text-[#2d2520] shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setTab("groups")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-smooth ${
              tab === "groups"
                ? "bg-white text-[#2d2520] shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <UsersRound className="w-4 h-4" />
            Groups
          </button>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2d2520]">
                Team Members
              </h2>
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth"
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
              <div className="bg-white/60 rounded-xl border border-[#e8e0d4] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-stone-600">
                  Invite New User
                </h3>
                <p className="text-xs text-stone-400">
                  Pre-create a user account. They will be able to sign in with Google using this email.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@goodnessgardens.net"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
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
                    className="px-4 py-2 text-stone-500 text-sm hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Users list */}
            <div className="bg-white/60 rounded-xl border border-[#e8e0d4] divide-y divide-slate-100">
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
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-medium text-stone-400">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2d2520] truncate">
                        {user.name || "Unnamed"}
                        {isCurrentUser && (
                          <span className="text-xs text-stone-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-stone-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                        disabled={isCurrentUser || isPending}
                        className="text-xs border border-[#e8e0d4] rounded-md px-2 py-1 text-stone-500 bg-white disabled:opacity-50"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleRemoveUser(user.id, user.name || user.email)}
                          disabled={isPending}
                          className="p-1.5 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-500 disabled:opacity-50"
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
              <h2 className="text-lg font-semibold text-[#2d2520]">
                Task Categories
              </h2>
              <button
                onClick={() => setShowAddCat(true)}
                className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth"
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
              <div className="bg-white/60 rounded-xl border border-[#e8e0d4] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-stone-600">
                  New Category
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Internal Name (no spaces)
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value.replace(/\s/g, ""))}
                      placeholder="e.g. Marketing"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newCatDisplay}
                      onChange={(e) => setNewCatDisplay(e.target.value)}
                      placeholder="e.g. Marketing & Outreach"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
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
                    className="px-4 py-2 text-stone-500 text-sm hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Categories list */}
            <div className="bg-white/60 rounded-xl border border-[#e8e0d4] divide-y divide-slate-100">
              {initialCategories.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-stone-400">
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
                          className="border border-[#e8e0d4] rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                        />
                        <button
                          onClick={() => handleRenameCategory(cat.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCat(null)}
                          className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-[#2d2520]">
                          {cat.displayName}
                        </p>
                        <p className="text-xs text-stone-400">
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
                        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-500"
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.displayName)}
                        disabled={isPending}
                        className="p-1.5 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-500 disabled:opacity-50"
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
        {/* Groups Tab */}
        {tab === "groups" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2d2520]">
                User Groups
              </h2>
              <button
                onClick={() => setShowAddGroup(true)}
                className="flex items-center gap-1.5 bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth"
              >
                <Plus className="w-4 h-4" />
                New Group
              </button>
            </div>

            {groupError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                {groupError}
              </div>
            )}

            {/* Add group form */}
            {showAddGroup && (
              <div className="bg-white/60 rounded-xl border border-[#e8e0d4] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-stone-600">New Group</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. Farm Team"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Optional description"
                      className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewGroupColor(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs border-2 transition-all ${opt.value} ${
                          newGroupColor === opt.value ? "ring-2 ring-[#1a3a2a] ring-offset-1" : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Members</label>
                  <div className="flex flex-wrap gap-2">
                    {initialUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() =>
                          setNewGroupMembers((prev) =>
                            prev.includes(user.id)
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                          newGroupMembers.includes(user.id)
                            ? "bg-[#1a3a2a] text-white border-[#1a3a2a]"
                            : "bg-white text-stone-500 border-[#e8e0d4] hover:border-slate-400"
                        }`}
                      >
                        {user.name || user.email}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGroup}
                    disabled={isPending || !newGroupName.trim()}
                    className="px-4 py-2 bg-[#1a3a2a] text-white text-sm rounded-lg hover:bg-[#1a3a2a]/90 disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "Create Group"}
                  </button>
                  <button
                    onClick={() => { setShowAddGroup(false); setGroupError(""); }}
                    className="px-4 py-2 text-stone-500 text-sm hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Groups list */}
            <div className="space-y-3">
              {initialGroups.length === 0 && !showAddGroup && (
                <div className="bg-white/60 rounded-xl border border-[#e8e0d4] px-4 py-8 text-center text-sm text-stone-400">
                  No groups yet. Create your first group to organize team members.
                </div>
              )}
              {initialGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white/60 rounded-xl border border-[#e8e0d4] overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-4 h-4 rounded border-2 shrink-0 ${group.color}`} />
                    <div className="flex-1 min-w-0">
                      {editingGroup === group.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameGroup(group.id);
                              if (e.key === "Escape") setEditingGroup(null);
                            }}
                            className="border border-[#e8e0d4] rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10"
                          />
                          <button onClick={() => handleRenameGroup(group.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingGroup(null)} className="p-1 text-stone-400 hover:bg-stone-100 rounded">
                            <XÛ\ÜÓ[YOHËMMÏØ]ÛÙ]
H
]Û\ÜÓ[YOH^\ÛHÛ[YY][H^VÈÌLHÙÜÝ\[Y_OÜÙÜÝ\\ØÜ\[Û	Û\ÜÓ[YOH^^È^\ÝÛKMÙÜÝ\\ØÜ\[ÛOÜBÛ\ÜÓ[YOH^^È^\ÝÛKMÙÜÝ\Y[X\Ë[ÝHY[X\ÙÜÝ\Y[X\Ë[ÝOOHHÈÈOÜÙ]
_BÙ]]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LH]ÛÛÛXÚÏ^Ê
HOÙ]^[YÜÝ\
^[YÜÝ\OOHÜÝ\YÈ[ÜÝ\Y
_BÛ\ÜÓ[YOHLKHÝ[Y[YÝ\Ë\ÝÛKLL^\ÝÛKMÝ\^\ÝÛKML]OHX[YÙHY[X\È\Ù\ÈÛ\ÜÓ[YOHËMMÏØ]ÛÙY][ÑÜÝ\OOHÜÝ\Y	
]ÛÛÛXÚÏ^Ê
HOÈÙ]Y][ÑÜÝ\
ÜÝ\Y
NÈÙ]Y]ÜÝ\[YJÜÝ\[YJNÈ_BÛ\ÜÓ[YOHLKHÝ[Y[YÝ\Ë\ÝÛKLL^\ÝÛKMÝ\^\ÝÛKML]OH[[YH[Ú[Û\ÜÓ[YOHËMMÏØ]Û]ÛÛÛXÚÏ^Ê
HO[Q[]QÜÝ\
ÜÝ\YÜÝ\[YJ_B\ØXY^Ú\Ô[[ßBÛ\ÜÓ[YOHLKHÝ[Y[YÝ\Ë\YML^\ÝÛKMÝ\^\YML\ØXYÜXÚ]KML]OH[]H\ÚÛ\ÜÓ[YOHËMMÏØ]ÛÏ
_BÙ]Ù]ËÊ^[YY[X\È[[
ßBÙ^[YÜÝ\OOHÜÝ\Y	
]Û\ÜÓ[YOHÜ\]Ü\VÈÙNL
KÍMKLÈË\ÝÛKMLÜXÙK^KLÛ\ÜÓ[YOH^^ÈÛ[YY][H^\ÝÛKMY[X\ÏÜÙÜÝ\Y[X\Ë[ÝOOH	
Û\ÜÓ[YOH^^È^\ÝÛKMÈY[X\ÈY]Ü
_BÙÜÝ\Y[X\ËX\

JHO
]Ù^O^ÛKYHÛ\ÜÓ[YOH^][\ËXÙ[\Ø\L^\ÛHÛK\Ù\[XYÙHÈ
[YÈÜÏ^ÛK\Ù\[XYÙ_H[HÛ\ÜÓ[YOHËMMÝ[YY[Ï
H
]Û\ÜÓ[YOHËMMÝ[YY[Ë\ÝÛKL^][\ËXÙ[\\ÝYKXÙ[\^VÌLHÛ[YY][H^\ÝÛKMÊK\Ù\[YHK\Ù\[XZ[
VÌKÕ\\Ø\ÙJ
_BÙ]
_BÜ[Û\ÜÓ[YOH^LH^\ÝÛKMÛK\Ù\[YHK\Ù\[XZ[OÜÜ[]ÛÛÛXÚÏ^Ê
HO[T[[ÝSY[X\ÜÝ\YK\Ù\Y
_B\ØXY^Ú\Ô[[ßBÛ\ÜÓ[YOHLHÝ[YÝ\Ë\YML^\ÝÛKMÝ\^\YML]OH[[ÝHY[X\\Ù\Z[\ÈÛ\ÜÓ[YOHËLËHLËHÏØ]ÛÙ]
J_BËÊYY[X\ÜÝÛ
ßB]Û\ÜÓ[YOHLHÙ[XÝ[YOHÛÚ[ÙO^ÊJHOÂY
K\Ù][YJH[PYY[X\ÜÝ\YK\Ù][YJNÂ_BÛ\ÜÓ[YOH^^ÈÜ\Ü\VÈÙNL
HÝ[Y[YLKLH^\ÝÛKMLË]Ú]HËY[Ü[Û[YOHÈYY[X\ÛÜ[ÛÚ[]X[\Ù\Â[\
JHOYÜÝ\Y[X\ËÛÛYJ
JHOK\Ù\YOOHKY
JBX\

JHO
Ü[ÛÙ^O^ÝKYH[YO^ÝKYOÝK[YHK[XZ[BÛÜ[Û
J_BÜÙ[XÝÙ]Ù]
_BÙ]
J_BÙ]Ù]
_BÙ]Ù]
NÂB

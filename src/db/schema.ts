import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// -- Users ------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  role: text("role", { enum: ["admin", "manager", "member"] })
    .notNull()
    .default("member"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// -- Tasks ------------------------------------------------
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  dueDate: text("due_date"),
  assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  category: text("category")
    .notNull()
    .default("Operations"),
  status: text("status", {
    enum: ["Backlog", "Doing", "Blocked", "Done"],
  })
    .notNull()
    .default("Backlog"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id),
  visibility: text("visibility", {
    enum: ["private", "project", "public"],
  })
    .notNull()
    .default("public"),
  projectId: text("project_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// -- Task Members (collaborators) -------------------------
export const taskMembers = sqliteTable("task_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  addedByUserId: text("added_by_user_id")
    .notNull()
    .references(() => users.id),
});

// -- Audit Trail ------------------------------------------
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action", {
    enum: [
      "created",
      "assignment_changed",
      "category_changed",
      "status_changed",
      "priority_changed",
      "due_date_changed",
      "title_changed",
      "description_changed",
      "visibility_changed",
    ],
  }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// -- Notifications ----------------------------------------
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["assignment", "reassignment", "status_change"],
  }).notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// -- Relations --------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  assignedTasks: many(tasks, { relationName: "assignedTo" }),
  createdTasks: many(tasks, { relationName: "createdBy" }),
  notifications: many(notifications),
  groupMemberships: many(userGroupMembers),
  additionalTaskAssignments: many(taskAssignees, { relationName: "taskAssigneeUser" }),
  taskMemberships: many(taskMembers, { relationName: "taskMemberUser" }),
  projectMemberships: many(projectMembers, { relationName: "projectMemberUser" }),
  prefs: one(userPrefs),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [tasks.assignedToUserId],
    references: [users.id],
    relationName: "assignedTo",
  }),
  createdBy: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
    relationName: "createdBy",
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  auditLogs: many(auditLogs),
  additionalAssignees: many(taskAssignees),
  groupAssignments: many(taskGroupAssignments),
  members: many(taskMembers),
  subtasks: many(subtasks),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  task: one(tasks, { fields: [auditLogs.taskId], references: [tasks.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

// -- Task Members Relations -------------------------------
export const taskMembersRelations = relations(taskMembers, ({ one }) => ({
  task: one(tasks, {
    fields: [taskMembers.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskMembers.userId],
    references: [users.id],
    relationName: "taskMemberUser",
  }),
  addedBy: one(users, {
    fields: [taskMembers.addedByUserId],
    references: [users.id],
    relationName: "taskMemberAddedBy",
  }),
}));

// -- Categories -------------------------------------------
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull().default("bg-slate-50 border-slate-200"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categoriesRelations = relations(categories, ({}) => ({}));

// -- Rocks (Quarterly Goals) - legacy, kept for compat ----
export const rocks = sqliteTable("rocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  ownerUserId: text("owner_user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  quarter: text("quarter").notNull(), // e.g., "Q1-2026"
  rockNumber: integer("rock_number").notNull().default(1),
  status: text("status", {
    enum: ["on_track", "off_track", "complete", "at_risk", "not_started"],
  })
    .notNull()
    .default("not_started"),
  progress: integer("progress").notNull().default(0), // 0-100
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rocksRelations = relations(rocks, ({ one }) => ({
  owner: one(users, {
    fields: [rocks.ownerUserId],
    references: [users.id],
  }),
}));

// -- Projects ---------------------------------------------
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  ownerUserId: text("owner_user_id")
    .references(() => users.id, { onDelete: "set null" }),
  quarter: text("quarter"),
  rockNumber: integer("rock_number").notNull().default(0),
  status: text("status", {
    enum: ["on_track", "off_track", "complete", "at_risk", "not_started"],
  })
    .notNull()
    .default("not_started"),
  progress: integer("progress").notNull().default(0),
  notes: text("notes"),
  type: text("type", { enum: ["rock", "project"] })
    .notNull()
    .default("project"),
  visibility: text("visibility", { enum: ["private", "members", "public"] })
    .notNull()
    .default("members"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectMembers = sqliteTable("project_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["viewer", "member", "owner"] })
    .notNull()
    .default("member"),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerUserId],
    references: [users.id],
  }),
  members: many(projectMembers),
  tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
    relationName: "projectMemberUser",
  }),
}));

// -- User Groups ------------------------------------------
export const userGroups = sqliteTable("user_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("bg-slate-50 border-slate-200"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userGroupMembers = sqliteTable("user_group_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id")
    .notNull()
    .references(() => userGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const taskAssignees = sqliteTable("task_assignees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignedByUserId: text("assigned_by_user_id")
    .notNull()
    .references(() => users.id),
  assignedAt: integer("assigned_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const taskGroupAssignments = sqliteTable("task_group_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  groupId: text("group_id")
    .notNull()
    .references(() => userGroups.id, { onDelete: "cascade" }),
  assignedByUserId: text("assigned_by_user_id")
    .notNull()
    .references(() => users.id),
  assignedAt: integer("assigned_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// -- Sub-tasks --------------------------------------------
export const subtasks = sqliteTable("subtasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

// -- Group Relations --------------------------------------
export const userGroupsRelations = relations(userGroups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [userGroups.createdByUserId],
    references: [users.id],
  }),
  members: many(userGroupMembers),
  taskAssignments: many(taskGroupAssignments),
}));

export const userGroupMembersRelations = relations(userGroupMembers, ({ one }) => ({
  group: one(userGroups, {
    fields: [userGroupMembers.groupId],
    references: [userGroups.id],
  }),
  user: one(users, {
    fields: [userGroupMembers.userId],
    references: [users.id],
  }),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignees.userId],
    references: [users.id],
    relationName: "taskAssigneeUser",
  }),
  assignedBy: one(users, {
    fields: [taskAssignees.assignedByUserId],
    references: [users.id],
    relationName: "taskAssigneeAssignedBy",
  }),
}));

export const taskGroupAssignmentsRelations = relations(taskGroupAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskGroupAssignments.taskId],
    references: [tasks.id],
  }),
  group: one(userGroups, {
    fields: [taskGroupAssignments.groupId],
    references: [userGroups.id],
  }),
  assignedBy: one(users, {
    fields: [taskGroupAssignments.assignedByUserId],
    references: [users.id],
  }),
}));

// -- User Preferences -------------------------------------
export const userPrefs = sqliteTable("user_prefs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("system"),
  sidebarCollapsed: integer("sidebar_collapsed", { mode: "boolean" })
    .notNull()
    .default(false),
  heidiEnabled: integer("heidi_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userPrefsRelations = relations(userPrefs, ({ one }) => ({
  user: one(users, {
    fields: [userPrefs.userId],
    references: [users.id],
  }),
}));

// -- Type exports -----------------------------------------
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Rock = typeof rocks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type TaskMember = typeof taskMembers.$inferSelect;
export type UserGroup = typeof userGroups.$inferSelect;
export type UserGroupMember = typeof userGroupMembers.$inferSelect;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type TaskGroupAssignment = typeof taskGroupAssignments.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;
export type UserPrefs = typeof userPrefs.$inferSelect;

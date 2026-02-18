import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Create users
  const userIds = {
    admin: crypto.randomUUID(),
    manager: crypto.randomUUID(),
    member1: crypto.randomUUID(),
    member2: crypto.randomUUID(),
    member3: crypto.randomUUID(),
    member4: crypto.randomUUID(),
    member5: crypto.randomUUID(),
  };

  const usersData = [
    { id: userIds.admin, name: "Daniel Eller", email: "daniel@goodnessgardens.net", role: "admin" as const },
    { id: userIds.manager, name: "Sarah Chen", email: "sarah@goodnessgardens.net", role: "manager" as const },
    { id: userIds.member1, name: "Marcus Johnson", email: "marcus@goodnessgardens.net", role: "member" as const },
    { id: userIds.member2, name: "Elena Rodriguez", email: "elena@goodnessgardens.net", role: "member" as const },
    { id: userIds.member3, name: "James Park", email: "james@goodnessgardens.net", role: "member" as const },
    { id: userIds.member4, name: "Priya Sharma", email: "priya@goodnessgardens.net", role: "member" as const },
    { id: userIds.member5, name: "Tyler Brooks", email: "tyler@goodnessgardens.net", role: "member" as const },
  ];

  for (const user of usersData) {
    await db.insert(schema.users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
    }).onConflictDoNothing();
  }
  console.log("✓ Users created");

  // Create sample tasks
  const tasksData = [
    { title: "Update organic certification docs", category: "Operations" as const, priority: "high" as const, status: "Doing" as const, assignedTo: userIds.member1, dueDate: "2026-03-01" },
    { title: "Q1 revenue forecast", category: "Finance" as const, priority: "high" as const, status: "Backlog" as const, assignedTo: userIds.member4, dueDate: "2026-02-28" },
    { title: "New wholesale client outreach", category: "Sales" as const, priority: "medium" as const, status: "Doing" as const, assignedTo: userIds.member2, dueDate: "2026-03-15" },
    { title: "Fix irrigation sensor dashboard", category: "ProductDev" as const, priority: "high" as const, status: "Blocked" as const, assignedTo: userIds.member3, dueDate: "2026-02-25" },
    { title: "Schedule food safety audit", category: "Operations" as const, priority: "medium" as const, status: "Backlog" as const, assignedTo: userIds.member1, dueDate: "2026-03-10" },
    { title: "Launch spring product catalog", category: "Sales" as const, priority: "medium" as const, status: "Backlog" as const, assignedTo: userIds.member2, dueDate: "2026-03-20" },
    { title: "Greenhouse temperature monitoring API", category: "ProductDev" as const, priority: "medium" as const, status: "Doing" as const, assignedTo: userIds.member3, dueDate: "2026-03-05" },
    { title: "Review supplier invoices", category: "Finance" as const, priority: "low" as const, status: "Backlog" as const, assignedTo: userIds.member4, dueDate: "2026-03-15" },
    { title: "Draft partnership agreement with Local Roots", category: "Sales" as const, priority: "high" as const, status: "Backlog" as const, assignedTo: userIds.manager, dueDate: "2026-03-01" },
    { title: "Update pesticide tracking spreadsheet", category: "Operations" as const, priority: "low" as const, status: "Done" as const, assignedTo: userIds.member5, dueDate: "2026-02-15" },
    { title: "Plan team offsite for March", category: "Other" as const, priority: "low" as const, status: "Backlog" as const, assignedTo: userIds.manager, dueDate: "2026-03-25" },
    { title: "Mobile app for field workers MVP spec", category: "ProductDev" as const, priority: "medium" as const, status: "Backlog" as const, assignedTo: null, dueDate: null },
    { title: "Process Q4 tax documents", category: "Finance" as const, priority: "high" as const, status: "Done" as const, assignedTo: userIds.member4, dueDate: "2026-02-10" },
    { title: "Order new packaging materials", category: "Operations" as const, priority: "medium" as const, status: "Doing" as const, assignedTo: userIds.member5, dueDate: "2026-02-28" },
    { title: "Set up farmers market booth schedule", category: "Sales" as const, priority: "low" as const, status: "Backlog" as const, assignedTo: userIds.member2, dueDate: "2026-04-01" },
  ];

  for (const task of tasksData) {
    const taskId = crypto.randomUUID();
    await db.insert(schema.tasks).values({
      id: taskId,
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: task.status,
      assignedToUserId: task.assignedTo,
      dueDate: task.dueDate,
      createdByUserId: userIds.admin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.auditLogs).values({
      taskId,
      userId: userIds.admin,
      action: "created",
      newValue: task.title,
      createdAt: new Date(),
    });
  }
  console.log("✓ Tasks and audit logs created");

  console.log("\nSeed complete! Created:");
  console.log(`  - ${usersData.length} users (1 admin, 1 manager, 5 members)`);
  console.log(`  - ${tasksData.length} tasks across all categories`);

  client.close();
}

seed().catch(console.error);

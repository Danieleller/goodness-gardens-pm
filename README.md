# Goodness Gardens — Task Manager

A lightweight task delegation tool for the Goodness Gardens team. Built with Next.js (App Router), TypeScript, Turso (SQLite), and deployed on Vercel.

## Features

- **Two Kanban Views** — same tasks, different groupings:
  - **By Person**: Columns = team members. Drag a card to reassign it.
  - **By Category**: Columns = Sales, Product Dev, Operations, Finance, Other. Drag a card to recategorize it.
- **Quick Add** — modal to create tasks fast with title, assignee, category, priority, due date, and status
- **Task Detail** — edit all fields inline, view full audit trail of changes
- **Drag-and-Drop** — powered by dnd-kit
- **Search** — global search bar with debounced server queries
- **Notifications** — in-app bell + optional email via Resend when tasks are assigned/reassigned
- **Audit Trail** — every change is logged
- **Filters** — filter by status and priority on the board

## Tech Stack

- Next.js 16 (App Router), TypeScript
- Turso (libSQL) + Drizzle ORM
- NextAuth v5 (Google OAuth)
- dnd-kit (drag-and-drop)
- Resend (email notifications)
- Tailwind CSS v4, Vercel

## Setup

### Environment Variables

Create a `.env.local` file (see `.env.example`):

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
AUTH_SECRET=generate-with-npx-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
RESEND_API_KEY=re_xxx  # optional
APP_URL=http://localhost:3000
```

### Database

```bash
npm run db:push    # Push schema to Turso
npm run seed       # Seed sample data (1 admin, 1 manager, 5 members, 15 tasks)
```

### Run Locally

```bash
npm install
npm run dev
```

### Deploy to Vercel

1. Push to GitHub
2. Import in Vercel → Add env vars → Deploy

## Drag-and-Drop Behavior

| View | Columns | Drag Effect |
|------|---------|-------------|
| By Person | Team members + Unassigned | Updates `assignedToUserId` |
| By Category | Sales / ProductDev / Operations / Finance / Other | Updates `category` |

Status is editable from the task detail page (not via drag). This keeps each board view focused on one dimension.

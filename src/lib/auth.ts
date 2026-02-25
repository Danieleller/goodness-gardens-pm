import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "admin" | "manager" | "member";
};

type Session = {
  user: SessionUser;
};

/**
 * Get the current user session from Supabase, then resolve against the app DB.
 * Returns `null` if no valid Supabase session exists.
 *
 * This keeps the same interface the rest of the codebase relies on.
 */
export async function auth(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user: supaUser },
  } = await supabase.auth.getUser();

  if (!supaUser) return null;

  const email = supaUser.email;
  if (!email) return null;

  // Look up the app-level user by email
  let dbUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Auto-provision if this is a new Supabase user
  if (!dbUser) {
    const metadata = supaUser.user_metadata || {};
    const name =
      metadata.full_name || metadata.name || email.split("@")[0] || "";

    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      name,
      email,
      role: "member",
      createdAt: new Date(),
    });

    dbUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  if (!dbUser) return null;

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      role: (dbUser.role as SessionUser["role"]) ?? "member",
    },
  };
}

/**
 * Sign the user out (server action helper).
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

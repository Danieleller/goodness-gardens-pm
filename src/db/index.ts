import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

// Use globalThis to avoid re-creating during hot reloads in dev
const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb._db ?? (globalForDb._db = createDb());

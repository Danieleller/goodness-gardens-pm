import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_DOMAIN = "goodnessgardens.net";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Restrict sign-in to @goodnessgardens.net Google accounts
      if (account?.provider === "google") {
        const email = profile?.email ?? user.email ?? "";
        if (!email.endsWith("@" + ALLOWED_DOMAIN)) {
          return false; // reject sign-in
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch role from DB
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });
        (session.user as any).role = dbUser?.role ?? "member";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

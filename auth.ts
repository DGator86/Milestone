import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${normalized}`,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await findUserByEmail(email);
        if (!user?.password_hash) return null;
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // Credentials: user.id is set by authorize()
      if (user?.id) {
        token.id = user.id;
        return token;
      }

      const email =
        typeof token.email === "string" ? token.email.trim().toLowerCase() : null;
      if (!email) return token;

      // Google OAuth: look up or create the user by email (case-insensitive).
      if (account?.provider === "google") {
        let dbUser = await findUserByEmail(email);
        if (!dbUser) {
          const [created] = await db
            .insert(users)
            .values({ email, name: token.name ?? null })
            .returning();
          dbUser = created;
        }
        token.id = dbUser.id;
        token.email = email;
        return token;
      }

      // Re-bind id from DB on every request so stale JWT user ids self-heal.
      const dbUser = await findUserByEmail(email);
      if (dbUser) {
        token.id = dbUser.id;
        token.email = email;
      }
      return token;
    },
  },
});

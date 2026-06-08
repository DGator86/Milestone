import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

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
        const user = await db.query.users.findFirst({ where: eq(users.email, email) });
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
      // Google OAuth: look up or create the user by email
      if (account?.provider === "google" && token.email) {
        let dbUser = await db.query.users.findFirst({ where: eq(users.email, token.email) });
        if (!dbUser) {
          const [created] = await db
            .insert(users)
            .values({ email: token.email, name: token.name ?? null })
            .returning();
          dbUser = created;
        }
        token.id = dbUser.id;
      }
      return token;
    },
  },
});

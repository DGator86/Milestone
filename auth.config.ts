import type { NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

type AppToken = JWT & { id?: string };
type AppUser = User & { id?: string };

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }: { token: AppToken; user?: AppUser }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }: { session: Session; token: AppToken }) {
      if (token.id) session.user.id = token.id;
      return session;
    },
  },
  providers: [],
};

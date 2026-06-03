import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
  providers: [],
};

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = [
  "/dashboard",
  "/kill-list",
  "/goals",
  "/groups",
  "/settings",
  "/timeline",
  "/templates",
  "/ai",
  "/customers",
  "/contacts",
  "/opportunities",
  "/flows",
  "/follow-ups",
  "/pipeline",
  "/reports",
];
const authRoutes = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (!isAuthed && isProtected) {
    return Response.redirect(new URL("/login", req.url));
  }
  if (isAuthed && isAuthRoute) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|icons/|api/auth/).*)"],
};

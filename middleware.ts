import { NextResponse, type NextRequest } from "next/server";

const PROJECT_REF = "bqpaemaechuupanyxgbf";

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
];
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname.startsWith(r));

  if (!isProtected && !isAuth) {
    return NextResponse.next();
  }

  // Check session by cookie presence only — no network call, no Supabase client.
  // Supabase stores session in sb-<ref>-auth-token (may be chunked into .0, .1, …).
  // Server components still call getUser() for security-critical checks.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(`sb-${PROJECT_REF}-auth-token`));

  if (!hasSession && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|icons/).*)"],
};

"use server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  let authError: string | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error) authError = error.message;
  } catch (err: unknown) {
    const e = err as Error & { cause?: unknown };
    console.error("signIn fetch failed:", {
      url: SUPABASE_URL,
      message: e?.message,
      cause: String(e?.cause),
      stack: e?.stack?.split("\n").slice(0, 3).join(" | "),
    });
    authError = `Network error: ${e?.message} — cause: ${String(e?.cause)}`;

export async function signIn_action(formData: FormData) {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  if (!emailRaw || typeof emailRaw !== "string" || !passwordRaw || typeof passwordRaw !== "string") {
    redirect(`/login?error=${encodeURIComponent("Email and password are required")}`);
  }
  try {
    await signIn("credentials", { email: emailRaw, password: passwordRaw, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }
    throw error;
  }
}

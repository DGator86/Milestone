"use server";

import { signIn as authSignIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function signIn_action(formData: FormData) {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");

  if (!emailRaw || typeof emailRaw !== "string" || !passwordRaw || typeof passwordRaw !== "string") {
    redirect(`/login?error=${encodeURIComponent("Email and password are required")}`);
  }

  try {
    await authSignIn("credentials", {
      email: emailRaw,
      password: passwordRaw,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }
    throw error;
  }
}

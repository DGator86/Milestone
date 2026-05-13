"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  let authError: string | null = null;
  try {
    const { error } = await supabase.auth.signUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error) authError = error.message;
  } catch {
    authError = "Unable to reach the server. Please try again.";
  }

  if (authError) {
    redirect(`/signup?error=${encodeURIComponent(authError)}`);
  }

  redirect("/dashboard");
}

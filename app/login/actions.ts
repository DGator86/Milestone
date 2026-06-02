"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let authError: string | null = null;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 150 * attempt));
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        authError = error.message;
        break; // auth errors (wrong password etc.) don't benefit from retrying
      }
      authError = null;
      break;
    } catch (err: unknown) {
      const e = err as Error & { cause?: unknown };
      console.error(`signIn network error (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`, {
        url: SUPABASE_URL,
        message: e?.message,
        cause: String(e?.cause),
        stack: e?.stack?.split("\n").slice(0, 3).join(" | "),
      });
      if (attempt === MAX_ATTEMPTS - 1) {
        authError = "Connection error — please try again";
      }
    }
  }

  if (authError) {
    redirect(`/login?error=${encodeURIComponent(authError)}`);
  }

  // Bust the client-side router cache so the post-login navigation fetches
  // fresh RSC data and the middleware sees the new session cookie.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

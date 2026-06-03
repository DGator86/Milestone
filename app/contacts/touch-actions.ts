"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LogTouchSchema, CreateContactSchema } from "@/lib/schemas";

export async function logTouch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = {
    contact_id: formData.get("contact_id") as string,
    type: formData.get("type") as string,
    notes: (formData.get("notes") as string)?.trim() || null,
    touched_at: (formData.get("touched_at") as string) || null,
  };

  const parsed = LogTouchSchema.safeParse(raw);
  if (!parsed.success) return;

  await supabase.from("touches").insert({
    user_id: user.id,
    contact_id: parsed.data.contact_id,
    type: parsed.data.type,
    notes: parsed.data.notes,
    touched_at: parsed.data.touched_at ?? new Date().toISOString(),
  });

  revalidatePath(`/contacts/${parsed.data.contact_id}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function createLegacyContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const freqRaw = formData.get("touch_frequency_days");
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    company: (formData.get("company") as string)?.trim() || null,
    role: (formData.get("role") as string)?.trim() || null,
    list_id: (formData.get("list_id") as string) || null,
    touch_frequency_days: freqRaw ? Number(freqRaw) : null,
    notes: (formData.get("notes") as string)?.trim() || null,
  };

  const parsed = CreateContactSchema.safeParse(raw);
  if (!parsed.success) return;

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error || !contact) redirect("/follow-ups?error=Failed+to+create+contact");

  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

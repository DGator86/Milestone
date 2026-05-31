"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  await supabase.from("crm_contacts").insert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
    customer_id: (formData.get("customer_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("crm_contacts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/contacts");
}

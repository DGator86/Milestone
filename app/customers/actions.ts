"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_CUSTOMER_STATUSES = ["prospect", "active", "inactive"] as const;

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const rawStatus = (formData.get("status") as string) || "prospect";
  const status = (VALID_CUSTOMER_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus
    : "prospect";

  await supabase.from("crm_customers").insert({
    user_id: user.id,
    name,
    industry: (formData.get("industry") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    website: (formData.get("website") as string) || null,
    status,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/customers");
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("crm_customers").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/customers");
}

export async function updateCustomerStatus(id: string, status: string) {
  if (!(VALID_CUSTOMER_STATUSES as readonly string[]).includes(status)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("crm_customers")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/customers");
}

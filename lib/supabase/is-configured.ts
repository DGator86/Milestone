/**
 * True when Supabase env vars look like real credentials (not empty or template placeholders).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return false;
  if (url === "your_supabase_project_url" || key === "your_supabase_anon_key") {
    return false;
  }
  return true;
}

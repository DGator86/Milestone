import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

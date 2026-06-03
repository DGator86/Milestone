// These are public-by-design values — the anon key is safe to embed in client code.
// Vercel env vars take priority when set; these are the fallback for local/preview.
const isProd = process.env.NODE_ENV === "production";

export const SUPABASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && isProd) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  return url ?? "https://bqpaemaechuupanyxgbf.supabase.co";
})();

export const SUPABASE_ANON_KEY = (() => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key && isProd) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  return key ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGFlbWFlY2h1dXBhbnl4Z2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzY3MjEsImV4cCI6MjA5MzA1MjcyMX0.za2FP5kRvqLw-Y_EPoUZrkhJStcCzzY9JhetuPH8o4c";
})();

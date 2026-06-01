// These are public-by-design values — the anon key is safe to embed in client code.
// Vercel env vars take priority when set; these are the fallback for any deployment.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqpaemaechuupanyxgbf.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGFlbWFlY2h1dXBhbnl4Z2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzY3MjEsImV4cCI6MjA5MzA1MjcyMX0.za2FP5kRvqLw-Y_EPoUZrkhJStcCzzY9JhetuPH8o4c";

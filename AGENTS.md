# Milestone

A goal-tracking CRM built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Supabase (Auth + Postgres + RLS).

## Cursor Cloud specific instructions

### Services

| Service | How to run |
|---------|-----------|
| Next.js dev server | `npm run dev` (port 3000) |
| Supabase | Hosted at `https://bqpaemaechuupanyxgbf.supabase.co` — requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |

### Commands

- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Dev**: `npm run dev`

### Important notes

- **Do NOT run `supabase start` (local Supabase via Docker)** — pulling the container images will OOM and crash the Cloud Agent VM. Always use the hosted Supabase instance.
- The app redirects to `/setup` when Supabase env vars are missing or invalid. If you see this redirect, verify `.env.local` has correct values.
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` for this project is actually a **service_role key** (`sb_secret_...` format). It has admin access to the Auth API, so you can create pre-confirmed test users via `POST /auth/v1/admin/users` with `{"email":"...","password":"...","email_confirm":true}`.
- Email confirmations ARE enabled on the Supabase project. To create test users without triggering email rate limits, use the admin user creation endpoint above.
- The schema is in `supabase/schema.sql`. If tables don't exist on the remote project, apply it via the Supabase MCP `apply_migration` tool or the Supabase dashboard SQL Editor.
- `.env.local` is gitignored — credentials stay local.

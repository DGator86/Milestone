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
- Email confirmations are disabled on the Supabase project, so signups work immediately without email verification.
- The schema is in `supabase/schema.sql`. If tables don't exist on the remote project, apply it via the Supabase MCP `apply_migration` tool or the Supabase dashboard SQL Editor.
- `.env.local` is gitignored — credentials stay local.

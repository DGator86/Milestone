# Milestone

A goal-tracking CRM built with Next.js 15 (App Router), TypeScript, Tailwind CSS,
Drizzle ORM on Neon (serverless Postgres), and NextAuth (Auth.js v5) for
email/password auth.

## Cursor Cloud specific instructions

### Services

| Service | How to run |
|---------|-----------|
| Next.js dev server | `npm run dev` (port 3000) |
| Database (Neon Postgres) | Set `DATABASE_URL` in `.env.local`; apply the schema with `npm run db:push` |

### Commands

- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Push schema**: `npm run db:push` (Drizzle — applies `db/schema.ts` to `DATABASE_URL`)

### Important notes

- Auth is **NextAuth (Auth.js v5)** with the Credentials provider (email/password,
  bcrypt hashes in the `users` table, JWT sessions). There is no external auth
  service. Required env: `DATABASE_URL` and `AUTH_SECRET`.
- Create a test user by signing up at `/signup` (no email confirmation step), or
  insert a row into `users` with a bcrypt `password_hash`.
- The schema lives in `db/schema.ts`; generated SQL migrations are in `drizzle/`.
  Apply with `npm run db:push` (idempotent diff) or `drizzle-kit generate` for new
  migration files. `supabase/schema.sql` is a legacy artifact and is not used.
- `GEMINI_API_KEY` (optional) enables the AI goal wizard and chat assistant; without it
 those features show a "not connected" notice. `ANTHROPIC_API_KEY` (optional) enables
 milestone suggestions in the manual goal form.
- `.env.local` is gitignored — credentials stay local.

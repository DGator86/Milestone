# Milestone

> Track the path. Kill the next step.

A no-bullshit goal CRM that tracks goals as milestone paths.

## Setup (local web app)

Do these **in order**:

1. **Supabase (browser)** — [supabase.com/dashboard](https://supabase.com/dashboard) → New project → wait until ready.
2. **Schema** — Supabase → **SQL Editor** → paste full contents of **`supabase/schema.sql`** from this repo → **Run**.
3. **Env (your machine)** — copy `.env.example` to **`.env.local`** and set:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon **public** key (never `service_role`)
4. **Install and verify**

   ```bash
   npm install
   npm run verify
   ```

   `verify` checks `.env.local` and calls Supabase’s auth health endpoint.

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — sign up at `/signup`, then use the dashboard.

### Test signup and login

1. Visit `/signup` and create an account
2. You'll be redirected to `/dashboard`
3. Default groups (Work, Home, Health) are created automatically
4. Click **+ Goal** or scroll down to create your first goal

## Deploy (public website)

Only **after** local setup works (`npm run verify` + `npm run dev`):

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New** → **Project** → **Import** this repo.
3. **Environment Variables** (before or after first deploy, then redeploy):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   Same values as `.env.local`.
4. **Deploy** → copy the production URL (e.g. `https://….vercel.app`).
5. Supabase → **Authentication** → **URL configuration**:
   - **Site URL** = `https://….vercel.app`
   - **Redirect URLs** add: `https://….vercel.app/**`
6. Open the Vercel URL in a browser and sign up again (production is a separate deployment from localhost).

**I can’t log into your Vercel or Supabase account from here** — those steps are always yours, but they are only this short list once the app runs locally.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** deployment
- **PWA** manifest

## Project Structure

```
app/            # Next.js App Router routes
components/     # React components
  layout/       # Sidebar, AppShell
  dashboard/    # MilestoneCharts, TaskHealth, Momentum
  forms/        # CreateGoalForm
lib/            # Types, helpers, Supabase clients
supabase/       # schema.sql
public/         # manifest.json, icons
```

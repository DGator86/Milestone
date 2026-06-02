# Milestone

> Track the path. Kill the next step.

A no-bullshit goal CRM that tracks goals as milestone paths.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Find your **Project URL** and **anon public key** in Settings → API

### 4. Run the schema

In your Supabase project dashboard, go to **SQL Editor** and paste the contents of `supabase/schema.sql`, then run it.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Test signup and login

1. Visit `/signup` and create an account
2. You'll be redirected to `/dashboard`
3. Default groups (Work, Home, Health) are created automatically
4. Click **+ Goal** or scroll down to create your first goal

## App Store & Google Play launch

See **[docs/LAUNCH.md](docs/LAUNCH.md)** for the 14-day checklist (web + Capacitor hybrid apps).

Native shells live in **`mobile/`** — they load your production Vercel URL.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration, add your Vercel domain to **Redirect URLs**:

```
https://your-app.vercel.app/**
```

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

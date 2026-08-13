# Catherine & Niyi — Wedding Save the Date

A Next.js site with:

- **Home** — the save-the-date
- **RSVP** — captures full name, phone, email, and attending yes/no, saved to Supabase
- **/dashboard** — a password-protected page for you to view, search, and export the RSVPs (not linked from the public site)

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor → New query**, run `create extension if not exists pgcrypto;`
   if it's not already enabled, then paste and run `supabase/schema.sql`.
   This creates the `rsvps` table and locks it down with row-level security
   so the public website can only *submit* RSVPs — it can never read them
   back directly.
3. In **Project Settings → API**, copy three values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "reveal" — keep this one secret)

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in all four values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by the public RSVP form.
- `SUPABASE_SERVICE_ROLE_KEY` — used only by `/dashboard`, on the server. This key bypasses row-level security, so it must never have the `NEXT_PUBLIC_` prefix and must never be committed to git (`.env.local` is already gitignored).
- `DASHBOARD_PASSWORD` — your own password for `/dashboard`. Not from Supabase — just make one up.

Restart the dev server after editing `.env.local` (env vars are only read on startup).

## 3. Run it

```bash
npm install
npm run dev
```

- Public site: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard (asks for `DASHBOARD_PASSWORD`)

## Dashboard features

- Total replies, attending / not-attending counts
- Search by name, email, or phone
- Export all responses as a CSV
- Refresh button to pull the latest without a full page reload
- Log out clears the session cookie

## A note on the dashboard's security

This is simple password protection suited to a personal site like this one —
one shared password, stored server-side, checked via an `httpOnly` cookie.
It's not the same as a full user-account system. If you'd ever want
stronger protection (e.g. your own login instead of a shared password,
or multiple family members with separate accounts), Supabase Auth is the
natural upgrade path and would slot in without changing the data model.

## Structure

- `app/page.js` — the public site (nav, hero/countdown, RSVP form)
- `app/dashboard/page.js` — server component, fetches RSVPs with the admin client
- `app/dashboard/DashboardClient.js` — the interactive dashboard UI
- `app/dashboard/login/page.js` — password entry screen
- `app/api/dashboard-login/route.js`, `app/api/dashboard-logout/route.js` — session cookie handling
- `middleware.js` — redirects unauthenticated visitors away from `/dashboard`
- `lib/supabaseClient.js` — public browser client (RSVP form)
- `lib/supabaseAdmin.js` — server-only client (dashboard), never imported into a `"use client"` file
- `supabase/schema.sql` — the `rsvps` table + security policy
- `public/couple.jpg` — hero photo

## Deploying

Works as-is on Vercel. Add all four `.env.local` variables as environment
variables in the Vercel project settings — including `SUPABASE_SERVICE_ROLE_KEY`
and `DASHBOARD_PASSWORD`, which should be added there and nowhere else.

## What's next

Once you've collected enough RSVPs, the natural next step is the full
site: more photos, the venue address, accommodation options (including the
resort discount code), and — later still — per-guest details like the
welcome-drinks night, Sunday brunch, and dietary requirements. Each of
those can be added as new columns on the `rsvps` table and new sections on
the site when you're ready.

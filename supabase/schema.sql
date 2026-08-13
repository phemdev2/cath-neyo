-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  attending text not null check (attending in ('yes', 'no')),
  created_at timestamptz not null default now()
);

-- Lock the table down: the public (anon) key may only INSERT, never read.
-- This keeps the guest list private — only you can view it, from the
-- Supabase Table Editor (or a query run with your own account/service key).
alter table public.rsvps enable row level security;

create policy "Public can submit an RSVP"
  on public.rsvps
  for insert
  to anon
  with check (true);

-- No SELECT/UPDATE/DELETE policy is created for `anon`, so the website
-- itself can never read back the list of who has responded.

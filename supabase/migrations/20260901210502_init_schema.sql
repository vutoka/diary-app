-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists dictionary_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term text not null,
  definition text not null,
  category text,
  created_at timestamptz not null default now()
);

alter table entries enable row level security;
alter table dictionary_terms enable row level security;

create policy "own entries" on entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own dictionary_terms" on dictionary_terms
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists entries_user_date_idx on entries (user_id, entry_date);
create index if not exists dictionary_terms_user_term_idx on dictionary_terms (user_id, term);

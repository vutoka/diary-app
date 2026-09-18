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

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);

alter table entries enable row level security;
alter table dictionary_terms enable row level security;
alter table requests enable row level security;

create policy "own entries" on entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own dictionary_terms" on dictionary_terms
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own requests" on requests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists requests_user_created_idx on requests (user_id, created_at desc);
create index if not exists entries_user_date_idx on entries (user_id, entry_date);
create index if not exists dictionary_terms_user_term_idx on dictionary_terms (user_id, term);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-images',
  'entry-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "read own entry images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "upload own entry images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own entry images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

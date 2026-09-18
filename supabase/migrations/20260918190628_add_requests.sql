create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);

alter table requests enable row level security;

create policy "own requests" on requests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists requests_user_created_idx on requests (user_id, created_at desc);

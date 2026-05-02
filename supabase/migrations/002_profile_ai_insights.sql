create table if not exists public.profile_ai_insights (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  signature text not null,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_ai_insights enable row level security;

create policy "Profile AI insights are readable by authenticated users"
  on public.profile_ai_insights for select
  to authenticated
  using (true);

create policy "Authenticated users can insert profile AI insights"
  on public.profile_ai_insights for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update profile AI insights"
  on public.profile_ai_insights for update
  to authenticated
  using (true)
  with check (true);
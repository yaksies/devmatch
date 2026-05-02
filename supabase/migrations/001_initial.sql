-- DevMatch: run in Supabase SQL Editor or via CLI after linking a project.
-- Assumes Supabase Auth; profiles row is created after signup (see note below).

create extension if not exists "pgcrypto";

-- Participant profile (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  headline text,
  tech_stack text[] not null default '{}',
  interests text,
  hackathon_id uuid,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Swipes: like / pass (unique pair per swiper)
create type public.swipe_direction as enum ('like', 'pass');

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  direction public.swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (swiper_id, target_id),
  check (swiper_id <> target_id)
);

alter table public.swipes enable row level security;

create policy "Users can read their own swipes"
  on public.swipes for select
  to authenticated
  using (auth.uid() = swiper_id);

create policy "Users can read swipes involving them"
  on public.swipes for select
  to authenticated
  using (auth.uid() = swiper_id or auth.uid() = target_id);

create policy "Users can insert their own swipes"
  on public.swipes for insert
  to authenticated
  with check (auth.uid() = swiper_id);

-- Matches: mutual likes (optional trigger or app logic can populate)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

alter table public.matches enable row level security;

create policy "Users can read matches they belong to"
  on public.matches for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Chat rooms 1:1 per match
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (match_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

-- Simplified policies: members of a match can read/write messages (expand with room membership checks in production)
create policy "Match members can read chat rooms"
  on public.chat_rooms for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "Match members can read messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_rooms r
      join public.matches m on m.id = r.match_id
      where r.id = room_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "Match members can send messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_rooms r
      join public.matches m on m.id = r.match_id
      where r.id = room_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Realtime: enable replication for chat_messages in Dashboard → Database → Replication, or:
alter publication supabase_realtime add table public.chat_messages;

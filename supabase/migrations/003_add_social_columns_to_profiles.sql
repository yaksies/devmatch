-- Add missing social and project columns to profiles
alter table public.profiles
add column if not exists discord text,
add column if not exists email text,
add column if not exists linkedin text,
add column if not exists github text,
add column if not exists projects text;

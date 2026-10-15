-- Титул и пол для рейтинга (рядом с ником).
-- Supabase → SQL Editor → выполнить один раз.

alter table public.profiles
  add column if not exists active_title text;

alter table public.profiles
  add column if not exists gender text;

comment on column public.profiles.active_title is 'Equipped title id (e.g. wanderer, iron)';
comment on column public.profiles.gender is 'male | female — for title localization';

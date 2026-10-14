-- Полный сейв игрока (инвентарь, рецепты, мир, бафы и т.д.)
-- Выполни один раз в Supabase → SQL Editor.

alter table public.profiles
  add column if not exists save_data jsonb;

comment on column public.profiles.save_data is
  'Full FitnessRPG player JSON: inventory, recipes, world, buffs, etc.';

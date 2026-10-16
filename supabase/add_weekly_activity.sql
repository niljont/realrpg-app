-- Публичная активность за 7 дней для просмотра из рейтинга.
-- Лёгкий jsonb (~несколько КБ), без полного сейва / инвентаря.

alter table public.profiles
  add column if not exists weekly_activity jsonb default '[]'::jsonb;

comment on column public.profiles.weekly_activity is
  'Sanitized activity feed for last 7 days (train/steps/quests). Safe for other players to read.';

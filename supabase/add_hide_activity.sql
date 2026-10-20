alter table public.profiles
  add column if not exists hide_activity boolean not null default false;

comment on column public.profiles.hide_activity is
  'Когда true, другие не видят онлайн и записи тренировок.';

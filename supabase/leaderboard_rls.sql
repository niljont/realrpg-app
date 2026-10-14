-- Чтобы рейтинг видел ВСЕХ игроков (не только себя).
-- Supabase → SQL Editor → выполнить один раз.

-- Полный сейв (если ещё не добавлял):
alter table public.profiles
  add column if not exists save_data jsonb;

-- Чтение чужих профилей для таблицы рейтинга
drop policy if exists "Profiles are viewable by authenticated" on public.profiles;
create policy "Profiles are viewable by authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- На всякий случай: обновлять можно только свой ряд
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

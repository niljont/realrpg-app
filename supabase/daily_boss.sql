-- Общий босс дня.
-- Supabase → SQL Editor → выполнить целиком.

create table if not exists public.daily_boss (
  day text primary key,
  name text not null,
  max_hp int not null,
  hp int not null,
  strikes int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_boss_contrib (
  day text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  damage int not null default 0,
  primary key (day, user_id)
);

alter table public.daily_boss enable row level security;
alter table public.daily_boss_contrib enable row level security;

drop policy if exists "Daily boss readable" on public.daily_boss;
create policy "Daily boss readable"
  on public.daily_boss
  for select
  to authenticated
  using (true);

drop policy if exists "Own boss contribution readable" on public.daily_boss_contrib;
create policy "Own boss contribution readable"
  on public.daily_boss_contrib
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.daily_boss_log (
  id bigint generated always as identity primary key,
  day text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  damage int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_boss_log_day_idx
  on public.daily_boss_log (day, created_at desc);

alter table public.daily_boss_log enable row level security;

drop policy if exists "Daily boss log readable" on public.daily_boss_log;
create policy "Daily boss log readable"
  on public.daily_boss_log
  for select
  to authenticated
  using (true);

drop function if exists public.strike_daily_boss(text, int);

create or replace function public.strike_daily_boss(
  p_day text,
  p_damage int,
  p_reason text default 'train',
  p_username text default 'Игрок'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  dmg int;
  dealt int;
  row public.daily_boss%rowtype;
  names text[] := array[
    'Страж порога',
    'Железный колосс',
    'Теневой зверь',
    'Рой аномалии',
    'Костяной великан',
    'Пепельный титан'
  ];
  boss_name text;
  hit_reason text;
  who text;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  if p_day is null or p_day !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'bad day';
  end if;

  hit_reason := case
    when p_reason in ('train', 'quest', 'steps', 'gather', 'breach', 'craft') then p_reason
    else 'train'
  end;
  who := left(coalesce(nullif(btrim(p_username), ''), 'Игрок'), 40);
  boss_name := names[1 + (abs(hashtext(p_day)) % array_length(names, 1))];

  insert into public.daily_boss (day, name, max_hp, hp)
  values (p_day, boss_name, 450, 450)
  on conflict (day) do nothing;

  select * into row from public.daily_boss where day = p_day for update;

  if row.max_hp = 1600 and row.strikes = 0 then
    update public.daily_boss
      set max_hp = 450, hp = 450
      where day = p_day
      returning * into row;
  end if;

  select damage into dealt
  from public.daily_boss_contrib
  where day = p_day and user_id = uid;

  dmg := greatest(0, coalesce(p_damage, 0));

  if dmg > 0 then
    if row.hp > 0 and coalesce(dealt, 0) = 0 and (
      select count(*) from public.daily_boss_contrib
      where day = p_day and damage > 0
    ) >= 1 then
      update public.daily_boss
        set max_hp = max_hp + 450, hp = hp + 450
        where day = p_day
        returning * into row;
    end if;

    insert into public.daily_boss_contrib (day, user_id, damage)
    values (p_day, uid, 0)
    on conflict (day, user_id) do nothing;

    if row.hp > 0 then
      update public.daily_boss
        set hp = greatest(0, hp - dmg),
            strikes = strikes + 1,
            updated_at = now()
        where day = p_day
        returning * into row;

      update public.daily_boss_contrib
        set damage = coalesce(damage, 0) + dmg
        where day = p_day and user_id = uid;

      dealt := coalesce(dealt, 0) + dmg;

      insert into public.daily_boss_log (day, user_id, username, damage, reason)
      values (p_day, uid, who, dmg, hit_reason);
    end if;
  end if;

  return jsonb_build_object(
    'day', row.day,
    'name', row.name,
    'maxHp', row.max_hp,
    'hp', row.hp,
    'strikes', row.strikes,
    'fighters', (
      select count(*) from public.daily_boss_contrib
      where day = p_day and damage > 0
    ),
    'mine', coalesce(dealt, 0),
    'shared', true,
    'log', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select l.id, l.username, l.damage, l.reason, l.created_at as "createdAt"
        from public.daily_boss_log l
        where l.day = p_day
        order by l.created_at desc
        limit 50
      ) t
    ), '[]'::jsonb)
  );
end;
$fn$;

revoke all on function public.strike_daily_boss(text, int, text, text) from public;
grant execute on function public.strike_daily_boss(text, int, text, text) to authenticated;

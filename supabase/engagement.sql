-- Вовлечённость: дуэль по упражнению, вызов, общий счётчик дня, серия в профиле.
-- Если дуэлей ещё не было, сначала выполни supabase/pvp.sql, затем этот файл.

alter table public.pvp_queue add column if not exists exercise text not null default 'pushups';
alter table public.pvp_queue add column if not exists target_id uuid;

alter table public.pvp_matches add column if not exists exercise text not null default 'pushups';

create table if not exists public.pvp_challenges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null,
  to_id uuid not null,
  from_name text not null,
  exercise text not null,
  rating int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.pvp_challenges enable row level security;
drop policy if exists "PvP challenges readable" on public.pvp_challenges;
create policy "PvP challenges readable" on public.pvp_challenges for select to authenticated using (true);

create table if not exists public.daily_tally (
  day date not null,
  exercise text not null,
  total int not null default 0,
  primary key (day, exercise)
);

alter table public.daily_tally enable row level security;
drop policy if exists "Daily tally readable" on public.daily_tally;
create policy "Daily tally readable" on public.daily_tally for select to authenticated using (true);

alter table public.profiles add column if not exists attendance_streak int;

drop function if exists public.pvp_poll(text, int);
drop function if exists public.pvp_poll(text, int, text);
drop function if exists public.pvp_poll(text, int, text, uuid);

create or replace function public.pvp_poll(p_username text, p_rating int, p_exercise text default 'pushups', p_target uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  opp record;
  row public.pvp_matches%rowtype;
  rate int := greatest(100, coalesce(p_rating, 1000));
  who text := left(coalesce(nullif(btrim(p_username), ''), 'Игрок'), 40);
  ex text := case
    when p_exercise in ('pushups', 'pullups', 'legsquats', 'abs') then p_exercise
    else 'pushups'
  end;
begin
  if uid is null then
    return jsonb_build_object('error', 'auth');
  end if;

  perform pg_advisory_xact_lock(81421);

  delete from public.pvp_queue q
  where q.created_at < now() - interval '90 seconds' and q.user_id <> uid;

  select * into row
  from public.pvp_matches m
  where m.status = 'live' and (m.a_id = uid or m.b_id = uid)
  order by m.created_at desc
  limit 1;

  if found then
    delete from public.pvp_queue where user_id = uid;
    return jsonb_build_object(
      'status', 'matched',
      'you', case when row.a_id = uid then 'a' else 'b' end,
      'exercise', coalesce(row.exercise, 'pushups'),
      'match', jsonb_build_object(
        'id', row.id,
        'aId', row.a_id, 'bId', row.b_id,
        'aName', row.a_name, 'bName', row.b_name,
        'aReps', row.a_reps, 'bReps', row.b_reps,
        'aRating', row.a_rating, 'bRating', row.b_rating,
        'exercise', coalesce(row.exercise, 'pushups')
      )
    );
  end if;

  insert into public.pvp_queue (user_id, username, rating, exercise, target_id, created_at)
  values (uid, who, rate, ex, p_target, now())
  on conflict (user_id) do update
    set username = excluded.username,
        rating = excluded.rating,
        exercise = excluded.exercise,
        target_id = excluded.target_id,
        created_at = now();

  select q.user_id, q.username, q.rating, q.exercise
  into opp
  from public.pvp_queue q
  where q.user_id <> uid
    and q.exercise = ex
    and abs(q.rating - rate) <= 500
    and (p_target is null or q.user_id = p_target)
    and (q.target_id is null or q.target_id = uid)
  order by q.created_at
  limit 1;

  if opp.user_id is null then
    return jsonb_build_object('status', 'searching');
  end if;

  delete from public.pvp_queue where user_id in (uid, opp.user_id);

  insert into public.pvp_matches (a_id, b_id, a_name, b_name, a_rating, b_rating, exercise)
  values (uid, opp.user_id, who, opp.username, rate, opp.rating, ex)
  returning * into row;

  return jsonb_build_object(
    'status', 'matched',
    'you', 'a',
    'exercise', ex,
    'match', jsonb_build_object(
      'id', row.id,
      'aId', row.a_id, 'bId', row.b_id,
      'aName', row.a_name, 'bName', row.b_name,
      'aReps', row.a_reps, 'bReps', row.b_reps,
      'aRating', row.a_rating, 'bRating', row.b_rating,
      'exercise', ex
    )
  );
end;
$fn$;

create or replace function public.pvp_incoming()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'fromId', c.from_id,
      'fromName', c.from_name,
      'exercise', c.exercise,
      'rating', c.rating
    ) order by c.created_at desc)
    from public.pvp_challenges c
    where c.to_id = uid and c.status = 'pending' and c.created_at > now() - interval '3 minutes'
  ), '[]'::jsonb);
end;
$fn$;

create or replace function public.pvp_challenge(p_to uuid, p_username text, p_rating int, p_exercise text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  who text := left(coalesce(nullif(btrim(p_username), ''), 'Игрок'), 40);
  ex text := case
    when p_exercise in ('pushups', 'pullups', 'legsquats', 'abs') then p_exercise
    else 'pushups'
  end;
  row public.pvp_challenges%rowtype;
begin
  if uid is null or p_to is null or p_to = uid then
    return jsonb_build_object('error', 'Вызов недоступен');
  end if;
  insert into public.pvp_challenges (from_id, to_id, from_name, exercise, rating)
  values (uid, p_to, who, ex, greatest(100, coalesce(p_rating, 1000)))
  returning * into row;
  return jsonb_build_object('id', row.id, 'exercise', ex);
end;
$fn$;

create or replace function public.pvp_decline(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.pvp_challenges
    set status = 'declined'
    where id = p_id and to_id = auth.uid() and status = 'pending';
end;
$fn$;

create or replace function public.pvp_accept(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  ch public.pvp_challenges%rowtype;
  q public.pvp_queue%rowtype;
  row public.pvp_matches%rowtype;
  me text;
begin
  if uid is null then
    return jsonb_build_object('error', 'auth');
  end if;
  select * into ch from public.pvp_challenges where id = p_id and to_id = uid and status = 'pending';
  if not found then
    return jsonb_build_object('error', 'Вызов уже закрыт');
  end if;
  select * into q from public.pvp_queue where user_id = ch.from_id and exercise = ch.exercise and target_id = uid;
  if not found then
    update public.pvp_challenges set status = 'expired' where id = ch.id;
    return jsonb_build_object('error', 'Соперник уже не ждёт');
  end if;
  select left(coalesce(username, 'Игрок'), 40) into me from public.profiles where id = uid;
  me := coalesce(me, 'Игрок');
  delete from public.pvp_queue where user_id in (uid, ch.from_id);
  insert into public.pvp_matches (a_id, b_id, a_name, b_name, a_rating, b_rating, exercise)
  values (ch.from_id, uid, ch.from_name, me, ch.rating, greatest(100, ch.rating), ch.exercise)
  returning * into row;
  update public.pvp_challenges set status = 'accepted' where id = ch.id;
  return jsonb_build_object(
    'status', 'matched',
    'you', 'b',
    'exercise', ch.exercise,
    'match', jsonb_build_object(
      'id', row.id,
      'aId', row.a_id, 'bId', row.b_id,
      'aName', row.a_name, 'bName', row.b_name,
      'aReps', 0, 'bReps', 0,
      'exercise', ch.exercise
    )
  );
end;
$fn$;

create or replace function public.bump_daily_tally(p_day date, p_exercise text, p_amount int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  next_total int;
begin
  if auth.uid() is null then
    return jsonb_build_object('total', 0);
  end if;
  insert into public.daily_tally (day, exercise, total)
  values (p_day, p_exercise, greatest(0, coalesce(p_amount, 0)))
  on conflict (day, exercise) do update
    set total = public.daily_tally.total + greatest(0, coalesce(p_amount, 0))
  returning total into next_total;
  return jsonb_build_object('total', next_total);
end;
$fn$;

create or replace function public.fetch_daily_tally(p_day date, p_exercise text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  n int;
begin
  select total into n from public.daily_tally where day = p_day and exercise = p_exercise;
  return jsonb_build_object('total', coalesce(n, 0));
end;
$fn$;

revoke all on function public.pvp_poll(text, int, text, uuid) from public;
revoke all on function public.pvp_incoming() from public;
revoke all on function public.pvp_challenge(uuid, text, int, text) from public;
revoke all on function public.pvp_decline(uuid) from public;
revoke all on function public.pvp_accept(uuid) from public;
revoke all on function public.bump_daily_tally(date, text, int) from public;
revoke all on function public.fetch_daily_tally(date, text) from public;
grant execute on function public.pvp_poll(text, int, text, uuid) to authenticated;
grant execute on function public.pvp_incoming() to authenticated;
grant execute on function public.pvp_challenge(uuid, text, int, text) to authenticated;
grant execute on function public.pvp_decline(uuid) to authenticated;
grant execute on function public.pvp_accept(uuid) to authenticated;
grant execute on function public.bump_daily_tally(date, text, int) to authenticated;
grant execute on function public.fetch_daily_tally(date, text) to authenticated;

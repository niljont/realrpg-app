-- Дуэли: очередь поиска и живой матч. Выполнить в SQL Editor один раз.

create table if not exists public.pvp_queue (
  user_id uuid primary key,
  username text not null,
  rating int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pvp_matches (
  id uuid primary key default gen_random_uuid(),
  a_id uuid not null,
  b_id uuid not null,
  a_name text not null,
  b_name text not null,
  a_rating int not null,
  b_rating int not null,
  a_reps int not null default 0,
  b_reps int not null default 0,
  status text not null default 'live',
  created_at timestamptz not null default now()
);

alter table public.pvp_queue enable row level security;
alter table public.pvp_matches enable row level security;

drop policy if exists "PvP queue readable" on public.pvp_queue;
create policy "PvP queue readable" on public.pvp_queue for select to authenticated using (true);
drop policy if exists "PvP matches readable" on public.pvp_matches;
create policy "PvP matches readable" on public.pvp_matches for select to authenticated using (true);

create or replace function public.pvp_poll(p_username text, p_rating int)
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
      'match', jsonb_build_object(
        'id', row.id,
        'aName', row.a_name, 'bName', row.b_name,
        'aReps', row.a_reps, 'bReps', row.b_reps,
        'aRating', row.a_rating, 'bRating', row.b_rating
      )
    );
  end if;

  insert into public.pvp_queue (user_id, username, rating, created_at)
  values (uid, who, rate, now())
  on conflict (user_id) do update
    set username = excluded.username, rating = excluded.rating, created_at = now();

  select q.user_id, q.username, q.rating
  into opp
  from public.pvp_queue q
  where q.user_id <> uid
    and abs(q.rating - rate) <= 500
  order by q.created_at
  limit 1;

  if opp.user_id is null then
    return jsonb_build_object('status', 'searching');
  end if;

  delete from public.pvp_queue where user_id in (uid, opp.user_id);

  insert into public.pvp_matches (a_id, b_id, a_name, b_name, a_rating, b_rating)
  values (uid, opp.user_id, who, opp.username, rate, opp.rating)
  returning * into row;

  return jsonb_build_object(
    'status', 'matched',
    'you', 'a',
    'match', jsonb_build_object(
      'id', row.id,
      'aName', row.a_name, 'bName', row.b_name,
      'aReps', row.a_reps, 'bReps', row.b_reps,
      'aRating', row.a_rating, 'bRating', row.b_rating
    )
  );
end;
$fn$;

create or replace function public.pvp_sync(p_match uuid, p_reps int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  row public.pvp_matches%rowtype;
  reps int := greatest(0, least(500, coalesce(p_reps, 0)));
begin
  if uid is null then
    return jsonb_build_object('error', 'auth');
  end if;

  update public.pvp_matches m
    set a_reps = case when m.a_id = uid then greatest(m.a_reps, reps) else m.a_reps end,
        b_reps = case when m.b_id = uid then greatest(m.b_reps, reps) else m.b_reps end
    where m.id = p_match and m.status = 'live' and (m.a_id = uid or m.b_id = uid)
    returning * into row;

  if row.id is null then
    return jsonb_build_object('error', 'no match');
  end if;

  return jsonb_build_object(
    'you', case when row.a_id = uid then 'a' else 'b' end,
    'aReps', row.a_reps,
    'bReps', row.b_reps,
    'aName', row.a_name,
    'bName', row.b_name
  );
end;
$fn$;

create or replace function public.pvp_cancel()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    return;
  end if;
  delete from public.pvp_queue where user_id = auth.uid();
end;
$fn$;

revoke all on function public.pvp_poll(text, int) from public;
revoke all on function public.pvp_sync(uuid, int) from public;
revoke all on function public.pvp_cancel() from public;
grant execute on function public.pvp_poll(text, int) to authenticated;
grant execute on function public.pvp_sync(uuid, int) to authenticated;
grant execute on function public.pvp_cancel() to authenticated;

create or replace function public.strike_daily_boss(p_day text, p_damage int, p_reason text default 'train', p_username text default 'Игрок')
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid();
  dmg int;
  dealt int;
  row public.daily_boss%rowtype;
  who text;
  spec boolean := false;
  ids uuid[] := array[]::uuid[];
  hit record;
  seen uuid[] := array[]::uuid[];
  nmx int;
  nhp int;
  nst int;
  names text[] := array['Страж порога','Железный колосс','Теневой зверь','Рой аномалии','Костяной великан','Пепельный титан'];
begin
  if uid is null then raise exception 'auth required'; end if;
  if p_day is null or p_day !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'bad day'; end if;
  who := left(coalesce(nullif(btrim(p_username), ''), 'Игрок'), 40);
  select coalesce(array_agg(id), array[]::uuid[]) into ids from public.profiles where lower(btrim(username)) in ('adminsha','админша');
  spec := uid = any(ids) or lower(btrim(who)) in ('adminsha','админша');
  insert into public.daily_boss(day, name, max_hp, hp) values (p_day, names[1+(abs(hashtext(p_day))%6)], 450, 450) on conflict (day) do nothing;
  select * into row from public.daily_boss where day = p_day for update;
  if row.max_hp = 1600 and row.strikes = 0 then
    update public.daily_boss set max_hp = 450, hp = 450 where day = p_day returning * into row;
  end if;
  if exists (select 1 from public.daily_boss_log where day = p_day and (user_id = any(ids) or lower(btrim(username)) in ('adminsha','админша')))
     or exists (select 1 from public.daily_boss_contrib where day = p_day and user_id = any(ids)) then
    delete from public.daily_boss_log where day = p_day and (user_id = any(ids) or lower(btrim(username)) in ('adminsha','админша'));
    nmx := 450; nhp := 450; nst := 0; seen := array[]::uuid[];
    for hit in select user_id, damage from public.daily_boss_log where day = p_day order by created_at, id loop
      if hit.user_id <> all(seen) then
        if coalesce(array_length(seen,1),0) >= 1 and nhp > 0 then nmx := nmx + 450; nhp := nhp + 450; end if;
        seen := array_append(seen, hit.user_id);
      end if;
      if nhp > 0 then nhp := greatest(0, nhp - hit.damage); nst := nst + 1; end if;
    end loop;
    delete from public.daily_boss_contrib where day = p_day;
    insert into public.daily_boss_contrib(day, user_id, damage)
      select p_day, user_id, sum(damage)::int from public.daily_boss_log where day = p_day group by user_id;
    update public.daily_boss set max_hp = nmx, hp = nhp, strikes = nst, updated_at = now() where day = p_day returning * into row;
  end if;
  select damage into dealt from public.daily_boss_contrib where day = p_day and user_id = uid;
  dmg := case when spec then 0 else greatest(0, coalesce(p_damage,0)) end;
  if spec then dealt := 0; end if;
  if dmg > 0 then
    if row.hp > 0 and coalesce(dealt,0) = 0 and (select count(*) from public.daily_boss_contrib where day = p_day and damage > 0) >= 1 then
      update public.daily_boss set max_hp = max_hp + 450, hp = hp + 450 where day = p_day returning * into row;
    end if;
    insert into public.daily_boss_contrib(day, user_id, damage) values (p_day, uid, 0) on conflict (day, user_id) do nothing;
    if row.hp > 0 then
      update public.daily_boss set hp = greatest(0, hp - dmg), strikes = strikes + 1, updated_at = now() where day = p_day returning * into row;
      update public.daily_boss_contrib set damage = coalesce(damage,0) + dmg where day = p_day and user_id = uid;
      dealt := coalesce(dealt,0) + dmg;
      insert into public.daily_boss_log(day, user_id, username, damage, reason)
        values (p_day, uid, who, dmg, case when p_reason in ('train','quest','steps','gather','breach','craft') then p_reason else 'train' end);
    end if;
  end if;
  return jsonb_build_object('day', row.day, 'name', row.name, 'maxHp', row.max_hp, 'hp', row.hp, 'strikes', row.strikes,
    'fighters', (select count(*) from public.daily_boss_contrib where day = p_day and damage > 0),
    'mine', coalesce(dealt,0), 'shared', true,
    'log', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, username, damage, reason, created_at as "createdAt" from public.daily_boss_log where day = p_day order by created_at desc limit 50
    ) t), '[]'::jsonb),
    'board', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select username, sum(damage)::int as damage from public.daily_boss_log where day = p_day group by username order by sum(damage) desc
    ) t), '[]'::jsonb));
end $fn$;
grant execute on function public.strike_daily_boss(text, int, text, text) to authenticated;

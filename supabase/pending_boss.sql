-- Вставить в Supabase → SQL Editor и выполнить.
-- Добыча за убитого босса находится, даже если игрок в тот день не заходил.

create or replace function public.pending_boss_rewards(p_since text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', b.day,
      'name', b.name,
      'hp', b.hp,
      'maxHp', b.max_hp,
      'mine', c.damage
    ) order by b.day)
    from public.daily_boss b
    join public.daily_boss_contrib c on c.day = b.day and c.user_id = uid
    where b.hp <= 0
      and c.damage > 0
      and b.day >= p_since
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.pending_boss_rewards(text) from public;
grant execute on function public.pending_boss_rewards(text) to authenticated;

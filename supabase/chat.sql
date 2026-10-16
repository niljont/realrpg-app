-- Общий чат: последние 100 сообщений.
-- Supabase → SQL Editor → выполнить целиком.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  active_title text,
  level int not null default 1,
  body text not null,
  created_at timestamptz not null default now(),
  constraint chat_messages_body_len check (char_length(body) between 1 and 280)
);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Chat readable by authenticated" on public.chat_messages;
create policy "Chat readable by authenticated"
  on public.chat_messages
  for select
  to authenticated
  using (true);

drop policy if exists "Users insert own chat messages" on public.chat_messages;
create policy "Users insert own chat messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- После вставки оставляем только 100 свежих сообщений.
create or replace function public.trim_chat_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chat_messages
  where id in (
    select id
    from public.chat_messages
    order by created_at desc
    offset 100
  );
  return null;
end;
$$;

drop trigger if exists chat_messages_trim on public.chat_messages;
create trigger chat_messages_trim
  after insert on public.chat_messages
  for each statement
  execute function public.trim_chat_messages();

-- Realtime (если ещё не добавлено в publication):
-- alter publication supabase_realtime add table public.chat_messages;

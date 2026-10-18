import { levelFromXp } from './game';
import { supabase } from './supabase';

export const CHAT_MAX_MESSAGES = 100;
export const CHAT_MAX_LEN = 280;
export const CHAT_COOLDOWN_MS = 4000;

let lastSendAt = 0;

export async function fetchChatMessages(limit = CHAT_MAX_MESSAGES) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id,user_id,username,active_title,level,body,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation|does not exist|schema cache|chat_messages/i.test(error.message || '')) {
      return {
        messages: [],
        error: 'Чат не настроен. Выполни SQL из supabase/chat.sql в Supabase.',
      };
    }
    throw error;
  }

  return { messages: [...(data ?? [])].reverse(), error: null };
}

export async function sendChatMessage(player, userId, text) {
  if (!userId) return { error: 'Нужен вход' };
  const body = String(text ?? '').trim().slice(0, CHAT_MAX_LEN);
  if (!body) return { error: 'Пустое сообщение' };

  const now = Date.now();
  const wait = CHAT_COOLDOWN_MS - (now - lastSendAt);
  if (wait > 0) return { error: `Подожди ${Math.ceil(wait / 1000)} с` };

  const { level } = levelFromXp(player?.xp ?? 0);
  const row = {
    user_id: userId,
    username: (player?.name || 'Игрок').slice(0, 40),
    active_title: player?.activeTitle || 'wanderer',
    level: Math.max(1, level),
    body,
  };

  const { data, error } = await supabase.from('chat_messages').insert(row).select('*').maybeSingle();
  if (error) {
    if (/relation|does not exist|schema cache|chat_messages/i.test(error.message || '')) {
      return { error: 'Чат не настроен. Выполни SQL из supabase/chat.sql' };
    }
    return { error: error.message || 'Не удалось отправить' };
  }

  lastSendAt = Date.now();
  return { message: data };
}

/** Подписка Realtime; если канал недоступен — просто отписка-noop. */
export function subscribeChat(onInsert) {
  const channel = supabase
    .channel('chat_messages_live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        if (payload?.new) onInsert?.(payload.new);
      },
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* ignore */
    }
  };
}

const seenKey = (userId) => `fitnessrpg.chat.seen.${userId}`;

export function readChatSeen(userId) {
  if (!userId) return '';
  try {
    return localStorage.getItem(seenKey(userId)) || '';
  } catch {
    return '';
  }
}

export function writeChatSeen(userId, stamp) {
  if (!userId || !stamp) return;
  try {
    localStorage.setItem(seenKey(userId), stamp);
  } catch {
    /* ignore */
  }
}

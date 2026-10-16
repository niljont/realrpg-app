import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { TITLES, titleName } from '../lib/game';
import { CHAT_MAX_LEN, fetchChatMessages, sendChatMessage, subscribeChat } from '../lib/chat';
import { useAuth } from '../context/AuthContext';
import PlayerProfileModal from './PlayerProfileModal';

function msgTitle(msg) {
  const id = msg.active_title && TITLES[msg.active_title] ? msg.active_title : null;
  if (!id) return null;
  return {
    label: titleName(id, 'male'),
    color: TITLES[id].color,
  };
}

export default function ChatScreen({ player }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [viewPlayer, setViewPlayer] = useState(null);
  const bottomRef = useRef(null);
  const listRef = useRef(null);

  const scrollBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetchChatMessages();
      setMessages(res.messages || []);
      setHint(res.error || '');
      setError('');
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = subscribeChat((row) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        const next = [...prev, row];
        return next.length > 100 ? next.slice(-100) : next;
      });
    });
    const poll = setInterval(load, 8000);
    return () => {
      unsub?.();
      clearInterval(poll);
    };
  }, [load]);

  useEffect(() => {
    scrollBottom(messages.length > 0);
  }, [messages.length, scrollBottom]);

  const onSend = async () => {
    if (!user?.id || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await sendChatMessage(player, user.id, text);
      if (res.error) {
        setError(res.error);
        return;
      }
      setText('');
      if (res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          const next = [...prev, res.message];
          return next.length > 100 ? next.slice(-100) : next;
        });
      } else {
        await load();
      }
    } catch (e) {
      setError(e?.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <section className="system-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-x-0 border-t-0 p-0 sm:rounded-xl sm:border sm:border-zinc-800">
        <div className="shrink-0 border-b border-zinc-800 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-neon" />
            <h2 className="font-display text-sm tracking-widest text-neon/90">ОБЩИЙ ЧАТ</h2>
            <span className="text-[10px] text-zinc-600">· 100</span>
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">Тап по имени — профиль и радар</p>
          {hint && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
              {hint}
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">
              {error}
            </div>
          )}
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3">
          {loading && <div className="py-10 text-center text-xs text-zinc-600">Загрузка…</div>}
          {!loading && messages.length === 0 && !hint && (
            <div className="py-10 text-center text-xs text-zinc-600">Пока тихо. Напиши первым.</div>
          )}
          {messages.map((m) => {
            const mine = user?.id === m.user_id;
            const title = msgTitle(m);
            return (
              <div
                key={m.id}
                className={`rounded-xl border px-3 py-2 ${
                  mine ? 'border-neon/30 bg-neon/5' : 'border-zinc-800 bg-zinc-900/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewPlayer({ id: m.user_id, name: m.username })}
                  className="flex w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-left"
                >
                  <span className="font-display text-[12px] text-zinc-100 hover:text-neon">{m.username}</span>
                  {title && (
                    <span className="text-[10px] font-bold" style={{ color: title.color }}>
                      «{title.label}»
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">Ур. {m.level ?? 1}</span>
                  {mine && <span className="text-[9px] font-bold text-neon">ВЫ</span>}
                </button>
                <div className="mt-1 whitespace-pre-wrap break-words text-[13px] text-zinc-200">{m.body}</div>
                <div className="mt-1 text-[9px] tabular-nums text-zinc-600">
                  {m.created_at
                    ? new Date(m.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-zinc-800 bg-void/95 px-3 py-2.5 backdrop-blur-md">
          <div className="flex gap-2">
            <input
              value={text}
              maxLength={CHAT_MAX_LEN}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Сообщение…"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-neon/50"
            />
            <button
              type="button"
              disabled={sending || !text.trim()}
              onClick={onSend}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neon/20 text-neon disabled:opacity-35"
              aria-label="Отправить"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-1 text-right text-[9px] text-zinc-600">
            {text.length}/{CHAT_MAX_LEN}
          </div>
        </div>
      </section>

      {viewPlayer && (
        <PlayerProfileModal
          userId={viewPlayer.id}
          fallbackName={viewPlayer.name}
          onClose={() => setViewPlayer(null)}
        />
      )}
    </div>
  );
}

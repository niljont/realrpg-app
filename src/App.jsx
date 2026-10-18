import { useCallback, useEffect, useRef, useState } from 'react';
import { Dumbbell, Hammer, Map, Medal, MessageCircle, Skull, UserRound } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Hud from './components/Hud';
import EnergyModal from './components/EnergyModal';
import StatusScreen from './components/StatusScreen';
import TrainingScreen from './components/TrainingScreen';
import WorldScreen from './components/WorldScreen';
import ProfessionsScreen from './components/ProfessionsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ChatScreen from './components/ChatScreen';
import BossScreen from './components/BossScreen';
import UnlockOverlay from './components/UnlockOverlay';
import { useAuth } from './context/AuthContext';
import {
  applyTimeSystems,
  addCustomQuest,
  applyTraining,
  applyTrainingMany,
  blockCustomQuest,
  createPlayer,
  equipTitle,
  loadPlayer,
  removeCustomQuest,
  changeGender,
  renamePlayer,
  savePlayer,
  sealResult,
  stampPlayer,
  dayKey,
} from './lib/game';
import {
  fetchProfile,
  resolvePlayerBootstrap,
} from './lib/profileSync';
import { supabase } from './lib/supabase';
import {
  addCustomRecipe,
  archiveCustomRecipe,
  cookCustomRecipe,
  editCustomRecipe,
  eatDish,
  gatherNode,
  logFastFood,
  logHealthyMeal,
  logNormalMeal,
  buyFromGoblin,
  sellToGoblin,
  useInventoryItem,
} from './lib/world';
import { craftRecipe } from './lib/crafting';
import { applyHpRegen, buyGear, equipItem, unequipSlot } from './lib/equipment';
import { ensureVendorStock } from './lib/loot';
import { fetchChatMessages, readChatSeen, subscribeChat, writeChatSeen } from './lib/chat';
import { applyDailyProgress, claimBossReward, claimContract, claimReturn, ensureDaily, strikeDailyBoss } from './lib/daily';
import {
  breachCombatContinue,
  breachCombatDefend,
  breachCombatEndTurn,
  breachCombatStrike,
  breachCombatTrinket,
  breachFlee,
  ensureRadar,
  enterBreach,
  setTodaySteps,
  syncStepsDay,
  travelToBreach,
} from './lib/breaches';

/** AP/HP-regen + утренний сброс + банк шагов + радар раз в час. */
function applyWorldSystems(p) {
  let result = applyTimeSystems(p);
  let player = result.player;
  let events = [...(result.events ?? [])];
  let changed = result.changed;

  const hpRegen = applyHpRegen(player);
  if (hpRegen.changed) {
    player = hpRegen.player;
    events.push(...(hpRegen.events ?? []));
    changed = true;
  }

  const steps = syncStepsDay(player);
  if (steps.changed) {
    player = steps.player;
    changed = true;
  }
  const radar = ensureRadar(player);
  if (radar.changed) {
    player = radar.player;
    changed = true;
    events.push({ type: 'gain', text: 'Радар Брешей обновлён' });
  }
  const vendor = ensureVendorStock(player);
  if (vendor.changed) {
    player = vendor.player;
    changed = true;
  }
  const daily = ensureDaily(player);
  if (daily.changed) {
    player = daily.player;
    changed = true;
    events.push(...(daily.events ?? []));
  }
  return { player, events, changed };
}

const TABS = [
  { id: 'status', label: 'Статус', Icon: UserRound },
  { id: 'training', label: 'Прокачка', Icon: Dumbbell },
  { id: 'world', label: 'Мир', Icon: Map },
  { id: 'professions', label: 'Профы', Icon: Hammer },
  { id: 'boss', label: 'Босс', Icon: Skull },
  { id: 'chat', label: 'Чат', Icon: MessageCircle },
  { id: 'rank', label: 'Рейтинг', Icon: Medal },
];

const TOAST_COLORS = {
  level: '#a855f7',
  title: '#eab308',
  stat: '#22c55e',
  energy: '#3b82f6',
  gain: '#22d3ee',
  error: '#ef4444',
  achievement: '#eab308',
};

export default function App() {
  const { user, loading: authLoading, storageKey, syncPlayerToCloud, signOut } = useAuth();
  const [player, setPlayer] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [tab, setTab] = useState('status');
  const [statusOpenRequest, setStatusOpenRequest] = useState(null);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unlockId, setUnlockId] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(null);
  const [boss, setBoss] = useState(null);
  const [chatUnread, setChatUnread] = useState(false);
  const syncTimer = useRef(null);

  const notify = useCallback((events) => {
    const items = (events ?? []).filter((e) => e.type !== 'achievement').map((e) => ({ ...e, id: crypto.randomUUID() }));
    setToasts((t) => [...t, ...items].slice(-4));
    for (const it of items) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== it.id)), 3200);

    const firstUnlock = (events ?? []).find((e) => e.type === 'achievement');
    if (firstUnlock) {
      setUnlockId(firstUnlock.id);
      setJustUnlocked(firstUnlock.id);
      setTab('status');
      setStatusOpenRequest('achievements');
    }
  }, []);

  const commit = useCallback(
    (result) => {
      if (result.error) {
        notify([{ type: 'error', text: result.error }]);
        return false;
      }
      let next = result.player;
      const events = [...(result.events ?? [])];
      if (result.daily) {
        const tracked = applyDailyProgress(next, result.daily);
        next = tracked.player;
        events.push(...(tracked.events ?? []));
        if (tracked.bossDamage > 0) {
          strikeDailyBoss(dayKey(), tracked.bossDamage, result.daily?.action || 'train', next.name).then((state) => {
            if (state) setBoss(state);
          });
        }
      }
      setPlayer(next);
      if (events.length) notify(events);
      return true;
    },
    [notify],
  );

  // Загрузка локального сейва / профиля при входе.
  useEffect(() => {
    if (authLoading) return undefined;
    if (!user?.id || !storageKey) {
      setPlayer(null);
      return undefined;
    }

    let cancelled = false;
    setBootstrapping(true);

    (async () => {
      try {
        const local = loadPlayer(storageKey);
        let cloud = null;
        try {
          cloud = await fetchProfile(user.id, { withSave: true });
        } catch {
          cloud = null;
        }

        const next = resolvePlayerBootstrap(
          local,
          cloud,
          user.user_metadata?.username || user.user_metadata?.display_name || 'Игрок',
        );

        if (!cancelled) {
          setPlayer(next);
          // Если облако пустое, а локальный сейв есть — сразу залить полный прогресс.
          if (local && !cloud?.save_data) {
            syncPlayerToCloud(stampPlayer(next));
          }
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, storageKey, syncPlayerToCloud]);

  // Локальное сохранение + debounce-синк полного сейва в Supabase.
  useEffect(() => {
    if (!player || !storageKey || !user?.id) return undefined;
    const stamped = stampPlayer(player);
    savePlayer(stamped, storageKey);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncPlayerToCloud(stamped);
    }, 1500);

    const flush = () => {
      clearTimeout(syncTimer.current);
      const latest = stampPlayer(player);
      savePlayer(latest, storageKey);
      syncPlayerToCloud(latest);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearTimeout(syncTimer.current);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [player, storageKey, user?.id, syncPlayerToCloud]);

  // Пассивный реген AP, утренний сброс, радар.
  useEffect(() => {
    if (!player) return undefined;
    const tick = () => {
      let events = [];
      setPlayer((prev) => {
        if (!prev) return prev;
        const result = applyWorldSystems(prev);
        if (result.changed) {
          events = result.events ?? [];
          return result.player;
        }
        return prev;
      });
      if (events.length) notify(events);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [Boolean(player), notify]);

  const run = useCallback((fn, ...args) => commit(sealResult(fn(player, ...args))), [commit, player]);

  useEffect(() => {
    if (!player) return undefined;
    let cancel = false;
    const pull = () => {
      strikeDailyBoss(dayKey(), 0, 'train', player?.name).then((state) => {
        if (!cancel && state) setBoss(state);
      });
    };
    pull();
    const id = setInterval(pull, tab === 'boss' ? 8000 : 20000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [Boolean(player), player?.name, tab]);

  const markChatSeen = useCallback(
    (stamp) => {
      if (!user?.id || !stamp) return;
      writeChatSeen(user.id, stamp);
      setChatUnread(false);
    },
    [user?.id],
  );

  useEffect(() => {
    if (!user?.id || tab === 'chat') return undefined;
    let cancel = false;
    const check = async () => {
      try {
        const res = await fetchChatMessages(30);
        const seen = readChatSeen(user.id);
        const fresh = (res.messages ?? []).some(
          (m) => m.user_id !== user.id && m.created_at && (!seen || m.created_at > seen),
        );
        if (!cancel) setChatUnread(fresh);
      } catch {
        /* чат может быть недоступен */
      }
    };
    check();
    const poll = setInterval(check, 8000);
    const unsub = subscribeChat((row) => {
      if (!row || row.user_id === user.id) return;
      const seen = readChatSeen(user.id);
      if (!seen || (row.created_at && row.created_at > seen)) setChatUnread(true);
    });
    return () => {
      cancel = true;
      clearInterval(poll);
      unsub?.();
    };
  }, [user?.id, tab]);

  const refreshRadar = useCallback(() => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const result = applyWorldSystems(prev);
      return result.changed ? result.player : prev;
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    clearTimeout(syncTimer.current);
    if (player && user?.id) {
      try {
        await syncPlayerToCloud(stampPlayer(player));
      } catch {
        /* ignore */
      }
    }
    setPlayer(null);
    await signOut();
  }, [player, user?.id, syncPlayerToCloud, signOut]);

  if (authLoading || (user && bootstrapping && !player)) {
    return (
      <div className="system-bg flex min-h-dvh items-center justify-center">
        <div className="font-display text-sm tracking-widest text-neon/80">СИНХРОНИЗАЦИЯ…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!player) {
    return (
      <div className="system-bg flex min-h-dvh items-center justify-center">
        <div className="font-display text-sm tracking-widest text-neon/80">ЗАГРУЗКА ПРОФИЛЯ…</div>
      </div>
    );
  }

  const chatMode = tab === 'chat';

  return (
    <div className={`system-bg ${chatMode ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <div className={`mx-auto flex max-w-md flex-col ${chatMode ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
        {!chatMode && (
          <Hud
            player={player}
            onOpenEnergy={() => setModal('energy')}
            onOpenTitles={() => {
              setTab('status');
              setStatusOpenRequest('titles');
            }}
            onSignOut={handleSignOut}
            onResetAccount={async () => {
              const fresh = createPlayer(player.name, player.gender || 'male');
              setPlayer(fresh);
              await syncPlayerToCloud(stampPlayer(fresh));
            }}
            onChangeGender={async (gender) => {
              const result = changeGender(player, gender);
              if (result.error) return { error: result.error };
              const next = stampPlayer(result.player);
              setPlayer(next);
              notify(result.events ?? []);
              const sync = await syncPlayerToCloud(next);
              if (sync && sync.ok === false) {
                return { error: sync.error || 'Не удалось сохранить пол в облаке' };
              }
              return { ok: true };
            }}
            onRename={async (newName) => {
              const result = renamePlayer(player, newName);
              if (result.error) return { error: result.error };
              const next = stampPlayer(result.player);
              setPlayer(next);
              notify(result.events ?? []);
              const sync = await syncPlayerToCloud(next);
              if (sync && sync.ok === false) {
                return { error: sync.error || 'Не удалось сохранить имя в облаке' };
              }
              try {
                await supabase.auth.updateUser({
                  data: {
                    username: next.name,
                    display_name: next.name,
                    full_name: next.name,
                  },
                });
              } catch {
                /* ignore metadata */
              }
              return { ok: true };
            }}
          />
        )}

        <main
          className={
            chatMode
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-0 pt-[max(env(safe-area-inset-top),8px)] pb-[calc(3.75rem+env(safe-area-inset-bottom))]'
              : 'flex-1 px-4 pt-4 pb-28'
          }
        >
          {tab === 'status' && (
            <StatusScreen
              player={player}
              onEat={(id) => run(eatDish, id)}
              onUseItem={(id) => run(useInventoryItem, id)}
              onHealthyMeal={() => run(logHealthyMeal)}
              onNormalMeal={() => run(logNormalMeal)}
              onFastFood={() => run(logFastFood)}
              onSell={(id, amt) => run(sellToGoblin, id, amt)}
              onBuyGear={(id, n) => run(buyGear, id, n)}
              onBuyConsumable={(id, n) => run(buyFromGoblin, id, n)}
              onEquipItem={(id, slot) => run(equipItem, id, slot)}
              onUnequipSlot={(slot) => run(unequipSlot, slot)}
              onEquipTitle={(id) => commit(equipTitle(player, id))}
              justUnlocked={justUnlocked}
              openRequest={statusOpenRequest}
              onOpenRequestHandled={() => setStatusOpenRequest(null)}
              onClaimContract={() => commit(claimContract(player))}
              onClaimReturn={() => commit(claimReturn(player))}
            />
          )}
          {tab === 'training' && (
            <TrainingScreen
              player={player}
              onTrain={(s, id, amt, rate) => commit(applyTraining(player, s, id, amt, rate))}
              onTrainMany={(rows) => commit(applyTrainingMany(player, rows))}
              onAddQuest={(data) => commit(sealResult(addCustomQuest(player, data)))}
              onRemoveQuest={(id) => commit(sealResult(removeCustomQuest(player, id)))}
              onBlockQuest={(id) => commit(sealResult(blockCustomQuest(player, id)))}
            />
          )}
          {tab === 'world' && (
            <WorldScreen
              player={player}
              onGather={(id) => run(gatherNode, id)}
              onSetSteps={(n) => run(setTodaySteps, n)}
              onTravel={(id) => run(travelToBreach, id)}
              onEnterBreach={(id) => run(enterBreach, id)}
              onBreachStrike={() => run(breachCombatStrike)}
              onBreachDefend={() => run(breachCombatDefend)}
              onBreachEndTurn={() => run(breachCombatEndTurn)}
              onBreachTrinket={() => run(breachCombatTrinket)}
              onBreachContinue={() => run(breachCombatContinue)}
              onBreachFlee={() => run(breachFlee)}
              onRefreshRadar={refreshRadar}
            />
          )}
          {tab === 'professions' && (
            <ProfessionsScreen
              player={player}
              onCook={(id) => run(cookCustomRecipe, id)}
              onAddRecipe={(data) => run(addCustomRecipe, data)}
              onEditRecipe={(id, data) => run(editCustomRecipe, id, data)}
              onArchiveRecipe={(id, archived) => run(archiveCustomRecipe, id, archived)}
              onCraft={(id) => {
                const result = sealResult(craftRecipe(player, id));
                return commit(result) ? result.crafted ?? null : null;
              }}
            />
          )}
          {tab === 'boss' && (
            <BossScreen player={player} boss={boss} onClaimBoss={() => commit(claimBossReward(player, boss))} />
          )}
          {tab === 'chat' && <ChatScreen player={player} onSeen={markChatSeen} />}
          {tab === 'rank' && <LeaderboardScreen player={player} />}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neon/20 bg-void/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto flex max-w-md gap-0.5 overflow-x-auto px-1">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 py-2 text-[8px] font-bold tracking-wider transition ${active ? 'text-neon' : 'text-zinc-500'}`}
                >
                  <span className="relative">
                    <Icon size={16} style={{ filter: active ? 'drop-shadow(0 0 6px #22d3ee)' : 'none' }} />
                    {id === 'chat' && chatUnread && (
                      <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border border-void bg-red-500 shadow-[0_0_6px_#ef4444]" />
                    )}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {modal === 'energy' && <EnergyModal player={player} commit={commit} onClose={() => setModal(null)} />}

      {unlockId && (
        <UnlockOverlay
          achievementId={unlockId}
          gender={player.gender}
          onClose={() => {
            setUnlockId(null);
            setTimeout(() => setJustUnlocked(null), 1800);
          }}
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),8px)] z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in max-w-sm rounded-lg border bg-zinc-950/95 px-4 py-2 text-center text-xs font-semibold text-zinc-100"
            style={{ borderColor: TOAST_COLORS[t.type], boxShadow: `0 0 18px ${TOAST_COLORS[t.type]}66` }}
          >
            <span className="mr-1 font-display" style={{ color: TOAST_COLORS[t.type] }}>
              [СИСТЕМА]
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

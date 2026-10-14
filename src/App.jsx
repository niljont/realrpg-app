import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Dumbbell, Hammer, Map, Trophy, UserRound } from 'lucide-react';
import Onboarding from './components/Onboarding';
import Hud from './components/Hud';
import EnergyModal from './components/EnergyModal';
import StatusScreen from './components/StatusScreen';
import TrainingScreen from './components/TrainingScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import AchievementsScreen from './components/AchievementsScreen';
import WorldScreen from './components/WorldScreen';
import ProfessionsScreen from './components/ProfessionsScreen';
import UnlockOverlay from './components/UnlockOverlay';
import {
  STORAGE_KEY,
  applyTimeSystems,
  applyTraining,
  createPlayer,
  equipTitle,
  loadPlayer,
  savePlayer,
  sealResult,
} from './lib/game';
import {
  addCustomRecipe,
  buyFromGoblin,
  cookCustomRecipe,
  craftCheatmealScroll,
  eatDish,
  gatherNode,
  logFastFood,
  logHealthyMeal,
  logNormalMeal,
  sellToGoblin,
  studyLanguage,
  useInventoryItem,
} from './lib/world';
import {
  breachAttack,
  breachFlee,
  ensureRadar,
  enterBreach,
  setTodaySteps,
  syncStepsDay,
  travelToBreach,
} from './lib/breaches';

/** AP-regen + утренний сброс + банк шагов + радар раз в час. */
function applyWorldSystems(p) {
  let result = applyTimeSystems(p);
  let player = result.player;
  let events = [...(result.events ?? [])];
  let changed = result.changed;

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
  return { player, events, changed };
}

const TABS = [
  { id: 'status', label: 'Статус', Icon: UserRound },
  { id: 'training', label: 'Прокачка', Icon: Dumbbell },
  { id: 'world', label: 'Мир', Icon: Map },
  { id: 'professions', label: 'Профы', Icon: Hammer },
  { id: 'titles', label: 'Титулы', Icon: Trophy },
  { id: 'analytics', label: 'Графики', Icon: BarChart3 },
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
  const [player, setPlayer] = useState(loadPlayer);
  const [tab, setTab] = useState('status');
  const [titlesSubTab, setTitlesSubTab] = useState('titles');
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unlockId, setUnlockId] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(null);

  const notify = useCallback((events) => {
    const items = (events ?? []).filter((e) => e.type !== 'achievement').map((e) => ({ ...e, id: crypto.randomUUID() }));
    setToasts((t) => [...t, ...items].slice(-4));
    for (const it of items) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== it.id)), 3200);

    const firstUnlock = (events ?? []).find((e) => e.type === 'achievement');
    if (firstUnlock) {
      setUnlockId(firstUnlock.id);
      setJustUnlocked(firstUnlock.id);
      setTab('titles');
      setTitlesSubTab('achievements');
    }
  }, []);

  const commit = useCallback(
    (result) => {
      if (result.error) {
        notify([{ type: 'error', text: result.error }]);
        return false;
      }
      setPlayer(result.player);
      notify(result.events ?? []);
      return true;
    },
    [notify],
  );

  useEffect(() => {
    if (player) savePlayer(player);
  }, [player]);

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

  const refreshRadar = useCallback(() => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const result = applyWorldSystems(prev);
      return result.changed ? result.player : prev;
    });
  }, []);

  if (!player) {
    return <Onboarding onAwaken={(name, gender) => setPlayer(createPlayer(name, gender))} />;
  }

  return (
    <div className="system-bg min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <Hud
          player={player}
          onOpenEnergy={() => setModal('energy')}
          onOpenTitles={() => {
            setTitlesSubTab('titles');
            setTab('titles');
          }}
        />

        <main className="flex-1 px-4 pt-4 pb-28">
          {tab === 'status' && (
            <StatusScreen
              player={player}
              onReset={() => {
                localStorage.removeItem(STORAGE_KEY);
                setPlayer(null);
              }}
            />
          )}
          {tab === 'training' && <TrainingScreen player={player} onTrain={(s, id, amt) => commit(applyTraining(player, s, id, amt))} />}
          {tab === 'world' && (
            <WorldScreen
              player={player}
              onGather={(id) => run(gatherNode, id)}
              onSetSteps={(n) => run(setTodaySteps, n)}
              onTravel={(id) => run(travelToBreach, id)}
              onEnterBreach={(id) => run(enterBreach, id)}
              onBreachAttack={() => run(breachAttack)}
              onBreachFlee={() => run(breachFlee)}
              onRefreshRadar={refreshRadar}
            />
          )}
          {tab === 'professions' && (
            <ProfessionsScreen
              player={player}
              onCook={(id) => run(cookCustomRecipe, id)}
              onAddRecipe={(data) => run(addCustomRecipe, data)}
              onStudy={(mins) => run(studyLanguage, mins)}
              onCraftScroll={() => run(craftCheatmealScroll)}
              onEat={(id) => run(eatDish, id)}
              onUseItem={(id) => run(useInventoryItem, id)}
              onHealthyMeal={() => run(logHealthyMeal)}
              onNormalMeal={() => run(logNormalMeal)}
              onFastFood={() => run(logFastFood)}
              onSell={(id, amt) => run(sellToGoblin, id, amt)}
              onBuy={(id) => run(buyFromGoblin, id)}
            />
          )}
          {tab === 'titles' && (
            <AchievementsScreen
              key={titlesSubTab}
              player={player}
              initialTab={titlesSubTab}
              justUnlocked={justUnlocked}
              onEquip={(id) => commit(equipTitle(player, id))}
            />
          )}
          {tab === 'analytics' && <AnalyticsScreen player={player} />}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neon/20 bg-void/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto grid max-w-md grid-cols-6">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (id === 'titles') setTitlesSubTab('titles');
                    setTab(id);
                  }}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold tracking-wider transition ${active ? 'text-neon' : 'text-zinc-500'}`}
                >
                  <Icon size={18} style={{ filter: active ? 'drop-shadow(0 0 6px #22d3ee)' : 'none' }} />
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

import { Crosshair, FastForward, Hand, Play, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  formatNumber,
  getModuleLevel,
  getWeaponDamage,
} from '@/lib/game/simulation';
import type { GameState, ResourceBag } from '@/lib/game/types';

type Mode = 'manual' | 'auto';
type RunStatus = 'idle' | 'running' | 'victory' | 'defeat';

type CombatState = {
  mode: Mode;
  status: RunStatus;
  wave: number;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  cooldown: number;
  enemyTimer: number;
  message: string;
  log: string[];
};

const MAX_WAVE = 20;

const getEnemyStats = (wave: number) => ({
  hp: Math.round(42 + Math.pow(wave, 1.48) * 32),
  damage: Math.round(10 + wave * 6.8),
  cadence: Math.max(0.82, 1.9 - wave * 0.035),
});

const getPlayerMaxHp = (state: GameState) =>
  82 + getModuleLevel(state, 'energyCore') * 18 + getModuleLevel(state, 'cargo') * 7;

const getWaveReward = (wave: number): Partial<ResourceBag> => ({
  credits: 80 + wave * 28,
  titan: 10 + wave * 4,
  crystal: 8 + wave * 3,
  silicon: wave >= 3 ? 5 + wave * 2 : 0,
  alien: wave >= 7 ? 1 + Math.floor(wave / 3) : 0,
});

const rewardText = (reward: Partial<ResourceBag>) =>
  Object.entries(reward)
    .filter(([, value]) => (value ?? 0) > 0)
    .map(
      ([key, value]) =>
        `${RESOURCE_LABELS[key as keyof ResourceBag]} +${formatNumber(value ?? 0)}`,
    )
    .join(', ');

const createCombat = (state: GameState, mode: Mode): CombatState => {
  const enemy = getEnemyStats(1);
  const playerMaxHp = getPlayerMaxHp(state);

  return {
    mode,
    status: 'running',
    wave: 1,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    playerHp: playerMaxHp,
    playerMaxHp,
    cooldown: 0,
    enemyTimer: enemy.cadence,
    message: 'Welle 1 gestartet',
    log: [],
  };
};

export function AdventureView({
  state,
  onClaimReward,
}: {
  state: GameState;
  onClaimReward: (reward: Partial<ResourceBag>) => void;
}) {
  const [combat, setCombat] = useState<CombatState>(() => ({
    mode: 'manual',
    status: 'idle',
    wave: 1,
    enemyHp: 0,
    enemyMaxHp: 1,
    playerHp: getPlayerMaxHp(state),
    playerMaxHp: getPlayerMaxHp(state),
    cooldown: 0,
    enemyTimer: 0,
    message: 'Bereit fuer den ersten Einsatz',
    log: [],
  }));

  const playerDamage = useMemo(() => getWeaponDamage(state), [state]);
  const weaponLevel = getModuleLevel(state, 'weapon');
  const laserLevel = getModuleLevel(state, 'laser');

  const startRun = (mode: Mode) => setCombat(createCombat(state, mode));

  const finishEnemy = (current: CombatState): CombatState => {
    const reward = getWaveReward(current.wave);
    onClaimReward(reward);

    if (current.wave >= MAX_WAVE) {
      return {
        ...current,
        status: 'victory',
        enemyHp: 0,
        message: 'Alle 20 Wellen geschafft',
        log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      };
    }

    const nextWave = current.wave + 1;
    const enemy = getEnemyStats(nextWave);

    return {
      ...current,
      wave: nextWave,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.hp,
      cooldown: 0.42,
      enemyTimer: enemy.cadence,
      message: `Welle ${nextWave} rueckt an`,
      log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
    };
  };

  const fireShot = () => {
    setCombat((current) => {
      if (current.status !== 'running' || current.cooldown > 0) return current;
      const nextEnemyHp = Math.max(0, current.enemyHp - playerDamage);

      if (nextEnemyHp <= 0) return finishEnemy({ ...current, enemyHp: 0 });

      return {
        ...current,
        enemyHp: nextEnemyHp,
        cooldown: current.mode === 'auto' ? 0.92 : 0.5,
        message: `${formatNumber(playerDamage)} Schaden verursacht`,
      };
    });
  };

  useEffect(() => {
    if (combat.status !== 'running') return undefined;

    const timer = window.setInterval(() => {
      setCombat((current) => {
        if (current.status !== 'running') return current;

        let next = {
          ...current,
          cooldown: Math.max(0, current.cooldown - 0.1),
          enemyTimer: Math.max(0, current.enemyTimer - 0.1),
        };

        if (next.mode === 'auto' && next.cooldown <= 0) {
          const nextEnemyHp = Math.max(0, next.enemyHp - playerDamage);
          next = {
            ...next,
            enemyHp: nextEnemyHp,
            cooldown: 0.92,
            message: `Auto-Feuer: ${formatNumber(playerDamage)} Schaden`,
          };
          if (nextEnemyHp <= 0) return finishEnemy(next);
        }

        if (next.enemyTimer <= 0) {
          const enemy = getEnemyStats(next.wave);
          const nextPlayerHp = Math.max(0, next.playerHp - enemy.damage);
          if (nextPlayerHp <= 0) {
            return {
              ...next,
              status: 'defeat',
              playerHp: 0,
              message: `Rakete in Welle ${next.wave} verloren`,
            };
          }

          next = {
            ...next,
            playerHp: nextPlayerHp,
            enemyTimer: enemy.cadence,
            message: `Gegner trifft fuer ${formatNumber(enemy.damage)}`,
          };
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [combat.status, onClaimReward, playerDamage]);

  const enemyPercent = (combat.enemyHp / combat.enemyMaxHp) * 100;
  const playerPercent = (combat.playerHp / combat.playerMaxHp) * 100;

  return (
    <section className="adventure-view" aria-label="Abenteuer">
      <div className="adventure-header">
        <div>
          <h2>Abenteuer</h2>
          <p>Raketenmaterialien gibt es hier. Baustoffe bleiben bei den Meteoriten.</p>
        </div>
        <div className="adventure-actions">
          <button onClick={() => startRun('manual')}>
            <Hand size={17} />
            Manuell
          </button>
          <button onClick={() => startRun('auto')}>
            <FastForward size={17} />
            Auto
          </button>
        </div>
      </div>

      <div className="adventure-arena">
        <div className="rocket-combat-card">
          <span className="combat-tag">Explorer I</span>
          <h3>Rostige Starterrakete</h3>
          <Progress className="game-progress" value={playerPercent} />
          <span>
            Huelle {formatNumber(combat.playerHp)} / {formatNumber(combat.playerMaxHp)}
          </span>
          <small>
            Waffenmodul {weaponLevel} · Bergbau-Laser {laserLevel} · Schaden{' '}
            {formatNumber(playerDamage)}
          </small>
        </div>

        <div className="wave-field">
          <span className="wave-count">
            Welle {combat.status === 'idle' ? 0 : combat.wave} / {MAX_WAVE}
          </span>
          <div className={`enemy-ship ${combat.status}`}>
            <span />
            <i />
          </div>
          <Progress className="game-progress enemy-progress" value={enemyPercent} />
          <strong>
            Gegner {formatNumber(combat.enemyHp)} / {formatNumber(combat.enemyMaxHp)}
          </strong>
          <p>{combat.message}</p>
          <button
            className="fire-button"
            disabled={combat.status !== 'running' || combat.cooldown > 0}
            onClick={fireShot}
          >
            <Crosshair size={18} />
            Feuern
          </button>
        </div>

        <div className="reward-card">
          <Shield size={24} />
          <h3>Beute</h3>
          <p>Wellen liefern Titan, Kristall, Silizium und Alien-Partikel.</p>
          <div className="reward-log">
            {combat.log.length ? (
              combat.log.map((entry) => <span key={entry}>{entry}</span>)
            ) : (
              <span>Noch keine Beute</span>
            )}
          </div>
          {combat.status === 'defeat' || combat.status === 'victory' ? (
            <button onClick={() => startRun(combat.mode)}>
              <RotateCcw size={17} />
              Nochmal starten
            </button>
          ) : null}
        </div>
      </div>

      <div className="wave-track" aria-hidden="true">
        {Array.from({ length: MAX_WAVE }, (_, index) => (
          <span
            className={index + 1 < combat.wave ? 'cleared' : ''}
            key={index}
          />
        ))}
      </div>
    </section>
  );
}

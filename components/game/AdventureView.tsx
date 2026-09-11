import {
  Crosshair,
  FastForward,
  Hand,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  formatNumber,
  getModuleLevel,
  getWeaponDamage,
} from '@/lib/game/simulation';
import type { GameState, ResourceBag } from '@/lib/game/types';
import enemySheetImage from './assets/rocketminer-enemy-sheet-desert.png';
import rocketImage from './assets/rocketminer-starter-rocket-desert.png';

type Mode = 'manual' | 'auto';
type RunStatus = 'idle' | 'running' | 'victory' | 'defeat';

type Enemy = {
  id: number;
  variant: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shotTimer: number;
};

type Shot = {
  id: number;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  enemyId?: number;
  damage: number;
};

type Explosion = {
  id: number;
  x: number;
  y: number;
  timer: number;
};

type CombatState = {
  mode: Mode;
  status: RunStatus;
  wave: number;
  enemies: Enemy[];
  shots: Shot[];
  explosions: Explosion[];
  playerHp: number;
  playerMaxHp: number;
  cooldown: number;
  message: string;
  log: string[];
  nextId: number;
};

const MAX_WAVE = 20;
const PLAYER_POS = { x: 12, y: 54 };

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

const getEnemyStats = (wave: number) => ({
  hp: Math.round(48 + Math.pow(wave, 1.45) * 28),
  damage: Math.round(9 + wave * 5.8),
  cadence: Math.max(0.85, 2.15 - wave * 0.04),
});

const getPlayerMaxHp = (state: GameState) =>
  84 + getModuleLevel(state, 'energyCore') * 18 + getModuleLevel(state, 'cargo') * 7;

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

const createEnemies = (wave: number, startId: number) => {
  const stats = getEnemyStats(wave);
  const count = Math.min(3, 1 + Math.floor((wave - 1) / 2));

  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    variant: (wave + index) % 3,
    x: 66 + index * 10,
    y: 30 + index * 17,
    vx: -1.4 - wave * 0.05 - index * 0.18,
    vy: index % 2 === 0 ? 1.1 + wave * 0.02 : -1.2 - wave * 0.02,
    hp: stats.hp + index * 18,
    maxHp: stats.hp + index * 18,
    shotTimer: stats.cadence + index * 0.48,
  }));
};

const createCombat = (state: GameState, mode: Mode): CombatState => ({
  mode,
  status: 'running',
  wave: 1,
  enemies: createEnemies(1, 1),
  shots: [],
  explosions: [],
  playerHp: getPlayerMaxHp(state),
  playerMaxHp: getPlayerMaxHp(state),
  cooldown: 0,
  message: 'Welle 1 gestartet',
  log: [],
  nextId: 10,
});

const createIdleCombat = (state: GameState): CombatState => ({
  mode: 'manual',
  status: 'idle',
  wave: 1,
  enemies: [],
  shots: [],
  explosions: [],
  playerHp: getPlayerMaxHp(state),
  playerMaxHp: getPlayerMaxHp(state),
  cooldown: 0,
  message: 'Bereit fuer den ersten Einsatz',
  log: [],
  nextId: 1,
});

export function AdventureView({
  state,
  onClaimReward,
}: {
  state: GameState;
  onClaimReward: (reward: Partial<ResourceBag>) => void;
}) {
  const [combat, setCombat] = useState<CombatState>(() => createIdleCombat(state));
  const playerDamage = useMemo(() => getWeaponDamage(state), [state]);
  const weaponLevel = getModuleLevel(state, 'weapon');
  const laserLevel = getModuleLevel(state, 'laser');

  const startRun = (mode: Mode) => setCombat(createCombat(state, mode));

  const finishWave = (current: CombatState): CombatState => {
    const reward = getWaveReward(current.wave);
    onClaimReward(reward);

    if (current.wave >= MAX_WAVE) {
      return {
        ...current,
        status: 'victory',
        message: 'Alle 20 Wellen geschafft',
        log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      };
    }

    const nextWave = current.wave + 1;
    const enemies = createEnemies(nextWave, current.nextId);

    return {
      ...current,
      wave: nextWave,
      enemies,
      shots: [],
      cooldown: 0.45,
      message: `Welle ${nextWave} rueckt an`,
      log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      nextId: current.nextId + enemies.length,
    };
  };

  const fireAtEnemy = (enemyId?: number) => {
    setCombat((current) => {
      if (current.status !== 'running' || current.cooldown > 0) return current;
      const sorted = [...current.enemies].sort((a, b) => a.hp - b.hp);
      const target = current.enemies.find((enemy) => enemy.id === enemyId) ?? sorted[0];
      if (!target) return current;

      return {
        ...current,
        shots: [
          ...current.shots,
          {
            id: current.nextId,
            owner: 'player',
            x: PLAYER_POS.x,
            y: PLAYER_POS.y,
            targetX: target.x,
            targetY: target.y,
            enemyId: target.id,
            damage: playerDamage,
          },
        ],
        cooldown: current.mode === 'auto' ? 0.72 : 0.38,
        message: 'Schuss abgefeuert',
        nextId: current.nextId + 1,
      };
    });
  };

  useEffect(() => {
    if (combat.status !== 'running') return undefined;

    const timer = window.setInterval(() => {
      setCombat((current) => {
        if (current.status !== 'running') return current;

        let nextId = current.nextId;
        let message = current.message;
        const explosions = current.explosions
          .map((explosion) => ({ ...explosion, timer: explosion.timer - 0.1 }))
          .filter((explosion) => explosion.timer > 0);
        const stats = getEnemyStats(current.wave);

        const enemies = current.enemies.map((enemy) => {
          let x = enemy.x + enemy.vx * 0.1;
          let y = enemy.y + enemy.vy * 0.1;
          let vx = enemy.vx;
          let vy = enemy.vy;

          if (x < 48 || x > 88) vx *= -1;
          if (y < 18 || y > 78) vy *= -1;

          return {
            ...enemy,
            x: Math.max(48, Math.min(88, x)),
            y: Math.max(18, Math.min(78, y)),
            vx,
            vy,
            shotTimer: enemy.shotTimer - 0.1,
          };
        });

        const spawnedShots: Shot[] = [];
        const armedEnemies = enemies.map((enemy) => {
          if (enemy.shotTimer > 0) return enemy;
          spawnedShots.push({
            id: nextId,
            owner: 'enemy',
            x: enemy.x,
            y: enemy.y,
            targetX: PLAYER_POS.x,
            targetY: PLAYER_POS.y,
            damage: stats.damage,
          });
          nextId += 1;
          return { ...enemy, shotTimer: stats.cadence };
        });

        const cooldown = Math.max(0, current.cooldown - 0.1);
        if (current.mode === 'auto' && cooldown <= 0 && armedEnemies.length) {
          const target = [...armedEnemies].sort((a, b) => a.hp - b.hp)[0];
          spawnedShots.push({
            id: nextId,
            owner: 'player',
            x: PLAYER_POS.x,
            y: PLAYER_POS.y,
            targetX: target.x,
            targetY: target.y,
            enemyId: target.id,
            damage: playerDamage,
          });
          nextId += 1;
          message = 'Auto-Feuer abgefeuert';
        }

        let playerHp = current.playerHp;
        let remainingEnemies = armedEnemies;
        const movingShots: Shot[] = [];

        [...current.shots, ...spawnedShots].forEach((shot) => {
          const dx = shot.targetX - shot.x;
          const dy = shot.targetY - shot.y;
          const distance = Math.hypot(dx, dy);
          const speed = shot.owner === 'player' ? 12 : 9;

          if (distance > speed) {
            movingShots.push({
              ...shot,
              x: shot.x + (dx / distance) * speed,
              y: shot.y + (dy / distance) * speed,
            });
            return;
          }

          if (shot.owner === 'enemy') {
            playerHp = Math.max(0, playerHp - shot.damage);
            message = `Rakete getroffen: ${formatNumber(shot.damage)} Schaden`;
            return;
          }

          remainingEnemies = remainingEnemies.flatMap((enemy) => {
            if (enemy.id !== shot.enemyId) return [enemy];
            const hp = enemy.hp - shot.damage;
            if (hp > 0) return [{ ...enemy, hp }];
            explosions.push({ id: nextId, x: enemy.x, y: enemy.y, timer: 0.58 });
            nextId += 1;
            message = 'Gegner zerstoert';
            return [];
          });
        });

        if (playerHp <= 0) {
          return {
            ...current,
            status: 'defeat',
            playerHp: 0,
            enemies: remainingEnemies,
            shots: movingShots,
            explosions,
            message: `Rakete in Welle ${current.wave} verloren`,
            nextId,
          };
        }

        const updated: CombatState = {
          ...current,
          enemies: remainingEnemies,
          shots: movingShots,
          explosions,
          playerHp,
          cooldown,
          message,
          nextId,
        };

        if (!remainingEnemies.length) return finishWave(updated);
        return updated;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [combat.status, onClaimReward, playerDamage]);

  const playerPercent = (combat.playerHp / combat.playerMaxHp) * 100;

  return (
    <section
      className="adventure-view"
      aria-label="Abenteuer"
      style={
        {
          '--enemy-sheet-image': `url(${getAssetUrl(enemySheetImage)})`,
          '--rocket-image': `url(${getAssetUrl(rocketImage)})`,
        } as CSSProperties
      }
    >
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
          <span
            className="player-ship-marker"
            style={{ left: `${PLAYER_POS.x}%`, top: `${PLAYER_POS.y}%` }}
          />
          {combat.enemies.map((enemy) => (
            <button
              className={`enemy-fighter variant-${enemy.variant}`}
              key={enemy.id}
              onClick={() => fireAtEnemy(enemy.id)}
              style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              title={`Gegner ${formatNumber(enemy.hp)} / ${formatNumber(enemy.maxHp)}`}
            >
              <span className="enemy-sprite" />
              <Progress
                className="game-progress enemy-mini-progress"
                value={(enemy.hp / enemy.maxHp) * 100}
              />
            </button>
          ))}
          {combat.shots.map((shot) => (
            <span
              className={`combat-shot ${shot.owner}`}
              key={shot.id}
              style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
            />
          ))}
          {combat.explosions.map((explosion) => (
            <span
              className="combat-explosion"
              key={explosion.id}
              style={{ left: `${explosion.x}%`, top: `${explosion.y}%` }}
            />
          ))}
          <p>{combat.message}</p>
          <button
            className="fire-button"
            disabled={combat.status !== 'running' || combat.cooldown > 0}
            onClick={() => fireAtEnemy()}
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

import {
  FastForward,
  Hand,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  formatNumber,
  getModuleLevel,
  getRocketSpeed,
  getShieldStrength,
  getWeaponDamage,
} from '@/lib/game/simulation';
import type { GameState, ResourceBag } from '@/lib/game/types';
import enemySheetImage from './assets/rocketminer-enemy-sheet-desert.png';
import rocketImage from './assets/rocketminer-starter-rocket-desert.png';

type Mode = 'manual' | 'auto';
type RunStatus = 'idle' | 'running' | 'victory' | 'defeat';
type WeaponAchievement = NonNullable<GameState['weaponAchievement']>;

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
  playerX: number;
  playerY: number;
  playerAngle: number;
  playerVx: number;
  playerVy: number;
  playerHp: number;
  playerMaxHp: number;
  fireTimer: number;
  message: string;
  log: string[];
  nextId: number;
};

const MAX_WAVE = 20;
const PLAYER_START = { x: 30, y: 54 };
const TICK_SECONDS = 0.05;
const ADVENTURE_SPEED_SCALE = 3.9;
const ENEMY_HIT_RADIUS = 4.4;

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

const getEnemyStats = (wave: number) => ({
  hp: Math.round(42 + Math.pow(wave, 1.34) * 24),
  damage: Math.round(8 + wave * 4.8),
  cadence: Math.max(0.9, 2.3 - wave * 0.045),
});

const getFireCooldown = (
  weaponLevel: number,
  achievement?: WeaponAchievement,
) => {
  const base = Math.max(0.34, 1.15 - weaponLevel * 0.035);
  return achievement === 'rapidFire' ? base * 0.68 : base;
};

const getPlayerMaxHp = (state: GameState) =>
  84 +
  getModuleLevel(state, 'energyCore') * 18 +
  getModuleLevel(state, 'cargo') * 7 +
  getShieldStrength(state);

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
  const count = Math.min(12, 3 + Math.floor(wave * 0.75));

  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    variant: (wave + index) % 3,
    x: 18 + ((startId + index * 19) % 72),
    y: 18 + ((startId * 7 + index * 23) % 62),
    vx: index % 2 === 0 ? 5.2 + wave * 0.22 : -5.8 - wave * 0.2,
    vy: index % 3 === 0 ? 4.4 + wave * 0.16 : -4.2 - wave * 0.14,
    hp: stats.hp + index * 10,
    maxHp: stats.hp + index * 10,
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
  playerX: PLAYER_START.x,
  playerY: PLAYER_START.y,
  playerAngle: 90,
  playerVx: 0,
  playerVy: 4.8,
  playerHp: getPlayerMaxHp(state),
  playerMaxHp: getPlayerMaxHp(state),
  fireTimer: 0.35,
  message: 'Welle 1 gestartet - steuere mit WASD oder Pfeiltasten',
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
  playerX: PLAYER_START.x,
  playerY: PLAYER_START.y,
  playerAngle: 90,
  playerVx: 0,
  playerVy: 4.8,
  playerHp: getPlayerMaxHp(state),
  playerMaxHp: getPlayerMaxHp(state),
  fireTimer: 0,
  message: 'Bereit fuer den ersten Einsatz',
  log: [],
  nextId: 1,
});

const getAimTarget = (enemies: Enemy[], x: number, y: number) =>
  [...enemies].sort(
    (a, b) =>
      Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
  )[0];

const createPlayerShots = (
  current: CombatState,
  target: Enemy,
  damage: number,
  startId: number,
  achievement?: WeaponAchievement,
): Shot[] => {
  const twin = achievement === 'twinShot';
  const offsets = twin ? [-2.2, 2.2] : [0];
  return offsets.map((offset, index) => ({
    id: startId + index,
    owner: 'player' as const,
    x: current.playerX,
    y: current.playerY + offset,
    targetX: target.x,
    targetY: target.y,
    enemyId: target.id,
    damage,
  }));
};

export function AdventureView({
  state,
  onClaimReward,
  onChooseWeaponAchievement,
}: {
  state: GameState;
  onClaimReward: (reward: Partial<ResourceBag>) => void;
  onChooseWeaponAchievement: (achievement: WeaponAchievement) => void;
}) {
  const [combat, setCombat] = useState<CombatState>(() => createIdleCombat(state));
  const keys = useRef(new Set<string>());
  const playerDamage = useMemo(() => getWeaponDamage(state), [state]);
  const shieldStrength = getShieldStrength(state);
  const engineLevel = getModuleLevel(state, 'engine');
  const weaponLevel = getModuleLevel(state, 'weapon');
  const laserLevel = getModuleLevel(state, 'laser');
  const shieldLevel = getModuleLevel(state, 'shield');
  const playerSpeed = getRocketSpeed(state) * ADVENTURE_SPEED_SCALE;
  const fireCooldown = getFireCooldown(weaponLevel, state.weaponAchievement);

  const startRun = (mode: Mode) => setCombat(createCombat(state, mode));

  useEffect(() => {
    const normalize = (key: string) => key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = normalize(event.key);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(normalize(event.key));
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

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
      fireTimer: 0.55,
      message: `Welle ${nextWave} rueckt an`,
      log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      nextId: current.nextId + enemies.length,
    };
  };

  useEffect(() => {
    if (combat.status !== 'running') return undefined;

    const timer = window.setInterval(() => {
      setCombat((current) => {
        if (current.status !== 'running') return current;

        let nextId = current.nextId;
        let message = current.message;
        const explosions = current.explosions
          .map((explosion) => ({
            ...explosion,
            timer: explosion.timer - TICK_SECONDS,
          }))
          .filter((explosion) => explosion.timer > 0);
        const stats = getEnemyStats(current.wave);
        const inputX =
          (keys.current.has('d') || keys.current.has('arrowright') ? 1 : 0) -
          (keys.current.has('a') || keys.current.has('arrowleft') ? 1 : 0);
        const inputY =
          (keys.current.has('s') || keys.current.has('arrowdown') ? 1 : 0) -
          (keys.current.has('w') || keys.current.has('arrowup') ? 1 : 0);
        const inputLength = Math.hypot(inputX, inputY) || 1;

        const enemies = current.enemies.map((enemy) => {
          const chaseX = current.playerX - enemy.x;
          const chaseY = current.playerY - enemy.y;
          const chaseDistance = Math.hypot(chaseX, chaseY) || 1;
          let x =
            enemy.x +
            (enemy.vx * 0.38 + (chaseX / chaseDistance) * (5.2 + current.wave * 0.5)) *
              TICK_SECONDS;
          let y =
            enemy.y +
            (enemy.vy * 0.38 + (chaseY / chaseDistance) * (5.2 + current.wave * 0.5)) *
              TICK_SECONDS;
          let vx = enemy.vx;
          let vy = enemy.vy;

          if (x < 7 || x > 93) vx *= -1;
          if (y < 14 || y > 84) vy *= -1;

          return {
            ...enemy,
            x: Math.max(7, Math.min(93, x)),
            y: Math.max(14, Math.min(84, y)),
            vx,
            vy,
            shotTimer: enemy.shotTimer - TICK_SECONDS,
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
            targetX: current.playerX,
            targetY: current.playerY,
            damage: stats.damage,
          });
          nextId += 1;
          return { ...enemy, shotTimer: stats.cadence };
        });

        let fireTimer = Math.max(0, current.fireTimer - TICK_SECONDS);
        if (fireTimer <= 0 && armedEnemies.length) {
          const target = getAimTarget(armedEnemies, current.playerX, current.playerY);
          const shots = createPlayerShots(
            current,
            target,
            playerDamage,
            nextId,
            state.weaponAchievement,
          );
          spawnedShots.push(...shots);
          nextId += shots.length;
          fireTimer = fireCooldown;
          message =
            state.weaponAchievement === 'twinShot'
              ? 'Doppelschuss erfasst Ziel'
              : 'Auto-Feuer erfasst Ziel';
        }

        const playerVx = (inputX / inputLength) * playerSpeed;
        const playerVy = (inputY / inputLength) * playerSpeed;
        const playerX = Math.max(
          8,
          Math.min(92, current.playerX + playerVx * TICK_SECONDS),
        );
        const playerY = Math.max(
          18,
          Math.min(82, current.playerY + playerVy * TICK_SECONDS),
        );
        const playerAngle =
          inputX || inputY
            ? Math.atan2(inputY, inputX) * (180 / Math.PI) + 90
            : current.playerAngle;
        let playerHp = current.playerHp;
        let remainingEnemies = armedEnemies;
        const movingShots: Shot[] = [];

        [...current.shots, ...spawnedShots].forEach((shot) => {
          const dx = shot.targetX - shot.x;
          const dy = shot.targetY - shot.y;
          const distance = Math.hypot(dx, dy);
          const speed = (shot.owner === 'player' ? 136 : 96) * TICK_SECONDS;

          if (distance > speed) {
            movingShots.push({
              ...shot,
              x: shot.x + (dx / distance) * speed,
              y: shot.y + (dy / distance) * speed,
            });
            return;
          }

          if (shot.owner === 'enemy') {
            const impactDistance = Math.hypot(
              playerX - shot.targetX,
              playerY - shot.targetY,
            );
            if (impactDistance > ENEMY_HIT_RADIUS) {
              message = 'Gegnerschuss ausgewichen';
              return;
            }

            const blocked = Math.min(shieldStrength, shot.damage - 1);
            const damage = Math.max(1, shot.damage - blocked);
            playerHp = Math.max(0, playerHp - damage);
            message = `Schild blockt ${formatNumber(blocked)} · Schaden ${formatNumber(damage)}`;
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
            playerX,
            playerY,
            playerAngle,
            playerVx,
            playerVy,
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
          playerX,
          playerY,
          playerAngle,
          playerVx,
          playerVy,
          playerHp,
          fireTimer,
          message,
          nextId,
        };

        if (!remainingEnemies.length) return finishWave(updated);
        return updated;
      });
    }, TICK_SECONDS * 1000);

    return () => window.clearInterval(timer);
  }, [
    combat.status,
    fireCooldown,
    onClaimReward,
    playerDamage,
    playerSpeed,
    shieldStrength,
    state.weaponAchievement,
  ]);

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
          <p>Steuere mit WASD oder Pfeiltasten. Die Rakete feuert automatisch.</p>
        </div>
        <div className="adventure-actions">
          <button onClick={() => startRun('manual')}>
            <Hand size={17} />
            Start Manuell
          </button>
          <button onClick={() => startRun('auto')}>
            <FastForward size={17} />
            Start Auto
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
            Triebwerk {engineLevel} · Waffenmodul {weaponLevel} · Schildmodul{' '}
            {shieldLevel} · Laser {laserLevel} · Schaden {formatNumber(playerDamage)}
          </small>
          {weaponLevel >= 15 && !state.weaponAchievement ? (
            <small>Waffen-Erfolg bereit: Schussrate oder Doppelschuss waehlen.</small>
          ) : null}
          {state.weaponAchievement ? (
            <small>
              Spezialisierung:{' '}
              {state.weaponAchievement === 'rapidFire'
                ? 'Schnellfeuer'
                : 'Doppelschuss'}
            </small>
          ) : null}
        </div>

        <div className="wave-field">
          <span className="wave-count">
            Welle {combat.status === 'idle' ? 0 : combat.wave} / {MAX_WAVE}
          </span>
          <span
            className="player-ship-marker"
            style={
              {
                '--player-angle': `${combat.playerAngle}deg`,
                left: `${combat.playerX}%`,
                top: `${combat.playerY}%`,
              } as CSSProperties
            }
          />
          {combat.enemies.map((enemy) => (
            <span
              aria-label={`Gegner ${formatNumber(enemy.hp)} von ${formatNumber(enemy.maxHp)}`}
              className={`enemy-fighter variant-${enemy.variant}`}
              key={enemy.id}
              style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              title={`Gegner ${formatNumber(enemy.hp)} / ${formatNumber(enemy.maxHp)}`}
            >
              <span className="enemy-sprite" />
              <Progress
                className="game-progress enemy-mini-progress"
                value={(enemy.hp / enemy.maxHp) * 100}
              />
            </span>
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
          <span className="fire-button">Auto-Feuer</span>
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
          {weaponLevel >= 15 && !state.weaponAchievement ? (
            <div className="achievement-picker">
              <button onClick={() => onChooseWeaponAchievement('rapidFire')}>
                Schnellfeuer
              </button>
              <button onClick={() => onChooseWeaponAchievement('twinShot')}>
                Doppelschuss
              </button>
            </div>
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

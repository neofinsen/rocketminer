import { createEnemies, createRunUpgrades } from './adventureRun';
import type { CombatState, Enemy, Mode, Shot } from './adventureTypes';

const PLAYER_START = { x: 30, y: 54 };

export const createCombat = (
  playerMaxHp: number,
  mode: Mode,
): CombatState => ({
  mode,
  status: 'running',
  wave: 1,
  enemies: createEnemies(1, 1),
  shots: [],
  explosions: [],
  xpOrbs: [],
  playerX: PLAYER_START.x,
  playerY: PLAYER_START.y,
  playerAngle: 90,
  playerVx: 0,
  playerVy: 4.8,
  playerHp: playerMaxHp,
  playerMaxHp,
  fireTimer: 0.35,
  pulseTimer: 8,
  runLevel: 1,
  runXp: 0,
  runXpTarget: 24,
  runUpgrades: createRunUpgrades(),
  runSkill: undefined,
  choices: [],
  message: 'Welle 1 gestartet - steuere mit WASD oder Pfeiltasten',
  log: [],
  nextId: 10,
});

export const createIdleCombat = (playerMaxHp: number): CombatState => ({
  mode: 'auto',
  status: 'idle',
  wave: 1,
  enemies: [],
  shots: [],
  explosions: [],
  xpOrbs: [],
  playerX: PLAYER_START.x,
  playerY: PLAYER_START.y,
  playerAngle: 90,
  playerVx: 0,
  playerVy: 4.8,
  playerHp: playerMaxHp,
  playerMaxHp,
  fireTimer: 0,
  pulseTimer: 8,
  runLevel: 1,
  runXp: 0,
  runXpTarget: 24,
  runUpgrades: createRunUpgrades(),
  runSkill: undefined,
  choices: [],
  message: 'Bereit fuer den ersten Einsatz',
  log: [],
  nextId: 1,
});

export const getAimTarget = (enemies: Enemy[], x: number, y: number) =>
  [...enemies].sort(
    (a, b) =>
      Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
  )[0];

export const createPlayerShots = (
  current: CombatState,
  target: Enemy,
  damage: number,
  startId: number,
  projectileCount: number,
): Shot[] => {
  const count = Math.max(1, Math.min(5, projectileCount));
  const center = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    owner: 'player' as const,
    x: current.playerX,
    y: current.playerY + (index - center) * 2.2,
    targetX: target.x,
    targetY: target.y,
    enemyId: target.id,
    damage,
  }));
};

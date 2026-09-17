import type {
  RunChoice,
  RunSkillKey,
  RunUpgrades,
} from './adventureRun';

export type Mode = 'auto';
export type RunStatus = 'idle' | 'running' | 'choosing' | 'victory' | 'defeat';

export type Enemy = {
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

export type Shot = {
  id: number;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  enemyId?: number;
  damage: number;
};

export type Explosion = {
  id: number;
  x: number;
  y: number;
  timer: number;
};

export type XpOrb = {
  id: number;
  x: number;
  y: number;
  amount: number;
};

export type CombatState = {
  mode: Mode;
  status: RunStatus;
  wave: number;
  enemies: Enemy[];
  shots: Shot[];
  explosions: Explosion[];
  xpOrbs: XpOrb[];
  playerX: number;
  playerY: number;
  playerAngle: number;
  playerVx: number;
  playerVy: number;
  playerHp: number;
  playerMaxHp: number;
  fireTimer: number;
  pulseTimer: number;
  runLevel: number;
  runXp: number;
  runXpTarget: number;
  runUpgrades: RunUpgrades;
  runSkill?: RunSkillKey;
  choices: RunChoice[];
  message: string;
  log: string[];
  nextId: number;
};

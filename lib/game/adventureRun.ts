import { RESOURCE_LABELS } from './constants';
import { formatNumber, getModuleLevel, getRocketSpeed } from './simulation';
import type { Enemy } from './adventureTypes';
import type { GameState, ResourceBag } from './types';

export const ADVENTURE_MAX_WAVE = 30;
export const MAX_RUN_PROJECTILES = 5;
export const MAX_RUN_RAPID_FIRE = 5;

export type RunUpgradeKey = 'rapidFire' | 'multiShot' | 'plating' | 'thrusters';
export type RunSkillKey = 'novaPulse' | 'droneWing' | 'overdrive';

export type RunUpgrades = Record<RunUpgradeKey, number>;

export type RunChoice = {
  key: RunUpgradeKey | RunSkillKey;
  title: string;
  description: string;
  kind: 'upgrade' | 'skill';
};

export const createRunUpgrades = (): RunUpgrades => ({
  rapidFire: 0,
  multiShot: 0,
  plating: 0,
  thrusters: 0,
});

export const getRunUpgradeChoices = (
  baseProjectileCount: number,
  upgrades: RunUpgrades,
): RunChoice[] => [
  {
    key: 'rapidFire',
    title: 'Schnellfeuer',
    description: '+12% Schussrate fuer diesen Run.',
    kind: 'upgrade',
  },
  {
    key: 'multiShot',
    title: 'Doppelschuss',
    description: '+1 Projektil, maximal 5 Geschosse.',
    kind: 'upgrade',
  },
  {
    key: 'plating',
    title: 'Notpanzerung',
    description: '+35 Huelle und sofortige Reparatur.',
    kind: 'upgrade',
  },
  {
    key: 'thrusters',
    title: 'Schubduesen',
    description: '+10% Bewegungstempo fuer diesen Run.',
    kind: 'upgrade',
  },
].filter((choice) => {
  if (choice.key === 'multiShot') {
    return baseProjectileCount + upgrades.multiShot < MAX_RUN_PROJECTILES;
  }
  if (choice.key === 'rapidFire') return upgrades.rapidFire < MAX_RUN_RAPID_FIRE;
  return true;
});

export const getRunSkillChoices = (): RunChoice[] => [
  {
    key: 'novaPulse',
    title: 'Nova-Puls',
    description: 'Alle 8 Sekunden Schaden im Nahbereich.',
    kind: 'skill',
  },
  {
    key: 'droneWing',
    title: 'Begleitdrohne',
    description: 'Feuert mit jedem Angriff einen Extra-Schuss.',
    kind: 'skill',
  },
  {
    key: 'overdrive',
    title: 'Ueberladung',
    description: '+25% Schussrate und +12% Tempo.',
    kind: 'skill',
  },
];

export const getRunChoicesForLevel = (
  level: number,
  baseProjectileCount: number,
  upgrades: RunUpgrades,
) =>
  level % 10 === 0
    ? getRunSkillChoices()
    : getRunUpgradeChoices(baseProjectileCount, upgrades);

export const getRunXpTarget = (level: number) =>
  Math.round(22 + level * 10 + Math.pow(level, 1.28) * 5);

export const getEnemyXpDrop = (wave: number) =>
  7 + Math.floor(wave * 1.35);

export const getEnemyStats = (wave: number) => ({
  hp: Math.round(42 + Math.pow(wave, 1.34) * 24),
  damage: Math.round(8 + wave * 4.8),
  cadence: Math.max(0.9, 2.3 - wave * 0.045),
});

const getAlienDrop = (wave: number) => {
  if (wave < 4) return 0;
  const chance = Math.min(0.22, 0.06 + wave * 0.007);
  if (Math.random() > chance) return 0;
  return 1 + (wave >= 14 && Math.random() < 0.18 ? 1 : 0);
};

export const getWaveReward = (wave: number): Partial<ResourceBag> => ({
  credits: 80 + wave * 28,
  titan: 10 + wave * 4,
  deuterium: wave >= 4 ? 2 + Math.floor(wave / 4) : 0,
  silicon: wave >= 3 ? 5 + wave * 2 : 0,
  alien: getAlienDrop(wave),
});

export const rewardText = (reward: Partial<ResourceBag>) =>
  Object.entries(reward)
    .filter(([, value]) => (value ?? 0) > 0)
    .map(
      ([key, value]) =>
        `${RESOURCE_LABELS[key as keyof ResourceBag]} +${formatNumber(value ?? 0)}`,
    )
    .join(', ');

export const createEnemies = (wave: number, startId: number): Enemy[] => {
  const stats = getEnemyStats(wave);
  const count = Math.min(18, 3 + Math.floor(wave * 0.75));

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

export const getRunProjectileCount = (
  baseProjectileCount: number,
  upgrades: RunUpgrades,
) => Math.min(5, baseProjectileCount + upgrades.multiShot);

export const getRunFireCooldown = (
  baseCooldown: number,
  upgrades: RunUpgrades,
  skill?: RunSkillKey,
) => {
  const upgradeBoost = Math.min(0.48, upgrades.rapidFire * 0.12);
  const skillBoost = skill === 'overdrive' ? 0.25 : 0;
  return Math.max(0.18, baseCooldown * (1 - upgradeBoost - skillBoost));
};

export const getRunPlayerDamage = (
  baseDamage: number,
  upgrades: RunUpgrades,
) => Math.round(baseDamage * (1 + upgrades.rapidFire * 0.03));

export const getRunPlayerSpeed = (
  state: GameState,
  speedScale: number,
  upgrades: RunUpgrades,
  skill?: RunSkillKey,
) => {
  const boost = 1 + upgrades.thrusters * 0.1 + (skill === 'overdrive' ? 0.12 : 0);
  return getRocketSpeed(state) * speedScale * boost;
};

export const getRunPlayerMaxHp = (
  baseHp: number,
  upgrades: RunUpgrades,
) => baseHp + upgrades.plating * 35;

export const getBaseRunSummary = (state: GameState) =>
  `Triebwerk ${getModuleLevel(state, 'engine')} · Waffenmodul ${getModuleLevel(
    state,
    'weapon',
  )} · Schildmodul ${getModuleLevel(state, 'shield')}`;

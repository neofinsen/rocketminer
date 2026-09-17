export type ResourceKey =
  | 'credits'
  | 'metal'
  | 'energy'
  | 'deuterium'
  | 'titan'
  | 'silicon'
  | 'alien';

export type ViewKey = 'space' | 'city' | 'research' | 'adventure';

export type SectorKey = 'alpha' | 'beta';

export type RocketKey =
  | 'starter'
  | 'desert'
  | 'ice'
  | 'neon'
  | 'alien'
  | 'volcanic'
  | 'relic'
  | 'military'
  | 'crystal'
  | 'stealth'
  | 'colony';

export type ResourceBag = Record<ResourceKey, number>;

export type ModuleKey =
  | 'engine'
  | 'collector'
  | 'cargo'
  | 'laser'
  | 'energyCore'
  | 'idle'
  | 'weapon'
  | 'shield';

export type BuildingKey =
  | 'townhall'
  | 'quarry'
  | 'forge'
  | 'research'
  | 'spaceport'
  | 'power'
  | 'warehouse';

export type TechKey =
  | 'asteroidSurvey'
  | 'automatedDrills'
  | 'plasmaCutters'
  | 'cargoDrones'
  | 'deepStorage'
  | 'fusionCells'
  | 'antimatterCore'
  | 'gravNavigation'
  | 'warpTheory'
  | 'stationFrame'
  | 'orbitalAssembly'
  | 'galaxyGate';

export interface RocketModule {
  key: ModuleKey;
  name: string;
  level: number;
  icon: string;
}

export interface Building {
  key: BuildingKey;
  name: string;
  level: number;
  icon: string;
  production: Partial<ResourceBag>;
}

export type CityPlacements = Partial<Record<BuildingKey, string>>;

export interface RocketState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  status: 'collecting' | 'returning' | 'unloading' | 'refueling';
  fuel: number;
  fuelMax: number;
  refuelTimer: number;
  refuelDuration: number;
  returnTimer: number;
  returnDuration: number;
  grabbedFragmentId?: number;
  grabTimer: number;
  grabDuration: number;
  idleMode: boolean;
  idleLaserTimer: number;
  cargo: Partial<ResourceBag>;
}

export interface Asteroid {
  id: number;
  type: 'iron' | 'titan' | 'deuterium' | 'silicon' | 'alien';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  resource: ResourceKey;
}

export interface Fragment {
  id: number;
  x: number;
  y: number;
  originX?: number;
  originY?: number;
  resource: ResourceKey;
  amount: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  asteroidId: number;
  damage: number;
}

export interface DamageText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface Quest {
  title: string;
  hint: string;
  goal: 'destroy' | 'module' | 'building' | 'collect' | 'sector';
  targetKey?: string;
  current: number;
  target: number;
  reward: Partial<ResourceBag>;
  done: boolean;
}

export type WeaponUpgradeChoice = 'rapidFire' | 'multiShot';

export interface WeaponUpgrades {
  rapidFire: number;
  multiShot: number;
  claimedLevels: number[];
}

export interface RunRecord {
  wave: number;
  runLevel: number;
  rocket: RocketKey;
  at: number;
  status: 'active' | 'finished';
}

export interface GameState {
  view: ViewKey;
  level: number;
  selectedRocket: RocketKey;
  unlockedRockets: RocketKey[];
  bestRun?: RunRecord;
  currentRun?: RunRecord;
  tutorialActive: boolean;
  questIndex: number;
  resources: ResourceBag;
  currentSector: SectorKey;
  unlockedSectors: SectorKey[];
  collectedTotals: Partial<ResourceBag>;
  destroyedAsteroids: number;
  research: Record<TechKey, boolean>;
  modules: RocketModule[];
  buildings: Building[];
  cityPlacements: CityPlacements;
  rocket: RocketState;
  asteroids: Asteroid[];
  fragments: Fragment[];
  projectiles: Projectile[];
  damageTexts: DamageText[];
  quest: Quest;
  sectorProgress: number;
  newRocketBuilt: boolean;
  weaponUpgrades: WeaponUpgrades;
  weaponAchievement?: 'rapidFire' | 'twinShot';
  nextId: number;
}

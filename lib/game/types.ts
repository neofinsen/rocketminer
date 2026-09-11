export type ResourceKey =
  | 'credits'
  | 'wood'
  | 'metal'
  | 'energy'
  | 'crystal'
  | 'titan'
  | 'silicon'
  | 'alien';

export type ViewKey = 'space' | 'city' | 'research' | 'adventure';

export type SectorKey = 'alpha' | 'beta';

export type ResourceBag = Record<ResourceKey, number>;

export type ModuleKey =
  | 'engine'
  | 'collector'
  | 'cargo'
  | 'laser'
  | 'energyCore'
  | 'weapon'
  | 'shield';

export type BuildingKey =
  | 'townhall'
  | 'sawmill'
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
  cargo: Partial<ResourceBag>;
}

export interface Asteroid {
  id: number;
  type: 'iron' | 'titan' | 'crystal' | 'silicon' | 'alien';
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

export interface GameState {
  view: ViewKey;
  level: number;
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
  weaponAchievement?: 'rapidFire' | 'twinShot';
  nextId: number;
}

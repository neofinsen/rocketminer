export type ResourceKey =
  | 'credits'
  | 'wood'
  | 'metal'
  | 'energy'
  | 'crystal'
  | 'titan'
  | 'silicon'
  | 'alien';

export type ViewKey = 'space' | 'city' | 'research' | 'rocket';

export type ResourceBag = Record<ResourceKey, number>;

export type ModuleKey =
  | 'engine'
  | 'collector'
  | 'cargo'
  | 'laser'
  | 'energyCore';

export type BuildingKey =
  | 'townhall'
  | 'sawmill'
  | 'quarry'
  | 'forge'
  | 'research'
  | 'spaceport'
  | 'power'
  | 'warehouse';

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

export interface RocketState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  cargo: Partial<ResourceBag>;
}

export interface Asteroid {
  id: number;
  type: 'iron' | 'titan' | 'crystal';
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
  resource: ResourceKey;
  amount: number;
}

export interface DamageText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface Quest {
  title: string;
  current: number;
  target: number;
  reward: Partial<ResourceBag>;
  done: boolean;
}

export interface GameState {
  view: ViewKey;
  level: number;
  resources: ResourceBag;
  modules: RocketModule[];
  buildings: Building[];
  rocket: RocketState;
  asteroids: Asteroid[];
  fragments: Fragment[];
  damageTexts: DamageText[];
  quest: Quest;
  sectorProgress: number;
  nextId: number;
}

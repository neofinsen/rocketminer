import type { Building, GameState, ResourceBag, RocketModule } from './types';

export const RESOURCE_LABELS: Record<keyof ResourceBag, string> = {
  credits: 'Credits',
  wood: 'Holz',
  metal: 'Metall',
  energy: 'Energie',
  crystal: 'Kristall',
  titan: 'Titan',
  silicon: 'Silizium',
  alien: 'Alien-Partikel',
};

export const RESOURCE_ICONS: Record<keyof ResourceBag, string> = {
  credits: 'C',
  wood: 'H',
  metal: 'M',
  energy: 'E',
  crystal: 'K',
  titan: 'T',
  silicon: 'S',
  alien: 'A',
};

export const ZERO_RESOURCES: ResourceBag = {
  credits: 0,
  wood: 0,
  metal: 0,
  energy: 0,
  crystal: 0,
  titan: 0,
  silicon: 0,
  alien: 0,
};

export const INITIAL_MODULES: RocketModule[] = [
  { key: 'engine', name: 'Triebwerk', level: 1, icon: 'engine' },
  { key: 'collector', name: 'Sammelmodul', level: 1, icon: 'collector' },
  { key: 'cargo', name: 'Frachtraum', level: 1, icon: 'cargo' },
  { key: 'laser', name: 'Bergbau-Laser', level: 1, icon: 'laser' },
  { key: 'energyCore', name: 'Energiemodul', level: 1, icon: 'energy' },
];

export const INITIAL_BUILDINGS: Building[] = [
  {
    key: 'townhall',
    name: 'Rathaus',
    level: 4,
    icon: 'capitol',
    production: { credits: 18 },
  },
  {
    key: 'sawmill',
    name: 'Saegewerk',
    level: 3,
    icon: 'wood',
    production: { wood: 12 },
  },
  {
    key: 'quarry',
    name: 'Steinbruch',
    level: 3,
    icon: 'stone',
    production: { metal: 8 },
  },
  {
    key: 'forge',
    name: 'Schmiede',
    level: 2,
    icon: 'forge',
    production: { metal: 6, credits: 4 },
  },
  {
    key: 'research',
    name: 'Forschungszentrum',
    level: 1,
    icon: 'dome',
    production: { crystal: 0.4 },
  },
  {
    key: 'spaceport',
    name: 'Raumfahrtzentrum',
    level: 2,
    icon: 'rocket',
    production: { energy: 4 },
  },
  {
    key: 'power',
    name: 'Energieanlage',
    level: 3,
    icon: 'power',
    production: { energy: 14 },
  },
  {
    key: 'warehouse',
    name: 'Lager',
    level: 3,
    icon: 'warehouse',
    production: { credits: 3 },
  },
];

export const INITIAL_STATE: GameState = {
  view: 'space',
  level: 7,
  resources: {
    credits: 12500,
    wood: 8750,
    metal: 6300,
    energy: 2150,
    crystal: 1280,
    titan: 420,
    silicon: 180,
    alien: 45,
  },
  modules: INITIAL_MODULES,
  buildings: INITIAL_BUILDINGS,
  rocket: { x: 33, y: 56, targetX: 54, targetY: 45, cargo: {} },
  asteroids: [
    {
      id: 1,
      type: 'iron',
      x: 72,
      y: 31,
      hp: 1800,
      maxHp: 1800,
      resource: 'metal',
    },
    {
      id: 2,
      type: 'titan',
      x: 84,
      y: 57,
      hp: 2400,
      maxHp: 2400,
      resource: 'titan',
    },
    {
      id: 3,
      type: 'crystal',
      x: 52,
      y: 74,
      hp: 1500,
      maxHp: 1500,
      resource: 'crystal',
    },
  ],
  fragments: [
    { id: 4, x: 44, y: 51, resource: 'crystal', amount: 28 },
    { id: 5, x: 48, y: 49, resource: 'titan', amount: 35 },
    { id: 6, x: 58, y: 58, resource: 'silicon', amount: 26 },
  ],
  damageTexts: [],
  quest: {
    title: 'Zerstoere 3 grosse Asteroiden',
    current: 0,
    target: 3,
    reward: { crystal: 80, credits: 1200 },
    done: false,
  },
  sectorProgress: 42,
  nextId: 7,
};

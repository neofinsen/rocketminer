import type { GameState, ResourceBag, TechKey } from './types';

export type TechNode = {
  key: TechKey;
  name: string;
  branch: 'Rakete';
  description: string;
  effect: string;
  cost: Partial<ResourceBag>;
  prerequisites: TechKey[];
  x: number;
  y: number;
};

export const INITIAL_RESEARCH: Record<TechKey, boolean> = {
  asteroidSurvey: false,
  automatedDrills: false,
  plasmaCutters: false,
  cargoDrones: false,
  deepStorage: false,
  fusionCells: false,
  antimatterCore: false,
  gravNavigation: false,
  warpTheory: false,
  stationFrame: false,
  orbitalAssembly: false,
  galaxyGate: false,
};

export const TECH_TREE: TechNode[] = [
  {
    key: 'asteroidSurvey',
    name: 'Raketen-Bauplan',
    branch: 'Rakete',
    description: 'Grundentwurf fuer eine groessere Explorer-Klasse.',
    effect: 'Startet das Projekt Neue Rakete',
    cost: { credits: 6000, crystal: 420 },
    prerequisites: [],
    x: 12,
    y: 30,
  },
  {
    key: 'automatedDrills',
    name: 'Verstaerkter Rumpf',
    branch: 'Rakete',
    description: 'Ein tragfaehiger Rahmen fuer mehr Module und Fracht.',
    effect: 'Rumpfteil erforscht',
    cost: { credits: 7600, metal: 6100 },
    prerequisites: ['asteroidSurvey'],
    x: 26,
    y: 30,
  },
  {
    key: 'plasmaCutters',
    name: 'Montagekupplungen',
    branch: 'Rakete',
    description: 'Standardisierte Anschluesse fuer Antrieb und Waffen.',
    effect: 'Modulrahmen erforscht',
    cost: { credits: 9400, metal: 7800, titan: 950 },
    prerequisites: ['automatedDrills'],
    x: 40,
    y: 30,
  },
  {
    key: 'cargoDrones',
    name: 'Frachtsektion',
    branch: 'Rakete',
    description: 'Interne Lagerzellen fuer laengere Sammelfluege.',
    effect: 'Frachtteil erforscht',
    cost: { credits: 11200, wood: 8900, silicon: 1300 },
    prerequisites: ['plasmaCutters'],
    x: 54,
    y: 30,
  },
  {
    key: 'deepStorage',
    name: 'Lebenserhaltung',
    branch: 'Rakete',
    description: 'Schutz- und Versorgungssysteme fuer entfernte Einsaetze.',
    effect: 'Versorgungsteil erforscht',
    cost: { credits: 13500, energy: 320, crystal: 2200 },
    prerequisites: ['cargoDrones'],
    x: 68,
    y: 30,
  },
  {
    key: 'fusionCells',
    name: 'Fusionsantrieb',
    branch: 'Rakete',
    description: 'Ein staerkerer Kernantrieb fuer die neue Klasse.',
    effect: 'Antriebsteil erforscht',
    cost: { credits: 15800, energy: 540, titan: 2600 },
    prerequisites: ['deepStorage'],
    x: 82,
    y: 30,
  },
  {
    key: 'antimatterCore',
    name: 'Schildmatrix',
    branch: 'Rakete',
    description: 'Defensive Feldgeneratoren fuer Abenteuer und Tiefraum.',
    effect: 'Schildteil erforscht',
    cost: { credits: 18400, silicon: 3400, alien: 620 },
    prerequisites: ['fusionCells'],
    x: 82,
    y: 68,
  },
  {
    key: 'gravNavigation',
    name: 'Waffenkontrolle',
    branch: 'Rakete',
    description: 'Zielsysteme fuer koordinierte Bordwaffen.',
    effect: 'Waffenteil erforscht',
    cost: { credits: 21200, titan: 4300, crystal: 3900 },
    prerequisites: ['antimatterCore'],
    x: 68,
    y: 68,
  },
  {
    key: 'warpTheory',
    name: 'Sprungnavigation',
    branch: 'Rakete',
    description: 'Navigation fuer Routen ausserhalb des Startsektors.',
    effect: 'Navigationskern erforscht',
    cost: { credits: 24600, crystal: 5200, alien: 980 },
    prerequisites: ['gravNavigation'],
    x: 54,
    y: 68,
  },
  {
    key: 'stationFrame',
    name: 'Werftadapter',
    branch: 'Rakete',
    description: 'Das Raumfahrtzentrum kann die neue Rakete zusammensetzen.',
    effect: 'Bau im Raumfahrtzentrum vorbereitet',
    cost: { credits: 28500, metal: 12300, silicon: 6100 },
    prerequisites: ['warpTheory'],
    x: 40,
    y: 68,
  },
  {
    key: 'orbitalAssembly',
    name: 'Endmontage',
    branch: 'Rakete',
    description: 'Alle Teile werden zu einem baubaren Projekt zusammengefuehrt.',
    effect: 'Neue Rakete fast bereit',
    cost: { credits: 33000, metal: 14800, titan: 7600, energy: 780 },
    prerequisites: ['stationFrame'],
    x: 26,
    y: 68,
  },
  {
    key: 'galaxyGate',
    name: 'Neue Rakete',
    branch: 'Rakete',
    description: 'Die komplette Rakete ist erforscht und kann gebaut werden.',
    effect: 'Bauauftrag im Raumfahrtzentrum freigeschaltet',
    cost: { credits: 38500, crystal: 9500, alien: 2100, energy: 1200 },
    prerequisites: ['orbitalAssembly'],
    x: 12,
    y: 68,
  },
];

export const RESEARCH_DISCOUNT_PER_LEVEL = 0.05;
export const MAX_RESEARCH_DISCOUNT = 0.5;

export const getResearchCenterLevel = (state: GameState) =>
  state.buildings.find((building) => building.key === 'research')?.level ?? 0;

export const getWarehouseLevel = (state: GameState) =>
  state.buildings.find((building) => building.key === 'warehouse')?.level ?? 0;

export const getTechStorageRequirement = (tech: TechNode) => {
  const index = Math.max(0, TECH_TREE.findIndex((item) => item.key === tech.key));
  return 5 + index * 2;
};

export const getResearchDiscountForLevel = (level: number) =>
  Math.min(level * RESEARCH_DISCOUNT_PER_LEVEL, MAX_RESEARCH_DISCOUNT);

export const getResearchDiscount = (state: GameState) =>
  getResearchDiscountForLevel(getResearchCenterLevel(state));

export const getTechCost = (state: GameState, tech: TechNode) => {
  const discount = getResearchDiscount(state);
  return Object.fromEntries(
    Object.entries(tech.cost).map(([resource, value]) => [
      resource,
      Math.max(1, Math.ceil((value ?? 0) * (1 - discount))),
    ]),
  ) as Partial<ResourceBag>;
};

export const getTech = (key: TechKey) =>
  TECH_TREE.find((tech) => tech.key === key);

export const isTechAvailable = (state: GameState, tech: TechNode) =>
  !state.research[tech.key] &&
  getResearchCenterLevel(state) > 0 &&
  getWarehouseLevel(state) >= getTechStorageRequirement(tech) &&
  tech.prerequisites.every((key) => state.research[key]);

export const getResearchedCount = (state: GameState) =>
  TECH_TREE.filter((tech) => state.research[tech.key]).length;

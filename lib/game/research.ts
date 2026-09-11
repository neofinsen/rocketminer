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
    cost: { credits: 700, crystal: 45 },
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
    cost: { credits: 1100, metal: 420 },
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
    cost: { credits: 1500, metal: 620, titan: 90 },
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
    cost: { credits: 1800, wood: 520, silicon: 80 },
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
    cost: { credits: 2200, energy: 320, crystal: 160 },
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
    cost: { credits: 2700, energy: 540, titan: 180 },
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
    cost: { credits: 3300, silicon: 240, alien: 35 },
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
    cost: { credits: 3900, titan: 260, crystal: 260 },
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
    cost: { credits: 4700, crystal: 420, alien: 60 },
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
    cost: { credits: 5600, metal: 980, silicon: 260 },
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
    cost: { credits: 6800, metal: 1300, titan: 420, energy: 780 },
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
    cost: { credits: 8200, crystal: 760, alien: 140, energy: 1200 },
    prerequisites: ['orbitalAssembly'],
    x: 12,
    y: 68,
  },
];

export const RESEARCH_DISCOUNT_PER_LEVEL = 0.05;
export const MAX_RESEARCH_DISCOUNT = 0.5;

export const getResearchCenterLevel = (state: GameState) =>
  state.buildings.find((building) => building.key === 'research')?.level ?? 0;

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
  tech.prerequisites.every((key) => state.research[key]);

export const getResearchedCount = (state: GameState) =>
  TECH_TREE.filter((tech) => state.research[tech.key]).length;

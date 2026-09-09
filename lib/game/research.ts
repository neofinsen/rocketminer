import type { GameState, ResourceBag, TechKey } from './types';

export type TechNode = {
  key: TechKey;
  name: string;
  branch: 'Bergbau' | 'Logistik' | 'Energie' | 'Navigation' | 'Raumstation';
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
    name: 'Asteroiden-Analyse',
    branch: 'Bergbau',
    description: 'Scanner markieren wertvolle Brocken im Sektor.',
    effect: 'Schaltet praezisere Rohstoffsuche frei',
    cost: { credits: 600, crystal: 35 },
    prerequisites: [],
    x: 9,
    y: 26,
  },
  {
    key: 'automatedDrills',
    name: 'Autobohrer',
    branch: 'Bergbau',
    description: 'Minenmodule zerlegen kleinere Asteroiden selbststaendig.',
    effect: '+ Bergbaupfad fuer Plasma-Laser',
    cost: { credits: 1200, metal: 320, energy: 120 },
    prerequisites: ['asteroidSurvey'],
    x: 27,
    y: 18,
  },
  {
    key: 'plasmaCutters',
    name: 'Plasma-Schneider',
    branch: 'Bergbau',
    description: 'Gebundene Plasmastrahlen brechen dichte Titanadern.',
    effect: 'Vorstufe fuer Stationsbau',
    cost: { credits: 2200, titan: 180, crystal: 120 },
    prerequisites: ['automatedDrills'],
    x: 47,
    y: 18,
  },
  {
    key: 'cargoDrones',
    name: 'Fracht-Drohnen',
    branch: 'Logistik',
    description: 'Kleine Drohnen sichern Fragmente beim Rueckflug.',
    effect: 'Logistikpfad fuer Tiefenlager',
    cost: { credits: 900, wood: 360, metal: 180 },
    prerequisites: [],
    x: 10,
    y: 50,
  },
  {
    key: 'deepStorage',
    name: 'Tiefenlager',
    branch: 'Logistik',
    description: 'Verdichtete Silos lagern seltene Materialien orbital vor.',
    effect: 'Noetig fuer Orbitalmontage',
    cost: { credits: 1700, metal: 460, silicon: 80 },
    prerequisites: ['cargoDrones'],
    x: 30,
    y: 51,
  },
  {
    key: 'fusionCells',
    name: 'Fusionszellen',
    branch: 'Energie',
    description: 'Stabile Reaktorzellen versorgen groessere Werftmodule.',
    effect: 'Energiepfad fuer Antimaterie',
    cost: { credits: 1100, energy: 260, crystal: 70 },
    prerequisites: [],
    x: 11,
    y: 74,
  },
  {
    key: 'antimatterCore',
    name: 'Antimaterie-Kern',
    branch: 'Energie',
    description: 'Ein geschuetzter Kern macht Langstrecken-Spruenge moeglich.',
    effect: 'Energiequelle der Raumstation',
    cost: { credits: 2600, energy: 620, alien: 30 },
    prerequisites: ['fusionCells'],
    x: 47,
    y: 76,
  },
  {
    key: 'gravNavigation',
    name: 'Grav-Navigation',
    branch: 'Navigation',
    description: 'Routen werden entlang stabiler Gravitationsfenster geplant.',
    effect: 'Navigationspfad fuer Warp-Theorie',
    cost: { credits: 1400, crystal: 120, titan: 80 },
    prerequisites: ['asteroidSurvey'],
    x: 31,
    y: 34,
  },
  {
    key: 'warpTheory',
    name: 'Warp-Theorie',
    branch: 'Navigation',
    description: 'Forschungsrechner simulieren Spruenge ausserhalb bekannter Sektoren.',
    effect: 'Schluessel fuer weitere Galaxien',
    cost: { credits: 3200, crystal: 340, alien: 55 },
    prerequisites: ['gravNavigation', 'antimatterCore'],
    x: 66,
    y: 46,
  },
  {
    key: 'stationFrame',
    name: 'Stationsrahmen',
    branch: 'Raumstation',
    description: 'Die erste tragende Struktur fuer eine permanente Raumstation.',
    effect: 'Start des Raumstationsprojekts',
    cost: { credits: 3800, metal: 900, titan: 360 },
    prerequisites: ['plasmaCutters', 'deepStorage'],
    x: 66,
    y: 25,
  },
  {
    key: 'orbitalAssembly',
    name: 'Orbitalmontage',
    branch: 'Raumstation',
    description: 'Werftarme bauen Module direkt im Orbit zusammen.',
    effect: 'Raumstation kann gebaut werden',
    cost: { credits: 5200, metal: 1200, silicon: 260, energy: 740 },
    prerequisites: ['stationFrame', 'deepStorage'],
    x: 82,
    y: 36,
  },
  {
    key: 'galaxyGate',
    name: 'Galaxiesprung',
    branch: 'Raumstation',
    description: 'Die Raumstation wird zum Sprunganker fuer ferne Galaxien.',
    effect: 'Endziel: neue Galaxien erreichen',
    cost: { credits: 8200, crystal: 760, alien: 140, energy: 1200 },
    prerequisites: ['orbitalAssembly', 'warpTheory'],
    x: 91,
    y: 58,
  },
];

export const getTech = (key: TechKey) =>
  TECH_TREE.find((tech) => tech.key === key);

export const isTechAvailable = (state: GameState, tech: TechNode) =>
  !state.research[tech.key] &&
  tech.prerequisites.every((key) => state.research[key]);

export const getResearchedCount = (state: GameState) =>
  TECH_TREE.filter((tech) => state.research[tech.key]).length;

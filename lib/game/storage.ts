import { INITIAL_CITY_PLACEMENTS, INITIAL_STATE, QUEST_CHAIN } from './constants';
import { clampResourcesToStorage } from './simulation';
import type {
  Asteroid,
  Building,
  Fragment,
  GameState,
  ResourceBag,
  RocketModule,
  RunRecord,
  RocketKey,
  SectorKey,
  ViewKey,
  WeaponUpgrades,
} from './types';

const SAVE_KEY = 'rocketminer-save-v3';

export const hasSavedGame = () =>
  typeof window !== 'undefined' && Boolean(window.localStorage.getItem(SAVE_KEY));

const asArray = <T,>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? (value as T[]) : fallback;

const mergeModules = (savedModules: unknown): RocketModule[] => {
  const saved = asArray(savedModules, []);
  return INITIAL_STATE.modules.map((module) => ({
    ...module,
    ...saved.find((item) => item.key === module.key),
  }));
};

const mergeBuildings = (savedBuildings: unknown): Building[] => {
  const saved = asArray(savedBuildings, []);
  return INITIAL_STATE.buildings.map((building) => {
    const savedBuilding = saved.find((item) => item.key === building.key);

    return {
      ...building,
      ...savedBuilding,
      name: building.name,
      icon: building.icon,
      production: building.production,
    };
  });
};

const normalizeView = (view: unknown): ViewKey => {
  if (view === 'space' || view === 'city' || view === 'research') return view;
  if (view === 'rocket') return 'adventure';
  if (view === 'adventure') return view;
  return INITIAL_STATE.view;
};

const normalizeSector = (sector: unknown): SectorKey =>
  sector === 'beta' ? 'beta' : 'alpha';

const normalizeRocketKey = (key: unknown): RocketKey => {
  const valid: RocketKey[] = [
    'starter',
    'desert',
    'ice',
    'neon',
    'alien',
    'volcanic',
    'relic',
    'military',
    'crystal',
    'stealth',
    'colony',
  ];

  return valid.includes(key as RocketKey) ? (key as RocketKey) : 'starter';
};

const normalizeUnlockedRockets = (rockets: unknown): RocketKey[] => {
  const valid = asArray<RocketKey>(rockets, ['starter'])
    .map(normalizeRocketKey)
    .filter((rocket, index, all) => all.indexOf(rocket) === index);

  return valid.includes('starter') ? valid : ['starter', ...valid];
};

const normalizeRunRecord = (run: unknown): RunRecord | undefined => {
  if (!run || typeof run !== 'object') return undefined;
  const saved = run as Partial<RunRecord>;
  const wave = typeof saved.wave === 'number' ? Math.max(0, saved.wave) : 0;
  const runLevel =
    typeof saved.runLevel === 'number' ? Math.max(0, saved.runLevel) : 0;
  if (!wave && !runLevel) return undefined;

  return {
    wave,
    runLevel,
    rocket: normalizeRocketKey(saved.rocket),
    at: typeof saved.at === 'number' ? saved.at : Date.now(),
    status: saved.status === 'active' ? 'active' : 'finished',
  };
};

const normalizeUnlockedSectors = (sectors: unknown): SectorKey[] => {
  const valid = asArray<SectorKey>(sectors, ['alpha']).filter(
    (sector) => sector === 'alpha' || sector === 'beta',
  );

  return valid.includes('alpha') ? valid : ['alpha', ...valid];
};

const normalizeCityPlacements = (placements: unknown) => {
  const merged = {
    ...INITIAL_CITY_PLACEMENTS,
    ...(placements && typeof placements === 'object' ? placements : {}),
  };
  const validSlots = new Set(Object.values(INITIAL_CITY_PLACEMENTS));
  const validBuildings = new Set(Object.keys(INITIAL_CITY_PLACEMENTS));

  return Object.fromEntries(
    Object.entries(merged)
      .filter(([key]) => validBuildings.has(key))
      .map(([key, slot]) => [
        key,
        validSlots.has(slot as string)
          ? slot
          : INITIAL_CITY_PLACEMENTS[key as keyof typeof INITIAL_CITY_PLACEMENTS],
      ]),
  );
};

const normalizeResourceBag = (resources: unknown): ResourceBag => {
  const saved = resources && typeof resources === 'object'
    ? (resources as Partial<ResourceBag> & { crystal?: number; wood?: number })
    : {};
  const { crystal, wood, ...currentResources } = saved;

  return {
    ...INITIAL_STATE.resources,
    ...currentResources,
    deuterium: saved.deuterium ?? crystal ?? INITIAL_STATE.resources.deuterium,
    energy: INITIAL_STATE.resources.energy,
  };
};

const normalizeAsteroids = (asteroids: unknown): Asteroid[] =>
  asArray(asteroids, INITIAL_STATE.asteroids).map((asteroid) => ({
    ...asteroid,
    type: 'iron',
    resource: 'metal',
  }));

const normalizeFragments = (fragments: unknown): Fragment[] =>
  asArray(fragments, INITIAL_STATE.fragments).map((fragment) => ({
    ...fragment,
    resource: 'metal',
  }));

const normalizeCargo = (cargo: unknown): Partial<ResourceBag> => {
  const saved = cargo && typeof cargo === 'object'
    ? (cargo as Partial<ResourceBag> & { crystal?: number; wood?: number })
    : {};
  const { crystal, wood, ...currentCargo } = saved;
  const convertedCargo = Object.entries(currentCargo).reduce(
    (total, [, value]) => total + (value ?? 0),
    0,
  );

  return {
    metal: convertedCargo + (crystal ?? 0) + (wood ?? 0),
  };
};

const normalizeWeaponUpgrades = (
  upgrades: unknown,
  legacyAchievement: unknown,
): WeaponUpgrades => {
  const saved = upgrades && typeof upgrades === 'object'
    ? (upgrades as Partial<WeaponUpgrades>)
    : {};
  const legacyRapid = legacyAchievement === 'rapidFire' ? 1 : 0;
  const legacyMulti = legacyAchievement === 'twinShot' ? 1 : 0;
  const rapidFire = Math.max(legacyRapid, saved.rapidFire ?? 0);
  const multiShot = Math.max(legacyMulti, saved.multiShot ?? 0);
  const claimedLevels = asArray(saved.claimedLevels, []).filter(
    (level): level is number => typeof level === 'number' && level >= 5,
  );

  return {
    rapidFire: Math.min(5, rapidFire),
    multiShot: Math.min(4, multiShot),
    claimedLevels,
  };
};

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return INITIAL_STATE;

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return INITIAL_STATE;

    const saved = JSON.parse(raw) as Partial<GameState>;
    const questIndex = saved.questIndex ?? 0;
    const questTemplate = QUEST_CHAIN[questIndex] ?? QUEST_CHAIN[0];

    const savedRocketStatus = saved.rocket?.status;
    const rocketStatus = [
      'collecting',
      'returning',
      'unloading',
      'refueling',
    ].includes(savedRocketStatus ?? '')
      ? (savedRocketStatus as GameState['rocket']['status'])
      : INITIAL_STATE.rocket.status;

    const loaded: GameState = {
      ...INITIAL_STATE,
      ...saved,
      view: normalizeView(saved.view),
      damageTexts: [],
      asteroids: normalizeAsteroids(saved.asteroids),
      fragments: normalizeFragments(saved.fragments),
      modules: mergeModules(saved.modules),
      buildings: mergeBuildings(saved.buildings),
      cityPlacements: normalizeCityPlacements(saved.cityPlacements),
      research: { ...INITIAL_STATE.research, ...saved.research },
      projectiles: [],
      selectedRocket: normalizeRocketKey(saved.selectedRocket),
      unlockedRockets: normalizeUnlockedRockets(saved.unlockedRockets),
      bestRun: normalizeRunRecord(saved.bestRun),
      currentRun: normalizeRunRecord(saved.currentRun),
      currentSector: normalizeSector(saved.currentSector),
      unlockedSectors: normalizeUnlockedSectors(saved.unlockedSectors),
      questIndex,
      resources: normalizeResourceBag(saved.resources),
      destroyedAsteroids: saved.destroyedAsteroids ?? 0,
      newRocketBuilt: saved.newRocketBuilt ?? INITIAL_STATE.newRocketBuilt,
      weaponUpgrades: normalizeWeaponUpgrades(
        saved.weaponUpgrades,
        saved.weaponAchievement,
      ),
      weaponAchievement:
        saved.weaponAchievement === 'rapidFire' ||
        saved.weaponAchievement === 'twinShot'
          ? saved.weaponAchievement
          : INITIAL_STATE.weaponAchievement,
      quest: saved.quest
        ? {
            ...questTemplate,
            current: saved.quest.current ?? questTemplate.current,
            done: saved.quest.done ?? questTemplate.done,
          }
        : questTemplate,
      rocket: {
        ...INITIAL_STATE.rocket,
        ...saved.rocket,
        angle: saved.rocket?.angle ?? INITIAL_STATE.rocket.angle,
        status: rocketStatus,
        fuel: saved.rocket?.fuel ?? INITIAL_STATE.rocket.fuel,
        fuelMax: saved.rocket?.fuelMax ?? INITIAL_STATE.rocket.fuelMax,
        refuelTimer:
          rocketStatus === 'refueling'
            ? Math.min(saved.rocket?.refuelTimer ?? 30, 30)
            : (saved.rocket?.refuelTimer ?? 0),
        refuelDuration: 30,
        returnTimer:
          rocketStatus === 'unloading'
            ? Math.min(saved.rocket?.returnTimer ?? 30, 30)
            : (saved.rocket?.returnTimer ?? 0),
        returnDuration:
          rocketStatus === 'unloading'
            ? 30
            : (saved.rocket?.returnDuration ?? INITIAL_STATE.rocket.returnDuration),
        grabbedFragmentId: saved.rocket?.grabbedFragmentId,
        grabTimer: saved.rocket?.grabTimer ?? 0,
        grabDuration:
          saved.rocket?.grabDuration ?? INITIAL_STATE.rocket.grabDuration,
        idleMode: saved.rocket?.idleMode ?? INITIAL_STATE.rocket.idleMode,
        idleLaserTimer:
          saved.rocket?.idleLaserTimer ?? INITIAL_STATE.rocket.idleLaserTimer,
        cargo: normalizeCargo(saved.rocket?.cargo),
      },
      collectedTotals: { ...saved.collectedTotals },
    };

    return {
      ...loaded,
      resources: clampResourcesToStorage(loaded, loaded.resources),
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveGameState(state: GameState) {
  if (typeof window === 'undefined') return;

  const saveData = {
    ...state,
    damageTexts: [],
    projectiles: [],
  };

  window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export function resetGameState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SAVE_KEY);
}

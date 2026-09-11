import { INITIAL_CITY_PLACEMENTS, INITIAL_STATE, QUEST_CHAIN } from './constants';
import { clampResourcesToStorage } from './simulation';
import type { GameState, RocketModule, SectorKey, ViewKey } from './types';

const SAVE_KEY = 'rocketminer-save-v3';

const asArray = <T,>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? (value as T[]) : fallback;

const mergeModules = (savedModules: unknown): RocketModule[] => {
  const saved = asArray(savedModules, []);
  return INITIAL_STATE.modules.map((module) => ({
    ...module,
    ...saved.find((item) => item.key === module.key),
  }));
};

const normalizeView = (view: unknown): ViewKey => {
  if (view === 'space' || view === 'city' || view === 'research') return view;
  if (view === 'rocket') return 'adventure';
  if (view === 'adventure') return view;
  return INITIAL_STATE.view;
};

const normalizeSector = (sector: unknown): SectorKey =>
  sector === 'beta' ? 'beta' : 'alpha';

const normalizeUnlockedSectors = (sectors: unknown): SectorKey[] => {
  const valid = asArray<SectorKey>(sectors, ['alpha']).filter(
    (sector) => sector === 'alpha' || sector === 'beta',
  );

  return valid.includes('alpha') ? valid : ['alpha', ...valid];
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
      asteroids: asArray(saved.asteroids, INITIAL_STATE.asteroids),
      fragments: asArray(saved.fragments, INITIAL_STATE.fragments),
      modules: mergeModules(saved.modules),
      buildings: asArray(saved.buildings, INITIAL_STATE.buildings),
      cityPlacements: {
        ...INITIAL_CITY_PLACEMENTS,
        ...saved.cityPlacements,
      },
      research: { ...INITIAL_STATE.research, ...saved.research },
      projectiles: [],
      currentSector: normalizeSector(saved.currentSector),
      unlockedSectors: normalizeUnlockedSectors(saved.unlockedSectors),
      questIndex,
      resources: {
        ...INITIAL_STATE.resources,
        ...saved.resources,
        energy: INITIAL_STATE.resources.energy,
      },
      destroyedAsteroids: saved.destroyedAsteroids ?? 0,
      newRocketBuilt: saved.newRocketBuilt ?? INITIAL_STATE.newRocketBuilt,
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
        refuelTimer: saved.rocket?.refuelTimer ?? 0,
        refuelDuration:
          saved.rocket?.refuelDuration ?? INITIAL_STATE.rocket.refuelDuration,
        returnTimer: saved.rocket?.returnTimer ?? 0,
        returnDuration:
          saved.rocket?.returnDuration ?? INITIAL_STATE.rocket.returnDuration,
        grabbedFragmentId: saved.rocket?.grabbedFragmentId,
        grabTimer: saved.rocket?.grabTimer ?? 0,
        grabDuration:
          saved.rocket?.grabDuration ?? INITIAL_STATE.rocket.grabDuration,
        cargo: { ...saved.rocket?.cargo },
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

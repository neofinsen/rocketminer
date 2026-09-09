import type {
  Building,
  GameState,
  ModuleKey,
  ResourceBag,
  ResourceKey,
  SectorKey,
} from './types';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const BASE_POSITION = { x: 16, y: 78 };

export const formatNumber = (value: number) =>
  Math.floor(value).toLocaleString('de-DE');

export const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

export const getModuleLevel = (state: GameState, key: ModuleKey) =>
  state.modules.find((module) => module.key === key)?.level ?? 1;

export const getLaserDamage = (state: GameState) =>
  260 + getModuleLevel(state, 'laser') * 95;

export const getCargoCapacity = (state: GameState) =>
  1100 + getModuleLevel(state, 'cargo') * 520;

export const getCargoUsed = (state: GameState) =>
  Object.values(state.rocket.cargo).reduce((sum, value) => sum + (value ?? 0), 0);

export const getCollectorRange = (state: GameState) =>
  24 + getModuleLevel(state, 'collector') * 7;

export const getRocketSpeed = (state: GameState) =>
  5.2 + getModuleLevel(state, 'engine') * 1.35;

export const getReturnDuration = (state: GameState) => {
  const sectorBonus = state.currentSector === 'beta' ? 24 : 0;
  const levelBonus = Math.floor(state.level / 4) * 6;
  const engineReduction = Math.max(0, getModuleLevel(state, 'engine') - 1) * 5;
  return clamp(120 + sectorBonus + levelBonus - engineReduction, 90, 210);
};

export const getSectorLabel = (sector: SectorKey) =>
  sector === 'beta' ? 'Sektor Beta' : 'Sektor Alpha';

export const getSectorDanger = (sector: SectorKey) => (sector === 'beta' ? 4 : 2);

export const getProductionPerMinute = (buildings: Building[]) => {
  const production = { credits: 0, wood: 0, metal: 0, energy: 0, crystal: 0 };

  buildings.forEach((building) => {
    Object.entries(building.production).forEach(([key, value]) => {
      production[key as keyof typeof production] += (value ?? 0) * building.level;
    });
  });

  return production;
};

export const addResources = (
  resources: ResourceBag,
  incoming: Partial<ResourceBag>,
) => {
  const next = { ...resources };
  Object.entries(incoming).forEach(([key, value]) => {
    next[key as ResourceKey] += value ?? 0;
  });
  return next;
};

export const canPay = (
  resources: ResourceBag,
  cost: Partial<ResourceBag>,
) =>
  Object.entries(cost).every(
    ([key, value]) => resources[key as ResourceKey] >= (value ?? 0),
  );

export const payCost = (
  resources: ResourceBag,
  cost: Partial<ResourceBag>,
) => {
  const next = { ...resources };
  Object.entries(cost).forEach(([key, value]) => {
    next[key as ResourceKey] -= value ?? 0;
  });
  return next;
};

export const getModuleCost = (key: ModuleKey, level: number) => {
  const scale = level + 1;
  const shared = {
    credits: 330 * scale,
    metal: 88 * scale,
    energy: 28 * scale,
  };

  if (key === 'laser') return { ...shared, titan: 24 * scale };
  if (key === 'cargo') return { ...shared, wood: 90 * scale };
  if (key === 'collector') return { ...shared, crystal: 14 * scale };
  if (key === 'energyCore') return { ...shared, silicon: 12 * scale };
  return { ...shared, titan: 16 * scale };
};

export const getBuildingCost = (building: Building) => ({
  credits: 210 * (building.level + 1),
  wood: 70 * (building.level + 1),
  metal: 62 * (building.level + 1),
});

export const canUnlockBeta = (state: GameState) =>
  !state.unlockedSectors.includes('beta') &&
  state.sectorProgress >= 100 &&
  getModuleLevel(state, 'engine') >= 2 &&
  getModuleLevel(state, 'laser') >= 2 &&
  state.resources.titan >= 220 &&
  state.resources.crystal >= 180 &&
  state.resources.energy >= 350;

export const unlockBetaCost: Partial<ResourceBag> = {
  titan: 220,
  crystal: 180,
  energy: 350,
};

export const startCargoReturn = (state: GameState): GameState => {
  if (getCargoUsed(state) <= 0 || state.rocket.status !== 'collecting') {
    return state;
  }

  return {
    ...state,
    rocket: {
      ...state.rocket,
      status: 'returning',
      targetX: BASE_POSITION.x,
      targetY: BASE_POSITION.y,
      returnTimer: getReturnDuration(state),
      returnDuration: getReturnDuration(state),
    },
  };
};

const unloadCargo = (
  state: GameState,
  resources: ResourceBag,
  collectedTotals: Partial<ResourceBag>,
  rocket: GameState['rocket'],
) => {
  const nextResources = addResources(resources, rocket.cargo);
  const nextTotals = { ...collectedTotals };

  Object.entries(rocket.cargo).forEach(([key, value]) => {
    nextTotals[key as ResourceKey] =
      (nextTotals[key as ResourceKey] ?? 0) + (value ?? 0);
  });

  return {
    resources: nextResources,
    collectedTotals: nextTotals,
    rocket: {
      ...rocket,
      cargo: {},
      status: 'collecting' as const,
      returnTimer: 0,
    },
  };
};

const updateRocketMovement = (
  state: GameState,
  rocket: GameState['rocket'],
  deltaSeconds: number,
) => {
  const dx = rocket.targetX - rocket.x;
  const dy = rocket.targetY - rocket.y;
  const distance = Math.hypot(dx, dy);
  const step = getRocketSpeed(state) * deltaSeconds;

  if (distance > 0.1) {
    rocket.angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    rocket.x += (dx / distance) * Math.min(step, distance);
    rocket.y += (dy / distance) * Math.min(step, distance);
  }

  return distance;
};

export const tickGame = (state: GameState, deltaSeconds: number): GameState => {
  const production = getProductionPerMinute(state.buildings);
  let resources = { ...state.resources };
  const collectedTotals = { ...state.collectedTotals };
  Object.entries(production).forEach(([key, perMinute]) => {
    resources[key as ResourceKey] += (perMinute * deltaSeconds) / 60;
  });

  const rocket = { ...state.rocket, cargo: { ...state.rocket.cargo } };
  let fragments = [...state.fragments];
  const capacity = getCargoCapacity(state);
  const used = getCargoUsed(state);
  let nextCollectedTotals = collectedTotals;

  if (rocket.status === 'unloading') {
    rocket.returnTimer = Math.max(0, rocket.returnTimer - deltaSeconds);

    if (rocket.returnTimer <= 0) {
      const unloaded = unloadCargo(state, resources, nextCollectedTotals, rocket);
      resources = unloaded.resources;
      nextCollectedTotals = unloaded.collectedTotals;
      Object.assign(rocket, unloaded.rocket);
    }

    return {
      ...state,
      resources,
      collectedTotals: nextCollectedTotals,
      rocket,
      damageTexts: state.damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

  if (rocket.status === 'returning') {
    rocket.targetX = BASE_POSITION.x;
    rocket.targetY = BASE_POSITION.y;
    const distanceToBase = updateRocketMovement(state, rocket, deltaSeconds);

    if (distanceToBase < 1.1) {
      rocket.x = BASE_POSITION.x;
      rocket.y = BASE_POSITION.y;
      rocket.status = 'unloading';
      rocket.returnTimer = rocket.returnDuration || getReturnDuration(state);
    }

    return {
      ...state,
      resources,
      collectedTotals: nextCollectedTotals,
      rocket,
      damageTexts: state.damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

  if (fragments.length && used < capacity) {
    const nearest = fragments
      .map((fragment) => ({
        fragment,
        distance: Math.hypot(fragment.x - rocket.x, fragment.y - rocket.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    rocket.targetX = nearest.fragment.x;
    rocket.targetY = nearest.fragment.y;
  } else {
    rocket.targetX = 32 + Math.sin(Date.now() / 2800) * 16;
    rocket.targetY = 50 + Math.cos(Date.now() / 3600) * 12;
  }

  updateRocketMovement(state, rocket, deltaSeconds);

  fragments = fragments.flatMap((fragment) => {
    const closeEnough =
      Math.hypot(fragment.x - rocket.x, fragment.y - rocket.y) < 2.2;
    if (!closeEnough || getCargoUsed({ ...state, rocket }) >= capacity) {
      return [fragment];
    }

    const free = capacity - getCargoUsed({ ...state, rocket });
    const amount = Math.min(fragment.amount, free);
    rocket.cargo[fragment.resource] =
      (rocket.cargo[fragment.resource] ?? 0) + amount;
    return amount < fragment.amount
      ? [{ ...fragment, amount: fragment.amount - amount }]
      : [];
  });

  if (getCargoUsed({ ...state, rocket }) >= capacity) {
    const returning = startCargoReturn({ ...state, rocket });
    Object.assign(rocket, returning.rocket);
  }

  const damageTexts = state.damageTexts
    .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
    .filter((text) => text.y > 8);

  return {
    ...state,
    resources,
    collectedTotals: nextCollectedTotals,
    rocket,
    fragments,
    damageTexts,
    sectorProgress: clamp(
      state.sectorProgress +
        deltaSeconds * (state.currentSector === 'beta' ? 0.055 : 0.14),
      0,
      100,
    ),
  };
};

import type {
  Building,
  GameState,
  ModuleKey,
  ResourceBag,
  ResourceKey,
} from './types';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const formatNumber = (value: number) =>
  Math.floor(value).toLocaleString('de-DE');

export const getModuleLevel = (state: GameState, key: ModuleKey) =>
  state.modules.find((module) => module.key === key)?.level ?? 1;

export const getLaserDamage = (state: GameState) =>
  220 + getModuleLevel(state, 'laser') * 75;

export const getCargoCapacity = (state: GameState) =>
  1200 + getModuleLevel(state, 'cargo') * 430;

export const getCargoUsed = (state: GameState) =>
  Object.values(state.rocket.cargo).reduce((sum, value) => sum + (value ?? 0), 0);

export const getCollectorRange = (state: GameState) =>
  20 + getModuleLevel(state, 'collector') * 6;

export const getRocketSpeed = (state: GameState) =>
  4.5 + getModuleLevel(state, 'engine') * 1.25;

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
    credits: 420 * scale,
    metal: 120 * scale,
    energy: 35 * scale,
  };

  if (key === 'laser') return { ...shared, titan: 35 * scale };
  if (key === 'cargo') return { ...shared, wood: 120 * scale };
  if (key === 'collector') return { ...shared, crystal: 18 * scale };
  if (key === 'energyCore') return { ...shared, silicon: 16 * scale };
  return { ...shared, titan: 22 * scale };
};

export const getBuildingCost = (building: Building) => ({
  credits: 260 * (building.level + 1),
  wood: 95 * (building.level + 1),
  metal: 80 * (building.level + 1),
});

export const tickGame = (state: GameState, deltaSeconds: number): GameState => {
  const production = getProductionPerMinute(state.buildings);
  let resources = { ...state.resources };
  Object.entries(production).forEach(([key, perMinute]) => {
    resources[key as ResourceKey] += (perMinute * deltaSeconds) / 60;
  });

  const rocket = { ...state.rocket, cargo: { ...state.rocket.cargo } };
  let fragments = [...state.fragments];
  const capacity = getCargoCapacity(state);
  const used = getCargoUsed(state);

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

  const dx = rocket.targetX - rocket.x;
  const dy = rocket.targetY - rocket.y;
  const distance = Math.hypot(dx, dy);
  const step = getRocketSpeed(state) * deltaSeconds;

  if (distance > 0.1) {
    rocket.x += (dx / distance) * Math.min(step, distance);
    rocket.y += (dy / distance) * Math.min(step, distance);
  }

  fragments = fragments.filter((fragment) => {
    const closeEnough =
      Math.hypot(fragment.x - rocket.x, fragment.y - rocket.y) < 2.2;
    if (!closeEnough || getCargoUsed({ ...state, rocket }) >= capacity) {
      return true;
    }

    const free = capacity - getCargoUsed({ ...state, rocket });
    const amount = Math.min(fragment.amount, free);
    rocket.cargo[fragment.resource] =
      (rocket.cargo[fragment.resource] ?? 0) + amount;
    return false;
  });

  if (getCargoUsed({ ...state, rocket }) > capacity * 0.92) {
    resources = addResources(resources, rocket.cargo);
    rocket.cargo = {};
  }

  const damageTexts = state.damageTexts
    .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
    .filter((text) => text.y > 8);

  return {
    ...state,
    resources,
    rocket,
    fragments,
    damageTexts,
    sectorProgress: clamp(state.sectorProgress + deltaSeconds * 0.08, 0, 100),
  };
};

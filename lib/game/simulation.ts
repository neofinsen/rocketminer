import type {
  Asteroid,
  Building,
  Fragment,
  GameState,
  ModuleKey,
  Projectile,
  ResourceBag,
  ResourceKey,
  SectorKey,
} from './types';

const STORAGE_RESOURCES: ResourceKey[] = [
  'credits',
  'wood',
  'metal',
  'crystal',
  'titan',
  'silicon',
  'alien',
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const BASE_POSITION = { x: 9, y: 78 };

const asteroidTypes: Asteroid['type'][] = [
  'iron',
  'titan',
  'crystal',
  'silicon',
  'alien',
];

const asteroidResource: Record<Asteroid['type'], ResourceKey> = {
  iron: 'metal',
  titan: 'metal',
  crystal: 'wood',
  silicon: 'wood',
  alien: 'credits',
};

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

export const getWeaponDamage = (state: GameState) =>
  34 + getModuleLevel(state, 'weapon') * 24 + getModuleLevel(state, 'laser') * 6;

export const getShieldStrength = (state: GameState) =>
  getModuleLevel(state, 'shield') * 14;

export const getCargoCapacity = (state: GameState) =>
  1100 + getModuleLevel(state, 'cargo') * 520;

export const getCargoUsed = (state: GameState) =>
  Object.values(state.rocket.cargo).reduce((sum, value) => sum + (value ?? 0), 0);

export const getCollectorRange = (state: GameState) =>
  24 + getModuleLevel(state, 'collector') * 7;

export const getRocketSpeed = (state: GameState) =>
  5.2 + getModuleLevel(state, 'engine') * 1.35;

export const getFuelDrain = (state: GameState) => {
  const energyLevel = getModuleLevel(state, 'energyCore');
  return clamp(0.22 / (1 + Math.max(0, energyLevel - 1) * 0.22), 0.09, 0.22);
};

export const getReturnDuration = (state: GameState) => {
  const sectorBonus = state.currentSector === 'beta' ? 24 : 0;
  const levelBonus = Math.floor(state.level / 4) * 6;
  const engineReduction = Math.max(0, getModuleLevel(state, 'engine') - 1) * 5;
  return clamp(120 + sectorBonus + levelBonus - engineReduction, 90, 210);
};

export const getFuelPercent = (state: GameState) =>
  state.rocket.fuelMax > 0
    ? clamp((state.rocket.fuel / state.rocket.fuelMax) * 100, 0, 100)
    : 0;

export const getGrabDuration = (state: GameState, fragment: Fragment) => {
  const collectorLevel = getModuleLevel(state, 'collector');
  return clamp(1.65 + fragment.amount / 90 - collectorLevel * 0.12, 0.85, 2.4);
};

export const getSectorLabel = (sector: SectorKey) =>
  sector === 'beta' ? 'Sektor Beta' : 'Sektor Alpha';

export const getSectorDanger = (sector: SectorKey) => (sector === 'beta' ? 4 : 2);

export const getProductionPerMinute = (buildings: Building[]) => {
  const production = { credits: 0, wood: 0, metal: 0, crystal: 0 };

  buildings.forEach((building) => {
    Object.entries(building.production).forEach(([key, value]) => {
      if (key === 'energy') return;
      production[key as keyof typeof production] += (value ?? 0) * building.level;
    });
  });

  return production;
};

export const getEnergyCapacity = (state: GameState) =>
  state.resources.energy +
  state.buildings.reduce(
    (total, building) =>
      total + (building.production.energy ?? 0) * building.level,
    0,
  );

export const getEnergyUsed = (state: GameState) =>
  state.buildings.reduce(
    (total, building) =>
      building.key === 'power' ? total : total + building.level * 50,
    0,
  );

export const getFreeEnergy = (state: GameState) =>
  Math.max(0, getEnergyCapacity(state) - getEnergyUsed(state));

export const getWarehouseLevel = (state: GameState) =>
  state.buildings.find((building) => building.key === 'warehouse')?.level ?? 0;

export const getStorageCapacity = (state: GameState) =>
  2500 + getWarehouseLevel(state) * 700;

export const clampResourcesToStorage = (state: GameState, resources: ResourceBag) => {
  const capacity = getStorageCapacity(state);
  const next = { ...resources };
  STORAGE_RESOURCES.forEach((resource) => {
    next[resource] = Math.min(next[resource], capacity);
  });
  return next;
};

export const addResources = (
  state: GameState,
  resources: ResourceBag,
  incoming: Partial<ResourceBag>,
) => {
  const next = { ...resources };
  Object.entries(incoming).forEach(([key, value]) => {
    if (key === 'energy') return;
    next[key as ResourceKey] += value ?? 0;
  });
  return clampResourcesToStorage(state, next);
};

export const canPay = (
  resources: ResourceBag,
  cost: Partial<ResourceBag>,
) =>
  Object.entries(cost).every(
    ([key, value]) => resources[key as ResourceKey] >= (value ?? 0),
  );

export const canPayCost = (state: GameState, cost: Partial<ResourceBag>) =>
  Object.entries(cost).every(([key, value]) =>
    key === 'energy'
      ? getFreeEnergy(state) >= (value ?? 0)
      : state.resources[key as ResourceKey] >= (value ?? 0),
  );

export const payCost = (
  resources: ResourceBag,
  cost: Partial<ResourceBag>,
) => {
  const next = { ...resources };
  Object.entries(cost).forEach(([key, value]) => {
    if (key === 'energy') return;
    next[key as ResourceKey] -= value ?? 0;
  });
  return next;
};

export const getModuleCost = (key: ModuleKey, level: number) => {
  const scale = level + 1;
  const shared = {
    credits: 280 * scale,
    titan: 18 * scale,
    crystal: 12 * scale,
  };

  if (key === 'weapon') return { ...shared, silicon: 16 * scale, alien: 4 * scale };
  if (key === 'shield') return { ...shared, silicon: 18 * scale, alien: 3 * scale };
  if (key === 'laser') return { ...shared, titan: 28 * scale };
  if (key === 'cargo') return { ...shared, silicon: 14 * scale };
  if (key === 'collector') return { ...shared, crystal: 22 * scale };
  if (key === 'energyCore') return { ...shared, silicon: 18 * scale };
  return { ...shared, titan: 22 * scale };
};

export const getBuildingCost = (building: Building) => {
  const cost = {
    credits: 210 * (building.level + 1),
    wood: 70 * (building.level + 1),
    metal: 62 * (building.level + 1),
  };

  return building.key === 'power' ? cost : { ...cost, energy: 50 };
};

export const canUnlockBeta = (state: GameState) =>
  false;

export const unlockBetaCost: Partial<ResourceBag> = {
  titan: 220,
  crystal: 180,
  energy: 350,
};

export const newRocketCost: Partial<ResourceBag> = {
  credits: 12000,
  metal: 2200,
  energy: 900,
  titan: 520,
  silicon: 360,
  alien: 90,
};

export const canBuildNewRocket = (state: GameState) => {
  const spaceport = state.buildings.find((building) => building.key === 'spaceport');
  return (
    Boolean(state.research.galaxyGate) &&
    (spaceport?.level ?? 0) >= 3 &&
    canPayCost(state, newRocketCost)
  );
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
      grabbedFragmentId: undefined,
      grabTimer: 0,
    },
  };
};

export const queueProjectile = (
  state: GameState,
  asteroidId: number,
): GameState => {
  if (state.rocket.status !== 'collecting') return state;
  const asteroid = state.asteroids.find((item) => item.id === asteroidId);
  if (!asteroid) return state;

  const projectile: Projectile = {
    id: state.nextId,
    x: state.rocket.x,
    y: state.rocket.y,
    targetX: asteroid.x,
    targetY: asteroid.y,
    asteroidId,
    damage: getLaserDamage(state),
  };

  return {
    ...state,
    projectiles: [...state.projectiles, projectile],
    nextId: state.nextId + 1,
  };
};

function spawnAsteroid(nextId: number, state: GameState): Asteroid {
  const available =
    state.currentSector === 'beta' ? asteroidTypes : asteroidTypes.slice(0, 4);
  const type = available[nextId % available.length];
  const sectorBonus = state.currentSector === 'beta' ? 520 : 0;
  const hp = 1250 + (nextId % 4) * 360 + sectorBonus;

  return {
    id: nextId,
    type,
    x: 40 + ((nextId * 19) % 48),
    y: 18 + ((nextId * 23) % 60),
    hp,
    maxHp: hp,
    resource: asteroidResource[type],
  };
}

function fragmentsFromAsteroid(asteroid: Asteroid, nextId: number) {
  return Array.from({ length: 7 }, (_, index) => ({
    id: nextId + index,
    x: asteroid.x + Math.cos(index * 0.9) * (4 + index * 0.45),
    y: asteroid.y + Math.sin(index * 0.9) * (4 + index * 0.45),
    resource: asteroid.resource,
    amount: 34 + index * 8,
  }));
}

function tickProjectiles(
  state: GameState,
  deltaSeconds: number,
  fragments: Fragment[],
) {
  let nextId = state.nextId;
  let questKills = 0;
  const damageTexts = [...state.damageTexts];
  let asteroids = [...state.asteroids];
  const projectiles: Projectile[] = [];

  state.projectiles.forEach((projectile) => {
    const dx = projectile.targetX - projectile.x;
    const dy = projectile.targetY - projectile.y;
    const distance = Math.hypot(dx, dy);
    const step = 82 * deltaSeconds;

    if (distance > step) {
      projectiles.push({
        ...projectile,
        x: projectile.x + (dx / distance) * step,
        y: projectile.y + (dy / distance) * step,
      });
      return;
    }

    const asteroid = asteroids.find((item) => item.id === projectile.asteroidId);
    if (!asteroid) return;

    const nextAsteroid = { ...asteroid, hp: asteroid.hp - projectile.damage };
    damageTexts.push({
      id: nextId,
      x: asteroid.x + 8,
      y: asteroid.y - 5,
      value: projectile.damage,
    });
    nextId += 1;

    if (nextAsteroid.hp > 0) {
      asteroids = asteroids.map((item) =>
        item.id === asteroid.id ? nextAsteroid : item,
      );
      return;
    }

    const newFragments = fragmentsFromAsteroid(asteroid, nextId);
    nextId += newFragments.length;
    fragments.push(...newFragments);
    asteroids = [
      ...asteroids.filter((item) => item.id !== asteroid.id),
      spawnAsteroid(nextId, state),
    ];
    nextId += 1;
    questKills += 1;
  });

  return { asteroids, fragments, projectiles, damageTexts, nextId, questKills };
}

const unloadCargo = (
  state: GameState,
  resources: ResourceBag,
  collectedTotals: Partial<ResourceBag>,
  rocket: GameState['rocket'],
) => {
  const nextResources = addResources(state, resources, rocket.cargo);
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
      status:
        rocket.fuel < rocket.fuelMax ? ('refueling' as const) : ('collecting' as const),
      returnTimer: 0,
      refuelTimer:
        rocket.fuel < rocket.fuelMax ? rocket.refuelDuration : rocket.refuelTimer,
      grabbedFragmentId: undefined,
      grabTimer: 0,
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
  resources = clampResourcesToStorage(state, resources);

  const rocket = { ...state.rocket, cargo: { ...state.rocket.cargo } };
  let fragments = [...state.fragments];
  const projectileUpdate = tickProjectiles(state, deltaSeconds, fragments);
  let asteroids = projectileUpdate.asteroids;
  let projectiles = projectileUpdate.projectiles;
  let damageTexts = projectileUpdate.damageTexts;
  let nextId = projectileUpdate.nextId;
  const capacity = getCargoCapacity(state);
  const used = getCargoUsed(state);
  let nextCollectedTotals = collectedTotals;

  if (rocket.status === 'refueling') {
    rocket.x = BASE_POSITION.x;
    rocket.y = BASE_POSITION.y;
    rocket.targetX = BASE_POSITION.x;
    rocket.targetY = BASE_POSITION.y;
    rocket.refuelTimer = Math.max(0, rocket.refuelTimer - deltaSeconds);
    rocket.fuel =
      rocket.fuelMax *
      (1 - rocket.refuelTimer / Math.max(rocket.refuelDuration, 1));

    if (rocket.refuelTimer <= 0) {
      rocket.fuel = rocket.fuelMax;
      rocket.status = 'collecting';
      rocket.refuelTimer = 0;
    }

    return {
      ...state,
      resources,
      collectedTotals: nextCollectedTotals,
      rocket,
      asteroids,
      fragments,
      projectiles,
      destroyedAsteroids: state.destroyedAsteroids + projectileUpdate.questKills,
      damageTexts: damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

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
      asteroids,
      fragments,
      projectiles,
      destroyedAsteroids: state.destroyedAsteroids + projectileUpdate.questKills,
      damageTexts: damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

  if (rocket.status === 'returning') {
    rocket.targetX = BASE_POSITION.x;
    rocket.targetY = BASE_POSITION.y;
    rocket.returnTimer = Math.max(0, rocket.returnTimer - deltaSeconds);
    const distanceToBase = updateRocketMovement(state, rocket, deltaSeconds);

    if (distanceToBase < 1.1) {
      rocket.x = BASE_POSITION.x;
      rocket.y = BASE_POSITION.y;
      rocket.status = 'unloading';
      rocket.returnTimer = Math.max(1, rocket.returnTimer);
    }

    return {
      ...state,
      resources,
      collectedTotals: nextCollectedTotals,
      rocket,
      asteroids,
      fragments,
      projectiles,
      destroyedAsteroids: state.destroyedAsteroids + projectileUpdate.questKills,
      damageTexts: damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

  rocket.fuel = Math.max(0, rocket.fuel - deltaSeconds * getFuelDrain(state));
  if (rocket.fuel <= 0) {
    const returning = startCargoReturn({ ...state, rocket });
    Object.assign(rocket, {
      ...returning.rocket,
      fuel: 0,
    });

    if (getCargoUsed({ ...state, rocket }) <= 0) {
      rocket.status = 'returning';
      rocket.targetX = BASE_POSITION.x;
      rocket.targetY = BASE_POSITION.y;
      rocket.returnTimer = getReturnDuration(state);
      rocket.returnDuration = getReturnDuration(state);
    }

    return {
      ...state,
      resources,
      collectedTotals: nextCollectedTotals,
      rocket,
      asteroids,
      fragments,
      projectiles,
      destroyedAsteroids: state.destroyedAsteroids + projectileUpdate.questKills,
      damageTexts: damageTexts
        .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
        .filter((text) => text.y > 8),
    };
  }

  const grabbed = fragments.find((item) => item.id === rocket.grabbedFragmentId);
  if (grabbed && used < capacity) {
    rocket.grabTimer = Math.max(0, rocket.grabTimer - deltaSeconds);
    const progress = 1 - rocket.grabTimer / Math.max(rocket.grabDuration, 0.1);
    const originX = grabbed.originX ?? grabbed.x;
    const originY = grabbed.originY ?? grabbed.y;
    grabbed.x = originX + (rocket.x - originX) * progress;
    grabbed.y = originY + (rocket.y - originY) * progress;

    if (rocket.grabTimer <= 0) {
      const free = capacity - getCargoUsed({ ...state, rocket });
      const amount = Math.min(grabbed.amount, free);
      rocket.cargo[grabbed.resource] =
        (rocket.cargo[grabbed.resource] ?? 0) + amount;
      fragments = fragments.flatMap((fragment) =>
        fragment.id === grabbed.id && amount >= fragment.amount
          ? []
          : fragment.id === grabbed.id
            ? [{ ...fragment, amount: fragment.amount - amount }]
            : [fragment],
      );
      rocket.grabbedFragmentId = undefined;
      rocket.grabTimer = 0;
    }
  } else if (fragments.length && used < capacity) {
    const nearest = fragments
      .map((fragment) => ({
        fragment,
        distance: Math.hypot(fragment.x - rocket.x, fragment.y - rocket.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    const inRange = nearest.distance <= getCollectorRange(state) * 0.35;
    rocket.targetX = nearest.fragment.x;
    rocket.targetY = nearest.fragment.y;

    if (inRange) {
      rocket.grabbedFragmentId = nearest.fragment.id;
      rocket.grabDuration = getGrabDuration(state, nearest.fragment);
      rocket.grabTimer = rocket.grabDuration;
      fragments = fragments.map((fragment) =>
        fragment.id === nearest.fragment.id
          ? { ...fragment, originX: fragment.x, originY: fragment.y }
          : fragment,
      );
    }
  } else {
    rocket.targetX = 32 + Math.sin(Date.now() / 2800) * 16;
    rocket.targetY = 50 + Math.cos(Date.now() / 3600) * 12;
  }

  updateRocketMovement(state, rocket, deltaSeconds);

  if (getCargoUsed({ ...state, rocket }) >= capacity) {
    const returning = startCargoReturn({ ...state, rocket });
    Object.assign(rocket, returning.rocket);
  }

  damageTexts = damageTexts
    .map((text) => ({ ...text, y: text.y - deltaSeconds * 7 }))
    .filter((text) => text.y > 8);

  return {
    ...state,
    resources,
    collectedTotals: nextCollectedTotals,
    rocket,
    asteroids,
    fragments,
    projectiles,
    damageTexts,
    nextId,
    destroyedAsteroids: state.destroyedAsteroids + projectileUpdate.questKills,
    sectorProgress: clamp(
      state.sectorProgress +
        deltaSeconds * (state.currentSector === 'beta' ? 0.055 : 0.14),
      0,
      100,
    ),
  };
};

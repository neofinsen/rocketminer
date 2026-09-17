import type { Building, GameState, ResourceBag, ResourceKey } from './types';

const CONVERTED_RESOURCES: ResourceKey[] = [
  'credits',
  'titan',
  'silicon',
  'deuterium',
];

const METAL_INPUT_PER_OUTPUT: Partial<Record<ResourceKey, number>> = {
  credits: 0.35,
  titan: 1.8,
  silicon: 1.6,
  deuterium: 12,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getProductionPerMinute = (buildings: Building[]) => {
  const production: Partial<ResourceBag> = {};

  buildings.forEach((building) => {
    Object.entries(building.production).forEach(([key, value]) => {
      if (key === 'energy' || key === 'metal') return;
      const resource = key as ResourceKey;
      production[resource] =
        (production[resource] ?? 0) + (value ?? 0) * building.level;
    });
  });

  return production;
};

export const getMetalDemandPerMinute = (buildings: Building[]) =>
  buildings.reduce(
    (total, building) =>
      total +
      Object.entries(building.production).reduce((buildingTotal, [key, value]) => {
        const resource = key as ResourceKey;
        if (!CONVERTED_RESOURCES.includes(resource)) return buildingTotal;
        return (
          buildingTotal +
          (value ?? 0) *
            building.level *
            (METAL_INPUT_PER_OUTPUT[resource] ?? 1)
        );
      }, 0),
    0,
  );

export const getProductionScale = (state: GameState) => {
  const demand = getMetalDemandPerMinute(state.buildings);
  if (demand <= 0) return 1;
  return clamp(state.resources.metal / Math.max(demand / 6, 1), 0, 1);
};

export const getEffectiveProductionPerMinute = (state: GameState) => {
  const production = getProductionPerMinute(state.buildings);
  const scale = getProductionScale(state);
  const effective: Partial<ResourceBag> = {
    metal: -getMetalDemandPerMinute(state.buildings) * scale,
  };

  Object.entries(production).forEach(([key, value]) => {
    effective[key as ResourceKey] = (value ?? 0) * scale;
  });

  return effective;
};

export const isProductionBlockedByMetal = (state: GameState) =>
  getMetalDemandPerMinute(state.buildings) > 0 && getProductionScale(state) < 1;

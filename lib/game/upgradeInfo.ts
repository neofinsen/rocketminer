import { RESOURCE_LABELS } from './constants';
import { type TechNode } from './research';
import { formatNumber } from './simulation';
import type { Building, ModuleKey, ResourceBag, RocketModule } from './types';

const moduleStats: Record<ModuleKey, (level: number) => string> = {
  engine: (level) => `Speed ${getRocketSpeedAt(level).toFixed(1)} u/s`,
  collector: (level) => `Reichweite ${24 + level * 7} u`,
  cargo: (level) => `Frachtraum ${formatNumber(1100 + level * 520)}`,
  laser: (level) => `Laser ${formatNumber(260 + level * 95)} Schaden`,
  energyCore: (level) => `Energiemodul Stufe ${level}`,
};

const getRocketSpeedAt = (level: number) => 5.2 + level * 1.35;

export const formatCostTitle = (cost: Partial<ResourceBag>) =>
  Object.entries(cost)
    .map(([resource, value]) => `${RESOURCE_LABELS[resource as keyof ResourceBag]} ${formatNumber(value ?? 0)}`)
    .join(', ');

export const getModuleUpgradeBenefits = (module: RocketModule) => [
  `${moduleStats[module.key](module.level)} -> ${moduleStats[module.key](module.level + 1)}`,
];

export const getBuildingUpgradeBenefits = (building: Building) =>
  Object.entries(building.production).map(
    ([resource, value]) =>
      `${RESOURCE_LABELS[resource as keyof ResourceBag]} +${formatNumber(value ?? 0)}/min mehr`,
  );

export const getTechResearchBenefits = (tech: TechNode) => [tech.effect];

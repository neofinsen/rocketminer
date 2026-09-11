import { RESOURCE_LABELS } from './constants';
import { getResearchDiscountForLevel, type TechNode } from './research';
import { formatNumber } from './simulation';
import type { Building, ModuleKey, ResourceBag, RocketModule } from './types';

const moduleStats: Record<ModuleKey, (level: number) => string> = {
  engine: (level) => `Speed ${getRocketSpeedAt(level).toFixed(1)} u/s`,
  collector: (level) => `Reichweite ${24 + level * 7} u`,
  cargo: (level) => `Frachtraum ${formatNumber(1100 + level * 520)}`,
  laser: (level) => `Laser ${formatNumber(260 + level * 95)} Schaden`,
  energyCore: (level) => `Treibstoffdauer ${getFuelMinutesAt(level)} min`,
  weapon: (level) => `Waffenmodul ${formatNumber(34 + level * 24)} Kampfschaden`,
  shield: (level) => `Schild ${formatNumber(level * 14)} Schutz`,
};

const getRocketSpeedAt = (level: number) => 5.2 + level * 1.35;

const getFuelMinutesAt = (level: number) =>
  (100 / (0.22 / (1 + Math.max(0, level - 1) * 0.22)) / 60).toFixed(1);

export const formatCostTitle = (cost: Partial<ResourceBag>) =>
  Object.entries(cost)
    .filter(([, value]) => (value ?? 0) > 0)
    .map(([resource, value]) => `${RESOURCE_LABELS[resource as keyof ResourceBag]} ${formatNumber(value ?? 0)}`)
    .join(', ');

export const getModuleUpgradeBenefits = (module: RocketModule) => [
  `${moduleStats[module.key](module.level)} -> ${moduleStats[module.key](module.level + 1)}`,
];

export const getBuildingUpgradeBenefits = (building: Building) =>
  [
    ...Object.entries(building.production).map(
      ([resource, value]) =>
        resource === 'energy'
          ? `Energie-Kapazitaet +${formatNumber(value ?? 0)}`
          : building.level === 0
            ? `${RESOURCE_LABELS[resource as keyof ResourceBag]} +${formatNumber(value ?? 0)}/min`
            : `${RESOURCE_LABELS[resource as keyof ResourceBag]} +${formatNumber(value ?? 0)}/min mehr`,
    ),
    ...(building.key === 'research'
      ? [
          `Forschungskosten -${Math.round(
            getResearchDiscountForLevel(building.level + 1) * 100,
          )}%`,
        ]
      : []),
    ...(building.key === 'warehouse'
      ? [`Lagerlimit fuer alle Materialien steigt`]
      : []),
  ];

export const getTechResearchBenefits = (tech: TechNode) => [tech.effect];

import {
  Building2,
  Factory,
  FlaskConical,
  Hammer,
  Landmark,
  Rocket,
  Warehouse,
  Zap,
} from 'lucide-react';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  canPay,
  formatNumber,
  getBuildingCost,
  getProductionPerMinute,
} from '@/lib/game/simulation';
import type { BuildingKey, GameState, ResourceKey } from '@/lib/game/types';
import {
  formatCostTitle,
  getBuildingUpgradeBenefits,
} from '@/lib/game/upgradeInfo';
import { ResourceIcon } from './ResourceIcon';
import { UpgradeTooltip } from './UpgradeTooltip';

type BuildingVisual = {
  x: number;
  y: number;
  size: 'large' | 'medium' | 'small';
  variant: string;
  icon: typeof Building2;
};

const cityLayout: Record<BuildingKey, BuildingVisual> = {
  townhall: {
    x: 48,
    y: 43,
    size: 'large',
    variant: 'civic',
    icon: Landmark,
  },
  sawmill: {
    x: 22,
    y: 32,
    size: 'medium',
    variant: 'bio',
    icon: Factory,
  },
  quarry: {
    x: 23,
    y: 68,
    size: 'medium',
    variant: 'mine',
    icon: Building2,
  },
  forge: {
    x: 40,
    y: 72,
    size: 'medium',
    variant: 'forge',
    icon: Hammer,
  },
  research: {
    x: 64,
    y: 27,
    size: 'medium',
    variant: 'research',
    icon: FlaskConical,
  },
  spaceport: {
    x: 76,
    y: 55,
    size: 'large',
    variant: 'spaceport',
    icon: Rocket,
  },
  power: {
    x: 59,
    y: 74,
    size: 'medium',
    variant: 'power',
    icon: Zap,
  },
  warehouse: {
    x: 34,
    y: 48,
    size: 'small',
    variant: 'storage',
    icon: Warehouse,
  },
};

export function CityView({
  state,
  onUpgradeBuilding,
}: {
  state: GameState;
  onUpgradeBuilding: (key: BuildingKey) => void;
}) {
  const production = getProductionPerMinute(state.buildings);

  return (
    <section className="city-view city-map-view" aria-label="Stadtansicht">
      <div className="city-header">
        <div>
          <h2>Basisstadt</h2>
          <p>Futuristische Kolonie mit Raumhafen, Energieachse und Industriebezirk.</p>
        </div>
        <div className="city-totals">
          {Object.entries(production).map(([key, value]) => (
            <span key={key}>
              {RESOURCE_LABELS[key as keyof typeof RESOURCE_LABELS]} +
              {formatNumber(value)}/min
            </span>
          ))}
        </div>
      </div>

      <div className="city-map" aria-label="Basis-Karte">
        <span className="city-grid-glow" />
        <span className="city-plaza core" />
        <span className="city-plaza launch" />
        <span className="city-road main" />
        <span className="city-road north" />
        <span className="city-road south" />
        <span className="city-road spur" />

        {state.buildings.map((building) => {
          const visual = cityLayout[building.key];
          const Icon = visual.icon;
          const cost = getBuildingCost(building);
          const affordable = canPay(state.resources, cost);
          const output = Object.entries(building.production);

          return (
            <button
              className={`city-building ${visual.variant} ${visual.size}`}
              disabled={!affordable}
              key={building.key}
              onClick={() => onUpgradeBuilding(building.key)}
              style={{ left: `${visual.x}%`, top: `${visual.y}%` }}
              title={`Ausbaukosten: ${formatCostTitle(cost)}`}
              type="button"
            >
              <span className="building-pad">
                <span className="building-shadow" />
                <span className="building-core">
                  <Icon />
                  <span className="tower tower-left" />
                  <span className="tower tower-right" />
                </span>
              </span>
              <span className="building-label">
                <strong>{building.name}</strong>
                <small>Stufe {building.level}</small>
              </span>
              <span className="building-output">
                {output.map(([resource, value]) => (
                  <span key={resource} className="output-chip">
                    <ResourceIcon resource={resource as ResourceKey} />
                    +{formatNumber((value ?? 0) * building.level)}
                  </span>
                ))}
              </span>
              <UpgradeTooltip
                benefits={getBuildingUpgradeBenefits(building)}
                cost={cost}
                label={`Ausbau auf Stufe ${building.level + 1}`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

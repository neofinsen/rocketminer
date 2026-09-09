import { RESOURCE_LABELS } from '@/lib/game/constants';
import type { CSSProperties } from 'react';
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
import buildingSheetImage from './assets/rocketminer-building-sheet.png';
import terrainImage from './assets/rocketminer-city-terrain.png';

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

type BuildingVisual = {
  x: number;
  y: number;
  size: 'large' | 'medium' | 'small';
  variant: string;
  sprite: string;
};

const cityLayout: Record<BuildingKey, BuildingVisual> = {
  townhall: {
    x: 46,
    y: 43,
    size: 'large',
    variant: 'civic',
    sprite: 'townhall',
  },
  sawmill: {
    x: 34,
    y: 35,
    size: 'medium',
    variant: 'bio',
    sprite: 'sawmill',
  },
  quarry: {
    x: 68,
    y: 31,
    size: 'medium',
    variant: 'mine',
    sprite: 'quarry',
  },
  forge: {
    x: 37,
    y: 62,
    size: 'medium',
    variant: 'forge',
    sprite: 'forge',
  },
  research: {
    x: 63,
    y: 60,
    size: 'medium',
    variant: 'research',
    sprite: 'research',
  },
  spaceport: {
    x: 16,
    y: 19,
    size: 'large',
    variant: 'spaceport',
    sprite: 'spaceport',
  },
  power: {
    x: 50,
    y: 75,
    size: 'medium',
    variant: 'power',
    sprite: 'power',
  },
  warehouse: {
    x: 79,
    y: 73,
    size: 'small',
    variant: 'storage',
    sprite: 'warehouse',
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

      <div
        className="city-map"
        aria-label="Basis-Karte"
        style={{
          '--building-sheet-image': `url(${getAssetUrl(buildingSheetImage)})`,
          '--city-terrain-image': `url(${getAssetUrl(terrainImage)})`,
        } as CSSProperties}
      >
        <span className="city-grid-glow" />
        <span className="city-plaza core" />
        <span className="city-plaza launch" />
        <span className="city-road main" />
        <span className="city-road north" />
        <span className="city-road south" />
        <span className="city-road spur" />

        {state.buildings.map((building) => {
          const visual = cityLayout[building.key];
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
                <span className={`building-sprite sprite-${visual.sprite}`} />
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

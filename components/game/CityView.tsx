import { Factory, Hammer, Rocket, Zap } from 'lucide-react';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  canPay,
  formatNumber,
  getBuildingCost,
  getProductionPerMinute,
} from '@/lib/game/simulation';
import type { BuildingKey, GameState } from '@/lib/game/types';
import { ResourceIcon } from './ResourceIcon';

export function CityView({
  state,
  onUpgradeBuilding,
}: {
  state: GameState;
  onUpgradeBuilding: (key: BuildingKey) => void;
}) {
  const production = getProductionPerMinute(state.buildings);

  return (
    <section className="city-view" aria-label="Stadtansicht">
      <div className="city-header">
        <div>
          <h2>Stadtzentrum</h2>
          <p>Produktionslinien laufen, waehrend Explorer I sammelt.</p>
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

      <div className="building-grid">
        {state.buildings.map((building) => {
          const cost = getBuildingCost(building);
          const affordable = canPay(state.resources, cost);

          return (
            <article className="building-card" key={building.key}>
              <div className={`building-art ${building.icon}`}>
                {building.key === 'spaceport' ? <Rocket /> : null}
                {building.key === 'power' ? <Zap /> : null}
                {building.key === 'forge' ? <Hammer /> : null}
                {!['spaceport', 'power', 'forge'].includes(building.key) ? (
                  <Factory />
                ) : null}
              </div>
              <h3>{building.name}</h3>
              <p>Stufe {building.level}</p>
              <div className="building-output">
                {Object.entries(building.production).map(([resource, value]) => (
                  <span key={resource}>
                    <ResourceIcon resource={resource as keyof typeof RESOURCE_LABELS} />
                    +{formatNumber((value ?? 0) * building.level)}/min
                  </span>
                ))}
              </div>
              <button
                disabled={!affordable}
                onClick={() => onUpgradeBuilding(building.key)}
              >
                Verbessern
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

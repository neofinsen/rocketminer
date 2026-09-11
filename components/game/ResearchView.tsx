import {
  Atom,
  Battery,
  Boxes,
  Cpu,
  FlaskConical,
  Gem,
  Hammer,
  Network,
  Orbit,
  Radar,
  Rocket,
  Satellite,
} from 'lucide-react';
import {
  getResearchCenterLevel,
  getResearchDiscount,
  getResearchedCount,
  getTechCost,
  getTechStorageRequirement,
  getWarehouseLevel,
  isTechAvailable,
  TECH_TREE,
  type TechNode,
} from '@/lib/game/research';
import { canPayCost, formatNumber } from '@/lib/game/simulation';
import type { GameState, ResourceKey, TechKey } from '@/lib/game/types';
import { getTechResearchBenefits } from '@/lib/game/upgradeInfo';
import { ResourceIcon } from './ResourceIcon';
import { UpgradeTooltip } from './UpgradeTooltip';

const icons: Record<TechKey, typeof Atom> = {
  asteroidSurvey: Radar,
  automatedDrills: Cpu,
  plasmaCutters: Gem,
  cargoDrones: Boxes,
  deepStorage: Network,
  fusionCells: Battery,
  antimatterCore: Atom,
  gravNavigation: Orbit,
  warpTheory: FlaskConical,
  stationFrame: Hammer,
  orbitalAssembly: Satellite,
  galaxyGate: Rocket,
};

const getStatus = (state: GameState, tech: TechNode) => {
  if (state.research[tech.key]) return 'Erforscht';
  if (getResearchCenterLevel(state) <= 0) return 'Zentrum fehlt';
  if (getWarehouseLevel(state) < getTechStorageRequirement(tech)) {
    return `Lager ${getTechStorageRequirement(tech)}`;
  }
  if (isTechAvailable(state, tech)) return 'Bereit';
  return 'Gesperrt';
};

const getStatusClass = (state: GameState, tech: TechNode) => {
  if (state.research[tech.key]) return 'complete';
  if (isTechAvailable(state, tech)) return 'available';
  return 'locked';
};

const getConnectorPath = (source: TechNode, target: TechNode) => {
  if (source.y === target.y) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  const midY = source.y + (target.y - source.y) / 2;
  return `M ${source.x} ${source.y} L ${source.x} ${midY} L ${target.x} ${midY} L ${target.x} ${target.y}`;
};

export function ResearchView({
  state,
  onResearchTech,
}: {
  state: GameState;
  onResearchTech: (key: TechKey) => void;
}) {
  const researched = getResearchedCount(state);
  const assemblyReady = Boolean(state.research.orbitalAssembly);
  const rocketReady = Boolean(state.research.galaxyGate);
  const researchLevel = getResearchCenterLevel(state);
  const discountPercent = Math.round(getResearchDiscount(state) * 100);

  return (
    <section className="research-view" aria-label="Forschung">
      <div className="city-header research-header">
        <div>
          <h2>Forschungsbaum</h2>
          <p>Lineares Ziel: neue Rakete Teil fuer Teil erforschen.</p>
        </div>
        <div className="research-goal">
          <strong>{researched} / {TECH_TREE.length}</strong>
          <span>
            {researchLevel <= 0
              ? 'Forschungszentrum bauen'
              : rocketReady
                ? 'Bauauftrag frei'
                : assemblyReady
                  ? 'Endmontage bereit'
                  : `Forschungszentrum ${researchLevel} · -${discountPercent}%`}
          </span>
        </div>
      </div>

      <div className="research-tree" aria-label="Technologiebaum">
        <svg className="tech-links" viewBox="0 0 100 100" aria-hidden="true">
          {TECH_TREE.flatMap((tech) =>
            tech.prerequisites.map((sourceKey) => {
              const source = TECH_TREE.find((item) => item.key === sourceKey);
              if (!source) return null;
              const active = state.research[source.key] || state.research[tech.key];
              return (
                <path
                  className={active ? 'active' : undefined}
                  d={getConnectorPath(source, tech)}
                  key={`${source.key}-${tech.key}`}
                />
              );
            }),
          )}
        </svg>

        {TECH_TREE.map((tech) => {
          const Icon = icons[tech.key];
          const statusClass = getStatusClass(state, tech);
          const cost = getTechCost(state, tech);
          const affordable = canPayCost(state, cost);
          const available = statusClass === 'available';
          const disabled = !available || !affordable;

          return (
            <button
              className={`tech-node ${tech.branch.toLowerCase()} ${statusClass}`}
              disabled={disabled}
              key={tech.key}
              onClick={() => onResearchTech(tech.key)}
              style={{ left: `${tech.x}%`, top: `${tech.y}%` }}
              type="button"
            >
              <span className="tech-node-icon">
                <Icon />
              </span>
              <span className="tech-node-copy">
                <small>{tech.branch}</small>
                <strong>{tech.name}</strong>
                <span>{tech.effect}</span>
              </span>
              <span className="tech-status">{getStatus(state, tech)}</span>
              <span className="tech-cost">
                {Object.entries(cost).map(([resource, value]) => (
                  <span key={resource}>
                    <ResourceIcon resource={resource as ResourceKey} />
                    {formatNumber(value ?? 0)}
                  </span>
                ))}
              </span>
              {statusClass !== 'complete' ? (
                <UpgradeTooltip
                  benefits={getTechResearchBenefits(tech)}
                  cost={cost}
                  label="Forschen"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

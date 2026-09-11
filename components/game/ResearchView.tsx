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
  getResearchedCount,
  isTechAvailable,
  TECH_TREE,
  type TechNode,
} from '@/lib/game/research';
import { canPay, formatNumber } from '@/lib/game/simulation';
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
  if (isTechAvailable(state, tech)) return 'Bereit';
  return 'Gesperrt';
};

const getStatusClass = (state: GameState, tech: TechNode) => {
  if (state.research[tech.key]) return 'complete';
  if (isTechAvailable(state, tech)) return 'available';
  return 'locked';
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

  return (
    <section className="research-view" aria-label="Forschung">
      <div className="city-header research-header">
        <div>
          <h2>Forschungsbaum</h2>
          <p>Lineares Ziel: neue Rakete Teil fuer Teil erforschen.</p>
        </div>
        <div className="research-goal">
          <strong>{researched} / {TECH_TREE.length}</strong>
          <span>{rocketReady ? 'Bauauftrag frei' : assemblyReady ? 'Endmontage bereit' : 'Raketenprojekt laeuft'}</span>
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
                <line
                  className={active ? 'active' : undefined}
                  key={`${source.key}-${tech.key}`}
                  x1={source.x}
                  y1={source.y}
                  x2={tech.x}
                  y2={tech.y}
                />
              );
            }),
          )}
        </svg>

        {TECH_TREE.map((tech) => {
          const Icon = icons[tech.key];
          const statusClass = getStatusClass(state, tech);
          const affordable = canPay(state.resources, tech.cost);
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
                {Object.entries(tech.cost).map(([resource, value]) => (
                  <span key={resource}>
                    <ResourceIcon resource={resource as ResourceKey} />
                    {formatNumber(value ?? 0)}
                  </span>
                ))}
              </span>
              {statusClass !== 'complete' ? (
                <UpgradeTooltip
                  benefits={getTechResearchBenefits(tech)}
                  cost={tech.cost}
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

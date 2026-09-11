import { Mail, Menu, Settings, Trophy } from 'lucide-react';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  formatNumber,
  getEnergyCapacity,
  getFreeEnergy,
  getProductionPerMinute,
  getStorageCapacity,
} from '@/lib/game/simulation';
import type { GameState, ResourceKey } from '@/lib/game/types';
import { ResourceIcon } from './ResourceIcon';

const topResources: ResourceKey[] = [
  'credits',
  'wood',
  'metal',
  'energy',
  'crystal',
];

export function TopBar({ state }: { state: GameState }) {
  const production = getProductionPerMinute(state.buildings);
  const freeEnergy = getFreeEnergy(state);
  const energyCapacity = getEnergyCapacity(state);
  const storageCapacity = getStorageCapacity(state);

  return (
    <header className="top-bar">
      <div className="empire-mark">
        <span className="crest">RM</span>
        <div>
          <strong>Imperium</strong>
          <small>Stufe {state.level}</small>
        </div>
      </div>

      <nav className="resource-strip" aria-label="Ressourcen">
        {topResources.map((resource) => (
          <div className="resource-cell" key={resource}>
            <ResourceIcon resource={resource} />
            <div>
              <strong>
                {resource === 'energy'
                  ? `${formatNumber(freeEnergy)} / ${formatNumber(energyCapacity)}`
                  : `${formatNumber(state.resources[resource])} / ${formatNumber(
                      storageCapacity,
                    )}`}
              </strong>
              <small>
                {resource === 'energy'
                  ? 'frei'
                  : `+${formatNumber(
                      production[resource as keyof typeof production] ?? 0,
                    )}/min`}
              </small>
            </div>
            <span className="sr-only">{RESOURCE_LABELS[resource]}</span>
          </div>
        ))}
      </nav>

      <div className="header-actions" aria-label="Menue">
        <span className="save-pill">Autosave aktiv</span>
        <button aria-label="Nachrichten">
          <Mail size={22} />
        </button>
        <button aria-label="Quests">
          <Trophy size={22} />
        </button>
        <button aria-label="Einstellungen">
          <Settings size={23} />
        </button>
        <button aria-label="Menue">
          <Menu size={25} />
        </button>
      </div>
    </header>
  );
}

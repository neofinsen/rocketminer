import { Mail, Menu, Settings, Trophy } from 'lucide-react';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  getEffectiveProductionPerMinute,
  isProductionBlockedByMetal,
} from '@/lib/game/economy';
import {
  formatNumber,
  formatRate,
  getEnergyCapacity,
  getFreeEnergy,
  getStorageCapacity,
} from '@/lib/game/simulation';
import type { GameState, ResourceKey } from '@/lib/game/types';
import alienIcon from './assets/rocketminer-resource-alien.png';
import creditsIcon from './assets/rocketminer-resource-credits.png';
import deuteriumIcon from './assets/rocketminer-resource-deuterium.png';
import energyIcon from './assets/rocketminer-resource-energy.png';
import metalIcon from './assets/rocketminer-resource-metal.png';
import siliconIcon from './assets/rocketminer-resource-silicon.png';
import titanIcon from './assets/rocketminer-resource-titan.png';

const topResources: ResourceKey[] = [
  'credits',
  'metal',
  'energy',
  'titan',
  'silicon',
  'deuterium',
  'alien',
];

const resourceImages: Record<ResourceKey, unknown> = {
  credits: creditsIcon,
  metal: metalIcon,
  energy: energyIcon,
  deuterium: deuteriumIcon,
  titan: titanIcon,
  silicon: siliconIcon,
  alien: alienIcon,
};

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

const formatSignedRate = (value: number) => {
  if (Math.abs(value) < 0.05) return '+0/min';
  return `${value > 0 ? '+' : ''}${formatRate(value)}/min`;
};

export function TopBar({ state }: { state: GameState }) {
  const production = getEffectiveProductionPerMinute(state);
  const productionBlocked = isProductionBlockedByMetal(state);
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
            <span className="resource-image-wrap" aria-hidden="true">
              <img
                alt=""
                className="resource-image"
                src={getAssetUrl(resourceImages[resource])}
              />
              <span>{RESOURCE_LABELS[resource]}</span>
            </span>
            <div className="resource-readout">
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
                  : resource === 'alien'
                    ? 'Abenteuer'
                  : productionBlocked && resource !== 'metal'
                    ? 'Metall fehlt'
                    : formatSignedRate(production[resource] ?? 0)}
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

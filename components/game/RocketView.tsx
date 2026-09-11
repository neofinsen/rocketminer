import {
  BatteryCharging,
  Box,
  Crosshair,
  Gauge,
  Orbit,
  Shield,
  Swords,
} from 'lucide-react';
import {
  canPay,
  formatNumber,
  getCargoCapacity,
  getCollectorRange,
  getLaserDamage,
  getModuleCost,
  getRocketSpeed,
} from '@/lib/game/simulation';
import type { GameState, ModuleKey } from '@/lib/game/types';
import { getModuleUpgradeBenefits } from '@/lib/game/upgradeInfo';
import { UpgradeTooltip } from './UpgradeTooltip';

const moduleCopy: Record<ModuleKey, string> = {
  engine: 'Mehr Geschwindigkeit und spaeter groessere Sektoren.',
  collector: 'Hoehere Reichweite beim automatischen Einsammeln.',
  cargo: 'Mehr Platz fuer seltene Ressourcen im Frachtraum.',
  laser: 'Mehr Schaden pro Klick gegen grosse Asteroiden.',
  energyCore: 'Stabilere Versorgung fuer kuenftige Spezialmodule.',
  weapon: 'Mehr Kampfschaden in Abenteuern und hoehere Chancen in spaeteren Wellen.',
  shield: 'Mehr Schutz gegen gegnerische Treffer in Abenteuern.',
};

const moduleIcons: Record<ModuleKey, React.ComponentType<{ size?: number }>> = {
  engine: Gauge,
  collector: Orbit,
  cargo: Box,
  laser: Crosshair,
  energyCore: BatteryCharging,
  weapon: Swords,
  shield: Shield,
};

export function RocketView({
  state,
  onUpgradeModule,
}: {
  state: GameState;
  onUpgradeModule: (key: ModuleKey) => void;
}) {
  return (
    <section className="rocket-view" aria-label="Raketenwerft">
      <div className="city-header">
        <div>
          <h2>Raketenwerft</h2>
          <p>Explorer I bleibt im Einsatz, Upgrades greifen sofort.</p>
        </div>
        <div className="ship-stats">
          <span>Speed {getRocketSpeed(state).toFixed(1)}</span>
          <span>Reichweite {getCollectorRange(state)}</span>
          <span>Laser {formatNumber(getLaserDamage(state))}</span>
          <span>Fracht {formatNumber(getCargoCapacity(state))}</span>
        </div>
      </div>

      <div className="module-upgrade-grid">
        {state.modules.map((module) => {
          const cost = getModuleCost(module.key, module.level);
          const affordable = canPay(state.resources, cost);
          const Icon = moduleIcons[module.key];

          return (
            <article className="upgrade-card" key={module.key}>
              <Icon size={28} />
              <h3>{module.name}</h3>
              <p>{moduleCopy[module.key]}</p>
              <small>
                Kosten: {formatNumber(cost.credits ?? 0)} Credits,{' '}
                {formatNumber(cost.metal ?? 0)} Metall
              </small>
              <button
                disabled={!affordable}
                onClick={() => onUpgradeModule(module.key)}
              >
                Auf Stufe {module.level + 1}
              </button>
              <UpgradeTooltip
                benefits={getModuleUpgradeBenefits(module)}
                cost={cost}
                label={`Upgrade auf Stufe ${module.level + 1}`}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

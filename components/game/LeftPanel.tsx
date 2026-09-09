import {
  BatteryCharging,
  Box,
  ChevronsUp,
  Crosshair,
  Gauge,
  Orbit,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  canPay,
  formatNumber,
  getCargoCapacity,
  getCargoUsed,
  getCollectorRange,
  getLaserDamage,
  getModuleCost,
  getRocketSpeed,
  getSectorLabel,
} from '@/lib/game/simulation';
import type { GameState, ModuleKey } from '@/lib/game/types';
import { formatCostTitle, getModuleUpgradeBenefits } from '@/lib/game/upgradeInfo';
import { UpgradeTooltip } from './UpgradeTooltip';

const moduleIcons: Record<ModuleKey, React.ReactNode> = {
  engine: <Gauge size={20} />,
  collector: <Orbit size={20} />,
  cargo: <Box size={20} />,
  laser: <Crosshair size={20} />,
  energyCore: <BatteryCharging size={20} />,
};

export function LeftPanel({
  state,
  onUpgradeModule,
}: {
  state: GameState;
  onUpgradeModule: (key: ModuleKey) => void;
}) {
  const cargoUsed = getCargoUsed(state);
  const cargoCapacity = getCargoCapacity(state);
  const status =
    state.rocket.status === 'returning'
      ? 'Rueckflug'
      : state.rocket.status === 'unloading'
        ? 'Entlaedt'
        : 'Sammelt';

  return (
    <aside className="side-panel left-panel">
      <section className="panel-block rocket-card">
        <div>
          <h2>RAKETE: EXPLORER I</h2>
          <p>
            {status} - {getSectorLabel(state.currentSector)}
          </p>
        </div>
        <div className="rocket-preview" aria-hidden="true">
          <span className="rocket-body-mini" />
          <span className="rocket-flame-mini" />
        </div>
        <div className="fuel-row">
          <strong>Treibstoff</strong>
          <Progress className="game-progress" value={82} />
          <span>82%</span>
        </div>
      </section>

      <section className="panel-block">
        <h2>Rakete Module</h2>
        <div className="module-list">
          {state.modules.map((module) => {
            const cost = getModuleCost(module.key, module.level);
            const affordable = canPay(state.resources, cost);

            return (
              <button
                className="module-row"
                disabled={!affordable}
                key={module.key}
                onClick={() => onUpgradeModule(module.key)}
                title={`Upgrade: ${formatCostTitle(cost)}`}
              >
                <span className={`module-icon ${module.key}`}>
                  {moduleIcons[module.key]}
                </span>
                <span>{module.name}</span>
                <small>Stufe {module.level}</small>
                <ChevronsUp size={18} />
                <UpgradeTooltip
                  benefits={getModuleUpgradeBenefits(module)}
                  cost={cost}
                  label={`Stufe ${module.level + 1}`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel-block stats-block">
        <h2>Statistik</h2>
        <dl>
          <div>
            <dt>Fluggeschwindigkeit</dt>
            <dd>{getRocketSpeed(state).toFixed(1)} u/s</dd>
          </div>
          <div>
            <dt>Sammelreichweite</dt>
            <dd>{getCollectorRange(state)} u</dd>
          </div>
          <div>
            <dt>Frachtraum</dt>
            <dd>
              {formatNumber(cargoUsed)} / {formatNumber(cargoCapacity)}
            </dd>
          </div>
          <div>
            <dt>Laser Schaden</dt>
            <dd>{formatNumber(getLaserDamage(state))} / Klick</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

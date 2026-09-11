import {
  BatteryCharging,
  Box,
  ChevronsUp,
  Crosshair,
  Gauge,
  Orbit,
  Shield,
  Swords,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CSSProperties } from 'react';
import {
  canPay,
  formatNumber,
  formatSeconds,
  getCargoCapacity,
  getCargoUsed,
  getCollectorRange,
  getFuelPercent,
  getLaserDamage,
  getModuleCost,
  getRocketSpeed,
  getSectorLabel,
} from '@/lib/game/simulation';
import type { GameState, ModuleKey } from '@/lib/game/types';
import { formatCostTitle, getModuleUpgradeBenefits } from '@/lib/game/upgradeInfo';
import { UpgradeTooltip } from './UpgradeTooltip';
import rocketImage from './assets/rocketminer-starter-rocket-desert.png';

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

const moduleIcons: Record<ModuleKey, React.ReactNode> = {
  engine: <Gauge size={20} />,
  collector: <Orbit size={20} />,
  cargo: <Box size={20} />,
  laser: <Crosshair size={20} />,
  energyCore: <BatteryCharging size={20} />,
  weapon: <Swords size={20} />,
  shield: <Shield size={20} />,
};

const spaceModules: ModuleKey[] = [
  'engine',
  'collector',
  'cargo',
  'laser',
  'energyCore',
];

const adventureModules: ModuleKey[] = ['engine', 'weapon', 'shield'];

export function LeftPanel({
  state,
  onUpgradeModule,
}: {
  state: GameState;
  onUpgradeModule: (key: ModuleKey) => void;
}) {
  const cargoUsed = getCargoUsed(state);
  const cargoCapacity = getCargoCapacity(state);
  const fuelPercent = getFuelPercent(state);
  const status =
    state.rocket.status === 'returning'
      ? 'Rueckflug'
      : state.rocket.status === 'unloading'
        ? 'Entlaedt'
        : state.rocket.status === 'refueling'
          ? 'Tankt auf'
          : 'Sammelt';
  const visibleModuleKeys =
    state.view === 'space'
      ? spaceModules
      : state.view === 'adventure'
        ? adventureModules
        : [];
  const visibleModules = state.modules.filter((module) =>
    visibleModuleKeys.includes(module.key),
  );
  const moduleTitle =
    state.view === 'adventure'
      ? 'Abenteuer Module'
      : state.view === 'space'
        ? 'Weltraum Module'
        : 'Module';

  return (
    <aside className="side-panel left-panel">
      <section
        className="panel-block rocket-card"
        style={
          {
            '--rocket-image': `url(${getAssetUrl(rocketImage)})`,
          } as CSSProperties
        }
      >
        <div>
          <h2>RAKETE: EXPLORER I</h2>
          <p>
            {status} - {getSectorLabel(state.currentSector)}
          </p>
        </div>
        <div className="rocket-preview" aria-hidden="true">
          <span className="rocket-image-mini" />
          <span className="rocket-flame-mini" />
        </div>
        <div className="fuel-row">
          <strong>Treibstoff</strong>
          <Progress className="game-progress" value={fuelPercent} />
          <span>{Math.round(fuelPercent)}%</span>
        </div>
        {state.rocket.status === 'refueling' ? (
          <small className="refuel-note">
            Auftanken {formatSeconds(state.rocket.refuelTimer)}
          </small>
        ) : null}
      </section>

      <section className="panel-block">
        <h2>{moduleTitle}</h2>
        <div className="module-list">
          {visibleModules.length === 0 ? (
            <p>Module sind im Weltraum oder Abenteuer verfuegbar.</p>
          ) : null}
          {visibleModules.map((module) => {
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

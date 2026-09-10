import { Home, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  formatNumber,
  formatSeconds,
  getCargoCapacity,
  getCargoUsed,
} from '@/lib/game/simulation';
import type { GameState, ResourceKey } from '@/lib/game/types';
import { ResourceIcon } from './ResourceIcon';

const cargoResources: ResourceKey[] = [
  'metal',
  'titan',
  'crystal',
  'silicon',
  'alien',
];

export function RightPanel({
  state,
  onReturnCargo,
}: {
  state: GameState;
  onReturnCargo: () => void;
}) {
  const used = getCargoUsed(state);
  const capacity = getCargoCapacity(state);
  const isReturning = state.rocket.status === 'returning';
  const isUnloading = state.rocket.status === 'unloading';
  const isRefueling = state.rocket.status === 'refueling';
  const isBusy = isReturning || isUnloading || isRefueling;
  const returnProgress =
    isRefueling && state.rocket.refuelDuration > 0
      ? ((state.rocket.refuelDuration - state.rocket.refuelTimer) /
          state.rocket.refuelDuration) *
        100
      : state.rocket.returnDuration > 0
      ? ((state.rocket.returnDuration - state.rocket.returnTimer) /
          state.rocket.returnDuration) *
        100
      : 0;

  return (
    <aside className="side-panel right-panel">
      <section className="panel-block sector-map">
        <div className="panel-title-row">
          <h2>Sektor-Karte</h2>
          <button aria-label="Karte vergroessern">
            <Plus size={18} />
          </button>
        </div>
        <svg viewBox="0 0 240 130" role="img" aria-label="Sektor Alpha Karte">
          <path d="M25 38 L80 20 L138 48 L176 92 L212 58" />
          <path d="M25 38 L72 82 L122 106 L138 48" />
          {[25, 80, 138, 176, 212, 72, 122].map((x, index) => (
            <circle
              cx={x}
              cy={[38, 20, 48, 92, 58, 82, 106][index]}
              key={x}
              r={index === 3 ? 8 : 6}
            />
          ))}
        </svg>
      </section>

      <section className="panel-block">
        <h2>Rakete Sammelt</h2>
        <div className="income-list">
          <div>
            <ResourceIcon resource="metal" />
            <span>Metall</span>
            <strong>+32 /s</strong>
          </div>
          <div>
            <ResourceIcon resource="titan" />
            <span>Titan</span>
            <strong>+14 /s</strong>
          </div>
          <div>
            <ResourceIcon resource="crystal" />
            <span>Kristall</span>
            <strong>+8 /s</strong>
          </div>
        </div>
      </section>

      <section className="panel-block cargo-block">
        <h2>Frachtraum</h2>
        <Progress
          className="game-progress cargo-progress"
          value={(used / capacity) * 100}
        />
        <p>
          {formatNumber(used)} / {formatNumber(capacity)}
        </p>
        <div className="cargo-status">
          <strong>
            {isUnloading
              ? `Entladen ${formatSeconds(state.rocket.returnTimer)}`
              : isRefueling
                ? `Auftanken ${formatSeconds(state.rocket.refuelTimer)}`
              : isReturning
                ? 'Rueckflug zur Basis'
                : 'Sammelt automatisch'}
          </strong>
          {isBusy && (
            <Progress className="game-progress" value={returnProgress} />
          )}
        </div>
        <div className="cargo-list">
          {cargoResources.map((resource) => (
            <div key={resource}>
              <ResourceIcon resource={resource} />
              <span>{RESOURCE_LABELS[resource]}</span>
              <strong>{formatNumber(state.rocket.cargo[resource] ?? 0)}</strong>
            </div>
          ))}
        </div>
        <button
          className="primary-action"
          disabled={used <= 0 || isReturning || isRefueling}
          onClick={onReturnCargo}
        >
          <Home size={18} />
          {isUnloading
            ? 'Entladen beschleunigen'
            : isRefueling
              ? 'Tankt auf'
            : isReturning
              ? 'Rueckflug aktiv'
              : 'Zurueck zur Basis'}
        </button>
      </section>
    </aside>
  );
}

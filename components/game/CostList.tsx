import type { GameState, ResourceBag, ResourceKey } from '@/lib/game/types';
import { formatNumber, getFreeEnergy } from '@/lib/game/simulation';
import { ResourceIcon } from './ResourceIcon';

const hasEnough = (
  state: GameState,
  resource: ResourceKey,
  value: number,
) =>
  resource === 'energy'
    ? getFreeEnergy(state) >= value
    : state.resources[resource] >= value;

export function CostList({
  className,
  cost,
  state,
}: {
  className?: string;
  cost: Partial<ResourceBag>;
  state?: GameState;
}) {
  return (
    <span className={['cost-list', className].filter(Boolean).join(' ')}>
      {Object.entries(cost).map(([resource, value]) => {
        const resourceKey = resource as ResourceKey;
        const amount = value ?? 0;
        const missing = state ? !hasEnough(state, resourceKey, amount) : false;

        return (
          <span
            className={missing ? 'cost-item missing' : 'cost-item'}
            key={resource}
          >
            <ResourceIcon resource={resourceKey} />
            {formatNumber(amount)}
          </span>
        );
      })}
    </span>
  );
}

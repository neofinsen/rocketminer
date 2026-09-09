import type { ResourceBag, ResourceKey } from '@/lib/game/types';
import { formatNumber } from '@/lib/game/simulation';
import { ResourceIcon } from './ResourceIcon';

export function UpgradeTooltip({
  benefits,
  cost,
  label = 'Upgrade',
}: {
  benefits: string[];
  cost: Partial<ResourceBag>;
  label?: string;
}) {
  return (
    <span className="upgrade-toolbar" aria-hidden="true">
      <span className="upgrade-toolbar-title">{label}</span>
      <span className="upgrade-toolbar-section">
        <strong>Kosten</strong>
        <span className="upgrade-cost-list">
          {Object.entries(cost).map(([resource, value]) => (
            <span key={resource}>
              <ResourceIcon resource={resource as ResourceKey} />
              {formatNumber(value ?? 0)}
            </span>
          ))}
        </span>
      </span>
      <span className="upgrade-toolbar-section">
        <strong>Bringt</strong>
        {benefits.map((benefit) => (
          <span className="upgrade-benefit" key={benefit}>
            {benefit}
          </span>
        ))}
      </span>
    </span>
  );
}

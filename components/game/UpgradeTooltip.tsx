import type { GameState, ResourceBag } from '@/lib/game/types';
import { CostList } from './CostList';

export function UpgradeTooltip({
  benefits,
  cost,
  label = 'Upgrade',
  state,
}: {
  benefits: string[];
  cost: Partial<ResourceBag>;
  label?: string;
  state?: GameState;
}) {
  return (
    <span className="upgrade-toolbar" aria-hidden="true">
      <span className="upgrade-toolbar-title">{label}</span>
      <span className="upgrade-toolbar-section">
        <strong>Kosten</strong>
        <CostList className="upgrade-cost-list" cost={cost} state={state} />
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

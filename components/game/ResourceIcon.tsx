import type { ResourceKey } from '@/lib/game/types';

const colors: Record<ResourceKey, string> = {
  credits: 'gold',
  metal: 'metal',
  energy: 'energy',
  deuterium: 'deuterium',
  titan: 'titan',
  silicon: 'silicon',
  alien: 'alien',
};

const labels: Record<ResourceKey, string> = {
  credits: 'C',
  metal: 'M',
  energy: 'E',
  deuterium: 'D',
  titan: 'T',
  silicon: 'S',
  alien: 'A',
};

export function ResourceIcon({ resource }: { resource: ResourceKey }) {
  return (
    <span className={`resource-icon ${colors[resource]}`} aria-hidden="true">
      {labels[resource]}
    </span>
  );
}

import type { ResourceKey } from '@/lib/game/types';

const colors: Record<ResourceKey, string> = {
  credits: 'gold',
  wood: 'wood',
  metal: 'metal',
  energy: 'energy',
  crystal: 'crystal',
  titan: 'titan',
  silicon: 'silicon',
  alien: 'alien',
};

const labels: Record<ResourceKey, string> = {
  credits: 'C',
  wood: 'H',
  metal: 'M',
  energy: 'E',
  crystal: 'K',
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

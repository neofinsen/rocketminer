import { FlaskConical, LandPlot, Rocket, Satellite } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewKey } from '@/lib/game/types';

const items: Array<{
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { key: 'space', label: 'Weltraum', icon: Satellite },
  { key: 'city', label: 'Stadt', icon: LandPlot },
  { key: 'research', label: 'Forschung', icon: FlaskConical },
  { key: 'rocket', label: 'Rakete', icon: Rocket },
];

export function BottomDock({
  value,
  onChange,
}: {
  value: ViewKey;
  onChange: (view: ViewKey) => void;
}) {
  return (
    <Tabs
      className="bottom-dock"
      value={value}
      onValueChange={(next) => onChange(next as ViewKey)}
    >
      <TabsList className="dock-tabs" variant="line">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TabsTrigger className="dock-tab" key={item.key} value={item.key}>
              <Icon size={18} />
              {item.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

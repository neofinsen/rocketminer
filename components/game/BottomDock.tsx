import { FlaskConical, LandPlot, Rocket, RotateCcw, Satellite } from 'lucide-react';
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
  onReset,
}: {
  value: ViewKey;
  onChange: (view: ViewKey) => void;
  onReset: () => void;
}) {
  return (
    <div className="bottom-dock">
      <Tabs
        className="dock-shell"
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
      <button className="reset-save" onClick={onReset} title="Spielstand loeschen">
        <RotateCcw size={17} />
        Neu
      </button>
    </div>
  );
}

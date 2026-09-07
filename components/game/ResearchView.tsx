import { Atom, Battery, Navigation, Pickaxe } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const techs = [
  {
    name: 'Industrielle Produktion',
    icon: Pickaxe,
    progress: 68,
    effect: '+12% Grundproduktion',
  },
  {
    name: 'Energiespeicher',
    icon: Battery,
    progress: 45,
    effect: '+300 Energiekapazitaet',
  },
  {
    name: 'Interplanetare Navigation',
    icon: Navigation,
    progress: 28,
    effect: 'Sektor Beta vorbereiten',
  },
  {
    name: 'Alien-Technologie',
    icon: Atom,
    progress: 10,
    effect: 'Spezialmodule spaeter',
  },
];

export function ResearchView() {
  return (
    <section className="research-view" aria-label="Forschung">
      <div className="city-header">
        <div>
          <h2>Forschung</h2>
          <p>Erste Technologiepfade sind vorbereitet und spaeter ausbaubar.</p>
        </div>
      </div>
      <div className="tech-grid">
        {techs.map((tech) => {
          const Icon = tech.icon;
          return (
            <article className="tech-card" key={tech.name}>
              <Icon size={28} />
              <h3>{tech.name}</h3>
              <p>{tech.effect}</p>
              <Progress className="game-progress" value={tech.progress} />
              <button>Forschen</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

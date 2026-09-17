import { Play, RotateCcw } from 'lucide-react';
import starterRocket from './assets/rocketminer-starter-rocket-desert.png';
import advancedColony from './assets/rocketminer-rocket-advanced-colony.png';
import alienBiotech from './assets/rocketminer-rocket-alien-biotech.png';
import ancientRelic from './assets/rocketminer-rocket-ancient-relic.png';
import crystalSurvey from './assets/rocketminer-rocket-crystal-survey.png';
import desertSalvage from './assets/rocketminer-rocket-desert-salvage.png';
import iceExpedition from './assets/rocketminer-rocket-ice-expedition.png';
import industrialMilitary from './assets/rocketminer-rocket-industrial-military.png';
import neonCyber from './assets/rocketminer-rocket-neon-cyber.png';
import stealthDeepspace from './assets/rocketminer-rocket-stealth-deepspace.png';
import volcanicMiner from './assets/rocketminer-rocket-volcanic-miner.png';

type MenuMode = 'home' | 'rocket-select';

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

const rockets = [
  { key: 'starter', name: 'Rostige Starterrakete', asset: starterRocket, unlocked: true },
  { key: 'desert', name: 'Wuesten-Salvage', asset: desertSalvage, unlocked: false },
  { key: 'ice', name: 'Eis-Expedition', asset: iceExpedition, unlocked: false },
  { key: 'neon', name: 'Neon-Cyber', asset: neonCyber, unlocked: false },
  { key: 'alien', name: 'Alien-Biotech', asset: alienBiotech, unlocked: false },
  { key: 'volcanic', name: 'Vulkan-Miner', asset: volcanicMiner, unlocked: false },
  { key: 'relic', name: 'Relikt-Schiff', asset: ancientRelic, unlocked: false },
  { key: 'military', name: 'Militaer-Frachter', asset: industrialMilitary, unlocked: false },
  { key: 'crystal', name: 'Kristall-Scout', asset: crystalSurvey, unlocked: false },
  { key: 'stealth', name: 'Stealth-Jaeger', asset: stealthDeepspace, unlocked: false },
  { key: 'colony', name: 'Kolonie-Explorer', asset: advancedColony, unlocked: false },
];

export function MainMenu({
  hasSave,
  mode,
  onContinue,
  onNewRun,
  onSelectStarter,
  onSetMode,
}: {
  hasSave: boolean;
  mode: MenuMode;
  onContinue: () => void;
  onNewRun: () => void;
  onSelectStarter: () => void;
  onSetMode: (mode: MenuMode) => void;
}) {
  return (
    <main className="main-menu">
      <section className="main-menu-panel">
        <span className="main-menu-kicker">Rocketminer</span>
        <h1>Abenteuer starten</h1>
        <p>
          Waehle spaeter deine freigeschaltete Rakete. Im Moment ist nur die
          Starterrakete einsatzbereit.
        </p>

        {mode === 'home' ? (
          <div className="main-menu-actions">
            <button disabled={!hasSave} onClick={onContinue} type="button">
              <Play size={18} />
              Alten Spielstand fortsetzen
            </button>
            <button onClick={onNewRun} type="button">
              <RotateCcw size={18} />
              Neuen Run starten
            </button>
          </div>
        ) : (
          <>
            <div className="rocket-select-grid">
              {rockets.map((rocket) => (
                <button
                  className={rocket.unlocked ? 'rocket-select-card' : 'rocket-select-card locked'}
                  disabled={!rocket.unlocked}
                  key={rocket.key}
                  onClick={rocket.unlocked ? onSelectStarter : undefined}
                  type="button"
                >
                  <img alt="" src={getAssetUrl(rocket.asset)} />
                  <strong>{rocket.name}</strong>
                  <small>{rocket.unlocked ? 'Bereit' : 'Gesperrt'}</small>
                </button>
              ))}
            </div>
            <button className="menu-back-button" onClick={() => onSetMode('home')} type="button">
              Zurueck
            </button>
          </>
        )}
      </section>
    </main>
  );
}

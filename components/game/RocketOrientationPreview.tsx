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

const rockets = [
  ['Wuesten', desertSalvage],
  ['Eis', iceExpedition],
  ['Neon', neonCyber],
  ['Alien', alienBiotech],
  ['Vulkan', volcanicMiner],
  ['Relikt', ancientRelic],
  ['Militaer', industrialMilitary],
  ['Kristall', crystalSurvey],
  ['Stealth', stealthDeepspace],
  ['Kolonie', advancedColony],
] as const;

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

export function RocketOrientationPreview() {
  return (
    <div className="rocket-orientation-preview">
      <strong>Raketen-Auswahl</strong>
      <small>Option C: Bild zeigt nach oben, das Spiel rotiert.</small>
      <div className="rocket-orientation-grid">
        {rockets.map(([label, asset], index) => (
          <span className="rocket-orientation-card" key={label}>
            <img
              alt=""
              src={getAssetUrl(asset)}
              style={{ '--preview-rotation': `${(index % 4) * 45}deg` } as React.CSSProperties}
            />
            <small>{label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

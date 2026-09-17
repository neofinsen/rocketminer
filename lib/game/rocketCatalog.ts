import type { RocketKey } from './types';
import starterRocket from '@/components/game/assets/rocketminer-starter-rocket-desert.png';
import advancedColony from '@/components/game/assets/rocketminer-rocket-advanced-colony.png';
import alienBiotech from '@/components/game/assets/rocketminer-rocket-alien-biotech.png';
import ancientRelic from '@/components/game/assets/rocketminer-rocket-ancient-relic.png';
import crystalSurvey from '@/components/game/assets/rocketminer-rocket-crystal-survey.png';
import desertSalvage from '@/components/game/assets/rocketminer-rocket-desert-salvage.png';
import iceExpedition from '@/components/game/assets/rocketminer-rocket-ice-expedition.png';
import industrialMilitary from '@/components/game/assets/rocketminer-rocket-industrial-military.png';
import neonCyber from '@/components/game/assets/rocketminer-rocket-neon-cyber.png';
import stealthDeepspace from '@/components/game/assets/rocketminer-rocket-stealth-deepspace.png';
import volcanicMiner from '@/components/game/assets/rocketminer-rocket-volcanic-miner.png';
import starterCombat from '@/components/game/assets/rocketminer-adventure-bg-desert-orbit.png';
import advancedColonyBg from '@/components/game/assets/rocketminer-combat-bg-advanced-colony.png';
import alienBiotechBg from '@/components/game/assets/rocketminer-combat-bg-alien-biotech.png';
import ancientRelicBg from '@/components/game/assets/rocketminer-combat-bg-ancient-relic.png';
import crystalSurveyBg from '@/components/game/assets/rocketminer-combat-bg-crystal-survey.png';
import desertSalvageBg from '@/components/game/assets/rocketminer-combat-bg-desert-salvage.png';
import iceExpeditionBg from '@/components/game/assets/rocketminer-combat-bg-ice-expedition.png';
import industrialMilitaryBg from '@/components/game/assets/rocketminer-combat-bg-industrial-military.png';
import neonCyberBg from '@/components/game/assets/rocketminer-combat-bg-neon-cyber.png';
import stealthDeepspaceBg from '@/components/game/assets/rocketminer-combat-bg-stealth-deepspace.png';
import volcanicMinerBg from '@/components/game/assets/rocketminer-combat-bg-volcanic-miner.png';

export const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

export const ROCKET_CATALOG: Array<{
  key: RocketKey;
  name: string;
  genre: string;
  unlocked: boolean;
  artRotationDeg: number;
  rocketAsset: unknown;
  worldAsset: unknown;
}> = [
  {
    key: 'starter',
    name: 'Rostige Starterrakete',
    genre: 'Wuesten-Orbit',
    unlocked: true,
    artRotationDeg: 0,
    rocketAsset: starterRocket,
    worldAsset: starterCombat,
  },
  { key: 'desert', name: 'Wuesten-Salvage', genre: 'Schrottwueste', unlocked: false, artRotationDeg: -24, rocketAsset: desertSalvage, worldAsset: desertSalvageBg },
  { key: 'ice', name: 'Eis-Expedition', genre: 'Eisfeld', unlocked: false, artRotationDeg: -10, rocketAsset: iceExpedition, worldAsset: iceExpeditionBg },
  { key: 'neon', name: 'Neon-Cyber', genre: 'Neon-Korridor', unlocked: false, artRotationDeg: -12, rocketAsset: neonCyber, worldAsset: neonCyberBg },
  { key: 'alien', name: 'Alien-Biotech', genre: 'Organische Zone', unlocked: false, artRotationDeg: -16, rocketAsset: alienBiotech, worldAsset: alienBiotechBg },
  { key: 'volcanic', name: 'Vulkan-Miner', genre: 'Vulkanfeld', unlocked: false, artRotationDeg: -18, rocketAsset: volcanicMiner, worldAsset: volcanicMinerBg },
  { key: 'relic', name: 'Relikt-Schiff', genre: 'Altes Relikt', unlocked: false, artRotationDeg: -12, rocketAsset: ancientRelic, worldAsset: ancientRelicBg },
  { key: 'military', name: 'Militaer-Frachter', genre: 'Kriegszone', unlocked: false, artRotationDeg: 2, rocketAsset: industrialMilitary, worldAsset: industrialMilitaryBg },
  { key: 'crystal', name: 'Kristall-Scout', genre: 'Kristallnebel', unlocked: false, artRotationDeg: -24, rocketAsset: crystalSurvey, worldAsset: crystalSurveyBg },
  { key: 'stealth', name: 'Stealth-Jaeger', genre: 'Tiefraum', unlocked: false, artRotationDeg: -28, rocketAsset: stealthDeepspace, worldAsset: stealthDeepspaceBg },
  { key: 'colony', name: 'Kolonie-Explorer', genre: 'Koloniefront', unlocked: false, artRotationDeg: -26, rocketAsset: advancedColony, worldAsset: advancedColonyBg },
];

export const getRocketDefinition = (key: RocketKey) =>
  ROCKET_CATALOG.find((rocket) => rocket.key === key) ?? ROCKET_CATALOG[0];

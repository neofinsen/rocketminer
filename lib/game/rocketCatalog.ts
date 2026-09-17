import type { RocketKey } from './types';
import starterRocket from '@/components/game/assets/rocketminer-starter-rocket-desert.png';
import advancedColony from '@/components/game/assets/rocketminer-rocket-advanced-colony-v2.png';
import alienBiotech from '@/components/game/assets/rocketminer-rocket-alien-biotech-v2.png';
import ancientRelic from '@/components/game/assets/rocketminer-rocket-ancient-relic-v2.png';
import crystalSurvey from '@/components/game/assets/rocketminer-rocket-crystal-survey-v2.png';
import desertSalvage from '@/components/game/assets/rocketminer-rocket-desert-salvage-v2.png';
import iceExpedition from '@/components/game/assets/rocketminer-rocket-ice-expedition-v2.png';
import industrialMilitary from '@/components/game/assets/rocketminer-rocket-industrial-military-v2.png';
import neonCyber from '@/components/game/assets/rocketminer-rocket-neon-cyber-v2.png';
import stealthDeepspace from '@/components/game/assets/rocketminer-rocket-stealth-deepspace-v2.png';
import volcanicMiner from '@/components/game/assets/rocketminer-rocket-volcanic-miner-v2.png';
import starterCombat from '@/components/game/assets/rocketminer-adventure-bg-desert-orbit.png';
import starterEnemy0 from '@/components/game/assets/rocketminer-enemy-0.png';
import starterEnemy1 from '@/components/game/assets/rocketminer-enemy-1.png';
import starterEnemy2 from '@/components/game/assets/rocketminer-enemy-2.png';
import alienEnemy0 from '@/components/game/assets/rocketminer-enemy-alien-0.png';
import alienEnemy1 from '@/components/game/assets/rocketminer-enemy-alien-1.png';
import alienEnemy2 from '@/components/game/assets/rocketminer-enemy-alien-2.png';
import colonyEnemy0 from '@/components/game/assets/rocketminer-enemy-colony-0.png';
import colonyEnemy1 from '@/components/game/assets/rocketminer-enemy-colony-1.png';
import colonyEnemy2 from '@/components/game/assets/rocketminer-enemy-colony-2.png';
import crystalEnemy0 from '@/components/game/assets/rocketminer-enemy-crystal-0.png';
import crystalEnemy1 from '@/components/game/assets/rocketminer-enemy-crystal-1.png';
import crystalEnemy2 from '@/components/game/assets/rocketminer-enemy-crystal-2.png';
import iceEnemy0 from '@/components/game/assets/rocketminer-enemy-ice-0.png';
import iceEnemy1 from '@/components/game/assets/rocketminer-enemy-ice-1.png';
import iceEnemy2 from '@/components/game/assets/rocketminer-enemy-ice-2.png';
import militaryEnemy0 from '@/components/game/assets/rocketminer-enemy-military-0.png';
import militaryEnemy1 from '@/components/game/assets/rocketminer-enemy-military-1.png';
import militaryEnemy2 from '@/components/game/assets/rocketminer-enemy-military-2.png';
import neonEnemy0 from '@/components/game/assets/rocketminer-enemy-neon-0.png';
import neonEnemy1 from '@/components/game/assets/rocketminer-enemy-neon-1.png';
import neonEnemy2 from '@/components/game/assets/rocketminer-enemy-neon-2.png';
import relicEnemy0 from '@/components/game/assets/rocketminer-enemy-relic-0.png';
import relicEnemy1 from '@/components/game/assets/rocketminer-enemy-relic-1.png';
import relicEnemy2 from '@/components/game/assets/rocketminer-enemy-relic-2.png';
import stealthEnemy0 from '@/components/game/assets/rocketminer-enemy-stealth-0.png';
import stealthEnemy1 from '@/components/game/assets/rocketminer-enemy-stealth-1.png';
import stealthEnemy2 from '@/components/game/assets/rocketminer-enemy-stealth-2.png';
import volcanicEnemy0 from '@/components/game/assets/rocketminer-enemy-volcanic-0.png';
import volcanicEnemy1 from '@/components/game/assets/rocketminer-enemy-volcanic-1.png';
import volcanicEnemy2 from '@/components/game/assets/rocketminer-enemy-volcanic-2.png';
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
  enemyAssets: [unknown, unknown, unknown];
  rocketAsset: unknown;
  worldAsset: unknown;
}> = [
  {
    key: 'starter',
    name: 'Rostige Starterrakete',
    genre: 'Wuesten-Orbit',
    unlocked: true,
    enemyAssets: [starterEnemy0, starterEnemy1, starterEnemy2],
    rocketAsset: starterRocket,
    worldAsset: starterCombat,
  },
  { key: 'desert', name: 'Wuesten-Salvage', genre: 'Schrottwueste', unlocked: false, enemyAssets: [starterEnemy0, starterEnemy1, starterEnemy2], rocketAsset: desertSalvage, worldAsset: desertSalvageBg },
  { key: 'ice', name: 'Eis-Expedition', genre: 'Eisfeld', unlocked: false, enemyAssets: [iceEnemy0, iceEnemy1, iceEnemy2], rocketAsset: iceExpedition, worldAsset: iceExpeditionBg },
  { key: 'neon', name: 'Neon-Cyber', genre: 'Neon-Korridor', unlocked: false, enemyAssets: [neonEnemy0, neonEnemy1, neonEnemy2], rocketAsset: neonCyber, worldAsset: neonCyberBg },
  { key: 'alien', name: 'Alien-Biotech', genre: 'Organische Zone', unlocked: false, enemyAssets: [alienEnemy0, alienEnemy1, alienEnemy2], rocketAsset: alienBiotech, worldAsset: alienBiotechBg },
  { key: 'volcanic', name: 'Vulkan-Miner', genre: 'Vulkanfeld', unlocked: false, enemyAssets: [volcanicEnemy0, volcanicEnemy1, volcanicEnemy2], rocketAsset: volcanicMiner, worldAsset: volcanicMinerBg },
  { key: 'relic', name: 'Relikt-Schiff', genre: 'Altes Relikt', unlocked: false, enemyAssets: [relicEnemy0, relicEnemy1, relicEnemy2], rocketAsset: ancientRelic, worldAsset: ancientRelicBg },
  { key: 'military', name: 'Militaer-Frachter', genre: 'Kriegszone', unlocked: false, enemyAssets: [militaryEnemy0, militaryEnemy1, militaryEnemy2], rocketAsset: industrialMilitary, worldAsset: industrialMilitaryBg },
  { key: 'crystal', name: 'Kristall-Scout', genre: 'Kristallnebel', unlocked: false, enemyAssets: [crystalEnemy0, crystalEnemy1, crystalEnemy2], rocketAsset: crystalSurvey, worldAsset: crystalSurveyBg },
  { key: 'stealth', name: 'Stealth-Jaeger', genre: 'Tiefraum', unlocked: false, enemyAssets: [stealthEnemy0, stealthEnemy1, stealthEnemy2], rocketAsset: stealthDeepspace, worldAsset: stealthDeepspaceBg },
  { key: 'colony', name: 'Kolonie-Explorer', genre: 'Koloniefront', unlocked: false, enemyAssets: [colonyEnemy0, colonyEnemy1, colonyEnemy2], rocketAsset: advancedColony, worldAsset: advancedColonyBg },
];

export const getRocketDefinition = (key: RocketKey) =>
  ROCKET_CATALOG.find((rocket) => rocket.key === key) ?? ROCKET_CATALOG[0];

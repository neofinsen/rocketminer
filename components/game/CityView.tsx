'use client';

import { RESOURCE_LABELS } from '@/lib/game/constants';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  canPay,
  formatNumber,
  getBuildingCost,
  getProductionPerMinute,
} from '@/lib/game/simulation';
import type { BuildingKey, GameState, ResourceKey } from '@/lib/game/types';
import {
  formatCostTitle,
  getBuildingUpgradeBenefits,
} from '@/lib/game/upgradeInfo';
import { ResourceIcon } from './ResourceIcon';
import { UpgradeTooltip } from './UpgradeTooltip';
import buildingSheetImage from './assets/rocketminer-building-sheet-desert.png';
import terrainImage from './assets/rocketminer-city-terrain-desert.png';

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

type BuildingVisual = {
  size: 'large' | 'medium' | 'small';
  variant: string;
  sprite: string;
};

const cityLayout: Record<BuildingKey, BuildingVisual> = {
  townhall: {
    size: 'medium',
    variant: 'civic',
    sprite: 'townhall',
  },
  sawmill: {
    size: 'medium',
    variant: 'bio',
    sprite: 'sawmill',
  },
  quarry: {
    size: 'medium',
    variant: 'mine',
    sprite: 'quarry',
  },
  forge: {
    size: 'medium',
    variant: 'forge',
    sprite: 'forge',
  },
  research: {
    size: 'medium',
    variant: 'research',
    sprite: 'research',
  },
  spaceport: {
    size: 'large',
    variant: 'spaceport',
    sprite: 'spaceport',
  },
  power: {
    size: 'medium',
    variant: 'power',
    sprite: 'power',
  },
  warehouse: {
    size: 'small',
    variant: 'storage',
    sprite: 'warehouse',
  },
};

const buildSlots = [
  { id: 'slot-01', x: 12.5, y: 12 },
  { id: 'slot-02', x: 46, y: 31 },
  { id: 'slot-03', x: 58.5, y: 35.5 },
  { id: 'slot-04', x: 33, y: 40 },
  { id: 'slot-05', x: 51, y: 49 },
  { id: 'slot-06', x: 69, y: 47 },
  { id: 'slot-07', x: 39, y: 63 },
  { id: 'slot-08', x: 57, y: 60 },
  { id: 'slot-09', x: 78, y: 65 },
  { id: 'slot-10', x: 50.5, y: 75 },
  { id: 'slot-11', x: 66, y: 74 },
  { id: 'slot-12', x: 28, y: 78 },
] as const;

export function CityView({
  state,
  onBuildAtSlot,
  onUpgradeBuilding,
}: {
  state: GameState;
  onBuildAtSlot: (key: BuildingKey, slotId: string) => void;
  onUpgradeBuilding: (key: BuildingKey) => void;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const production = getProductionPerMinute(state.buildings);
  const occupiedSlots = new Set(
    state.buildings
      .filter((building) => building.level > 0)
      .map((building) => state.cityPlacements[building.key]),
  );
  const selectedSlot = buildSlots.find((slot) => slot.id === selectedSlotId);
  const buildableBuildings = state.buildings.filter((building) => building.level === 0);

  return (
    <section className="city-view city-map-view" aria-label="Stadtansicht">
      <div className="city-header">
        <div>
          <h2>Basisstadt</h2>
          <p>Futuristische Kolonie mit Raumhafen, Energieachse und Industriebezirk.</p>
        </div>
        <div className="city-totals">
          {Object.entries(production).map(([key, value]) => (
            <span key={key}>
              {RESOURCE_LABELS[key as keyof typeof RESOURCE_LABELS]} +
              {formatNumber(value)}/min
            </span>
          ))}
        </div>
      </div>

      <div
        className="city-map"
        aria-label="Basis-Karte"
        style={{
          '--building-sheet-image': `url(${getAssetUrl(buildingSheetImage)})`,
          '--city-terrain-image': `url(${getAssetUrl(terrainImage)})`,
        } as CSSProperties}
      >
        <span className="city-grid-glow" />
        <span className="city-plaza core" />
        <span className="city-plaza launch" />
        <span className="city-road main" />
        <span className="city-road north" />
        <span className="city-road south" />
        <span className="city-road spur" />

        {buildSlots.map((slot) => {
          const isOccupied = occupiedSlots.has(slot.id);

          return (
            <button
              aria-label={`Baufeld ${slot.id}`}
              className={`city-build-slot ${isOccupied ? 'occupied' : 'free'} ${
                selectedSlotId === slot.id ? 'selected' : ''
              }`}
              disabled={isOccupied}
              key={slot.id}
              onClick={() => setSelectedSlotId(slot.id)}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              title={isOccupied ? 'Belegt' : 'Baufeld auswaehlen'}
              type="button"
            >
              <span className="slot-dot" />
              <span className="slot-plus">+</span>
              <span className="slot-label">Bauen</span>
            </button>
          );
        })}

        {state.buildings
          .filter((building) => building.level > 0)
          .map((building) => {
            const visual = cityLayout[building.key];
            const slot = buildSlots.find(
              (item) => item.id === state.cityPlacements[building.key],
            );
            if (!slot) return null;

            const cost = getBuildingCost(building);
            const affordable = canPay(state.resources, cost);
            const output = Object.entries(building.production);

            return (
              <button
                className={`city-building ${visual.variant} ${visual.size} ${
                  'built'
                }`}
                disabled={!affordable}
                key={building.key}
                onClick={() => onUpgradeBuilding(building.key)}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                title={`Ausbaukosten: ${formatCostTitle(cost)}`}
                type="button"
              >
                <span className="building-pad">
                  <span className={`building-sprite sprite-${visual.sprite}`} />
                </span>
                <span className="building-label">
                  <strong>{building.name}</strong>
                  <small>Stufe {building.level}</small>
                </span>
                <span className="building-output">
                  {output.map(([resource, value]) => (
                    <span key={resource} className="output-chip">
                      <ResourceIcon resource={resource as ResourceKey} />
                      +{formatNumber((value ?? 0) * building.level)}
                    </span>
                  ))}
                </span>
                <UpgradeTooltip
                  benefits={getBuildingUpgradeBenefits(building)}
                  cost={cost}
                  label={`Ausbau auf Stufe ${building.level + 1}`}
                />
              </button>
            );
          })}

        {selectedSlot ? (
          <div
            className="building-picker"
            style={{ left: `${selectedSlot.x}%`, top: `${selectedSlot.y}%` }}
          >
            <div className="building-picker-head">
              <strong>Gebaeude bauen</strong>
              <button
                aria-label="Auswahl schliessen"
                onClick={() => setSelectedSlotId(null)}
                type="button"
              >
                x
              </button>
            </div>
            {buildableBuildings.map((building) => {
              const cost = getBuildingCost(building);
              const affordable = canPay(state.resources, cost);

              return (
                <button
                  className="building-picker-option"
                  disabled={!affordable}
                  key={building.key}
                  onClick={() => {
                    onBuildAtSlot(building.key, selectedSlot.id);
                    setSelectedSlotId(null);
                  }}
                  title={`Baukosten: ${formatCostTitle(cost)}`}
                  type="button"
                >
                  <span>
                    <strong>{building.name}</strong>
                    <small>{formatCostTitle(cost)}</small>
                  </span>
                  <span>Bauen</span>
                </button>
              );
            })}
            {buildableBuildings.length === 0 ? (
              <p>Alle Gebaeude sind gebaut.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

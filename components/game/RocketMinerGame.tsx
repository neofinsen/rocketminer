'use client';

import { useEffect, useRef, useState } from 'react';
import { INITIAL_STATE } from '@/lib/game/constants';
import {
  addResources,
  canPay,
  getBuildingCost,
  getLaserDamage,
  getModuleCost,
  payCost,
  tickGame,
} from '@/lib/game/simulation';
import type {
  Asteroid,
  BuildingKey,
  GameState,
  ModuleKey,
  ResourceKey,
  ViewKey,
} from '@/lib/game/types';
import { BottomDock } from './BottomDock';
import { CityView } from './CityView';
import { LeftPanel } from './LeftPanel';
import { ResearchView } from './ResearchView';
import { RightPanel } from './RightPanel';
import { RocketView } from './RocketView';
import { SpaceScene } from './SpaceScene';
import { TopBar } from './TopBar';

const asteroidTypes: Asteroid['type'][] = ['iron', 'titan', 'crystal'];

const asteroidResource: Record<Asteroid['type'], ResourceKey> = {
  iron: 'metal',
  titan: 'titan',
  crystal: 'crystal',
};

function spawnAsteroid(nextId: number): Asteroid {
  const type = asteroidTypes[nextId % asteroidTypes.length];
  return {
    id: nextId,
    type,
    x: 40 + ((nextId * 19) % 48),
    y: 18 + ((nextId * 23) % 60),
    hp: 1450 + (nextId % 4) * 420,
    maxHp: 1450 + (nextId % 4) * 420,
    resource: asteroidResource[type],
  };
}

function fragmentsFromAsteroid(asteroid: Asteroid, nextId: number) {
  return Array.from({ length: 7 }, (_, index) => ({
    id: nextId + index,
    x: asteroid.x + Math.cos(index * 0.9) * (4 + index * 0.45),
    y: asteroid.y + Math.sin(index * 0.9) * (4 + index * 0.45),
    resource: asteroid.resource,
    amount: 34 + index * 8,
  }));
}

function completeQuestIfNeeded(state: GameState): GameState {
  if (state.quest.done || state.quest.current < state.quest.target) return state;

  return {
    ...state,
    resources: addResources(state.resources, state.quest.reward),
    level: state.level + 1,
    quest: { ...state.quest, done: true },
  };
}

export function RocketMinerGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const lastFrame = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;

    const loop = (time: number) => {
      const last = lastFrame.current ?? time;
      const deltaSeconds = Math.min((time - last) / 1000, 0.08);
      lastFrame.current = time;
      setState((current) => tickGame(current, deltaSeconds));
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setView = (view: ViewKey) =>
    setState((current) => ({ ...current, view }));

  const hitAsteroid = (id: number) => {
    setState((current) => {
      const damage = getLaserDamage(current);
      const asteroid = current.asteroids.find((item) => item.id === id);
      if (!asteroid) return current;

      const nextAsteroid = { ...asteroid, hp: asteroid.hp - damage };
      const damageText = {
        id: current.nextId,
        x: asteroid.x + 8,
        y: asteroid.y - 5,
        value: damage,
      };

      if (nextAsteroid.hp > 0) {
        return {
          ...current,
          asteroids: current.asteroids.map((item) =>
            item.id === id ? nextAsteroid : item,
          ),
          damageTexts: [...current.damageTexts, damageText],
          nextId: current.nextId + 1,
        };
      }

      const fragments = fragmentsFromAsteroid(asteroid, current.nextId + 1);
      const spawned = spawnAsteroid(current.nextId + fragments.length + 1);
      const updated = {
        ...current,
        asteroids: [
          ...current.asteroids.filter((item) => item.id !== id),
          spawned,
        ],
        fragments: [...current.fragments, ...fragments],
        damageTexts: [...current.damageTexts, damageText],
        quest: {
          ...current.quest,
          current: Math.min(current.quest.current + 1, current.quest.target),
        },
        nextId: current.nextId + fragments.length + 2,
      };

      return completeQuestIfNeeded(updated);
    });
  };

  const upgradeModule = (key: ModuleKey) => {
    setState((current) => {
      const module = current.modules.find((item) => item.key === key);
      if (!module) return current;
      const cost = getModuleCost(key, module.level);
      if (!canPay(current.resources, cost)) return current;

      return {
        ...current,
        resources: payCost(current.resources, cost),
        modules: current.modules.map((item) =>
          item.key === key ? { ...item, level: item.level + 1 } : item,
        ),
      };
    });
  };

  const upgradeBuilding = (key: BuildingKey) => {
    setState((current) => {
      const building = current.buildings.find((item) => item.key === key);
      if (!building) return current;
      const cost = getBuildingCost(building);
      if (!canPay(current.resources, cost)) return current;

      return {
        ...current,
        resources: payCost(current.resources, cost),
        buildings: current.buildings.map((item) =>
          item.key === key ? { ...item, level: item.level + 1 } : item,
        ),
      };
    });
  };

  const returnCargo = () => {
    setState((current) => ({
      ...current,
      resources: addResources(current.resources, current.rocket.cargo),
      rocket: { ...current.rocket, cargo: {} },
    }));
  };

  return (
    <main className="game-shell">
      <TopBar state={state} />
      <div className="game-layout">
        <LeftPanel state={state} onUpgradeModule={upgradeModule} />
        <div className="center-stage">
          {state.view === 'space' ? (
            <SpaceScene state={state} onHitAsteroid={hitAsteroid} />
          ) : null}
          {state.view === 'city' ? (
            <CityView state={state} onUpgradeBuilding={upgradeBuilding} />
          ) : null}
          {state.view === 'research' ? <ResearchView /> : null}
          {state.view === 'rocket' ? (
            <RocketView state={state} onUpgradeModule={upgradeModule} />
          ) : null}
        </div>
        <RightPanel state={state} onReturnCargo={returnCargo} />
      </div>
      <BottomDock value={state.view} onChange={setView} />
    </main>
  );
}

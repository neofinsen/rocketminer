'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_STATE } from '@/lib/game/constants';
import { applyQuestEvent, syncQuestProgress } from '@/lib/game/quests';
import {
  getTech,
  getTechCost,
  INITIAL_RESEARCH,
  isTechAvailable,
} from '@/lib/game/research';
import {
  addResources,
  canBuildNewRocket,
  canPay,
  canPayCost,
  getBuildingCost,
  getModuleCost,
  newRocketCost,
  payCost,
  queueProjectile,
  startCargoReturn,
  tickGame,
} from '@/lib/game/simulation';
import { loadGameState, resetGameState, saveGameState } from '@/lib/game/storage';
import type {
  BuildingKey,
  GameState,
  ModuleKey,
  ResourceBag,
  TechKey,
  ViewKey,
  WeaponUpgradeChoice,
} from '@/lib/game/types';
import { BottomDock } from './BottomDock';
import { CityView } from './CityView';
import { LeftPanel } from './LeftPanel';
import { ResearchView } from './ResearchView';
import { RightPanel } from './RightPanel';
import { AdventureView } from './AdventureView';
import { SpaceScene } from './SpaceScene';
import { TopBar } from './TopBar';
import './adventure.css';
import './space-assets.css';

export function RocketMinerGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const lastFrame = useRef<number | null>(null);
  const saveLoaded = useRef(false);
  const latestState = useRef(state);

  useEffect(() => {
    const loaded = syncQuestProgress(loadGameState());
    saveLoaded.current = true;
    latestState.current = loaded;
    setState(loaded);
  }, []);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    let frame = 0;

    const loop = (time: number) => {
      const last = lastFrame.current ?? time;
      const deltaSeconds = Math.min((time - last) / 1000, 0.08);
      lastFrame.current = time;
      setState((current) => syncQuestProgress(tickGame(current, deltaSeconds)));
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const autosave = window.setInterval(() => {
      if (!saveLoaded.current) return;
      saveGameState(latestState.current);
    }, 1500);

    return () => window.clearInterval(autosave);
  }, []);

  const setView = (view: ViewKey) =>
    setState((current) => ({ ...current, view }));

  const hitAsteroid = (id: number) =>
    setState((current) => queueProjectile(current, id));

  const upgradeModule = (key: ModuleKey) => {
    setState((current) => {
      const rocketModule = current.modules.find((item) => item.key === key);
      if (!rocketModule) return current;
      const cost = getModuleCost(key, rocketModule.level);
      if (!canPay(current.resources, cost)) return current;

      const upgraded = {
        ...current,
        resources: payCost(current.resources, cost),
        modules: current.modules.map((item) =>
          item.key === key ? { ...item, level: item.level + 1 } : item,
        ),
      };

      return applyQuestEvent(upgraded, {
        goal: 'module',
        key,
        level: rocketModule.level + 1,
      });
    });
  };

  const upgradeBuilding = (key: BuildingKey) => {
    setState((current) => {
      const building = current.buildings.find((item) => item.key === key);
      if (!building) return current;
      const cost = getBuildingCost(building);
      if (!canPayCost(current, cost)) return current;

      const upgraded = {
        ...current,
        resources: payCost(current.resources, cost),
        buildings: current.buildings.map((item) =>
          item.key === key ? { ...item, level: item.level + 1 } : item,
        ),
      };

      return applyQuestEvent(upgraded, {
        goal: 'building',
        key,
        level: building.level + 1,
      });
    });
  };

  const buildAtSlot = (key: BuildingKey, slotId: string) => {
    setState((current) => {
      const occupiedSlots = current.buildings
        .filter((building) => building.level > 0)
        .map((building) => current.cityPlacements[building.key]);
      if (occupiedSlots.includes(slotId)) return current;

      const building = current.buildings.find((item) => item.key === key);
      if (!building || building.level > 0) return current;
      const cost = getBuildingCost(building);
      if (!canPayCost(current, cost)) return current;

      const upgraded = {
        ...current,
        resources: payCost(current.resources, cost),
        cityPlacements: {
          ...current.cityPlacements,
          [key]: slotId,
        },
        buildings: current.buildings.map((item) =>
          item.key === key ? { ...item, level: 1 } : item,
        ),
      };

      return applyQuestEvent(upgraded, {
        goal: 'building',
        key,
        level: 1,
      });
    });
  };

  const researchTech = (key: TechKey) => {
    setState((current) => {
      const tech = getTech(key);
      if (!tech) return current;
      const cost = getTechCost(current, tech);
      if (!isTechAvailable(current, tech) || !canPayCost(current, cost)) {
        return current;
      }

      return {
        ...current,
        resources: payCost(current.resources, cost),
        research: {
          ...current.research,
          [key]: true,
        },
      };
    });
  };

  const buildNewRocket = () => {
    setState((current) => {
      if (!canBuildNewRocket(current) || !canPayCost(current, newRocketCost)) {
        return current;
      }

      const nextSector = current.currentSector === 'alpha' ? 'beta' : 'alpha';

      return {
        ...current,
        resources: payCost(current.resources, newRocketCost),
        currentSector: nextSector,
        unlockedSectors: Array.from(
          new Set([...current.unlockedSectors, nextSector]),
        ),
        view: 'space',
        level: current.level + 1,
        questIndex: 0,
        quest: INITIAL_STATE.quest,
        collectedTotals: {},
        destroyedAsteroids: 0,
        research: { ...INITIAL_RESEARCH },
        rocket: {
          ...INITIAL_STATE.rocket,
          cargo: {},
        },
        asteroids: INITIAL_STATE.asteroids.map((asteroid) => ({ ...asteroid })),
        fragments: INITIAL_STATE.fragments.map((fragment) => ({ ...fragment })),
        projectiles: [],
        damageTexts: [],
        sectorProgress: 0,
        newRocketBuilt: false,
        weaponUpgrades: INITIAL_STATE.weaponUpgrades,
        weaponAchievement: undefined,
        nextId: INITIAL_STATE.nextId,
      };
    });
  };

  const returnCargo = () =>
    setState((current) =>
      current.rocket.status === 'unloading'
        ? {
            ...current,
            rocket: {
              ...current.rocket,
              returnTimer: Math.max(0, current.rocket.returnTimer - 15),
            },
          }
        : current.rocket.status === 'refueling'
          ? {
              ...current,
              rocket: {
                ...current.rocket,
                refuelTimer: Math.max(0, current.rocket.refuelTimer - 15),
              },
            }
        : startCargoReturn(current),
    );

  const claimAdventureReward = useCallback(
    (reward: Partial<ResourceBag>) =>
      setState((current) => ({
        ...current,
        resources: addResources(current, current.resources, reward),
      })),
    [],
  );

  const chooseWeaponUpgrade = useCallback((choice: WeaponUpgradeChoice) => {
    setState((current) => {
      const weaponLevel =
        current.modules.find((module) => module.key === 'weapon')?.level ?? 1;
      const availableLevels = Array.from(
        { length: Math.floor(weaponLevel / 5) },
        (_, index) => (index + 1) * 5,
      );
      const milestone = availableLevels.find(
        (level) => !current.weaponUpgrades.claimedLevels.includes(level),
      );
      if (!milestone) return current;
      if (choice === 'rapidFire' && current.weaponUpgrades.rapidFire >= 5) {
        return current;
      }
      if (choice === 'multiShot' && current.weaponUpgrades.multiShot >= 4) {
        return current;
      }

      return {
        ...current,
        weaponUpgrades: {
          rapidFire:
            current.weaponUpgrades.rapidFire + (choice === 'rapidFire' ? 1 : 0),
          multiShot:
            current.weaponUpgrades.multiShot + (choice === 'multiShot' ? 1 : 0),
          claimedLevels: [...current.weaponUpgrades.claimedLevels, milestone],
        },
      };
    });
  }, []);

  const resetSave = () => {
    resetGameState();
    lastFrame.current = null;
    setState(INITIAL_STATE);
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
            <CityView
              state={state}
              onBuildAtSlot={buildAtSlot}
              onBuildNewRocket={buildNewRocket}
              onUpgradeBuilding={upgradeBuilding}
            />
          ) : null}
          {state.view === 'research' ? (
            <ResearchView state={state} onResearchTech={researchTech} />
          ) : null}
          {state.view === 'adventure' ? (
            <AdventureView
              state={state}
              onChooseWeaponUpgrade={chooseWeaponUpgrade}
              onClaimReward={claimAdventureReward}
            />
          ) : null}
        </div>
        <RightPanel state={state} onReturnCargo={returnCargo} />
      </div>
      <BottomDock value={state.view} onChange={setView} onReset={resetSave} />
    </main>
  );
}

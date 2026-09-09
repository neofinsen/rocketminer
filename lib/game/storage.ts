import { INITIAL_STATE, QUEST_CHAIN } from './constants';
import type { GameState } from './types';

const SAVE_KEY = 'rocketminer-save-v2';

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return INITIAL_STATE;

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return INITIAL_STATE;

    const saved = JSON.parse(raw) as Partial<GameState>;
    const questIndex = saved.questIndex ?? 0;

    return {
      ...INITIAL_STATE,
      ...saved,
      damageTexts: [],
      projectiles: saved.projectiles ?? [],
      questIndex,
      quest: saved.quest ?? QUEST_CHAIN[questIndex] ?? QUEST_CHAIN[0],
      resources: { ...INITIAL_STATE.resources, ...saved.resources },
      destroyedAsteroids: saved.destroyedAsteroids ?? 0,
      rocket: {
        ...INITIAL_STATE.rocket,
        ...saved.rocket,
        angle: saved.rocket?.angle ?? INITIAL_STATE.rocket.angle,
        status: saved.rocket?.status ?? INITIAL_STATE.rocket.status,
        returnTimer: saved.rocket?.returnTimer ?? 0,
        returnDuration:
          saved.rocket?.returnDuration ?? INITIAL_STATE.rocket.returnDuration,
        grabbedFragmentId: saved.rocket?.grabbedFragmentId,
        grabTimer: saved.rocket?.grabTimer ?? 0,
        grabDuration:
          saved.rocket?.grabDuration ?? INITIAL_STATE.rocket.grabDuration,
        cargo: { ...saved.rocket?.cargo },
      },
      collectedTotals: { ...saved.collectedTotals },
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveGameState(state: GameState) {
  if (typeof window === 'undefined') return;

  const saveData = {
    ...state,
    damageTexts: [],
    projectiles: [],
  };

  window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export function resetGameState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SAVE_KEY);
}

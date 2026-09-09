import { QUEST_CHAIN } from './constants';
import { addResources } from './simulation';
import type { BuildingKey, GameState, ModuleKey, ResourceKey } from './types';

type QuestEvent =
  | { goal: 'destroy'; amount?: number }
  | { goal: 'module'; key: ModuleKey; level: number }
  | { goal: 'building'; key: BuildingKey; level: number }
  | { goal: 'collect'; key: ResourceKey; total: number }
  | { goal: 'sector'; key: string };

const nextQuest = (index: number) => {
  const quest = QUEST_CHAIN[index];
  return quest ? { ...quest } : { ...QUEST_CHAIN[QUEST_CHAIN.length - 1], done: true };
};

export function applyQuestEvent(state: GameState, event: QuestEvent): GameState {
  if (state.quest.done) return state;
  if (state.quest.goal !== event.goal) return state;
  if ('key' in event && state.quest.targetKey !== event.key) return state;

  const current =
    event.goal === 'destroy'
      ? state.quest.current + (event.amount ?? 1)
      : event.goal === 'module' || event.goal === 'building'
        ? event.level
        : event.goal === 'collect'
          ? event.total
          : 1;

  const quest = { ...state.quest, current: Math.min(current, state.quest.target) };
  if (quest.current < quest.target) return { ...state, quest };

  const questIndex = state.questIndex + 1;
  return {
    ...state,
    level: state.level + 1,
    resources: addResources(state.resources, quest.reward),
    questIndex,
    quest: nextQuest(questIndex),
  };
}

export function syncQuestProgress(state: GameState): GameState {
  if (state.quest.done) return state;

  if (state.quest.goal === 'module') {
    const module = state.modules.find((item) => item.key === state.quest.targetKey);
    return module
      ? applyQuestEvent(state, {
          goal: 'module',
          key: module.key,
          level: module.level,
        })
      : state;
  }

  if (state.quest.goal === 'building') {
    const building = state.buildings.find(
      (item) => item.key === state.quest.targetKey,
    );
    return building
      ? applyQuestEvent(state, {
          goal: 'building',
          key: building.key,
          level: building.level,
        })
      : state;
  }

  if (state.quest.goal === 'collect' && state.quest.targetKey) {
    const key = state.quest.targetKey as ResourceKey;
    return applyQuestEvent(state, {
      goal: 'collect',
      key,
      total: state.collectedTotals[key] ?? 0,
    });
  }

  return state;
}

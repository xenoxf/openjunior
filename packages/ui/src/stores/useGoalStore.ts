import { create } from 'zustand';

interface GoalState {
  text: string;
  createdAt: number;
  turnCount: number;
}

interface GoalStore {
  goals: Record<string, GoalState>;
  setGoal: (sessionId: string, text: string) => void;
  clearGoal: (sessionId: string) => void;
  getGoal: (sessionId: string) => GoalState | null;
  incrementTurnCount: (sessionId: string) => void;
}

const STORAGE_KEY = 'openjunior_goals';

const loadGoalsFromStorage = (): Record<string, GoalState> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveGoalsToStorage = (goals: Record<string, GoalState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore
  }
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: loadGoalsFromStorage(),
  setGoal: (sessionId, text) => {
    set((state) => {
      const next = {
        ...state.goals,
        [sessionId]: { text, createdAt: Date.now(), turnCount: 0 },
      };
      saveGoalsToStorage(next);
      return { goals: next };
    });
  },
  clearGoal: (sessionId) => {
    set((state) => {
      const next = { ...state.goals };
      delete next[sessionId];
      saveGoalsToStorage(next);
      return { goals: next };
    });
  },
  getGoal: (sessionId) => get().goals[sessionId] ?? null,
  incrementTurnCount: (sessionId) => {
    set((state) => {
      const existing = state.goals[sessionId];
      if (!existing) return state;
      const next = {
        ...state.goals,
        [sessionId]: { ...existing, turnCount: existing.turnCount + 1 },
      };
      saveGoalsToStorage(next);
      return { goals: next };
    });
  },
}));

export type { GoalState };

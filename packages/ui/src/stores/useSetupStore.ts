import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UseCase = 'coding' | 'writing' | 'research' | 'automation' | null;

export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'local' | null;

export interface SetupState {
  isComplete: boolean;
  currentStep: number;
  useCase: UseCase;
  provider: AIProvider;
  apiKey: string;
  profile: string | null;
  setUseCase: (useCase: UseCase) => void;
  setProvider: (provider: AIProvider) => void;
  setApiKey: (key: string) => void;
  setProfile: (profile: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeSetup: (profile: string) => void;
  resetSetup: () => void;
  skipSetup: () => void;
}

const STEP_COUNT = 3;

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      isComplete: false,
      currentStep: 0,
      useCase: null,
      provider: null,
      apiKey: '',
      profile: null,

      setUseCase: (useCase) => set({ useCase, currentStep: 1 }),
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setProfile: (profile) => set({ profile }),

      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, STEP_COUNT) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      completeSetup: (profile) => set({
        isComplete: true,
        currentStep: STEP_COUNT,
        profile,
      }),

      resetSetup: () => set({
        isComplete: false,
        currentStep: 0,
        useCase: null,
        provider: null,
        apiKey: '',
        profile: null,
      }),

      skipSetup: () => set({ isComplete: true, currentStep: STEP_COUNT }),
    }),
    {
      name: 'openchamber_setup',
      version: 1,
    }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OpenJunior',
    description: 'This tutorial will guide you through the main features. You can skip this anytime.',
    icon: 'sparkling',
    position: 'bottom',
  },
  {
    id: 'sidebar',
    title: 'Session Sidebar',
    description: 'Your sessions are organized here. Create new sessions or switch between existing ones.',
    icon: 'layout-left',
    target: 'sidebar-toggle',
    position: 'right',
  },
  {
    id: 'chat',
    title: 'Chat Input',
    description: 'Type your messages here. Use @ to mention files, # for commands, or just chat naturally.',
    icon: 'chat-3',
    target: 'chat-input',
    position: 'top',
  },
  {
    id: 'model-selector',
    title: 'Model Selector',
    description: 'Choose which AI model to use. Different models have different strengths.',
    icon: 'brain',
    target: 'model-selector',
    position: 'bottom',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'Open a terminal to run commands directly from the interface.',
    icon: 'terminal',
    position: 'top',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Customize your experience. Configure themes, fonts, and behavior.',
    icon: 'settings-3',
    target: 'settings-button',
    position: 'left',
  },
];

interface TutorialState {
  isComplete: boolean;
  isOpen: boolean;
  currentStepIndex: number;
  hasSeenTutorial: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skip: () => void;
  complete: () => void;
  open: () => void;
  close: () => void;
  reset: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      isComplete: false,
      isOpen: false,
      currentStepIndex: 0,
      hasSeenTutorial: false,

      nextStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex >= TUTORIAL_STEPS.length - 1) {
          set({ isComplete: true, isOpen: false, hasSeenTutorial: true });
        } else {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      goToStep: (index) => {
        if (index >= 0 && index < TUTORIAL_STEPS.length) {
          set({ currentStepIndex: index });
        }
      },

      skip: () => set({ isComplete: true, isOpen: false, hasSeenTutorial: true }),

      complete: () => set({ isComplete: true, isOpen: false, hasSeenTutorial: true }),

      open: () => set({ isOpen: true, currentStepIndex: 0 }),

      close: () => set({ isOpen: false }),

      reset: () => set({
        isComplete: false,
        isOpen: false,
        currentStepIndex: 0,
        hasSeenTutorial: false,
      }),
    }),
    {
      name: 'openjunior_tutorial',
      version: 1,
    }
  )
);

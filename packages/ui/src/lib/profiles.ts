import type { UseCase } from '@/stores/useSetupStore';

export interface ProfileConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  useCase: UseCase;
  defaultProvider: string | null;
  suggestions: string[];
  uiHints: {
    showTerminalByDefault: boolean;
    showGitPanelByDefault: boolean;
    compactMode: boolean;
  };
}

export const PROFILES: ProfileConfig[] = [
  {
    id: 'developer',
    label: 'Developer',
    description: 'Optimized for coding, debugging, and software development',
    icon: 'code',
    useCase: 'coding',
    defaultProvider: 'anthropic',
    suggestions: [
      'Help me debug this error',
      'Write a unit test for this function',
      'Refactor this component to use hooks',
      'Explain this code snippet',
    ],
    uiHints: {
      showTerminalByDefault: true,
      showGitPanelByDefault: true,
      compactMode: false,
    },
  },
  {
    id: 'writer',
    label: 'Writer',
    description: 'Optimized for documentation, blogs, and technical writing',
    icon: 'file-text',
    useCase: 'writing',
    defaultProvider: 'openai',
    suggestions: [
      'Write a blog post about this topic',
      'Improve the clarity of this paragraph',
      'Create documentation for this API',
      'Proofread this article',
    ],
    uiHints: {
      showTerminalByDefault: false,
      showGitPanelByDefault: false,
      compactMode: true,
    },
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Optimized for deep research, code exploration, and learning',
    icon: 'search',
    useCase: 'research',
    defaultProvider: 'anthropic',
    suggestions: [
      'Explain how this algorithm works',
      'Find the best practices for this pattern',
      'Analyze the architecture of this project',
      'Compare these two approaches',
    ],
    uiHints: {
      showTerminalByDefault: false,
      showGitPanelByDefault: true,
      compactMode: false,
    },
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Optimized for learning, tutoring, and guided problem-solving',
    icon: 'graduation-cap',
    useCase: 'coding',
    defaultProvider: 'openai',
    suggestions: [
      'Teach me about recursion',
      'Help me understand this concept step by step',
      'Give me a practice exercise',
      'Explain the error in my code',
    ],
    uiHints: {
      showTerminalByDefault: false,
      showGitPanelByDefault: false,
      compactMode: false,
    },
  },
];

export function getProfileById(id: string): ProfileConfig | undefined {
  return PROFILES.find((p) => p.id === id);
}

export function getDefaultProfile(useCase: UseCase): ProfileConfig {
  if (!useCase) return PROFILES[0];
  const match = PROFILES.find((p) => p.useCase === useCase);
  return match ?? PROFILES[0];
}

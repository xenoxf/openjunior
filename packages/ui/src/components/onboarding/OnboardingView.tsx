"use client"

import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useSessionUIStore } from '@/sync/session-ui-store';
import { useSelectionStore } from '@/sync/selection-store';
import { opencodeClient } from '@/lib/opencode/client';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { useEffectiveDirectory } from '@/hooks/useEffectiveDirectory';

const STARTER_PROMPTS: Array<{ icon: IconName; label: string }> = [
  { icon: 'search', label: 'Help me understand this project' },
  { icon: 'question', label: 'What can you do?' },
  { icon: 'chat-4', label: 'Start a new blank conversation' },
];

// Try to resolve a provider/model from config
function resolveDefaultModel() {
  const state = useConfigStore.getState();
  const providers = state.providers;
  const defaultModel = state.settingsDefaultModel || state.opencodeDefaultModel;

  if (defaultModel) {
    const parsed = /^(.+?)\/(.+)$/.exec(defaultModel);
    if (parsed) {
      const provider = providers.find((p) => p.id === parsed[1]);
      if (provider && provider.models.some((m) => m.id === parsed[2])) {
        return { providerID: parsed[1], modelID: parsed[2] };
      }
    }
  }

  const first = providers?.[0];
  if (first?.models?.[0]) {
    return { providerID: first.id, modelID: first.models[0].id };
  }

  return { providerID: 'opencode', modelID: 'big-pickle' };
}

function getFirstAgent(): string | undefined {
  const agents = useConfigStore.getState().agents;
  if (Array.isArray(agents) && agents.length > 0) {
    const first = agents[0];
    return typeof first === 'string' ? first : (first as Record<string, unknown>)?.name as string | undefined;
  }
  return undefined;
}

type SetupStep = 'welcome' | 'role' | 'done';

const ROLES = [
  {
    id: 'developer',
    label: 'Developer',
    icon: 'code' as IconName,
    desc: 'Build software with AI-assisted coding, debugging, and refactoring',
  },
  {
    id: 'data-scientist',
    label: 'Data Scientist',
    icon: 'chart' as IconName,
    desc: 'Analyze data, build models, and automate ML pipelines',
  },
  {
    id: 'devops',
    label: 'DevOps',
    icon: 'server' as IconName,
    desc: 'Manage infrastructure, deployments, and monitoring',
  },
  {
    id: 'writer',
    label: 'Technical Writer',
    icon: 'edit' as IconName,
    desc: 'Write documentation, technical specs, and content',
  },
  {
    id: 'other',
    label: 'Other / Not sure yet',
    icon: 'question' as IconName,
    desc: 'General AI assistant for any task',
  },
];

export function OnboardingView() {
  const [step, setStep] = React.useState<SetupStep>('welcome');
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);

  const setOnboardingCompleted = useUIStore((state) => state.setOnboardingCompleted);
  const createSession = useSessionUIStore((state) => state.createSession);
  const sendMessage = useSessionUIStore((state) => state.sendMessage);
  const setCurrentSession = useSessionUIStore((state) => state.setCurrentSession);
  const directory = useEffectiveDirectory();

  const handleStart = React.useCallback(async (prompt?: string) => {
    const resolved = resolveDefaultModel();
    const agent = getFirstAgent();
    const dir = directory ?? opencodeClient.getDirectory() ?? null;

    try {
      const session = await createSession(undefined, dir, null);
      if (!session?.id) {
        setOnboardingCompleted(true);
        return;
      }

      useSelectionStore.getState().saveSessionModelSelection(session.id, resolved.providerID, resolved.modelID);
      if (agent) {
        useSelectionStore.getState().saveSessionAgentSelection(session.id, agent);
        useSelectionStore.getState().saveAgentModelForSession(session.id, agent, resolved.providerID, resolved.modelID);
      }

      setCurrentSession(session.id, dir);
      setOnboardingCompleted(true);

      if (prompt) {
        await sendMessage(prompt, resolved.providerID, resolved.modelID, agent);
      }
    } catch {
      setOnboardingCompleted(true);
    }
  }, [directory, createSession, sendMessage, setCurrentSession, setOnboardingCompleted]);

  // Welcome step
  if (step === 'welcome') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <div className="flex max-w-lg flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon name="brain-ai-3" className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome to OpenJunior
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Let's set up your workspace. What describes you best?
            </p>
          </div>

          <div className="flex w-full flex-col gap-2">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id);
                  setStep('role');
                }}
                className="flex items-center gap-3 rounded-xl border border-border/40 px-4 py-3 text-left transition-colors hover:border-border hover:bg-accent/5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon name={role.icon} className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleStart()}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Skip setup
          </button>
        </div>
      </div>
    );
  }

  // Role step (confirmation + starter prompts)
  if (step === 'role') {
    const role = ROLES.find((r) => r.id === selectedRole);
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <div className="flex max-w-lg flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon name="ai-generate-2" className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {role?.label || 'Your workspace is ready'}
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Your workspace is configured for {role?.label?.toLowerCase() || 'general use'}.
              Built-in tools and integrations are enabled.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <p className="text-xs text-muted-foreground">Try these to get started:</p>
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => handleStart(prompt.label)}
                className="flex items-center gap-3 rounded-xl border border-border/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <Icon name={prompt.icon} className="h-4 w-4 shrink-0" />
                <span>{prompt.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleStart()}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </button>

          <button
            type="button"
            onClick={() => setStep('welcome')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to role selection
          </button>
        </div>
      </div>
    );
  }

  return null;
}

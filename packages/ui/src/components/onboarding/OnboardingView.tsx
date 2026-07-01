"use client"

import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';

const STARTER_PROMPTS: Array<{ icon: IconName; label: string }> = [
  { icon: 'search', label: 'Help me understand this project' },
  { icon: 'question', label: 'What can you do?' },
  { icon: 'chat-4', label: 'Start a new blank conversation' },
];

export function OnboardingView() {
  const setOnboardingCompleted = useUIStore((state) => state.setOnboardingCompleted);

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
            Your AI-powered workspace. Start a conversation, explore your files, and get things done.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <p className="text-xs text-muted-foreground">Try these to get started:</p>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              className="flex items-center gap-3 rounded-xl border border-border/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <Icon name={prompt.icon} className="h-4 w-4 shrink-0" />
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOnboardingCompleted(true)}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

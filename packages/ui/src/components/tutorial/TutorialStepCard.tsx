import React from 'react';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TutorialStep as TutorialStepType } from '@/stores/useTutorialStore';

interface TutorialStepProps {
  step: TutorialStepType;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLast: boolean;
}

export const TutorialStepCard: React.FC<TutorialStepProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isLast,
}) => {
  return (
    <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon name={step.icon as 'sparkling' | 'layout-left' | 'chat-3' | 'brain' | 'terminal' | 'settings-3'} className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="typography-ui-header font-medium text-foreground">
            {step.title}
          </h3>
          <p className="typography-ui-label text-muted-foreground mt-1">
            {step.description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                i === currentStep
                  ? 'w-4 bg-primary'
                  : i < currentStep
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted-foreground/20'
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
            >
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={onNext}
          >
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

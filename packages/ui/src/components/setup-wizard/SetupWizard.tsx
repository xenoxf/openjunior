import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useSetupStore } from '@/stores/useSetupStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icon/Icon';
import { StepUseCase } from './StepUseCase';
import { StepProvider } from './StepProvider';
import { StepProfile } from './StepProfile';

const STEPS = [
  { id: 0, component: StepUseCase, titleKey: 'setupWizard.step1.title' },
  { id: 1, component: StepProvider, titleKey: 'setupWizard.step2.title' },
  { id: 2, component: StepProfile, titleKey: 'setupWizard.step3.title' },
] as const;

export const SetupWizard: React.FC<{ onComplete: () => void; onSkip: () => void }> = ({ onComplete, onSkip }) => {
  const { t } = useI18n();
  const { isComplete, currentStep, nextStep, prevStep, skipSetup } = useSetupStore();

  if (isComplete) return null;

  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    skipSetup();
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border bg-background p-6 shadow-lg">
        <div className="pb-4">
          <div className="text-center">
            <h2 className="typography-markdown leading-none font-semibold text-foreground">{t('setupWizard.title')}</h2>
            <p className="text-muted-foreground typography-ui-label mt-1">{t('setupWizard.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <div className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i <= currentStep ? 'bg-[var(--primary-base)]' : 'bg-[var(--interactive-border)]'
                )} />
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-8 transition-colors',
                    i < currentStep ? 'bg-[var(--primary-base)]' : 'bg-[var(--interactive-border)]'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="animate-in fade-in slide-in-from-right-2 duration-200">
            {React.createElement(step.component)}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--interactive-border)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isComplete}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('setupWizard.skip')}
            </Button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                  {t('setupWizard.back')}
                </Button>
              )}

              {isLastStep ? (
                <Button onClick={handleNext} className="ml-auto">
                  {t('setupWizard.finish')}
                  <Icon name="check" className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="ml-auto">
                  {t('setupWizard.next')}
                  <Icon name="arrow-right" className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
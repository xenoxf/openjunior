import React from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '@/stores/useTutorialStore';
import { TutorialStepCard } from './TutorialStepCard';

export const InteractiveTutorial: React.FC = () => {
  const { isOpen, currentStepIndex, nextStep, prevStep, skip, close } = useTutorialStore();

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  if (!currentStep) return null;

  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative z-10">
        <TutorialStepCard
          step={currentStep}
          currentStep={currentStepIndex}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skip}
          isLast={isLast}
        />
      </div>
    </div>
  );
};

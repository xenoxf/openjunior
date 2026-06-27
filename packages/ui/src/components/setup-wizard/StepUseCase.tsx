import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useSetupStore } from '@/stores/useSetupStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';

const USE_CASES = [
  { id: 'coding', icon: 'code', labelKey: 'setupWizard.useCase.coding', descKey: 'setupWizard.useCase.codingDesc' },
  { id: 'writing', icon: 'file-text', labelKey: 'setupWizard.useCase.writing', descKey: 'setupWizard.useCase.writingDesc' },
  { id: 'research', icon: 'search', labelKey: 'setupWizard.useCase.research', descKey: 'setupWizard.useCase.researchDesc' },
  { id: 'automation', icon: 'flashlight', labelKey: 'setupWizard.useCase.automation', descKey: 'setupWizard.useCase.automationDesc' },
] as const;

export const StepUseCase: React.FC = () => {
  const { t } = useI18n();
  const { useCase, setUseCase } = useSetupStore();

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="typography-ui-header font-semibold text-foreground">{t('setupWizard.step1.title')}</h2>
        <p className="typography-ui text-muted-foreground">{t('setupWizard.step1.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {USE_CASES.map(({ id, icon, labelKey, descKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setUseCase(id as typeof useCase)}
            className={cn(
              'relative group p-4 text-left rounded-lg border-2 transition-all',
              useCase === id
                ? 'border-[var(--primary-base)] bg-[var(--primary-base)]/5'
                : 'border-[var(--interactive-border)] hover:border-[var(--primary-base)]/40'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                useCase === id ? 'bg-[var(--primary-base)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-muted)]'
              )}>
                <Icon name={icon} className="h-5 w-5" />
              </div>
              <div>
                <h3 className="typography-ui-label font-medium text-foreground">{t(labelKey)}</h3>
                <p className="typography-micro text-muted-foreground">{t(descKey)}</p>
              </div>
            </div>
            {useCase === id && (
              <Icon name="check" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--primary-base)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
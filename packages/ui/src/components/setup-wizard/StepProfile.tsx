import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useSetupStore } from '@/stores/useSetupStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';

const PROFILES = [
  {
    id: 'developer',
    icon: 'code',
    labelKey: 'setupWizard.profile.developer',
    descKey: 'setupWizard.profile.developerDesc',
    features: ['Modelo potente', 'Agente coding', 'Temperatura baja', 'Herramientas de código'],
    color: 'text-blue-500',
  },
  {
    id: 'writer',
    icon: 'file-text',
    labelKey: 'setupWizard.profile.writer',
    descKey: 'setupWizard.profile.writerDesc',
    features: ['Modelo balanceado', 'Agente writing', 'Temperatura media', 'Sin herramientas de código'],
    color: 'text-green-500',
  },
  {
    id: 'researcher',
    icon: 'search',
    labelKey: 'setupWizard.profile.researcher',
    descKey: 'setupWizard.profile.researcherDesc',
    features: ['Modelo potente', 'Agente research', 'Búsqueda habilitada', 'Razonamiento visible'],
    color: 'text-purple-500',
  },
  {
    id: 'student',
    icon: 'graduation-cap',
    labelKey: 'setupWizard.profile.student',
    descKey: 'setupWizard.profile.studentDesc',
    features: ['Modelo económico', 'Agente tutoring', 'Temperatura alta', 'Explicaciones detalladas'],
    color: 'text-orange-500',
  },
] as const;

export const StepProfile: React.FC = () => {
  const { t } = useI18n();
  const { profile, setProfile, completeSetup } = useSetupStore();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="typography-ui-header font-semibold text-foreground">{t('setupWizard.step3.title')}</h2>
        <p className="typography-ui text-muted-foreground">{t('setupWizard.step3.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROFILES.map(({ id, icon, labelKey, descKey, features, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setProfile(id);
              completeSetup(id);
            }}
            className={cn(
              'relative p-4 text-left rounded-lg border-2 transition-all',
              profile === id
                ? 'border-[var(--primary-base)] bg-[var(--primary-base)]/5'
                : 'border-[var(--interactive-border)] hover:border-[var(--primary-base)]/40'
            )}
          >
            <div className="mb-3">
              <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg', profile === id ? 'bg-[var(--primary-base)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-muted)]')}>
                <Icon name={icon} className={cn('h-5 w-5', color)} />
              </div>
            </div>
            <h3 className="typography-ui-label font-medium text-foreground">{t(labelKey)}</h3>
            <p className="typography-micro text-muted-foreground mt-1">{t(descKey)}</p>
            <ul className="mt-3 space-y-1.5">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 typography-micro text-muted-foreground">
                  <Icon name="check" className={cn('h-3.5 w-3.5 flex-shrink-0', profile === id ? 'text-[var(--primary-base)]' : 'text-[var(--status-success)]')} />
                  {feature}
                </li>
              ))}
            </ul>
            {profile === id && (
              <Icon name="check" className="absolute right-3 top-3 h-5 w-5 text-[var(--primary-base)]" />
            )}
          </button>
        ))}
      </div>

      {profile && (
        <div className="rounded-lg bg-[var(--status-success)]/10 border border-[var(--status-success)]/20 p-4 text-center animate-in fade-in duration-200">
          <Icon name="checkbox-circle" className="mx-auto h-6 w-6 text-[var(--status-success)]" />
          <p className="mt-2 typography-ui font-medium text-[var(--status-success)]">{t('setupWizard.step3.ready')}</p>
        </div>
      )}
    </div>
  );
};
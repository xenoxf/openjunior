import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useServiceAuthStore } from '@/stores/useServiceAuthStore';
import { GoogleService } from './GoogleService';

export const IntegrationsTab: React.FC = () => {
  const { t } = useI18n();
  const services = useServiceAuthStore((s) => s.services);

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="typography-ui-header font-semibold text-[var(--foreground)] mb-4">
          {t('settings.connectors.sidebar.integrations')}
        </h2>
        <p className="typography-small text-[var(--muted-foreground)] mb-6">
          {t('settings.integrations.detail.signInWithGoogleDescription')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <GoogleService status={services.google ?? null} />
        </div>
      </div>
    </div>
  );
};

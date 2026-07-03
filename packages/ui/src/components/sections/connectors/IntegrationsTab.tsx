import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore } from '@/stores/useComposioStore';
import { ComposioIntegrationCard } from './ComposioIntegrationCard';

export const IntegrationsTab: React.FC = () => {
  const { t } = useI18n();
  const apps = useComposioStore((s) => s.apps);
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const isLoadingApps = useComposioStore((s) => s.isLoadingApps);

  React.useEffect(() => {
    useComposioStore.getState().loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, []);

  const connectedToolkitIds = new Set(connectedAccounts.map((acct) => acct.toolkit));

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="typography-ui-header font-semibold text-[var(--foreground)] mb-4">
          {t('settings.connectors.sidebar.integrations')}
        </h2>
        <p className="typography-small text-[var(--muted-foreground)] mb-6">
          {t('settings.connectors.integrations.composio.description')}
        </p>

        {isLoadingApps && apps.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-32 animate-pulse rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        )}

        {!isLoadingApps && apps.length === 0 && (
          <div className="rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-elevated)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {t('settings.connectors.integrations.empty')}
            </p>
          </div>
        )}

        {apps.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {apps.map((app) => {
              const isConnected = connectedToolkitIds.has(app.id) || connectedToolkitIds.has(app.name);
              const connectedAccount = connectedAccounts.find(
                (acct) => acct.toolkit === app.id || acct.toolkit === app.name,
              );
              return (
                <ComposioIntegrationCard
                  key={app.id}
                  app={app}
                  isConnected={isConnected}
                  connectedAccountId={connectedAccount?.id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

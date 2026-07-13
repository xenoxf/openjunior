import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore } from '@/stores/useComposioStore';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';

interface IntegracionesSidebarProps {
  onItemSelect?: () => void;
}

export const IntegracionesSidebar: React.FC<IntegracionesSidebarProps> = ({ onItemSelect }) => {
  const { t } = useI18n();
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const apps = useComposioStore((s) => s.apps);
  const isLoadingConnections = useComposioStore((s) => s.isLoadingConnections);
  const selectedAccountId = useComposioStore((s) => s.selectedAccountId);
  const loadApps = useComposioStore((s) => s.loadApps);
  const setSelectedAccount = useComposioStore((s) => s.setSelectedAccount);

  React.useEffect(() => {
    loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, [loadApps]);

  const connectedItems = React.useMemo(() => {
    return connectedAccounts
      .map((acct) => {
        const app = apps.find((a) => a.slug === acct.toolkit || a.id === acct.toolkit || a.name === acct.toolkit);
        // Fallback: if no app found, create a minimal app object from the toolkit name
        const fallbackApp = app
          ? app
          : {
              id: acct.toolkit,
              slug: acct.toolkit,
              name: acct.toolkit.charAt(0).toUpperCase() + acct.toolkit.slice(1).replace(/[-_]/g, ' '),
              logoUrl: null,
            };
        return { account: acct, app: fallbackApp };
      });
  }, [connectedAccounts, apps]);

  const getInitials = (name: string) =>
    name.split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="typography-ui-header font-semibold text-foreground">
          {t('settings.page.integrations.title')}
        </h2>
        <button
          type="button"
          onClick={() => { loadApps(); useComposioStore.getState().loadConnectedAccounts(); }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-interactive-hover transition-colors',
            isLoadingConnections && 'animate-spin',
          )}
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ScrollableOverlay className="h-full">
          {isLoadingConnections ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          ) : connectedItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Icon name="plug" className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{t('settings.connectors.integrations.empty')}</p>
            </div>
          ) : (
            <div className="px-2">
              {connectedItems.map(({ account: acct, app }) => {
                const isSelected = selectedAccountId === acct.id;
                const appName = app?.name ?? acct.toolkit;

                return (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(acct.id);
                      onItemSelect?.();
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-interactive-selection text-foreground'
                        : 'text-muted-foreground hover:bg-interactive-hover hover:text-foreground',
                    )}
                  >
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--surface-muted)] overflow-hidden">
                      {app?.logoUrl ? (
                        <img src={app.logoUrl} alt={appName} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-semibold">{getInitials(appName)}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">{appName}</div>
                    </div>
                    <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-[var(--status-success)]" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollableOverlay>
      </div>
    </div>
  );
};

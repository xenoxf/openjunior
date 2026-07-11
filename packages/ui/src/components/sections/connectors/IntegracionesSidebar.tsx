import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore } from '@/stores/useComposioStore';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { useUIStore } from '@/stores/useUIStore';

interface IntegracionesSidebarProps {
  onItemSelect?: () => void;
}

export const IntegracionesSidebar: React.FC<IntegracionesSidebarProps> = ({ onItemSelect }) => {
  const { t } = useI18n();
  const apps = useComposioStore((s) => s.apps);
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const isLoadingApps = useComposioStore((s) => s.isLoadingApps);
  const isLoadingConnections = useComposioStore((s) => s.isLoadingConnections);
  const selectedAccountId = useComposioStore((s) => s.selectedAccountId);
  const loadApps = useComposioStore((s) => s.loadApps);
  const setSelectedAccount = useComposioStore((s) => s.setSelectedAccount);
  const setSettingsPage = useUIStore((s) => s.setSettingsPage);
  const [searchInput, setSearchInput] = React.useState('');

  React.useEffect(() => {
    loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, [loadApps]);

  const connectedAppIds = React.useMemo(() => {
    const ids = new Set<string>();
    connectedAccounts.forEach((acct) => {
      if (acct.status === 'connected') {
        ids.add(acct.toolkit);
        const app = apps.find((a) => a.id === acct.toolkit || a.name === acct.toolkit);
        if (app) ids.add(app.id);
      }
    });
    return ids;
  }, [connectedAccounts, apps]);

  const filteredApps = apps.filter((app) => {
    if (!searchInput) return true;
    const q = searchInput.toLowerCase();
    return app.name.toLowerCase().includes(q)
      || app.description.toLowerCase().includes(q)
      || app.tags.some((t) => t.toLowerCase().includes(q));
  });

  const isLoading = isLoadingApps || isLoadingConnections;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="typography-ui-header font-semibold text-foreground">
          {t('settings.connectors.sidebar.integrations')}
        </h2>
        <button
          type="button"
          onClick={() => { loadApps(); useComposioStore.getState().loadConnectedAccounts(); }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-interactive-hover transition-colors',
            isLoading && 'animate-spin',
          )}
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('settings.connectors.integrations.searchPlaceholder')}
            aria-label={t('settings.connectors.integrations.searchPlaceholder')}
            className="h-8 w-full rounded-md border border-border bg-[var(--surface-muted)] pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[var(--primary-base)]/50 focus:ring-1 focus:ring-[var(--primary-base)]/30 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-2">
        <span className="typography-micro text-muted-foreground">
          {apps.length} {t('settings.connectors.integrations.composio.tools').toLowerCase()}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ScrollableOverlay className="h-full">
          {isLoading && filteredApps.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Icon name="plug" className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                {searchInput
                  ? t('settings.connectors.integrations.noResults', { query: searchInput })
                  : t('settings.connectors.integrations.empty')}
              </p>
            </div>
          ) : (
            <div className="px-2">
              {filteredApps.map((app) => {
                const isConnected = connectedAppIds.has(app.id) || connectedAppIds.has(app.name);
                const isSelected = selectedAccountId === app.id;
                const initials = app.name.split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      if (isConnected) {
                        const acct = connectedAccounts.find(
                          (a) => a.toolkit === app.id || a.toolkit === app.name || a.toolkit === app.slug,
                        );
                        if (acct) setSelectedAccount(acct.id);
                      } else {
                        setSettingsPage('connectors');
                      }
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
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.name} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-semibold">{initials}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">{app.name}</div>
                    </div>
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full shrink-0',
                        isConnected ? 'bg-[var(--status-success)]' : 'bg-muted-foreground/30',
                      )}
                    />
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

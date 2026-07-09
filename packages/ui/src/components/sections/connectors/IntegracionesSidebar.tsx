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
  const loadConnectedAccounts = useComposioStore((s) => s.loadConnectedAccounts);
  const setSelectedAccount = useComposioStore((s) => s.setSelectedAccount);
  const [searchInput, setSearchInput] = React.useState('');

  React.useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  const getAppForAccount = (toolkit: string) => apps.find((a) => a.id === toolkit || a.name === toolkit);

  const filteredAccounts = connectedAccounts.filter((acct) => {
    if (!searchInput) return true;
    const q = searchInput.toLowerCase();
    const app = getAppForAccount(acct.toolkit);
    const name = app?.name ?? acct.toolkit;
    return name.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="typography-ui-header font-semibold text-foreground">
          {t('settings.page.integrations.title')}
        </h2>
        <button
          type="button"
          onClick={() => loadConnectedAccounts()}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-interactive-hover transition-colors',
            isLoadingConnections && 'animate-spin',
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
          {filteredAccounts.length} {filteredAccounts.length === 1 ? t('settings.page.integrations.connected').toLowerCase() : t('settings.page.integrations.connected').toLowerCase()}
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollableOverlay className="h-full">
          {isLoadingConnections && filteredAccounts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          ) : filteredAccounts.length === 0 ? (
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
              {filteredAccounts.map((acct) => {
                const app = getAppForAccount(acct.toolkit);
                const appName = app?.name ?? acct.toolkit;
                const isSelected = selectedAccountId === acct.id;
                const initials = appName
                  .split(/[\s_-]+/)
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

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
                        <span className="text-[10px] font-semibold">{initials}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">{appName}</div>
                    </div>
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full shrink-0',
                        acct.status === 'connected' ? 'bg-[var(--status-success)]' : 'bg-muted-foreground/30',
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

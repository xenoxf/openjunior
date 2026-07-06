import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore } from '@/stores/useComposioStore';
import { ComposioIntegrationCard } from './ComposioIntegrationCard';
import { Icon } from '@/components/icon/Icon';

export const IntegrationsTab: React.FC = () => {
  const { t } = useI18n();
  const apps = useComposioStore((s) => s.apps);
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const isLoadingApps = useComposioStore((s) => s.isLoadingApps);
  const isLoadingMore = useComposioStore((s) => s.isLoadingMore);
  const hasMore = useComposioStore((s) => s.hasMore);
  const searchQuery = useComposioStore((s) => s.searchQuery);
  const loadApps = useComposioStore((s) => s.loadApps);
  const loadMoreApps = useComposioStore((s) => s.loadMoreApps);
  const searchApps = useComposioStore((s) => s.searchApps);

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, [loadApps]);

  React.useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingApps) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreApps();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingApps, loadMoreApps]);

  const [searchInput, setSearchInput] = React.useState('');

  const handleSearchInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          searchApps(value.trim());
        } else {
          loadApps();
        }
      }, 300);
    },
    [searchApps, loadApps],
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchInput('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadApps();
  }, [loadApps]);

  const connectedToolkitIds = new Set(connectedAccounts.map((acct) => acct.toolkit));

  const showSentinel = hasMore && !isLoadingApps && apps.length > 0;

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="typography-ui-header font-semibold text-[var(--foreground)] shrink-0">
            {t('settings.connectors.sidebar.integrations')}
          </h2>
          <div className="relative flex-1 max-w-xs">
            {isLoadingApps && apps.length > 0 ? (
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
            ) : (
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            )}
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInput}
              placeholder="Search integrations..."
              aria-label="Search integrations"
              className="h-8 w-full rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] pl-8 pr-8 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary-base)]/50 focus:ring-1 focus:ring-[var(--primary-base)]/30 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

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
              {searchQuery
                ? `No integrations found for "${searchQuery}"`
                : t('settings.connectors.integrations.empty')}
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

        {showSentinel && (
          <div ref={sentinelRef} className="h-4" />
        )}
        {isLoadingMore && apps.length > 0 && (
          <div className="flex justify-center py-4 opacity-50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
          </div>
        )}
      </div>
    </div>
  );
};

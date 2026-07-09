import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore, type ComposioApp } from '@/stores/useComposioStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import type { TimeFormatPreference } from '@/stores/useUIStore';

const formatConnectionTime = (createdAt: string | undefined, timeFormatPreference: TimeFormatPreference): string | null => {
  if (!createdAt) return null;
  try {
    const date = new Date(createdAt);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormatPreference === 'auto' ? undefined : timeFormatPreference === '12h',
    }).format(date);
  } catch {
    return null;
  }
};

const AccountDetail: React.FC<{
  acct: { id: string; status: string; userId: string; toolkit: string; createdAt?: string };
  app: ComposioApp | undefined;
  connectingSlug: string | null;
  disconnectingId: string | null;
  onReconnect: (appId: string) => void;
  onDisconnectClick: (id: string) => void;
  onBack: () => void;
  timeFormatPreference: TimeFormatPreference;
}> = ({ acct, app, connectingSlug, disconnectingId, onReconnect, onDisconnectClick, onBack, timeFormatPreference }) => {
  const { t } = useI18n();
  const appName = app?.name ?? acct.toolkit;
  const initials = typeof appName === 'string'
    ? appName.split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <Icon name="arrow-left" className="h-4 w-4" />
        {t('settings.connectors.integrations.composio.back')}
      </button>
      <div className="rounded-xl border border-border bg-[var(--surface-elevated)] overflow-hidden">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] overflow-hidden">
            {app?.logoUrl ? (
              <img src={app.logoUrl} alt={appName} className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground">{appName}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-success)]/10 px-2 py-0.5 text-[11px] text-[var(--status-success)] font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--status-success)]" />
                {t('settings.page.integrations.connected')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{app?.description ?? ''}</p>
          </div>
        </div>

        <div className="border-t border-border px-5 py-4 space-y-3">
          <h4 className="typography-ui-label font-medium text-foreground text-xs uppercase tracking-wider">
            {t('settings.connectors.integrations.composio.tools')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(app?.tags ?? []).slice(0, 8).map((tag) => (
              <div key={tag} className="flex items-center gap-2 rounded-md bg-[var(--surface-muted)] px-3 py-2">
                <Icon name="check" className="h-3.5 w-3.5 text-[var(--status-success)] shrink-0" />
                <span className="text-xs text-foreground">{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-5 py-4 space-y-2">
          <h4 className="typography-ui-label font-medium text-foreground text-xs uppercase tracking-wider">
            {t('settings.connectors.integrations.composio.details')}
          </h4>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('settings.connectors.integrations.composio.authScheme')}</dt>
              <dd className="text-foreground font-medium">{app?.authScheme ?? '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Toolkit</dt>
              <dd className="text-foreground font-medium">{acct.toolkit}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('settings.connectors.integrations.composio.connectedAt')}</dt>
              <dd className="text-foreground font-medium">
                {formatConnectionTime(acct.createdAt, timeFormatPreference) || '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground font-medium flex items-center gap-1">
                <span className={cn('inline-block h-2 w-2 rounded-full', acct.status === 'connected' ? 'bg-[var(--status-success)]' : 'bg-muted-foreground/30')} />
                {acct.status}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-border px-5 py-4 flex gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => onReconnect(app?.id ?? acct.toolkit)}
            disabled={connectingSlug === (app?.id ?? acct.toolkit)}
          >
            {connectingSlug === (app?.id ?? acct.toolkit)
              ? t('settings.connectors.integrations.composio.connecting')
              : t('settings.connectors.integrations.composio.reAuthorize')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnectClick(acct.id)}
            disabled={disconnectingId === acct.id}
            className="text-[var(--status-error)] hover:text-[var(--status-error)] border-[var(--status-error)]/30 hover:border-[var(--status-error)]/60"
          >
            {disconnectingId === acct.id
              ? t('settings.connectors.integrations.composio.disconnecting')
              : t('settings.connectors.integrations.composio.disconnect')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const IntegracionesPage: React.FC = () => {
  const { t } = useI18n();
  const timeFormatPreference = useUIStore((s) => s.timeFormatPreference);
  const apps = useComposioStore((s) => s.apps);
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const selectedAccountId = useComposioStore((s) => s.selectedAccountId);
  const isLoadingApps = useComposioStore((s) => s.isLoadingApps);
  const isLoadingMore = useComposioStore((s) => s.isLoadingMore);
  const hasMore = useComposioStore((s) => s.hasMore);
  const searchQuery = useComposioStore((s) => s.searchQuery);
  const loadApps = useComposioStore((s) => s.loadApps);
  const loadMoreApps = useComposioStore((s) => s.loadMoreApps);
  const searchApps = useComposioStore((s) => s.searchApps);
  const connectApp = useComposioStore((s) => s.connectApp);
  const disconnectAccount = useComposioStore((s) => s.disconnectAccount);
  const setSelectedAccount = useComposioStore((s) => s.setSelectedAccount);

  const [searchInput, setSearchInput] = React.useState('');
  const [connectingSlug, setConnectingSlug] = React.useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [connectedApp, setConnectedApp] = React.useState<ComposioApp | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const oauthWindowRef = React.useRef<Window | null>(null);
  const oauthCheckIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (entries[0]?.isIntersecting) loadMoreApps();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingApps, loadMoreApps]);

  React.useEffect(() => {
    return () => {
      if (oauthCheckIntervalRef.current) clearInterval(oauthCheckIntervalRef.current);
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) oauthWindowRef.current.close();
    };
  }, []);

  const getAppForToolkit = (toolkit: string) => apps.find((a) => a.id === toolkit || a.name === toolkit);

  const handleSearchInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) searchApps(value.trim());
        else loadApps();
      }, 300);
    },
    [searchApps, loadApps],
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchInput('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadApps();
  }, [loadApps]);

  const handleConnect = React.useCallback(async (appId: string) => {
    setConnectingSlug(appId);
    try {
      const result = await connectApp(appId);
      if (result.ok && result.redirectUrl) {
        const w = window.open(result.redirectUrl, '_blank', 'width=600,height=700,noopener,noreferrer');
        if (w) {
          oauthWindowRef.current = w;
          const app = apps.find((a) => a.id === appId) ?? null;
          setConnectedApp(app);
          setShowSuccessModal(true);
          oauthCheckIntervalRef.current = setInterval(async () => {
            if (w.closed) {
              if (oauthCheckIntervalRef.current) {
                clearInterval(oauthCheckIntervalRef.current);
                oauthCheckIntervalRef.current = null;
              }
              await useComposioStore.getState().loadConnectedAccounts();
            }
          }, 1000);
        }
      }
    } finally {
      setConnectingSlug(null);
    }
  }, [connectApp, apps]);

  const handleDisconnect = React.useCallback(async (accountId: string) => {
    setDisconnectingId(accountId);
    try {
      await disconnectAccount(accountId);
      setShowDisconnectConfirm(null);
    } finally {
      setDisconnectingId(null);
    }
  }, [disconnectAccount]);

  const selectedAccount = selectedAccountId
    ? connectedAccounts.find((acct) => acct.id === selectedAccountId)
    : null;

  // Detail mode: show account detail
  if (selectedAccount) {
    const app = getAppForToolkit(selectedAccount.toolkit);
    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="flex-1 px-6 py-4">
          <AccountDetail
            acct={selectedAccount}
            app={app}
            connectingSlug={connectingSlug}
            disconnectingId={disconnectingId}
            onReconnect={(appId) => {
              setConnectingSlug(appId);
              handleConnect(appId);
            }}
            onDisconnectClick={(id) => setShowDisconnectConfirm(id)}
            onBack={() => setSelectedAccount(null)}
            timeFormatPreference={timeFormatPreference}
          />
        </div>

        <Dialog open={showDisconnectConfirm !== null} onOpenChange={(open) => { if (!open) setShowDisconnectConfirm(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.connectors.integrations.composio.confirmDisconnect')}</DialogTitle>
              <DialogDescription>{t('settings.connectors.integrations.composio.disconnectWarning')}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDisconnectConfirm(null)}>
                {t('settings.connectors.integrations.composio.cancel')}
              </Button>
              <Button
                variant="default"
                onClick={() => { if (showDisconnectConfirm) handleDisconnect(showDisconnectConfirm); }}
                disabled={disconnectingId !== null}
                className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90 text-white"
              >
                {disconnectingId !== null
                  ? t('settings.connectors.integrations.composio.disconnecting')
                  : t('settings.connectors.integrations.composio.disconnect')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSuccessModal} onOpenChange={(open) => { if (!open) { setShowSuccessModal(false); setConnectedApp(null); } }}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <div className="mx-auto mb-5 flex flex-col items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--status-success)]/10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--status-success)]/20 overflow-hidden" style={{ animation: 'scaleIn 0.3s ease-out' }}>
                    {connectedApp?.logoUrl ? (
                      <img src={connectedApp.logoUrl} alt={connectedApp.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <Icon name="check" className="h-8 w-8 text-[var(--status-success)]" style={{ animation: 'scaleIn 0.3s ease-out 0.15s both' }} />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--status-success)] shadow-sm" style={{ animation: 'scaleIn 0.25s ease-out 0.3s both, pulse 2s ease-in-out infinite 0.5s' }}>
                    <Icon name="check" className="h-3.5 w-3.5 text-white" />
                  </span>
                </div>
                <div className="text-center">
                  {connectedApp && <p className="typography-ui-label text-muted-foreground mb-1">{connectedApp.name}</p>}
                  <DialogTitle className="text-center text-xl font-semibold text-foreground">
                    {t('settings.page.integrations.successTitle')}
                  </DialogTitle>
                  <DialogDescription className="text-center text-sm text-muted-foreground pt-1.5 max-w-sm mx-auto">
                    {connectedApp
                      ? t('settings.page.integrations.successDescription', { app: connectedApp.name })
                      : t('settings.page.integrations.successDescriptionGeneric')}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex justify-center pt-2">
              <Button variant="default" onClick={() => { setShowSuccessModal(false); setConnectedApp(null); }}>
                {t('settings.page.integrations.successContinue')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <style>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--status-success), 0.4); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(var(--status-success), 0); }
          }
        `}</style>
      </div>
    );
  }

  // Catalog mode: show browse/discover grid
  const connectedToolkitIds = new Set(connectedAccounts.map((acct) => acct.toolkit));
  const showSentinel = hasMore && !isLoadingApps && apps.length > 0;
  const connectedApps = apps.filter((app) => connectedToolkitIds.has(app.id) || connectedToolkitIds.has(app.name));
  const availableApps = apps.filter((app) => !connectedToolkitIds.has(app.id) && !connectedToolkitIds.has(app.name));

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="typography-ui-header font-semibold text-foreground shrink-0">
              {t('settings.page.integrations.title')}
            </h2>
            <div className="relative flex-1 max-w-xs">
              {isLoadingApps && apps.length > 0 ? (
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              ) : (
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              )}
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInput}
                placeholder={t('settings.connectors.integrations.searchPlaceholder')}
                aria-label={t('settings.connectors.integrations.searchPlaceholder')}
                className="h-8 w-full rounded-md border border-border bg-[var(--surface-muted)] pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[var(--primary-base)]/50 focus:ring-1 focus:ring-[var(--primary-base)]/30 transition-all"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {isLoadingApps && apps.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex h-32 animate-pulse rounded-xl border border-border bg-[var(--surface-muted)]" />
              ))}
            </div>
          )}

          {!isLoadingApps && apps.length === 0 && (
            <div className="rounded-xl border border-border bg-[var(--surface-elevated)] px-6 py-12 text-center">
              <Icon name="plug" className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? t('settings.connectors.integrations.noResults', { query: searchQuery })
                  : t('settings.connectors.integrations.empty')}
              </p>
            </div>
          )}

          {connectedApps.length > 0 && (
            <div className="mb-6">
              <h3 className="typography-ui-header font-medium text-foreground mb-3 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--status-success)] shrink-0" />
                {t('settings.page.integrations.connected')}
                <span className="typography-micro text-muted-foreground font-normal">({connectedApps.length})</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {connectedApps.map((app) => {
                  const connectedAccount = connectedAccounts.find(
                    (acct) => acct.toolkit === app.id || acct.toolkit === app.name,
                  );
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        if (connectedAccount) setSelectedAccount(connectedAccount.id);
                      }}
                      className="group relative flex flex-col rounded-xl border border-[var(--status-success)]/40 bg-[var(--surface-elevated)] p-4 text-left transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer shadow-[0_0_12px_-4px_rgba(var(--status-success),0.15)]"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] overflow-hidden">
                          {app.logoUrl ? (
                            <img src={app.logoUrl} alt={app.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">{(app.name).split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                            {app.name}
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--status-success)]/10 px-1.5 py-0.5 text-[10px] text-[var(--status-success)] font-medium">
                              <Icon name="check" className="h-2.5 w-2.5" />
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{app.description}</p>
                          {connectedAccount?.createdAt && (
                            <p className="text-[10px] text-[var(--status-success)]/70 mt-0.5 flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--status-success)] shrink-0" />
                              {t('settings.connectors.integrations.composio.connected')}{' '}
                              {new Date(connectedAccount.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {app.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                        ))}
                        {(app.tags?.length ?? 0) > 2 && (
                          <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">+{app.tags.length - 2}</span>
                        )}
                      </div>
                      <div className="mt-auto">
                        <span className="inline-flex w-full items-center justify-center rounded-md border border-border bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-interactive-hover transition-colors">
                          {t('settings.connectors.integrations.composio.manage')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableApps.length > 0 && (
            <div>
              <h3 className="typography-ui-header font-medium text-foreground mb-3 flex items-center gap-2">
                <Icon name="cloud" className="h-4 w-4 text-muted-foreground" />
                {t('settings.page.integrations.available')}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleConnect(app.id)}
                    disabled={connectingSlug === app.id}
                    className="group relative flex flex-col rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-elevated)] p-4 text-left transition-all duration-200 hover:border-[var(--primary-base)]/35 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] overflow-hidden">
                        {app.logoUrl ? (
                          <img src={app.logoUrl} alt={app.name} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">{(app.name).split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground truncate">{app.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{app.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {app.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                      ))}
                      {(app.tags?.length ?? 0) > 2 && (
                        <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">+{app.tags.length - 2}</span>
                      )}
                    </div>
                    <div className="mt-auto">
                      <span className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-[var(--primary-base)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-all">
                        {connectingSlug === app.id
                          ? t('settings.connectors.integrations.composio.connecting')
                          : t('settings.connectors.integrations.composio.connect')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSentinel && <div ref={sentinelRef} className="h-4" />}
          {isLoadingMore && apps.length > 0 && (
            <div className="flex justify-center py-4 opacity-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={(open) => { if (!open) { setShowSuccessModal(false); setConnectedApp(null); } }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="mx-auto mb-5 flex flex-col items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--status-success)]/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--status-success)]/20 overflow-hidden" style={{ animation: 'scaleIn 0.3s ease-out' }}>
                  {connectedApp?.logoUrl ? (
                    <img src={connectedApp.logoUrl} alt={connectedApp.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <Icon name="check" className="h-8 w-8 text-[var(--status-success)]" style={{ animation: 'scaleIn 0.3s ease-out 0.15s both' }} />
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--status-success)] shadow-sm" style={{ animation: 'scaleIn 0.25s ease-out 0.3s both, pulse 2s ease-in-out infinite 0.5s' }}>
                  <Icon name="check" className="h-3.5 w-3.5 text-white" />
                </span>
              </div>
              <div className="text-center">
                {connectedApp && <p className="typography-ui-label text-muted-foreground mb-1">{connectedApp.name}</p>}
                <DialogTitle className="text-center text-xl font-semibold text-foreground">
                  {t('settings.page.integrations.successTitle')}
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground pt-1.5 max-w-sm mx-auto">
                  {connectedApp
                    ? t('settings.page.integrations.successDescription', { app: connectedApp.name })
                    : t('settings.page.integrations.successDescriptionGeneric')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button variant="default" onClick={() => { setShowSuccessModal(false); setConnectedApp(null); }}>
              {t('settings.page.integrations.successContinue')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--status-success), 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(var(--status-success), 0); }
        }
      `}</style>
    </div>
  );
};

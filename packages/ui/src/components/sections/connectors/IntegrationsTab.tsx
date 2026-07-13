import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore, type ComposioApp, type ComposioAuthField } from '@/stores/useComposioStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useComposioConnect } from '@/hooks/useComposioConnect';
import { toast } from '@/components/ui';

function getInitials(name: string): string {
  return name.split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

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
  const connectAppCustom = useComposioStore((s) => s.connectAppCustom);
  const disconnectAccount = useComposioStore((s) => s.disconnectAccount);

  const {
    connectingSlug,
    connectedApp,
    showSuccessModal,
    pendingCustomAuth,
    setShowSuccessModal,
    setConnectedApp,
    clearCustomAuth,
    startConnect,
  } = useComposioConnect();

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchInput, setSearchInput] = React.useState('');
  const [detailApp, setDetailApp] = React.useState<ComposioApp | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [credentialFields, setCredentialFields] = React.useState<ComposioAuthField[]>([]);
  const [credentialValues, setCredentialValues] = React.useState<Record<string, string>>({});
  const [isLoadingFields, setIsLoadingFields] = React.useState(false);
  const [credentialConnecting, setCredentialConnecting] = React.useState(false);

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

  const OAUTH_SCHEMES = React.useMemo(() => new Set(['OAUTH2', 'OAUTH1', 'DCR_OAUTH', 'S2S_OAUTH2']), []);

  const isNonOAuthScheme = React.useCallback((app: ComposioApp) => {
    if (!app.authScheme) return false;
    if (app.authScheme === 'NO_AUTH') return false;
    return !OAUTH_SCHEMES.has(app.authScheme);
  }, [OAUTH_SCHEMES]);

  // When detail dialog opens with a non-OAuth app, fetch required credential fields from SDK
  React.useEffect(() => {
    if (!detailApp || !detailApp.authScheme || !isNonOAuthScheme(detailApp)) {
      setCredentialFields([]);
      setCredentialValues({});
      return;
    }
    setIsLoadingFields(true);
    useComposioStore.getState().getAuthFields(detailApp.id, detailApp.authScheme).then((fields) => {
      setCredentialFields(fields);
      const initialValues: Record<string, string> = {};
      fields.forEach((f) => { initialValues[f.name] = ''; });
      setCredentialValues(initialValues);
      setIsLoadingFields(false);
    });
  }, [detailApp, isNonOAuthScheme]);

  const doConnectCustom = React.useCallback(async (app: ComposioApp) => {
    setCredentialConnecting(true);
    try {
      const result = await connectAppCustom(app.id, credentialValues, app.authScheme || 'API_KEY');
      if (result.ok && result.redirectUrl && result.connectionId) {
        setCredentialFields([]);
        setCredentialValues({});
        setDetailOpen(false);
        // Open OAuth popup with the redirectUrl from the custom auth config
        const left = Math.max(0, Math.round((window.screen.width - 600) / 2));
        const top = Math.max(0, Math.round((window.screen.height - 700) / 2));
        const popup = window.open(
          result.redirectUrl,
          'composio-oauth',
          `width=600,height=700,left=${left},top=${top},popup=1`,
        );
        if (popup) popup.focus();
      } else if (result.ok) {
        setCredentialFields([]);
        setCredentialValues({});
        setDetailOpen(false);
        setConnectedApp(app);
        setShowSuccessModal(true);
        await useComposioStore.getState().loadConnectedAccounts();
        toast.success(t('settings.connectors.integrations.toast.connected', { app: app.name }));
      } else {
        toast.error(t('settings.connectors.integrations.toast.connectFailed', { app: app.name }), {
          description: result.error,
        });
      }
    } finally {
      setCredentialConnecting(false);
    }
  }, [connectAppCustom, credentialValues, setConnectedApp, setShowSuccessModal, t]);

  const toolkitMatches = (toolkit: string, app: ComposioApp) =>
    toolkit === app.id || toolkit === app.slug || toolkit === app.name;

  const getConnectedAccountForApp = (app: ComposioApp) =>
    connectedAccounts.find((acct) => toolkitMatches(acct.toolkit, app) && (acct.status === 'connected' || acct.status === 'active'));

  // When OAuth connect fails because managed auth isn't available, switch
  // the detail dialog to custom-credentials mode for the same app.
  React.useEffect(() => {
    if (!pendingCustomAuth) return;
    const { app, authScheme } = pendingCustomAuth;
    setDetailApp(app);
    setDetailOpen(true);
    setIsLoadingFields(true);
    setCredentialValues({});
    useComposioStore.getState().getAuthFields(app.id, authScheme).then((fields) => {
      setCredentialFields(fields);
      const initialValues: Record<string, string> = {};
      fields.forEach((f) => { initialValues[f.name] = ''; });
      setCredentialValues(initialValues);
      setIsLoadingFields(false);
    });
    clearCustomAuth();
  }, [pendingCustomAuth, clearCustomAuth]);

  const handleDisconnect = React.useCallback(async (accountId: string) => {
    const account = connectedAccounts.find((acct) => acct.id === accountId);
    const matchedApp = account ? apps.find((a) => toolkitMatches(account.toolkit, a)) : undefined;
    const appName = matchedApp?.name ?? account?.toolkit ?? 'Account';
    try {
      const ok = await disconnectAccount(accountId);
      if (ok) {
        toast.success(t('settings.connectors.integrations.toast.disconnected', { app: appName }));
        setDetailOpen(false);
        setDetailApp(null);
      } else {
        toast.error(t('settings.connectors.integrations.toast.disconnectFailed', { app: appName }));
      }
    } catch {
      toast.error(t('settings.connectors.integrations.toast.disconnectFailed', { app: appName }));
    }
  }, [disconnectAccount, connectedAccounts, apps, toolkitMatches, t]);

  const connectedToolkitIds = new Set(
    connectedAccounts.map((acct) => acct.toolkit),
  );
  const showSentinel = hasMore && !isLoadingApps && apps.length > 0;

  const isAppConnected = (app: ComposioApp) =>
    connectedToolkitIds.has(app.id) || connectedToolkitIds.has(app.slug) || connectedToolkitIds.has(app.name) || app.authScheme === 'NO_AUTH';

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
              <div key={i} className="flex h-32 animate-pulse rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-muted)]" />
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
              const isConnected = isAppConnected(app);
              const initials = getInitials(app.name);

              return (
                <div
                  key={app.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setDetailApp(app); setDetailOpen(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailApp(app); setDetailOpen(true); } }}
                  className={cn(
                    'group relative flex flex-col rounded-xl border bg-[var(--surface-elevated)] p-4 transition-all duration-200 cursor-pointer',
                    isConnected
                      ? 'border-[var(--status-success)]/40 shadow-[0_0_12px_-4px_rgba(var(--status-success),0.15)]'
                      : 'border-[var(--interactive-border)] hover:border-[var(--primary-base)]/35 hover:shadow-sm hover:-translate-y-0.5',
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] overflow-hidden">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.name} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                        {app.name}
                        {isConnected && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--status-success)]/10 px-1.5 py-0.5 text-[10px] text-[var(--status-success)] font-medium">
                            <Icon name="check" className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{app.description}</p>
                    </div>
                  </div>
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {app.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                      ))}
                      {app.tags.length > 2 && <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">+{app.tags.length - 2}</span>}
                    </div>
                  )}
                  <div className="mt-auto">
                    {isConnected ? (
                      <span className="inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                        {t('settings.connectors.integrations.composio.connected')}
                      </span>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center rounded-md bg-[var(--primary-base)] px-3 py-1.5 text-xs font-medium text-white">
                        {t('settings.connectors.integrations.composio.connect')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showSentinel && <div ref={sentinelRef} className="h-4" />}
        {isLoadingMore && apps.length > 0 && (
          <div className="flex justify-center py-4 opacity-50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
          </div>
        )}
      </div>

      {/* Detail Dialog — opens on card click */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setDetailApp(null); setCredentialFields([]); setCredentialValues({}); } }}>
        <DialogContent className="sm:max-w-lg">
          {detailApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] overflow-hidden">
                    {detailApp.logoUrl ? (
                      <img src={detailApp.logoUrl} alt={detailApp.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">{getInitials(detailApp.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-lg font-semibold truncate block">{detailApp.name}</span>
                    <DialogDescription className="mt-0.5">{detailApp.authScheme || detailApp.category}</DialogDescription>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-foreground leading-relaxed">{detailApp.description}</p>

                {detailApp.tags && detailApp.tags.length > 0 && (
                  <div>
                    <h4 className="typography-ui-label font-medium text-foreground text-xs uppercase tracking-wider mb-2">
                      {t('settings.connectors.integrations.composio.tools')}
                    </h4>
                    {detailApp.meta?.toolsCount > 0 && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {detailApp.meta.toolsCount} available actions, {detailApp.meta.triggersCount || 0} triggers
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {detailApp.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-foreground">
                          <Icon name="check" className="h-3 w-3 text-[var(--status-success)] shrink-0" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detailApp.authScheme && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('settings.connectors.integrations.composio.authScheme')}</span>
                    <span className="text-foreground font-medium">{detailApp.authScheme}</span>
                  </div>
                )}
              </div>

              {(() => {
                const account = getConnectedAccountForApp(detailApp);
                const hasCredentialFields = credentialFields.length > 0;
                const isCustomAuth = isNonOAuthScheme(detailApp) || hasCredentialFields;
                const isNoAuth = detailApp.authScheme === 'NO_AUTH';
                const alreadyConnected = (!!account || isNoAuth) && !hasCredentialFields;

                if (alreadyConnected) {
                  return (
                    <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                      <DialogClose asChild>
                        <Button variant="outline">{t('settings.connectors.integrations.composio.cancel')}</Button>
                      </DialogClose>
                      {account && (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(account.id)}
                          className="text-[var(--status-error)] border-[var(--status-error)]/30 hover:border-[var(--status-error)]/60"
                        >
                          {t('settings.connectors.integrations.composio.disconnect')}
                        </Button>
                      )}
                    </div>
                  );
                }

                if (isCustomAuth) {
                  return (
                    <div className="border-t border-border px-6 py-4 space-y-3">
                      {isLoadingFields ? (
                        <div className="flex justify-center py-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
                        </div>
                      ) : (
                        credentialFields.map((field) => (
                          <div key={field.name}>
                            <label className="typography-ui-label text-xs text-muted-foreground mb-1 block">
                              {field.displayName || field.name}
                            </label>
                            <input
                              type={
                                field.name.toLowerCase().includes('password')
                                || field.name.toLowerCase().includes('secret')
                                || field.name.toLowerCase().includes('token')
                                || field.name.toLowerCase().includes('key')
                                  ? 'password' : 'text'
                              }
                              value={credentialValues[field.name] || ''}
                              onChange={(e) => setCredentialValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                              placeholder={field.description || `Enter ${field.displayName || field.name}`}
                              className="h-8 w-full rounded-md border border-border bg-[var(--surface-muted)] px-3 text-sm text-foreground outline-none focus:border-[var(--primary-base)]/50"
                            />
                          </div>
                        ))
                      )}
                      <div className="flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button variant="outline">{t('settings.connectors.integrations.composio.cancel')}</Button>
                        </DialogClose>
                        <Button
                          variant="default"
                          onClick={() => doConnectCustom(detailApp)}
                          disabled={credentialConnecting || credentialFields.some((f) => f.required && !credentialValues[f.name])}
                        >
                          {credentialConnecting
                            ? t('settings.connectors.integrations.composio.connecting')
                            : t('settings.connectors.integrations.composio.connect')}
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                    <DialogClose asChild>
                      <Button variant="outline">{t('settings.connectors.integrations.composio.cancel')}</Button>
                    </DialogClose>
                    <Button
                      variant="default"
                      onClick={() => {
                        setDetailOpen(false);
                        startConnect(detailApp);
                      }}
                      disabled={connectingSlug === detailApp.id}
                    >
                      {connectingSlug === detailApp.id
                        ? t('settings.connectors.integrations.composio.connecting')
                        : t('settings.connectors.integrations.composio.connect')}
                    </Button>
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
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

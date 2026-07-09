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

export const IntegracionesPage: React.FC = () => {
  const { t } = useI18n();
  const timeFormatPreference = useUIStore((s) => s.timeFormatPreference);
  const apps = useComposioStore((s) => s.apps);
  const connectedAccounts = useComposioStore((s) => s.connectedAccounts);
  const selectedAccountId = useComposioStore((s) => s.selectedAccountId);
  const isLoadingApps = useComposioStore((s) => s.isLoadingApps);
  const loadApps = useComposioStore((s) => s.loadApps);
  const connectApp = useComposioStore((s) => s.connectApp);
  const disconnectAccount = useComposioStore((s) => s.disconnectAccount);

  const [connectingSlug, setConnectingSlug] = React.useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [connectedApp, setConnectedApp] = React.useState<ComposioApp | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState<string | null>(null);
  const oauthWindowRef = React.useRef<Window | null>(null);
  const oauthCheckIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, [loadApps]);

  React.useEffect(() => {
    return () => {
      if (oauthCheckIntervalRef.current) {
        clearInterval(oauthCheckIntervalRef.current);
      }
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
      }
    };
  }, []);

  const getAppForToolkit = (toolkit: string) => apps.find((a) => a.id === toolkit || a.name === toolkit);

  const handleReconnect = React.useCallback(async (appId: string) => {
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

  if (connectedAccounts.length > 0 && !selectedAccount && !isLoadingApps) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Icon name="plug" className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="typography-ui-header font-semibold text-foreground mb-2">
            {t('settings.page.integrations.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.connectors.sidebar.integrations')}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedAccount && connectedAccounts.length === 0 && !isLoadingApps) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Icon name="plug" className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="typography-ui-header font-semibold text-foreground mb-2">
            {t('settings.page.integrations.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.connectors.integrations.empty')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t('settings.connectors.sidebar.integrations')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {(selectedAccount ? [selectedAccount] : connectedAccounts).map((acct) => {
            const app = getAppForToolkit(acct.toolkit);
            const appName = app?.name ?? acct.toolkit;
            const initials = appName
              .split(/[\s_-]+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const isConnecting = connectingSlug === (app?.id ?? acct.toolkit);
            const isDisconnecting = disconnectingId === acct.id;

            return (
              <div
                key={acct.id}
                className="rounded-xl border border-border bg-[var(--surface-elevated)] overflow-hidden"
              >
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
                      <div
                        key={tag}
                        className="flex items-center gap-2 rounded-md bg-[var(--surface-muted)] px-3 py-2"
                      >
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
                    onClick={() => handleReconnect(app?.id ?? acct.toolkit)}
                    disabled={isConnecting}
                  >
                    {isConnecting
                      ? t('settings.connectors.integrations.composio.connecting')
                      : t('settings.connectors.integrations.composio.reAuthorize')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(acct.id)}
                    disabled={isDisconnecting}
                    className="text-[var(--status-error)] hover:text-[var(--status-error)] border-[var(--status-error)]/30 hover:border-[var(--status-error)]/60"
                  >
                    {isDisconnecting
                      ? t('settings.connectors.integrations.composio.disconnecting')
                      : t('settings.connectors.integrations.composio.disconnect')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showDisconnectConfirm !== null} onOpenChange={(open) => { if (!open) setShowDisconnectConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.connectors.integrations.composio.confirmDisconnect')}</DialogTitle>
            <DialogDescription>
              {t('settings.connectors.integrations.composio.disconnectWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDisconnectConfirm(null)}>
              {t('settings.connectors.integrations.composio.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (showDisconnectConfirm) handleDisconnect(showDisconnectConfirm);
              }}
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
                {connectedApp && (
                  <p className="typography-ui-label text-muted-foreground mb-1">{connectedApp.name}</p>
                )}
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
            <Button
              variant="default"
              onClick={() => {
                setShowSuccessModal(false);
                setConnectedApp(null);
              }}
            >
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

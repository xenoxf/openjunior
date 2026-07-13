import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useComposioStore, type ComposioApp } from '@/stores/useComposioStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { useComposioConnect } from '@/hooks/useComposioConnect';
import { toast } from '@/components/ui';
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
  timeFormatPreference: TimeFormatPreference;
}> = ({ acct, app, connectingSlug, disconnectingId, onReconnect, onDisconnectClick, timeFormatPreference }) => {
  const { t } = useI18n();
  const appName = app?.name ?? acct.toolkit;
  const initials = typeof appName === 'string'
    ? appName.split(/[\s_-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="mx-auto max-w-2xl pt-6">
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

        {app?.tags && app.tags.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <h4 className="typography-ui-label font-medium text-foreground text-xs uppercase tracking-wider">
              {t('settings.connectors.integrations.composio.tools')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {app.tags.slice(0, 8).map((tag) => (
                <div key={tag} className="flex items-center gap-1.5 rounded-md bg-[var(--surface-muted)] px-2.5 py-1">
                  <Icon name="check" className="h-3 w-3 text-[var(--status-success)] shrink-0" />
                  <span className="text-xs text-foreground">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
  const loadApps = useComposioStore((s) => s.loadApps);
  const disconnectAccount = useComposioStore((s) => s.disconnectAccount);
  const setSelectedAccount = useComposioStore((s) => s.setSelectedAccount);

  const { connectingSlug, startConnect } = useComposioConnect();

  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadApps();
    useComposioStore.getState().loadConnectedAccounts();
  }, [loadApps]);

  const getAppForToolkit = React.useCallback((toolkit: string) => apps.find((a) => a.id === toolkit || a.slug === toolkit || a.name === toolkit), [apps]);

  const handleReconnect = React.useCallback(async (appId: string) => {
    const app = getAppForToolkit(appId);
    if (!app) return;
    await startConnect(app);
  }, [getAppForToolkit, startConnect]);

  const handleDisconnect = React.useCallback(async (accountId: string) => {
    setDisconnectingId(accountId);
    try {
      const ok = await disconnectAccount(accountId);
      const account = connectedAccounts.find((acct) => acct.id === accountId);
      const fallbackName = account?.toolkit ?? 'Account';
      if (ok) {
        toast.success(t('settings.connectors.integrations.toast.disconnected', { app: fallbackName }));
        setShowDisconnectConfirm(null);
        setSelectedAccount(null);
      } else {
        toast.error(t('settings.connectors.integrations.toast.disconnectFailed', { app: fallbackName }));
      }
    } finally {
      setDisconnectingId(null);
    }
  }, [disconnectAccount, setSelectedAccount, connectedAccounts, t]);

  const selectedAccount = selectedAccountId
    ? connectedAccounts.find((acct) => acct.id === selectedAccountId)
    : null;

  if (!selectedAccount) {
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

  const app = getAppForToolkit(selectedAccount.toolkit);

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex-1 px-6 py-4">
        <AccountDetail
          acct={selectedAccount}
          app={app}
          connectingSlug={connectingSlug}
          disconnectingId={disconnectingId}
          onReconnect={handleReconnect}
          onDisconnectClick={(id) => setShowDisconnectConfirm(id)}
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
    </div>
  );
};

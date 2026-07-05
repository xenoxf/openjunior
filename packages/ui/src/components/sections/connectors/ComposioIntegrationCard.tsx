import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import { useComposioStore, type ComposioApp } from '@/stores/useComposioStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui';

interface ComposioIntegrationCardProps {
  app: ComposioApp;
  isConnected: boolean;
  connectedAccountId?: string;
}

export const ComposioIntegrationCard: React.FC<ComposioIntegrationCardProps> = ({
  app,
  isConnected,
  connectedAccountId,
}) => {
  const { t } = useI18n();
  const { connectApp, disconnectAccount } = useComposioStore();
  const [connecting, setConnecting] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectApp(app.id);
      if (result.ok && result.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
        toast.success(t('settings.connectors.integrations.composio.connecting'), {
          description: t('settings.connectors.integrations.composio.completeAuth'),
        });
      } else {
        toast.error(t('settings.connectors.integrations.composio.connectFailed'), {
          description: result.error,
        });
      }
    } catch {
      toast.error(t('settings.connectors.integrations.composio.connectFailed'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectedAccountId) return;
    setDisconnecting(true);
    try {
      await disconnectAccount(connectedAccountId);
      toast.success(t('settings.connectors.integrations.composio.disconnected'));
    } catch {
      toast.error(t('settings.connectors.integrations.composio.disconnectFailed'));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-4 transition-all duration-200',
        isConnected
          ? 'border-[var(--status-success)]/30 bg-[var(--surface-elevated)]'
          : 'border-[var(--interactive-border)] bg-[var(--surface-elevated)] hover:border-[var(--primary-base)]/35',
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)]">
          <Icon name="plug" className="h-5 w-5 text-[var(--muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--foreground)] truncate">
            {app.name}
          </h4>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
            {app.description}
          </p>
        </div>
      </div>

      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {app.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {isConnected && (
        <div className="mb-2 rounded-lg bg-[var(--status-success)]/5 px-2 py-1 text-xs text-[var(--status-success)]">
          <Icon name="check" className="inline h-3 w-3 mr-1" />
          {t('settings.connectors.integrations.composio.connected')}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="xs"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full"
          >
            {disconnecting
              ? t('settings.connectors.integrations.composio.disconnecting')
              : t('settings.connectors.integrations.composio.disconnect')}
          </Button>
        ) : (
          <Button
            variant="default"
            size="xs"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting
              ? t('settings.connectors.integrations.composio.connecting')
              : t('settings.connectors.integrations.composio.connect')}
          </Button>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import { useComposioStore, type ComposioApp } from '@/stores/useComposioStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ComposioIntegrationCardProps {
  app: ComposioApp;
  isConnected: boolean;
  connectedAccountId?: string;
  connectedAt?: string;
  onConnect?: () => void;
  isConnecting?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const ComposioIntegrationCard: React.FC<ComposioIntegrationCardProps> = ({
  app,
  isConnected,
  connectedAccountId,
  connectedAt,
  onConnect,
  isConnecting: externalConnecting,
}) => {
  const { t } = useI18n();
  const { disconnectAccount } = useComposioStore();
  const [disconnecting, setDisconnecting] = React.useState(false);

  const handleDisconnect = async () => {
    if (!connectedAccountId) return;
    setDisconnecting(true);
    try {
      await disconnectAccount(connectedAccountId);
    } finally {
      setDisconnecting(false);
    }
  };

  const initials = getInitials(app.name);

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border p-4 transition-all duration-200 overflow-hidden',
        isConnected
          ? 'border-[var(--status-success)]/40 bg-[var(--surface-elevated)] shadow-[0_0_12px_-4px_rgba(var(--status-success),0.15)]'
          : 'border-[var(--interactive-border)] bg-[var(--surface-elevated)] hover:border-[var(--primary-base)]/35 hover:shadow-sm hover:-translate-y-0.5',
        onConnect && !isConnected && 'cursor-pointer',
      )}
      role={onConnect && !isConnected ? 'button' : undefined}
      tabIndex={onConnect && !isConnected ? 0 : undefined}
      onClick={onConnect && !isConnected ? onConnect : undefined}
      onKeyDown={onConnect && !isConnected ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onConnect(); } } : undefined}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] overflow-hidden">
          {app.logoUrl ? (
            <img
              src={app.logoUrl}
              alt={app.name}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={cn(
            'text-xs font-semibold text-muted-foreground',
            app.logoUrl ? 'hidden' : '',
          )}>
            {initials}
          </span>
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
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {app.description}
          </p>
          {isConnected && connectedAt && (
            <p className="text-[10px] text-[var(--status-success)]/70 mt-0.5 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--status-success)] shrink-0" />
              {t('settings.connectors.integrations.composio.connected')}{' '}
              {new Date(connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {app.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {app.tags.length > 2 && (
            <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-muted-foreground">
              +{app.tags.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="xs"
            onClick={(e) => { e.stopPropagation(); handleDisconnect(); }}
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
            onClick={onConnect}
            disabled={externalConnecting}
            className="w-full"
          >
            {externalConnecting
              ? t('settings.connectors.integrations.composio.connecting')
              : t('settings.connectors.integrations.composio.connect')}
          </Button>
        )}
      </div>
    </div>
  );
};

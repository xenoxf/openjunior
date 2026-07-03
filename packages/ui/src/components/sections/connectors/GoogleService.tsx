import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import { useServiceAuthStore, type ServiceAuthStatus } from '@/stores/useServiceAuthStore';
import { runtimeFetch } from '@/lib/runtime-fetch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui';

interface GoogleServiceProps {
  status: ServiceAuthStatus | null;
}

export const GoogleService: React.FC<GoogleServiceProps> = ({ status }) => {
  const { t } = useI18n();
  const { setStatus } = useServiceAuthStore();
  const [connecting, setConnecting] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await runtimeFetch('/api/auth/google/start', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const body = await response.text();
        let shortMessage: string;
        try {
          const parsed = JSON.parse(body);
          shortMessage = parsed.error || 'Failed to start Google OAuth';
        } catch {
          shortMessage = body.includes('Cannot') || body.includes('404')
            ? 'Google OAuth is not configured on the server. Backend routes are needed.'
            : 'Failed to start Google OAuth';
        }
        toast.error(shortMessage, {
          description: `Server returned ${response.status}:\n${body.slice(0, 2000)}`,
        });
        return;
      }
      let data: { url?: string };
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        toast.error('Invalid response from server (expected JSON)', {
          description: text ? `Body:\n${text.slice(0, 2000)}` : 'The server returned an empty or non-JSON response.',
        });
        return;
      }
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        setConnecting(false);
        return;
      }
      toast.error('No OAuth URL returned');
    } catch (err) {
      toast.error('Failed to connect Google', {
        description: err instanceof Error ? err.message : 'Network error. Check your connection.',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await runtimeFetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        toast.error('Failed to disconnect Google', {
          description: `Server returned ${response.status}:\n${body.slice(0, 2000)}`,
        });
        return;
      }
      setStatus('google', { connected: false });
      toast.success('Google disconnected');
    } catch (err) {
      toast.error('Failed to disconnect Google', {
        description: err instanceof Error ? err.message : 'Network error. Check your connection.',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.connected === true;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-5 transition-all duration-200',
        isConnected
          ? 'border-[var(--status-success)]/30 bg-[var(--surface-elevated)]'
          : 'border-[var(--interactive-border)] bg-[var(--surface-elevated)] hover:border-[var(--primary-base)]/35'
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)]">
          <span className="text-lg font-bold" style={{ color: '#4285F4' }}>G</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {t('settings.connectors.integrations.google.title')}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {t('settings.connectors.integrations.google.description')}
          </p>
        </div>
      </div>

      {isConnected && (
        <div className="mb-3 rounded-lg bg-[var(--status-success)]/5 px-3 py-2 text-xs text-[var(--status-success)]">
          <Icon name="check" className="inline h-3.5 w-3.5 mr-1" />
          {t('settings.connectors.integrations.google.connected')}
          {status?.email && (
            <span className="block text-[var(--muted-foreground)] mt-0.5">{status.email}</span>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full"
          >
            {disconnecting
              ? t('settings.connectors.integrations.google.disconnecting')
              : t('settings.connectors.integrations.google.disconnect')}
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting
              ? t('settings.connectors.integrations.google.connecting')
              : t('settings.connectors.integrations.google.connect')}
          </Button>
        )}
      </div>
    </div>
  );
};

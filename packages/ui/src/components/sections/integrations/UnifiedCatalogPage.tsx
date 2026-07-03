import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/components/ui';
import {
  useMcpRegistryStore,
  type McpRegistryServer,
  type McpEnvVar,
  type McpRemoteHeader,
  type McpRemoteVariable,
} from '@/stores/useMcpRegistryStore';
import { runtimeFetch } from '@/lib/runtime-fetch';
import { useMcpConfigStore } from '@/stores/useMcpConfigStore';
import { useMcpStore } from '@/stores/useMcpStore';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { getPopularityRank } from './appIcons';
import { ServerIcon } from './ServerIcon';

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-elevated)] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-[var(--surface-muted)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[var(--surface-muted)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-3 w-full rounded bg-[var(--surface-muted)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--surface-muted)]" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-3 w-16 rounded bg-[var(--surface-muted)]" />
        <div className="ml-auto h-3 w-14 rounded bg-[var(--surface-muted)]" />
      </div>
      <div className="mt-4 flex items-center">
        <div className="ml-auto h-8 w-20 rounded-lg bg-[var(--surface-muted)]" />
      </div>
    </div>
  );
}

function TransportBadge({ type }: { type: McpRegistryServer['transportType'] }) {
  if (!type) return null;
  const isStdio = type === 'stdio';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 typography-micro font-medium',
        isStdio
          ? 'bg-[var(--status-success)]/10 text-[var(--status-success)]'
          : 'bg-[var(--status-info)]/10 text-[var(--status-info)]'
      )}
    >
      <Icon name={isStdio ? 'terminal-box' : 'global'} className="h-3 w-3" />
      {isStdio ? 'stdio' : type === 'streamable-http' ? 'HTTP' : 'SSE'}
    </span>
  );
}

function AuthBadge({ hasAuth, hasOAuth }: { hasAuth: boolean; hasOAuth: boolean }) {
  if (!hasAuth) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 typography-micro font-medium',
        'bg-[var(--status-warning)]/10 text-[var(--status-warning)]'
      )}
    >
      <Icon name="lock" className="h-3 w-3" />
      {hasOAuth ? 'OAuth' : 'API Key'}
    </span>
  );
}

function EnvVarRow({ env }: { env: McpEnvVar }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <code className="typography-small rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[var(--surface-foreground)]">
        {env.name}
      </code>
      {env.isSecret && (
        <Icon name="lock" className="h-3 w-3 shrink-0 text-[var(--status-warning)]" aria-label="Secret" />
      )}
      {env.isRequired && (
        <span className="typography-micro text-[var(--status-error)]">Required</span>
      )}
      <span className="typography-small text-[var(--surface-mutedForeground)] flex-1 truncate">
        {env.description || 'No description'}
      </span>
      {env.defaultValue && (
        <span className="typography-small text-[var(--surface-mutedForeground)]/60">
          default: {env.defaultValue}
        </span>
      )}
    </div>
  );
}

function HeaderRow({ header }: { header: McpRemoteHeader }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <code className="typography-small rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[var(--surface-foreground)]">
        {header.name}
      </code>
      {header.isSecret && (
        <Icon name="lock" className="h-3 w-3 shrink-0 text-[var(--status-warning)]" aria-label="Secret" />
      )}
      {header.isRequired && (
        <span className="typography-micro text-[var(--status-error)]">Required</span>
      )}
      <span className="typography-small text-[var(--surface-mutedForeground)] flex-1 truncate">
        {header.description || 'No description'}
      </span>
      {header.placeholder && (
        <span className="typography-small text-[var(--surface-mutedForeground)]/40 font-mono truncate max-w-[200px]">
          e.g. {header.placeholder}
        </span>
      )}
    </div>
  );
}

function VariableRow({ variable }: { variable: McpRemoteVariable }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <code className="typography-small rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[var(--surface-foreground)]">
        {variable.name}
      </code>
      {variable.isRequired && (
        <span className="typography-micro text-[var(--status-error)]">Required</span>
      )}
      <span className="typography-small text-[var(--surface-mutedForeground)] flex-1 truncate">
        {variable.description || 'No description'}
      </span>
      {variable.choices && (
        <span className="typography-micro text-[var(--surface-mutedForeground)]/60">
          choices: {variable.choices.join(', ')}
        </span>
      )}
    </div>
  );
}

function DetailDialog({
  server,
  open,
  onOpenChange,
  onInstall,
  onUninstall,
  isInstalling,
  isUninstalling,
  isInstalled,
  envValues,
  onEnvValueChange,
}: {
  server: McpRegistryServer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (server: McpRegistryServer) => void;
  onUninstall: (server: McpRegistryServer) => void;
  isInstalling: boolean;
  isUninstalling: boolean;
  isInstalled: boolean;
  envValues: Record<string, string>;
  onEnvValueChange: (name: string, value: string) => void;
}) {
  const { t } = useI18n();

  const requiredFields = React.useMemo(() => {
    if (!server) return [];
    const envRequired = server.envVars.filter(v => v.isRequired).map(v => v.name);
    const headerRequired = server.remoteHeaders.filter(h => h.isRequired).map(h => `__header_${h.name}`);
    return [...envRequired, ...headerRequired];
  }, [server]);

  const missingRequired = React.useMemo(() => {
    return requiredFields.filter(key => !envValues[key]?.trim());
  }, [requiredFields, envValues]);

  if (!server) return null;

  const hasRequirements = server.envVars.length > 0 || server.remoteHeaders.length > 0 || server.remoteVariables.length > 0;
  const isGoogleMcp = server.name.toLowerCase().includes('google') || server.title.toLowerCase().includes('google');
  const popularRank = getPopularityRank(server.name, server.title);

  const canInstall = !isInstalled && server.installType && missingRequired.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3">
            <ServerIcon server={server} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold truncate">{server.title}</span>
                {popularRank && popularRank <= 10 && (
                  <span className="shrink-0 rounded-full bg-[var(--status-warning)]/15 px-2 py-0.5 typography-micro font-semibold text-[var(--status-warning)]">
                    🔥 Popular
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1">
                <code className="text-xs font-mono">{server.name}</code>
                {' · '}v{server.version}
                {' · '}
                {server.transportType === 'stdio' ? 'Local (stdio)' : server.transportType === 'streamable-http' ? 'Remote (HTTP)' : server.transportType === 'sse' ? 'Remote (SSE)' : 'Unknown'}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-6 py-4">
          <p className="typography-ui text-[var(--surface-foreground)] mb-4">
            {server.description || t('settings.integrations.card.noDescription')}
          </p>

          {/* Google OAuth sign-in */}
          {isGoogleMcp && server.hasOAuth && (
            <div className="mb-4 rounded-lg border border-[var(--status-info)]/30 bg-[var(--status-info)]/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)]">
                  <Icon name="global" className="h-5 w-5 text-[var(--surface-foreground)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="typography-ui-label font-medium text-[var(--surface-foreground)]">
                    {t('settings.integrations.detail.signInWithGoogle')}
                  </p>
                  <p className="typography-small text-[var(--surface-mutedForeground)] mt-1">
                    {t('settings.integrations.detail.googleOAuthNote')}
                  </p>
                  <p className="typography-micro text-[var(--surface-mutedForeground)]/60 mt-1">
                    {t('settings.integrations.detail.signInWithGoogleDescription')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      toast.info('Google Sign-In', {
                        description: 'OAuth flow will open in your browser. Your credentials stay local.',
                      });
                    }}
                  >
                    <Icon name="global" className="h-4 w-4" />
                    Sign in with Google
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasRequirements && !(isGoogleMcp && server.hasOAuth) && server.hasAuth && (
            <div className="mb-4">
              <h4 className="typography-ui-label font-medium text-[var(--surface-foreground)] mb-2">
                {t('settings.integrations.detail.requiredCredentials')}
              </h4>
              {server.envVars.filter(v => v.isSecret || v.isRequired).map(env => (
                <div key={env.name} className="mb-3">
                  <label className="typography-small text-[var(--surface-mutedForeground)] block mb-1">
                    <code className="font-mono">{env.name}</code>
                    {env.isRequired && <span className="text-[var(--status-error)] ml-1">*</span>}
                    {env.isSecret && <Icon name="lock" className="h-3 w-3 inline ml-1 text-[var(--status-warning)]" aria-label="Secret" />}
                  </label>
                  {env.description && (
                    <p className="typography-micro text-[var(--surface-mutedForeground)]/60 mb-1">{env.description}</p>
                  )}
                  <input
                    type={env.isSecret ? "password" : "text"}
                    value={envValues[env.name] || ''}
                    onChange={(e) => onEnvValueChange(env.name, e.target.value)}
                    placeholder={env.placeholder || `Enter ${env.name}`}
                    className="w-full rounded-lg border bg-[var(--surface-elevated)] py-2 px-3 typography-ui text-[var(--surface-foreground)] border-[var(--interactive-border)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50 font-mono"
                  />
                </div>
              ))}
              {server.remoteHeaders.filter(h => h.isSecret || h.isRequired).map(header => (
                <div key={header.name} className="mb-3">
                  <label className="typography-small text-[var(--surface-mutedForeground)] block mb-1">
                    <code className="font-mono">Header: {header.name}</code>
                    {header.isRequired && <span className="text-[var(--status-error)] ml-1">*</span>}
                  </label>
                  {header.description && (
                    <p className="typography-micro text-[var(--surface-mutedForeground)]/60 mb-1">{header.description}</p>
                  )}
                  <input
                    type={header.isSecret ? "password" : "text"}
                    value={envValues[`__header_${header.name}`] || ''}
                    onChange={(e) => onEnvValueChange(`__header_${header.name}`, e.target.value)}
                    placeholder={header.placeholder || `Enter ${header.name}`}
                    className="w-full rounded-lg border bg-[var(--surface-elevated)] py-2 px-3 typography-ui text-[var(--surface-foreground)] border-[var(--interactive-border)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Auth warning for non-Google MCPs */}
          {server.hasAuth && !(isGoogleMcp && server.hasOAuth) && (
            <div className="mb-4 rounded-lg border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5 p-3">
              <div className="flex items-start gap-2">
                <Icon name="error-warning" className="h-5 w-5 shrink-0 text-[var(--status-warning)] mt-0.5" />
                <div>
                  <p className="typography-ui-label font-medium text-[var(--status-warning)]">
                    {server.hasOAuth ? 'OAuth Required' : 'API Key Required'}
                  </p>
                  <p className="typography-small text-[var(--surface-mutedForeground)] mt-1">
                    {server.hasOAuth
                      ? 'This server requires OAuth 2.0 authentication. After install, your MCP client will guide you through browser-based authorization.'
                      : 'This server requires an API key or token. You will need to obtain credentials before using this server.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Install command */}
          {server.installCommand && (
            <div className="mb-4">
              <h4 className="typography-ui-label font-medium text-[var(--surface-foreground)] mb-1">{t('settings.integrations.detail.install')}</h4>
              <div className="rounded-lg bg-[var(--syntax-base-background)] p-3">
                <code className="text-sm font-mono text-[var(--syntax-base-foreground)]">
                  {server.installCommand.join(' ')}
                </code>
              </div>
            </div>
          )}

          {server.installUrl && (
            <div className="mb-4">
              <h4 className="typography-ui-label font-medium text-[var(--surface-foreground)] mb-1">{t('settings.integrations.detail.details')}</h4>
              <div className="rounded-lg bg-[var(--syntax-base-background)] p-3">
                <code className="text-sm font-mono text-[var(--syntax-base-foreground)] break-all">
                  {server.installUrl}
                </code>
              </div>
            </div>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <div className="mb-4">
              <h4 className="typography-ui-label font-medium text-[var(--surface-foreground)] mb-2">
                Configuration Requirements
              </h4>

              {server.envVars.length > 0 && (
                <div className="mb-3">
                  <p className="typography-small text-[var(--surface-mutedForeground)] mb-1">Environment Variables:</p>
                  <div className="divide-y divide-[var(--interactive-border)]/50">
                    {server.envVars.map((env) => (
                      <EnvVarRow key={env.name} env={env} />
                    ))}
                  </div>
                </div>
              )}

              {server.remoteHeaders.length > 0 && (
                <div className="mb-3">
                  <p className="typography-small text-[var(--surface-mutedForeground)] mb-1">HTTP Headers:</p>
                  <div className="divide-y divide-[var(--interactive-border)]/50">
                    {server.remoteHeaders.map((header) => (
                      <HeaderRow key={header.name} header={header} />
                    ))}
                  </div>
                </div>
              )}

              {server.remoteVariables.length > 0 && (
                <div>
                  <p className="typography-small text-[var(--surface-mutedForeground)] mb-1">Server Variables:</p>
                  <div className="divide-y divide-[var(--interactive-border)]/50">
                    {server.remoteVariables.map((variable) => (
                      <VariableRow key={variable.name} variable={variable} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {server.homepage && (
              <a
                href={server.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 typography-small text-[var(--primary-base)] hover:underline"
              >
                <Icon name="external-link" className="h-3 w-3" />
                Homepage
              </a>
            )}
            {server.repository && (
              <a
                href={server.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 typography-small text-[var(--primary-base)] hover:underline"
              >
                <Icon name="github-fill" className="h-3 w-3" />
                Repository
              </a>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-col items-stretch gap-2">
          {missingRequired.length > 0 && (
            <p className="typography-micro text-[var(--status-warning)] text-center">
              Fill in required fields ({missingRequired.length} missing) to enable installation.
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            {!isInstalled && server.installType && (
              <Button
                variant="default"
                onClick={() => onInstall(server)}
                disabled={isInstalling || !canInstall}
                title={missingRequired.length > 0 ? `Required: ${missingRequired.join(', ')}` : undefined}
              >
                {isInstalling ? (
                  <>
                    <Icon name="loader-4" className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Icon name="download" className="h-4 w-4" />
                    Install
                  </>
                )}
              </Button>
            )}
            {isInstalled && server.installType && (
              <Button
                variant="destructive"
                onClick={() => onUninstall(server)}
                disabled={isUninstalling}
              >
                {isUninstalling ? (
                  <>
                    <Icon name="loader-4" className="h-4 w-4 animate-spin" />
                    Uninstalling...
                  </>
                ) : (
                  <>
                    <Icon name="delete-bin" className="h-4 w-4" />
                    Uninstall
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function computeServerRank(server: McpRegistryServer): number {
  const popularRank = getPopularityRank(server.name, server.title);
  if (popularRank !== null) return popularRank;

  let score = 20;
  if (server.hasOAuth) score -= 3;
  if (server.status === 'active') score -= 2;
  if (server.categories.some(c => ['database', 'search', 'communication'].includes(c))) score -= 1;
  return score;
}

export const UnifiedCatalogPage: React.FC = () => {
  const { t } = useI18n();
  const rawServers = useMcpRegistryStore((state) => state.servers);
  const {
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    searchQuery,
    fetchServers,
    fetchMore,
    setSearch,
    categories,
    activeCategory,
    fetchCategories,
    setActiveCategory,
  } = useMcpRegistryStore();

  const [installedNames, setInstalledNames] = React.useState<string[]>([]);
  const [selectedServer, setSelectedServer] = React.useState<McpRegistryServer | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [installingName, setInstallingName] = React.useState<string | null>(null);
  const [deletingName, setDeletingName] = React.useState<string | null>(null);
  const [localSearch, setLocalSearch] = React.useState('');
  const [pendingEnvValues, setPendingEnvValues] = React.useState<Record<string, string>>({});
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Smart ranking: sort servers by popularity
  const servers = React.useMemo(() => {
    return [...rawServers].sort((a, b) => computeServerRank(a) - computeServerRank(b));
  }, [rawServers]);

  // Reset env values when selected server changes
  React.useEffect(() => {
    setPendingEnvValues({});
  }, [selectedServer]);

  // Initial fetch
  React.useEffect(() => {
    void fetchServers(undefined);
    void fetchCategories();
    void loadInstalled();
  }, [fetchServers, fetchCategories]);

  // Debounced search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = React.useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearch(value);
        void fetchServers(value, activeCategory);
      }, 300);
    },
    [fetchServers, setSearch, activeCategory]
  );

  // Infinite scroll via IntersectionObserver — ref-based guard to prevent cascade
  const loadingRef = React.useRef(false);
  loadingRef.current = isLoadingMore || isLoading;

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadingRef.current = true;
          void fetchMore().finally(() => {
            if (active) loadingRef.current = false;
          });
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [hasMore, fetchMore]);

  const loadInstalled = async () => {
    try {
      const resp = await runtimeFetch('/api/config/mcp', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (resp.ok) {
        const configs = await resp.json();
        if (Array.isArray(configs)) {
          setInstalledNames(configs.map((c) => c.name));
        }
      }
    } catch {
      // non-critical
    }
  };

  const handleInstall = async (server: McpRegistryServer) => {
    setInstallingName(server.name);
    try {
      const name = server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const body: Record<string, unknown> = {};

      if (server.installType === 'command' && server.installCommand) {
        body.type = 'local';
        body.command = server.installCommand;
      } else if (server.installType === 'url' && server.installUrl) {
        body.type = 'remote';
        body.url = server.installUrl;
      } else {
        toast.error('Installation failed', {
          description: 'This server does not have a supported install method.',
        });
        return;
      }

      const envVars: Record<string, string> = {};
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(pendingEnvValues)) {
        if (value) {
          if (key.startsWith('__header_')) {
            headers[key.replace('__header_', '')] = value;
          } else {
            envVars[key] = value;
          }
        }
      }
      if (Object.keys(envVars).length > 0) {
        body.environment = envVars;
      }
      if (Object.keys(headers).length > 0) {
        body.headers = headers;
      }

      const response = await runtimeFetch(`/api/config/mcp/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setInstalledNames((prev) => [...prev, name]);
        const result = await response.json().catch(() => null);
        toast.success(`${server.title} installed`, {
          description: result?.message || `MCP server "${name}" configured successfully.`,
        });
        void loadInstalled();
        useMcpConfigStore.getState().loadMcpConfigs({ force: true });
        useMcpStore.getState().refresh({ silent: true });
        setDetailOpen(false);
      } else {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        toast.error('Installation failed', {
          description: err?.message || err?.error || `Server responded with ${response.status}.`,
        });
      }
    } catch (err) {
      toast.error('Installation failed', {
        description: err instanceof Error ? err.message : 'Network error. Check your connection.',
      });
    } finally {
      setInstallingName(null);
    }
  };

  const handleUninstall = async (server: McpRegistryServer) => {
    setDeletingName(server.name);
    try {
      const name = server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const response = await runtimeFetch(`/api/config/mcp/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInstalledNames((prev) => prev.filter((n) => n !== name));
        toast.success(`${server.title} uninstalled`);
        useMcpConfigStore.getState().loadMcpConfigs({ force: true });
        useMcpStore.getState().refresh({ silent: true });
        setDetailOpen(false);
      } else {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        toast.error('Uninstall failed', {
          description: err?.message || err?.error || `Server responded with ${response.status}.`,
        });
      }
    } catch (err) {
      toast.error('Uninstall failed', {
        description: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setDeletingName(null);
    }
  };

  const handleCardClick = (server: McpRegistryServer) => {
    setSelectedServer(server);
    setDetailOpen(true);
  };

  const isInstalled = (server: McpRegistryServer) =>
    installedNames.some(
      (n) => server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') === n || server.name === n
    );

  const isPopular = (server: McpRegistryServer) => {
    const rank = getPopularityRank(server.name, server.title);
    return rank !== null && rank <= 10;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--interactive-border)] px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="typography-ui-header font-semibold text-[var(--surface-foreground)] truncate">
              {t('settings.integrations.page.title')}
            </h1>
            <p className="typography-small text-[var(--surface-mutedForeground)] truncate">
              {servers.length > 0
                ? `${servers.length} servers`
                : 'Official MCP Registry'}
            </p>
          </div>

          {/* Search + filters + refresh inline */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-0 w-full sm:w-auto sm:min-w-[240px]">
              <Icon
                name="search"
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--surface-mutedForeground)]"
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('settings.integrations.page.searchPlaceholder')}
                className="w-full rounded-lg border bg-[var(--surface-elevated)] py-2 pl-9 pr-8 typography-small text-[var(--surface-foreground)] border-[var(--interactive-border)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50"
                aria-label="Search MCP servers"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--surface-mutedForeground)] hover:text-[var(--surface-foreground)]"
                  aria-label="Clear search"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 typography-small font-medium transition-colors border shrink-0',
                      activeCategory
                        ? 'bg-[var(--primary-base)]/10 text-[var(--primary-base)] border-[var(--primary-base)]/30'
                        : 'bg-[var(--surface-elevated)] text-[var(--surface-mutedForeground)] border-[var(--interactive-border)] hover:border-[var(--interactive-hover)]'
                    )}
                    aria-label="Filter by category"
                  >
                    <Icon name="equalizer-2" className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {activeCategory
                        ? categories.find(c => c.id === activeCategory)?.label || 'Filtros'
                        : 'Filtros'}
                    </span>
                    {activeCategory && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[var(--primary-base)] text-[10px] font-bold text-[var(--primary-foreground)] px-1">
                        1
                      </span>
                    )}
                    <Icon name="arrow-down-s" className="h-3.5 w-3.5 text-[var(--surface-mutedForeground)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1.5">
                  <div className="px-2 pb-1.5 pt-1 typography-micro font-semibold text-[var(--surface-mutedForeground)] uppercase tracking-wider">
                    Categoría
                  </div>
                  {categories.map(cat => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={activeCategory === cat.id}
                      onCheckedChange={() => {
                        if (activeCategory === cat.id) {
                          setActiveCategory(null);
                        } else {
                          setActiveCategory(cat.id);
                        }
                      }}
                      className="rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        {cat.label}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                  {activeCategory && (
                    <>
                      <div className="my-1 border-t border-[var(--interactive-border)]" />
                      <button
                        type="button"
                        onClick={() => setActiveCategory(null)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--surface-mutedForeground)] hover:bg-[var(--interactive-hover)] hover:text-[var(--surface-foreground)] transition-colors"
                      >
                        <Icon name="close" className="h-3.5 w-3.5" />
                        Limpiar filtro
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchServers(searchQuery, activeCategory)}
              disabled={isLoading}
              className="shrink-0"
            >
              <Icon name={isLoading ? 'loader-4' : 'refresh'} className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4" role="list" aria-label="MCP servers">
        {/* Initial loading skeletons */}
        {isLoading && servers.length === 0 && (
          <div className="grid gap-5 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && servers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
            <Icon name="error-warning" className="h-12 w-12 text-[var(--status-error)]/60" />
            <p className="typography-ui mt-4 text-[var(--surface-foreground)] font-medium">
              {error.type === 'network'
                ? 'Could not reach the MCP Registry'
                : error.type === 'registry_error'
                  ? 'MCP Registry returned an error'
                  : error.type === 'rate_limited'
                    ? 'Too many requests'
                    : 'Something went wrong'}
            </p>
            <p className="typography-small text-[var(--surface-mutedForeground)] mt-2 max-w-md">
              {error.message}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" size="sm" onClick={() => fetchServers(searchQuery)}>
                <Icon name="refresh" className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && servers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="search" className="h-12 w-12 text-[var(--surface-mutedForeground)]/40" />
            <p className="typography-ui mt-4 text-[var(--surface-foreground)] font-medium">
              {searchQuery ? 'No servers match your search' : 'MCP Registry is empty'}
            </p>
            <p className="typography-small text-[var(--surface-mutedForeground)] mt-2">
              {searchQuery
                ? 'Try a different search term or browse all servers'
                : 'The registry returned no results. It may be temporarily unavailable.'}
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => handleSearchChange('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Server grid - 2 columns for larger cards */}
        {servers.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {servers.map((server) => {
              const installed = isInstalled(server);
              const popular = isPopular(server);

              return (
                <div
                  key={server.name}
                  role="listitem"
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--interactive-border)] bg-[var(--surface-elevated)] p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-[var(--primary-base)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-base)]/50"
                  tabIndex={0}
                  onClick={() => handleCardClick(server)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(server);
                    }
                  }}
                  aria-label={`${server.title} — ${server.description ? server.description.slice(0, 80) : 'No description'}`}
                >
                  {/* Popular badge */}
                  {popular && (
                    <div className="absolute right-3 top-3 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-warning)]/15 px-2.5 py-0.5 typography-micro font-semibold text-[var(--status-warning)]">
                        🔥 Popular
                      </span>
                    </div>
                  )}

                  {/* Top row: app icon + title + description */}
                  <div className="flex items-start gap-4">
                    <ServerIcon server={server} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate text-sm font-semibold text-[var(--surface-foreground)]">
                          {server.title}
                        </h3>
                        {server.status === 'active' && (
                          <span className="shrink-0 rounded-md bg-[var(--primary-base)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
                            ⭐ Official
                          </span>
                        )}
                        {installed && (
                          <>
                            <span className="shrink-0 rounded-md bg-[var(--status-success)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
                              ✓ Installed
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUninstall(server);
                              }}
                              disabled={deletingName === server.name}
                              className="shrink-0 rounded-md bg-[var(--status-error)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--status-error)] hover:bg-[var(--status-error)]/20 transition-colors"
                            >
                              {deletingName === server.name ? '...' : '✕'}
                            </button>
                          </>
                        )}
                      </div>
                      <p className="typography-micro text-[var(--surface-mutedForeground)] truncate font-mono">
                        {server.name}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="typography-small text-[var(--surface-mutedForeground)] mt-3 line-clamp-2">
                    {server.description || t('settings.integrations.card.noDescription')}
                  </p>

                  {/* Transport + Auth badges + categories */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <TransportBadge type={server.transportType} />
                    <AuthBadge hasAuth={server.hasAuth} hasOAuth={server.hasOAuth} />
                    {server.categories && server.categories.length > 0 && (
                      <span className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--surface-mutedForeground)]">
                        {server.categories[0].replace(/-/g, ' ')}
                      </span>
                    )}
                    <span className="ml-auto typography-micro text-[var(--surface-mutedForeground)]/60 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono">
                      v{server.version}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <div className="grid gap-5 sm:grid-cols-2 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* End of list */}
        {!hasMore && servers.length > 0 && (
          <p className="text-center typography-micro text-[var(--surface-mutedForeground)]/40 py-6">
            All {servers.length} servers loaded
          </p>
        )}
      </div>

      {/* Detail Dialog */}
      <DetailDialog
        server={selectedServer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        isInstalling={installingName === selectedServer?.name}
        isUninstalling={deletingName === selectedServer?.name}
        isInstalled={selectedServer ? isInstalled(selectedServer) : false}
        envValues={pendingEnvValues}
        onEnvValueChange={(name, value) => setPendingEnvValues(prev => ({...prev, [name]: value}))}
      />
    </div>
  );
};

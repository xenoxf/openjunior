import React from 'react';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { resolveAppIcon } from './appIcons';
import type { McpRegistryServer } from '@/stores/useMcpRegistryStore';

function getGitHubAvatarUrl(server: McpRegistryServer): string | null {
  const repo = server.repository;
  if (!repo) return null;
  try {
    const url = new URL(repo);
    if (url.hostname === 'github.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 1) {
        return `https://github.com/${parts[0]}.png`;
      }
    }
  } catch {}
  return null;
}

const GENERIC_CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

function getGoogleFaviconUrl(server: McpRegistryServer): string | null {
  const url = server.homepage || server.repository;
  if (url) {
    try {
      const domain = new URL(url).hostname;
      if (!GENERIC_CODE_HOSTS.has(domain)) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      }
    } catch {}
  }
  return null;
}

function getImageUrls(server: McpRegistryServer): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  if (server.faviconUrl && !seen.has(server.faviconUrl)) {
    urls.push(server.faviconUrl);
    seen.add(server.faviconUrl);
  }

  const githubAvatar = getGitHubAvatarUrl(server);
  if (githubAvatar && !seen.has(githubAvatar)) {
    urls.push(githubAvatar);
    seen.add(githubAvatar);
  }

  const googleFavicon = getGoogleFaviconUrl(server);
  if (googleFavicon && !seen.has(googleFavicon)) {
    urls.push(googleFavicon);
    seen.add(googleFavicon);
  }

  return urls;
}

export function ServerIcon({ server, className }: { server: McpRegistryServer; className?: string }) {
  const [imgError, setImgError] = React.useState(false);
  const [activeUrlIndex, setActiveUrlIndex] = React.useState(0);
  const resolved = React.useMemo(() => resolveAppIcon(server), [server]);

  const urls = React.useMemo(() => getImageUrls(server), [server]);

  React.useEffect(() => {
    setImgError(false);
    setActiveUrlIndex(0);
  }, [server.name]);

  if (urls.length > 0 && activeUrlIndex < urls.length && !imgError) {
    return (
      <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-[var(--surface-muted)]', className)}>
        <img
          key={activeUrlIndex}
          src={urls[activeUrlIndex]}
          alt={server.title}
          className="h-full w-full object-contain"
          onError={() => {
            if (activeUrlIndex < urls.length - 1) {
              setActiveUrlIndex((i) => i + 1);
            } else {
              setImgError(true);
            }
          }}
        />
      </div>
    );
  }

  const fromDescription = resolved?.matchSource === 'description';

  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
        resolved
          ? 'bg-[var(--surface-muted)] text-[var(--surface-foreground)]'
          : 'bg-[var(--status-success)]/8 text-[var(--status-success)]',
        fromDescription && 'opacity-60',
        className
      )}
      title={fromDescription ? `Matched by description: ${resolved?.label}` : undefined}
    >
      <Icon name={resolved?.icon || 'plug'} className="h-6 w-6" />
    </div>
  );
}

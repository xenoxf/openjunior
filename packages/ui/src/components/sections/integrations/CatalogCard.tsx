import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
import { useI18n } from '@/lib/i18n';
import { findAppIcon } from './appIcons';
import type { UnifiedCatalogItem } from '@/lib/api/types';
import type { IconName } from '@/components/icon/icons';

const TYPE_CONFIG: Record<string, { icon: IconName; accent: string; bg: string; label: string }> = {
  skill: {
    icon: 'brain',
    accent: 'bg-[var(--status-info)]',
    bg: 'bg-[var(--status-info)]/8',
    label: 'Skill',
  },
  mcp: {
    icon: 'plug',
    accent: 'bg-[var(--status-success)]',
    bg: 'bg-[var(--status-success)]/8',
    label: 'MCP',
  },
  plugin: {
    icon: 'code-box',
    accent: 'bg-[var(--status-warning)]',
    bg: 'bg-[var(--status-warning)]/8',
    label: 'Plugin',
  },
};

interface CatalogCardProps {
  item: UnifiedCatalogItem;
  isInstalled?: boolean;
  isPopular?: boolean;
  onSelect: (item: UnifiedCatalogItem) => void;
  onInstall?: (item: UnifiedCatalogItem) => void;
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ item, isInstalled = false, isPopular = false, onSelect, onInstall }) => {
  const { t } = useI18n();
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.skill;
  const appIcon = findAppIcon(item.name, item.name);

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-200',
        'border-[var(--interactive-border)] bg-[var(--surface-elevated)]',
        'hover:-translate-y-1 hover:shadow-lg hover:border-[var(--primary-base)]/35',
        isInstalled && 'border-[var(--status-success)]/30'
      )}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-warning)]/15 px-2.5 py-0.5 typography-micro font-semibold text-[var(--status-warning)]">
            {t('settings.integrations.card.popular')}
          </span>
        </div>
      )}

      {/* Accent bar */}
      <div className={cn('h-1 w-full shrink-0', isInstalled ? 'bg-[var(--status-success)]' : typeConfig.accent)} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Icon - bigger */}
          <div className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
            appIcon ? 'bg-[var(--surface-muted)]' : typeConfig.bg,
            appIcon ? 'text-[var(--surface-foreground)]' : typeConfig.accent.replace('bg-', 'text-')
          )}>
            <Icon name={appIcon?.icon || typeConfig.icon} className="h-6 w-6" />
          </div>

          {/* Title + description */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="truncate text-sm font-semibold text-[var(--surface-foreground)]">
                {item.name}
              </h3>
              {item.official && (
                <span className="shrink-0 rounded-md bg-[var(--primary-base)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
                  ⭐ Official
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[var(--surface-mutedForeground)] line-clamp-2">
              {item.description || t('settings.integrations.card.noDescription')}
            </p>
          </div>
        </div>

        {/* Type + tags row */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
            typeConfig.bg, typeConfig.accent.replace('bg-', 'text-')
          )}>
            <Icon name={typeConfig.icon} className="h-3.5 w-3.5" />
            {typeConfig.label}
          </span>
          {(Array.isArray(item.tags) ? item.tags : []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--surface-mutedForeground)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-[11px] text-[var(--surface-mutedForeground)]">
            {item.author && (
              <span className="truncate max-w-28">{item.author}</span>
            )}
            {item.version && typeof item.version === 'string' && (
              <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[10px]">v{item.version}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onInstall && !isInstalled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onInstall(item); }}
                className={cn(
                  'pointer-events-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                  'bg-[var(--primary-base)] text-[var(--primary-foreground)]',
                  'opacity-0 group-hover:opacity-100 hover:shadow-md'
                )}
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                Install
              </button>
            )}
            {isInstalled && (
              <span className="flex items-center gap-1 rounded-md bg-[var(--status-success)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--status-success)]">
                <Icon name="check" className="h-3.5 w-3.5" />
                Installed
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[11px] text-[var(--surface-mutedForeground)]">
              <Icon name="star" className="h-3.5 w-3.5" />
              {item.popularity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

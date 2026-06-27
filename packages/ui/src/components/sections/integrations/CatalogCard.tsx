import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
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
  onSelect: (item: UnifiedCatalogItem) => void;
  onInstall?: (item: UnifiedCatalogItem) => void;
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ item, isInstalled = false, onSelect, onInstall }) => {
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.skill;

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all',
        'border-[var(--interactive-border)] bg-[var(--surface-elevated)]',
        'hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--primary-base)]/35',
        isInstalled && 'border-[var(--status-success)]/30'
      )}
      onClick={() => onSelect(item)}
    >
      {/* Accent bar */}
      <div className={cn('h-1 w-full shrink-0', isInstalled ? 'bg-[var(--status-success)]' : typeConfig.accent)} />

      <div className="flex flex-1 flex-col p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            typeConfig.bg, typeConfig.accent.replace('bg-', 'text-')
          )}>
            <Icon name={typeConfig.icon} className="h-5 w-5" />
          </div>

          {/* Title + description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[var(--surface-foreground)]">
                {item.name}
              </h3>
              {item.official && (
                <span className="shrink-0 rounded bg-[var(--primary-base)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
                  Official
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--surface-mutedForeground)] line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        {/* Type + tags row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
            typeConfig.bg, typeConfig.accent.replace('bg-', 'text-')
          )}>
            <Icon name={typeConfig.icon} className="h-3 w-3" />
            {typeConfig.label}
          </span>
          {(Array.isArray(item.tags) ? item.tags : []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--surface-mutedForeground)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2 text-[10px] text-[var(--surface-mutedForeground)]">
            {item.author && (
              <span className="truncate max-w-24">{item.author}</span>
            )}
            {item.version && typeof item.version === 'string' && (
              <span className="rounded bg-[var(--surface-muted)] px-1 py-px font-mono">v{item.version}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Quick install button (visible on hover) */}
            {onInstall && !isInstalled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onInstall(item); }}
                className={cn(
                  'pointer-events-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
                  'bg-[var(--primary-base)] text-[var(--primary-foreground)]',
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
              >
                <Icon name="download" className="h-3 w-3" />
                Install
              </button>
            )}
            {isInstalled && (
              <span className="flex items-center gap-1 rounded-md bg-[var(--status-success)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
                <Icon name="check" className="h-3 w-3" />
                Installed
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--surface-mutedForeground)]">
              <Icon name="star" className="h-3 w-3" />
              {item.popularity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

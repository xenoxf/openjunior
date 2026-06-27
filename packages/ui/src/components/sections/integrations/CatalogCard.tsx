import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';
import type { UnifiedCatalogItem } from '@/lib/api/types';
import type { IconName } from '@/components/icon/icons';

const TYPE_CONFIG: Record<string, { icon: IconName; color: string; label: string }> = {
  skill: { icon: 'brain', color: 'text-[var(--status-info)]', label: 'Skill' },
  mcp: { icon: 'plug', color: 'text-[var(--status-success)]', label: 'MCP' },
  plugin: { icon: 'code-box', color: 'text-[var(--status-warning)]', label: 'Plugin' },
};

interface CatalogCardProps {
  item: UnifiedCatalogItem;
  isInstalled?: boolean;
  onSelect: (item: UnifiedCatalogItem) => void;
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ item, isInstalled = false, onSelect }) => {
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.skill;

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border p-4 transition-all',
        'border-[var(--interactive-border)] bg-[var(--surface-elevated)]',
        'hover:border-[var(--primary-base)]/40 hover:shadow-md',
        isInstalled && 'border-[var(--status-success)]/30'
      )}
      onClick={() => onSelect(item)}
    >
      {/* Official badge */}
      {item.official && (
        <span className="absolute top-2 right-2 rounded-full bg-[var(--primary-base)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
          Official
        </span>
      )}

      {/* Installed badge */}
      {isInstalled && (
        <span className="absolute top-2 left-2 rounded-full bg-[var(--status-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
          Installed
        </span>
      )}

      {/* Header: icon + type */}
      <div className="mb-3 flex items-start gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-muted)]', typeConfig.color)}>
          <Icon name={typeConfig.icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight text-[var(--surface-foreground)] truncate">
            {item.name}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--surface-mutedForeground)] line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        <span className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0 text-[10px] text-[var(--surface-mutedForeground)]">
          {typeConfig.label}
        </span>
        {(Array.isArray(item.tags) ? item.tags : []).slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0 text-[10px] text-[var(--surface-mutedForeground)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: author + popularity */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-[var(--surface-mutedForeground)]">
          {item.author && <span>{item.author}</span>}
          {item.version && <span className="rounded bg-[var(--surface-muted)] px-1 py-0.5">v{item.version}</span>}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--surface-mutedForeground)]">
          <Icon name="star" className="h-3 w-3" />
          <span>{item.popularity}</span>
        </div>
      </div>
    </div>
  );
};

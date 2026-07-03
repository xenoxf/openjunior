import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { cn } from '@/lib/utils';

export type ConnectorType = 'integration' | 'mcp' | 'skill';

const TYPE_CONFIG: Record<ConnectorType, {
  icon: IconName;
  accent: string;
  bg: string;
}> = {
  integration: { icon: 'plug', accent: 'var(--status-info)', bg: 'var(--status-info)/10' },
  mcp: { icon: 'server', accent: 'var(--primary-base)', bg: 'var(--primary-base)/10' },
  skill: { icon: 'book-open', accent: 'var(--status-success)', bg: 'var(--status-success)/10' },
};

interface ConnectorCardProps {
  type: ConnectorType;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tags?: string[];
  isInstalled?: boolean;
  isPopular?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  type,
  title,
  description,
  icon,
  tags,
  isInstalled,
  isPopular,
  onClick,
  action,
}) => {
  const { t } = useI18n();
  const cfg = TYPE_CONFIG[type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-200',
        'border-[var(--interactive-border)] bg-[var(--surface-elevated)]',
        'hover:-translate-y-1 hover:shadow-lg hover:border-[var(--primary-base)]/35',
        isInstalled && 'border-[var(--status-success)]/30'
      )}
    >
      {isPopular && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[var(--status-warning)]/15 px-2.5 py-0.5 typography-micro font-semibold text-[var(--status-warning)]">
          {t('settings.integrations.card.popular')}
        </span>
      )}

      <div className="h-1 w-full shrink-0" style={{ backgroundColor: isInstalled ? 'var(--status-success)' : cfg.accent }} />

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden">
              {icon}
            </div>
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: cfg.bg }}
            >
              <Icon name={cfg.icon} className="h-6 w-6" style={{ color: cfg.accent }} />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate text-sm font-semibold text-[var(--foreground)]">{title}</div>
            {description && (
              <div className="text-xs leading-relaxed text-[var(--surface-mutedForeground)] line-clamp-2">
                {description}
              </div>
            )}
          </div>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
              {type === 'integration' && 'Integration'}
              {type === 'mcp' && 'MCP'}
              {type === 'skill' && 'Skill'}
            </span>
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {isInstalled ? (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--status-success)]">
              <Icon name="check" className="h-3.5 w-3.5" />
              {t('settings.integrations.card.installed')}
            </span>
          ) : (
            <span />
          )}
          {action && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

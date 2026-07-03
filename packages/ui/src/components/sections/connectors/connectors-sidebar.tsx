import React from 'react';
import { useI18n } from '@/lib/i18n';
import type { I18nKey } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export type ConnectorTab = 'integrations' | 'mcp' | 'skills';

const TABS: { id: ConnectorTab; icon: IconName; labelKey: I18nKey }[] = [
  { id: 'integrations', icon: 'plug', labelKey: 'settings.connectors.sidebar.integrations' },
  { id: 'mcp', icon: 'server', labelKey: 'settings.connectors.sidebar.mcp' },
  { id: 'skills', icon: 'book-open', labelKey: 'settings.connectors.sidebar.skills' },
];

interface ConnectorsSidebarProps {
  activeTab: ConnectorTab;
  onTabChange: (tab: ConnectorTab) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

export const ConnectorsSidebar: React.FC<ConnectorsSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onCollapseToggle,
}) => {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'flex flex-col border-r border-[var(--interactive-border)] bg-[var(--sidebar-bg)] transition-all duration-200',
        collapsed ? 'w-14' : 'w-48'
      )}
    >
      <nav className="flex flex-col gap-1 px-2 pt-4" role="tablist">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-md px-2 transition-colors',
                    selected
                      ? 'bg-[var(--interactive-selection)] text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--interactive-hover)] hover:text-[var(--foreground)]',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon name={tab.icon} className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="typography-ui-label font-normal truncate">
                      {t(tab.labelKey)}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  {t(tab.labelKey)}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pb-3">
        <button
          type="button"
          onClick={onCollapseToggle}
          className="flex h-8 w-full items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--interactive-hover)] hover:text-[var(--foreground)] transition-colors"
          aria-label={t(collapsed ? 'settings.connectors.sidebar.expand' : 'settings.connectors.sidebar.collapse')}
        >
          <Icon
            name={collapsed ? 'arrow-right-s' : 'arrow-left-s'}
            className="h-5 w-5"
          />
        </button>
      </div>
    </div>
  );
};

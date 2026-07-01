import React from 'react';
import { cn } from '@/lib/utils';
import type { SessionNode } from './types';
import { useI18n } from '@/lib/i18n';
import { Icon } from "@/components/icon/Icon";
import type { SessionNodeRenderExtras } from './sessionNodeItemUtils';

type ActivityItem = {
  node: SessionNode;
  projectId: string | null;
  groupDirectory: string | null;
  secondaryMeta: {
    projectLabel?: string | null;
    branchLabel?: string | null;
  } | null;
};

type ActivitySection = {
  key: 'active-now';
  title: string;
  items: ActivityItem[];
};

type Props = {
  sections: ActivitySection[];
  renderSessionNode: (
    node: SessionNode,
    depth?: number,
    groupDirectory?: string | null,
    projectId?: string | null,
    archivedBucket?: boolean,
    secondaryMeta?: { projectLabel?: string | null; branchLabel?: string | null } | null,
    renderContext?: 'project' | 'recent',
    renderExtras?: SessionNodeRenderExtras,
  ) => React.ReactNode;
  currentSessionId: string | null;
  editingId: string | null;
  openSidebarMenuKey: string | null;
  variant?: 'section' | 'flat';
  initialVisibleCount?: number;
  batchSize?: number;
};

const getDayBoundary = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getDateGroupKey = (now: number, sessionTs: number): string => {
  const todayStart = getDayBoundary(now);
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;
  const monthStart = todayStart - 29 * 86400000;

  if (sessionTs >= todayStart) return 'today';
  if (sessionTs >= yesterdayStart) return 'yesterday';
  if (sessionTs >= weekStart) return 'week';
  if (sessionTs >= monthStart) return 'month';
  return 'older';
};

const DATE_GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Previous 7 Days',
  month: 'Previous 30 Days',
  older: 'Older',
};

const DATE_GROUP_ORDER = ['today', 'yesterday', 'week', 'month', 'older'];

const getSessionUpdatedAt = (session: { time?: { updated?: number; created?: number } }): number => {
  const updated = session.time?.updated;
  const created = session.time?.created;
  if (typeof updated === 'number' && Number.isFinite(updated)) return updated;
  if (typeof created === 'number' && Number.isFinite(created)) return created;
  return 0;
};



export function SidebarActivitySections({
  sections,
  renderSessionNode,
  currentSessionId,
  variant = 'section',
  initialVisibleCount = 20,
}: Props): React.ReactNode {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const toggleSection = React.useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const flatVariant = variant === 'flat';

  const now = Date.now();

  const allItems = React.useMemo(() => {
    const seen = new Set<string>();
    const items: ActivityItem[] = [];
    for (const section of sections) {
      for (const item of section.items) {
        if (!seen.has(item.node.session.id)) {
          seen.add(item.node.session.id);
          items.push(item);
        }
      }
    }
    return items;
  }, [sections]);

  const dateGroups = React.useMemo(() => {
    const groups = new Map<string, ActivityItem[]>();
    for (const item of allItems) {
      const ts = getSessionUpdatedAt(item.node.session);
      const key = getDateGroupKey(now, ts);
      const existing = groups.get(key);
      if (existing) existing.push(item);
      else groups.set(key, [item]);
    }
    return DATE_GROUP_ORDER
      .filter((key) => (groups.get(key)?.length ?? 0) > 0)
      .map((key) => ({ key, label: DATE_GROUP_LABELS[key], items: groups.get(key)! }));
  }, [allItems, now]);

  if (dateGroups.length === 0) return null;

  const renderCard = (item: ActivityItem) => (
    <div key={item.node.session.id} className="group relative">
      {renderSessionNode(
        item.node,
        0,
        item.groupDirectory,
        item.projectId,
        false,
        item.secondaryMeta,
        'recent',
        undefined,
      )}
    </div>
  );

  if (flatVariant) {
    return (
      <div className="space-y-0.5 pb-2">
        {dateGroups.map((group) => (
          <div key={group.key} className="space-y-0.5">
            <div className="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </div>
            {group.items.map(renderCard)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1 pb-2 pt-1">
      {dateGroups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <div key={group.key} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleSection(group.key)}
              className="group flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-expanded={!isCollapsed}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground">
                {isCollapsed ? <Icon name="arrow-right-s" className="h-3.5 w-3.5" /> : <Icon name="arrow-down-s" className="h-3.5 w-3.5" />}
              </span>
              <span className="text-[13px] font-medium text-foreground/90">{group.label}</span>
              <span className="ml-auto text-[11px] text-muted-foreground/50">{group.items.length}</span>
            </button>
            {!isCollapsed ? (
              <div className="space-y-1 px-1">
                {group.items.slice(0, initialVisibleCount).map((item) => {
                  const isActive = item.node.session.id === currentSessionId;
                  return (
                    <div
                      key={item.node.session.id}
                      className={cn(
                        'relative rounded-lg border transition-all',
                        isActive
                          ? 'border-primary/30 bg-primary/[0.03]'
                          : 'border-transparent hover:border-border/50 hover:bg-muted/30 hover:shadow-sm'
                      )}
                    >
                      {renderSessionNode(
                        item.node,
                        0,
                        item.groupDirectory,
                        item.projectId,
                        false,
                        item.secondaryMeta as { projectLabel?: string | null; branchLabel?: string | null } | null,
                        'recent',
                        undefined,
                      )}
                    </div>
                  );
                })}
                {group.items.length > initialVisibleCount ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.key)}
                    className="mt-0.5 flex items-center justify-start rounded-md px-2 py-1 text-left text-xs text-muted-foreground/70 leading-tight hover:text-foreground hover:underline"
                  >
                    {t('sessions.sidebar.group.showMore')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

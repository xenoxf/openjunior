import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/icon/Icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSkillsCatalogStore } from '@/stores/useSkillsCatalogStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { ConnectorCard } from './ConnectorCard';
import { InstallSkillDialog } from '@/components/sections/skills/catalog/InstallSkillDialog';
import type { SkillsCatalogItem } from '@/lib/api/types';

export const SkillsTab: React.FC = () => {
  const { t } = useI18n();
  const {
    sources,
    itemsBySource,
    selectedSourceId,
    setSelectedSource,
    loadCatalog,
    loadSource,
    loadMoreClawdHub,
    isLoadingCatalog,
    isLoadingSource,
    isLoadingMore,
    loadedSourceIds,
    clawdhubHasMoreBySource,
    lastCatalogError,
  } = useSkillsCatalogStore(useShallow((s) => ({
    sources: s.sources,
    itemsBySource: s.itemsBySource,
    selectedSourceId: s.selectedSourceId,
    setSelectedSource: s.setSelectedSource,
    loadCatalog: s.loadCatalog,
    loadSource: s.loadSource,
    loadMoreClawdHub: s.loadMoreClawdHub,
    isLoadingCatalog: s.isLoadingCatalog,
    isLoadingSource: s.isLoadingSource,
    isLoadingMore: s.isLoadingMore,
    loadedSourceIds: s.loadedSourceIds,
    clawdhubHasMoreBySource: s.clawdhubHasMoreBySource,
    lastCatalogError: s.lastCatalogError,
  })));

  const [search, setSearch] = React.useState('');
  const [installItem, setInstallItem] = React.useState<SkillsCatalogItem | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = React.useState(false);

  React.useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  React.useEffect(() => {
    if (!selectedSourceId) return;
    if (!loadedSourceIds[selectedSourceId]) {
      void loadSource(selectedSourceId);
    }
  }, [selectedSourceId, loadedSourceIds, loadCatalog]);

  const items = React.useMemo(() => {
    if (!selectedSourceId) return [];
    return itemsBySource[selectedSourceId] || [];
  }, [itemsBySource, selectedSourceId]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = item.skillName.toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const fm = (item.frontmatterName || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || fm.includes(q);
    });
  }, [items, search]);

  const selectedSource = React.useMemo(
    () => sources.find((s) => s.id === selectedSourceId) || null,
    [sources, selectedSourceId],
  );

  const isClawdHubSource = selectedSource?.source === 'clawdhub:registry' || selectedSource?.sourceType === 'clawdhub';
  const hasMoreClawdHub = Boolean(selectedSourceId && (clawdhubHasMoreBySource[selectedSourceId] ?? true));
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isClawdHubSource || !hasMoreClawdHub || isLoadingMore || isLoadingSource) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMoreClawdHub(); },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isClawdHubSource, hasMoreClawdHub, isLoadingMore, isLoadingSource, loadMoreClawdHub]);

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="typography-ui-header font-semibold text-[var(--foreground)]">
            {t('settings.skills.catalog.page.title')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select
            value={selectedSourceId || ''}
            onValueChange={(v) => setSelectedSource(v)}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder={t('settings.skills.catalog.page.field.selectSourcePlaceholder')}>
                {selectedSource?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {sources.map((src) => (
                <SelectItem key={src.id} value={src.id}>
                  {src.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="xs"
            className="!font-normal h-7 w-7 px-0"
            onClick={() => {
              if (selectedSourceId) {
                void loadSource(selectedSourceId, { refresh: true });
              } else {
                void loadCatalog({ refresh: true });
              }
            }}
            disabled={isLoadingCatalog || isLoadingSource}
            title={t('settings.skills.catalog.page.actions.refreshTitle')}
          >
            <Icon name="refresh" className={cn('h-3.5 w-3.5', (isLoadingCatalog || isLoadingSource) && 'animate-spin')} />
          </Button>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Icon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('settings.skills.catalog.shared.field.searchSkillsPlaceholder')}
              className="h-7 pl-8 w-full"
            />
          </div>
        </div>

        {lastCatalogError && (
          <div className="mb-6 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-background)] px-4 py-3">
            <p className="typography-ui-label font-medium text-[var(--status-error)]">{t('settings.skills.catalog.page.error.catalogTitle')}</p>
            <p className="typography-meta text-[var(--status-error)]/80 mt-1">{lastCatalogError.message}</p>
          </div>
        )}

        {filtered.length === 0 && !isLoadingSource && !lastCatalogError && (
          <div className="py-12 text-center text-muted-foreground">
            <Icon name="book-open" className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="typography-body">{t('settings.skills.catalog.page.empty.noSkillsTitle')}</p>
            <p className="typography-meta mt-1 opacity-75">{t('settings.skills.catalog.page.empty.noSkillsDescription')}</p>
          </div>
        )}

        {isLoadingSource && (
          <div className="py-12 text-center text-muted-foreground">
            <Icon name="refresh" className="mx-auto mb-3 h-5 w-5 animate-spin opacity-50" />
            <p className="typography-meta">{t('settings.skills.catalog.page.loading.skills')}</p>
          </div>
        )}

        {!isLoadingSource && filtered.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ConnectorCard
                  key={`${item.sourceId}:${item.skillDir}`}
                  type="skill"
                  title={item.frontmatterName || item.skillName}
                  description={item.description}
                  isInstalled={item.installed?.isInstalled}
                  tags={[
                    ...(item.clawdhub?.owner ? [item.clawdhub.owner] : []),
                    ...(item.clawdhub?.version ? [`v${item.clawdhub.version}`] : []),
                  ]}
                  onClick={() => {
                    if (item.installable) {
                      setInstallItem(item);
                      setInstallDialogOpen(true);
                    }
                  }}
                  action={
                    item.installable ? (
                      <Button
                        variant="outline"
                        size="xs"
                        className="!font-normal"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInstallItem(item);
                          setInstallDialogOpen(true);
                        }}
                      >
                        {t('settings.skills.catalog.shared.actions.install')}
                      </Button>
                    ) : null
                  }
                />
              ))}
            </div>

            {isClawdHubSource && hasMoreClawdHub && (
              <div ref={sentinelRef} className="h-4 mt-4" />
            )}
            {isLoadingMore && (
              <div className="flex justify-center py-4 opacity-50">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            )}
          </>
        )}

        <div className="mt-1 text-xs text-muted-foreground">
          {isLoadingCatalog
            ? t('settings.skills.catalog.page.loading.catalog')
            : t('settings.skills.catalog.page.foundCount', { count: filtered.length })}
        </div>
      </div>

      <InstallSkillDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        item={installItem}
      />
    </div>
  );
};

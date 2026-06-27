import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { cn } from '@/lib/utils';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { useUnifiedCatalogStore, installedKey } from '@/stores/useUnifiedCatalogStore';
import type { UnifiedCatalogItemType, UnifiedCatalogCategory, UnifiedCatalogItem } from '@/lib/api/types';
import { CatalogCard } from './CatalogCard';
import { CatalogDetailDialog } from './CatalogDetailDialog';

const TYPE_FILTERS: Array<{ id: UnifiedCatalogItemType | 'all'; labelKey: I18nKey; icon: IconName }> = [
  { id: 'all', labelKey: 'settings.integrations.page.filterAll', icon: 'list-check-3' },
  { id: 'skill', labelKey: 'settings.integrations.page.filterSkills', icon: 'brain' },
  { id: 'mcp', labelKey: 'settings.integrations.page.filterMCPs', icon: 'plug' },
  { id: 'plugin', labelKey: 'settings.integrations.page.filterPlugins', icon: 'code-box' },
];

const CATEGORY_FILTERS: Array<{ id: UnifiedCatalogCategory; labelKey: I18nKey }> = [
  { id: 'all', labelKey: 'settings.integrations.page.categoryAll' },
  { id: 'files', labelKey: 'settings.integrations.page.categoryFiles' },
  { id: 'tools', labelKey: 'settings.integrations.page.categoryTools' },
  { id: 'chat', labelKey: 'settings.integrations.page.categoryChat' },
  { id: 'agents', labelKey: 'settings.integrations.page.categoryAgents' },
  { id: 'services', labelKey: 'settings.integrations.page.categoryServices' },
];

export const UnifiedCatalogPage: React.FC = () => {
  const { t } = useI18n();
  const {
    items,
    sources,
    selectedType,
    selectedCategory,
    searchQuery,
    isLoading,
    installedIds,
    loadCatalog,
    setTypeFilter,
    setCategoryFilter,
    setSearch,
    installItem,
  } = useUnifiedCatalogStore();

  const [selectedItem, setSelectedItemLocal] = React.useState<UnifiedCatalogItem | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  React.useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleSelectItem = React.useCallback((item: UnifiedCatalogItem) => {
    setSelectedItemLocal(item);
    setDetailOpen(true);
  }, []);

  const handleDetailClose = React.useCallback(() => {
    setDetailOpen(false);
    setSelectedItemLocal(null);
  }, []);

  const handleRefresh = React.useCallback(() => {
    void loadCatalog({ refresh: true });
  }, [loadCatalog]);

  const handleQuickInstall = React.useCallback(async (item: UnifiedCatalogItem) => {
    await installItem(item);
  }, [installItem]);

  const isItemInstalled = React.useCallback(
    (item: UnifiedCatalogItem) => installedIds.includes(installedKey(item)),
    [installedIds]
  );

  const onlineSources = sources.filter((s) => s.online);
  const cachedSources = sources.filter((s) => s.cached && !s.online);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--interactive-border)] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="typography-ui-header font-semibold text-[var(--surface-foreground)]">
              {t('settings.integrations.page.title')}
            </h1>
            <p className="typography-micro text-[var(--surface-mutedForeground)] mt-0.5">
              {t('settings.integrations.page.subtitle.available', { count: items.length })}
              {' · '}
              {t('settings.integrations.page.subtitle.sourcesOnline', { count: onlineSources.length })}
              {cachedSources.length > 0 && ` · ${cachedSources.length} cached`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Icon name={isLoading ? 'loader-4' : 'refresh'} className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--surface-mutedForeground)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settings.integrations.page.searchPlaceholder')}
            className="w-full rounded-lg border bg-[var(--surface-elevated)] py-2 pl-9 pr-3 typography-ui text-[var(--surface-foreground)] border-[var(--interactive-border)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-mutedForeground)] hover:text-[var(--surface-foreground)]"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 typography-micro font-medium transition-colors',
                selectedType === filter.id
                  ? 'bg-[var(--interactive-selection)] text-[var(--interactive-selectionForeground)]'
                  : 'text-[var(--surface-mutedForeground)] hover:bg-[var(--interactive-hover)] hover:text-[var(--surface-foreground)]'
              )}
            >
              <Icon name={filter.icon} className="h-3.5 w-3.5" />
              {t(filter.labelKey)}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategoryFilter(filter.id)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1 typography-micro transition-colors',
                selectedCategory === filter.id
                  ? 'bg-[var(--interactive-selection)] text-[var(--interactive-selectionForeground)]'
                  : 'text-[var(--surface-mutedForeground)] hover:bg-[var(--interactive-hover)]'
              )}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="loader-4" className="h-10 w-10 text-[var(--surface-mutedForeground)]/40 animate-spin" />
            <p className="typography-ui mt-3 text-[var(--surface-mutedForeground)]">
              {t('settings.integrations.page.loading')}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="search" className="h-10 w-10 text-[var(--surface-mutedForeground)]/40" />
            <p className="typography-ui mt-3 text-[var(--surface-mutedForeground)]">
              {t('settings.integrations.page.empty')}
            </p>
            <p className="typography-micro text-[var(--surface-mutedForeground)]/60">
              {t('settings.integrations.page.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                isInstalled={isItemInstalled(item)}
                onSelect={handleSelectItem}
                onInstall={handleQuickInstall}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <CatalogDetailDialog
        item={selectedItem}
        open={detailOpen}
        onOpenChange={handleDetailClose}
      />
    </div>
  );
};

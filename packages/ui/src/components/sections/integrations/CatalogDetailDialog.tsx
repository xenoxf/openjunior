import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { openExternalUrl } from '@/lib/url';
import type { UnifiedCatalogItem, UnifiedCatalogItemType } from '@/lib/api/types';
import type { IconName } from '@/components/icon/icons';
import { useUnifiedCatalogStore } from '@/stores/useUnifiedCatalogStore';

const TYPE_CONFIG: Record<UnifiedCatalogItemType, { icon: IconName; color: string; labelKey: I18nKey }> = {
  skill: { icon: 'brain', color: 'text-[var(--status-info)]', labelKey: 'settings.integrations.card.skill' },
  mcp: { icon: 'plug', color: 'text-[var(--status-success)]', labelKey: 'settings.integrations.card.mcp' },
  plugin: { icon: 'code-box', color: 'text-[var(--status-warning)]', labelKey: 'settings.integrations.card.plugin' },
};

interface CatalogDetailDialogProps {
  item: UnifiedCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CatalogDetailDialog: React.FC<CatalogDetailDialogProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  const { t } = useI18n();
  const { installItem, isInstalling } = useUnifiedCatalogStore();

  if (!item) return null;

  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.skill;
  const isItemInstalling = isInstalling[item.id] || false;

  const handleInstall = async () => {
    const result = await installItem(item);
    if (result.ok) {
      toast.success(result.message || t('settings.integrations.toast.installed', { name: item.name }));
      onOpenChange(false);
    } else {
      toast.error(result.message || t('settings.integrations.toast.installFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-muted)]', typeConfig.color)}>
              <Icon name={typeConfig.icon} className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {item.name}
                <span className="rounded-full bg-[var(--primary-base)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
                  {t(typeConfig.labelKey)}
                </span>
                {item.official && (
                  <span className="rounded-full bg-[var(--status-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
                    {t('settings.integrations.card.official')}
                  </span>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Long description */}
            {item.longDescription && item.longDescription !== item.description && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.about')}
                </h4>
                <p className="text-sm text-[var(--surface-mutedForeground)]">{item.longDescription}</p>
              </div>
            )}

            {/* Install steps */}
            {item.installSteps && item.installSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.howToInstall')}
                </h4>
                <ol className="space-y-2">
                  {item.installSteps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--surface-mutedForeground)]">
                      <span className="flex-shrink-0 font-mono text-xs text-[var(--primary-base)]">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Config fields */}
            {item.configFields && item.configFields.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.requiredCredentials')}
                </h4>
                <div className="space-y-2">
                  {item.configFields.map((field) => (
                    <div key={field.key} className="rounded-md bg-[var(--surface-muted)] p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--surface-foreground)]">{field.key}</span>
                        {field.required && (
                          <span className="text-[10px] text-[var(--status-error)]">
                            {t('settings.integrations.detail.required')}
                          </span>
                        )}
                      </div>
                      {field.description && (
                        <p className="mt-1 text-xs text-[var(--surface-mutedForeground)]">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical details */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                {t('settings.integrations.detail.details')}
              </h4>
              <div className="rounded-md bg-[var(--surface-muted)] p-3 font-mono text-xs space-y-1">
                <div>
                  <span className="text-[var(--surface-mutedForeground)]">{t('settings.integrations.detail.source')}:</span>{' '}
                  <span className="text-[var(--surface-foreground)]">{item.source}</span>
                </div>
                {item.author && (
                  <div>
                    <span className="text-[var(--surface-mutedForeground)]">{t('settings.integrations.detail.author')}:</span>{' '}
                    <span className="text-[var(--surface-foreground)]">{item.author}</span>
                  </div>
                )}
                {item.version && (
                  <div>
                    <span className="text-[var(--surface-mutedForeground)]">{t('settings.integrations.detail.version')}:</span>{' '}
                    <span className="text-[var(--surface-foreground)]">{item.version}</span>
                  </div>
                )}
                <div>
                  <span className="text-[var(--surface-mutedForeground)]">{t('settings.integrations.detail.category')}:</span>{' '}
                  <span className="text-[var(--surface-foreground)]">{item.category}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {(Array.isArray(item.tags) ? item.tags : []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.tags')}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[var(--interactive-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--surface-mutedForeground)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-row items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => item.setupGuideUrl && openExternalUrl(item.setupGuideUrl)}
            disabled={!item.setupGuideUrl}
          >
            <Icon name="external-link" className="h-3 w-3 mr-1" />
            {t('settings.integrations.detail.documentation')}
          </Button>
          <Button onClick={handleInstall} disabled={isItemInstalling}>
            {isItemInstalling
              ? t('settings.integrations.detail.installing')
              : t('settings.integrations.detail.install')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

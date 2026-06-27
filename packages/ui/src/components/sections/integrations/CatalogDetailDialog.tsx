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
import { useUnifiedCatalogStore, installedKey } from '@/stores/useUnifiedCatalogStore';

const TYPE_CONFIG: Record<UnifiedCatalogItemType, { icon: IconName; accent: string; bg: string; labelKey: I18nKey }> = {
  skill: {
    icon: 'brain',
    accent: 'bg-[var(--status-info)]',
    bg: 'bg-[var(--status-info)]/8',
    labelKey: 'settings.integrations.card.skill',
  },
  mcp: {
    icon: 'plug',
    accent: 'bg-[var(--status-success)]',
    bg: 'bg-[var(--status-success)]/8',
    labelKey: 'settings.integrations.card.mcp',
  },
  plugin: {
    icon: 'code-box',
    accent: 'bg-[var(--status-warning)]',
    bg: 'bg-[var(--status-warning)]/8',
    labelKey: 'settings.integrations.card.plugin',
  },
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
  const { installItem, isInstalling, installedIds } = useUnifiedCatalogStore();
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (item && item.configFields) {
      const initial: Record<string, string> = {};
      for (const f of item.configFields) {
        initial[f.key] = '';
      }
      setConfigValues(initial);
    }
  }, [item]);

  if (!item) return null;

  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.skill;
  const isItemInstalling = isInstalling[item.id] || false;
  const isAlreadyInstalled = installedIds.includes(installedKey(item));

  const handleInstall = async () => {
    const enrichedItem = {
      ...item,
      installConfig: {
        ...item.installConfig,
        ...(item.configFields && item.configFields.length > 0
          ? { env: { ...(item.installConfig.env as Record<string, string> || {}), ...configValues } }
          : {}),
      },
    };
    const result = await installItem(enrichedItem);
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
          <DialogTitle className="flex items-start gap-3">
            <div className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
              typeConfig.bg, typeConfig.accent.replace('bg-', 'text-')
            )}>
              <Icon name={typeConfig.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate">{item.name}</span>
                <span className={cn(
                  'inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  typeConfig.bg, typeConfig.accent.replace('bg-', 'text-')
                )}>
                  <Icon name={typeConfig.icon} className="h-3 w-3" />
                  {t(typeConfig.labelKey)}
                </span>
                {isAlreadyInstalled && (
                  <span className="shrink-0 rounded-full bg-[var(--status-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--status-success)]">
                    <Icon name="check" className="h-3 w-3 inline mr-0.5" />
                    {t('settings.integrations.card.installed')}
                  </span>
                )}
                {item.official && !isAlreadyInstalled && (
                  <span className="shrink-0 rounded-full bg-[var(--primary-base)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary-base)]">
                    {t('settings.integrations.card.official')}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1">{item.description}</DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-5">
            {/* Stats row */}
            <div className="flex flex-wrap gap-3 text-xs text-[var(--surface-mutedForeground)]">
              {item.author && (
                <span className="flex items-center gap-1">
                  <Icon name="user" className="h-3.5 w-3.5" />
                  {item.author}
                </span>
              )}
              {item.version && typeof item.version === 'string' && (
                <span className="flex items-center gap-1">
                  <Icon name="information" className="h-3.5 w-3.5" />
                  v{item.version}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Icon name="star" className="h-3.5 w-3.5" />
                {item.popularity} popularity
              </span>
              <span className="flex items-center gap-1">
                <Icon name="server" className="h-3.5 w-3.5" />
                {item.source}
              </span>
            </div>

            {/* Long description */}
            {item.longDescription && item.longDescription !== item.description && (
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <h4 className="text-sm font-semibold mb-1 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.about')}
                </h4>
                <p className="text-sm text-[var(--surface-mutedForeground)] leading-relaxed">{item.longDescription}</p>
              </div>
            )}

            {/* Config fields as editable inputs */}
            {item.configFields && item.configFields.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.requiredCredentials')}
                </h4>
                <div className="space-y-3">
                  {item.configFields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-xs font-medium text-[var(--surface-foreground)]">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-[var(--status-error)]">*</span>
                        )}
                      </label>
                      {field.type === 'password' ? (
                        <input
                          type="password"
                          value={configValues[field.key] || ''}
                          onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder || field.label}
                          className="w-full rounded-lg border border-[var(--interactive-border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--surface-foreground)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50"
                        />
                      ) : (
                        <input
                          type="text"
                          value={configValues[field.key] || ''}
                          onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder || field.label}
                          className="w-full rounded-lg border border-[var(--interactive-border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--surface-foreground)] placeholder:text-[var(--surface-mutedForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50"
                        />
                      )}
                      {field.description && (
                        <p className="mt-1 text-xs text-[var(--surface-mutedForeground)]">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
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
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-base)]/10 text-[10px] font-semibold text-[var(--primary-base)]">
                        {i + 1}
                      </span>
                      <span className="pt-px">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tags */}
            {(Array.isArray(item.tags) ? item.tags : []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-[var(--surface-foreground)]">
                  {t('settings.integrations.detail.tags')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
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
          {isAlreadyInstalled ? (
            <Button disabled variant="outline" size="sm">
              <Icon name="check" className="h-4 w-4 mr-1" />
              {t('settings.integrations.card.installed')}
            </Button>
          ) : (
            <Button onClick={handleInstall} disabled={isItemInstalling}>
              {isItemInstalling ? (
                <>
                  <Icon name="loader-4" className="h-4 w-4 mr-1 animate-spin" />
                  {t('settings.integrations.detail.installing')}
                </>
              ) : (
                t('settings.integrations.detail.install')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

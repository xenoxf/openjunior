import * as React from 'react';
import { Icon } from '@/components/icon/Icon';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n';
import { getSafeStorage } from '@/stores/utils/safeStorage';
import { useUpdateStore } from '@/stores/useUpdateStore';
import { isElectronShell, isDesktopLocalOriginActive } from '@/lib/desktop';

const UPDATE_TOAST_ID = 'glenker-update-available';
const UPDATE_DOWNLOAD_TOAST_ID = 'glenker-update-download';
const DISMISSED_VERSION_KEY = 'glenker-update-toast-dismissed-version';

const AUTO_CHECK_INITIAL_DELAY_MS = 15_000;
const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const GlenkerUpdateToast: React.FC = () => {
  const { t } = useI18n();
  const seenVersionsRef = React.useRef(new Set<string>());
  const autoCheckScheduledRef = React.useRef(false);

  React.useEffect(() => {
    if (!isElectronShell() || !isDesktopLocalOriginActive()) {
      return;
    }

    if (autoCheckScheduledRef.current) {
      return;
    }
    autoCheckScheduledRef.current = true;

    let cancelled = false;
    let checkTimer: number | null = null;
    let intervalTimer: number | null = null;

    const doCheck = () => {
      if (cancelled) return;
      void useUpdateStore.getState().checkForUpdates();
    };

    checkTimer = window.setTimeout(() => {
      if (cancelled) return;
      doCheck();
      intervalTimer = window.setInterval(doCheck, AUTO_CHECK_INTERVAL_MS);
    }, AUTO_CHECK_INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      if (checkTimer !== null) window.clearTimeout(checkTimer);
      if (intervalTimer !== null) window.clearInterval(intervalTimer);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let currentDownloadToastId: string | null = null;

    const unsub = useUpdateStore.subscribe((state) => {
      if (cancelled) return;

      const version = state.info?.version;
      const dismissedVersion = getSafeStorage().getItem(DISMISSED_VERSION_KEY);

      if (state.available && version && !seenVersionsRef.current.has(version) && dismissedVersion !== version) {
        seenVersionsRef.current.add(version);

        toast.info(t('glenkerUpdate.toast.available.title'), {
          id: UPDATE_TOAST_ID,
          description: t('glenkerUpdate.toast.available.description', { version }),
          duration: Infinity,
          action: {
            label: t('glenkerUpdate.toast.actions.download'),
            onClick: () => {
              useUpdateStore.getState().downloadUpdate();
            },
          },
          cancel: {
            label: t('glenkerUpdate.toast.actions.dismiss'),
            onClick: () => {
              getSafeStorage().setItem(DISMISSED_VERSION_KEY, version);
              toast.dismiss(UPDATE_TOAST_ID);
            },
          },
        });
      }

      if (state.downloading && state.progress) {
        const total = state.progress.total ?? 0;
        const percent = total > 0
          ? Math.round((state.progress.downloaded / total) * 100)
          : 0;
        toast.message(t('glenkerUpdate.toast.downloading.title'), {
          id: UPDATE_DOWNLOAD_TOAST_ID,
          description: t('glenkerUpdate.toast.downloading.description', {
            progress: percent,
          }),
          duration: Infinity,
          icon: <Icon name="refresh" className="h-4 w-4 animate-spin text-muted-foreground" />,
        });
        currentDownloadToastId = UPDATE_DOWNLOAD_TOAST_ID;
      }

      if (state.downloaded) {
        toast.success(t('glenkerUpdate.toast.downloaded.title'), {
          id: currentDownloadToastId || UPDATE_DOWNLOAD_TOAST_ID,
          description: t('glenkerUpdate.toast.downloaded.description', { version: state.info?.version || '' }),
          duration: Infinity,
          icon: <Icon name="check" className="h-4 w-4 text-[var(--status-success)]" />,
          action: {
            label: t('glenkerUpdate.toast.actions.restart'),
            onClick: () => {
              useUpdateStore.getState().restartToUpdate();
            },
          },
        });
      }

      if (state.error && !state.downloading) {
        toast.error(t('glenkerUpdate.toast.failed.title'), {
          id: currentDownloadToastId || UPDATE_DOWNLOAD_TOAST_ID,
          description: state.error,
          duration: Infinity,
        });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [t]);

  return null;
};

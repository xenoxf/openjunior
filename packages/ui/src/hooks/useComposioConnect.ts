import React from 'react';
import { useComposioStore, type ComposioApp } from '@/stores/useComposioStore';
import { toast } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

interface UseComposioConnectReturn {
  connectingSlug: string | null;
  connectedApp: ComposioApp | null;
  showSuccessModal: boolean;
  pendingCustomAuth: { app: ComposioApp; authScheme: string } | null;
  setShowSuccessModal: (v: boolean) => void;
  setConnectedApp: (app: ComposioApp | null) => void;
  clearCustomAuth: () => void;
  startConnect: (app: ComposioApp) => Promise<void>;
}

const POPUP_W = 600;
const POPUP_H = 700;

export function useComposioConnect(): UseComposioConnectReturn {
  const connectApp = useComposioStore((s) => s.connectApp);
  const waitForConnection = useComposioStore((s) => s.waitForConnection);
  const loadConnectedAccounts = useComposioStore((s) => s.loadConnectedAccounts);
  const { t } = useI18n();

  const [connectingSlug, setConnectingSlug] = React.useState<string | null>(null);
  const [connectedApp, setConnectedApp] = React.useState<ComposioApp | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [pendingCustomAuth, setPendingCustomAuth] = React.useState<{ app: ComposioApp; authScheme: string } | null>(null);

  const popupRef = React.useRef<Window | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = React.useRef<{ connectionId: string; app: ComposioApp } | null>(null);

  const clearCustomAuth = React.useCallback(() => {
    setPendingCustomAuth(null);
  }, []);

  const cleanup = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    popupRef.current = null;
    activeRef.current = null;
  }, []);

  React.useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.source !== 'composio-callback') return;
      cleanup();
      const s = activeRef.current;
      if (!s) return;

      const status = e.data.status;
      if (status === 'ok' || status === 'connected') {
        setConnectingSlug(null);
        waitForConnection(s.connectionId).then((ready) => {
          if (ready) {
            loadConnectedAccounts();
            setConnectedApp(s.app);
            setShowSuccessModal(true);
            toast.success(t('settings.connectors.integrations.toast.connected', { app: s.app.name }));
          } else {
            toast.error(t('settings.connectors.integrations.toast.connectFailed', { app: s.app.name }));
          }
        });
      } else {
        toast.error(t('settings.connectors.integrations.toast.connectFailed', { app: s.app.name }));
        setConnectingSlug(null);
      }
    }
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      cleanup();
    };
  }, [waitForConnection, loadConnectedAccounts, t, cleanup]);

  const startConnect = React.useCallback(async (app: ComposioApp) => {
    setConnectingSlug(app.id);
    setConnectedApp(null);
    setShowSuccessModal(false);
    cleanup();

    // Open the popup synchronously within the user gesture. Browsers block
    // window.open() called after an await, so we create it now (blank) and
    // navigate it once we have the OAuth URL from the server.
    const left = Math.max(0, Math.round((window.screen.width - POPUP_W) / 2));
    const top = Math.max(0, Math.round((window.screen.height - POPUP_H) / 2));
    const popup = window.open(
      'about:blank',
      'composio-oauth',
      `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},popup=1`,
    );

    if (!popup || popup.closed) {
      toast.error(t('settings.connectors.integrations.toast.oauthBlocked'));
      setConnectingSlug(null);
      cleanup();
      return;
    }

    popupRef.current = popup;

    try {
      const result = await connectApp(app.slug);
      if (result.requiresCustomAuth) {
        popup.close();
        setPendingCustomAuth({ app, authScheme: result.authScheme || 'OAUTH2' });
        setConnectingSlug(null);
        cleanup();
        return;
      }
      if (!result.ok || !result.redirectUrl || !result.connectionId) {
        popup.close();
        toast.error(t('settings.connectors.integrations.toast.connectFailed', { app: app.name }));
        setConnectingSlug(null);
        cleanup();
        return;
      }

      if (popup.closed) {
        toast.error(t('settings.connectors.integrations.toast.oauthBlocked'));
        setConnectingSlug(null);
        cleanup();
        return;
      }

      activeRef.current = { connectionId: result.connectionId, app };
      popup.location.href = result.redirectUrl;
      popup.focus();

      pollRef.current = setInterval(() => {
        if (popupRef.current?.closed) {
          cleanup();
          if (activeRef.current) {
            setConnectingSlug(null);
            toast.error(t('settings.connectors.integrations.toast.oauthTimeout'));
          }
        }
      }, 500);
    } catch {
      popup.close();
      toast.error(t('settings.connectors.integrations.toast.connectFailed', { app: app.name }));
      setConnectingSlug(null);
      cleanup();
    }
  }, [connectApp, t, cleanup]);

  return {
    connectingSlug,
    connectedApp,
    showSuccessModal,
    pendingCustomAuth,
    setShowSuccessModal,
    setConnectedApp,
    clearCustomAuth,
    startConnect,
  };
}

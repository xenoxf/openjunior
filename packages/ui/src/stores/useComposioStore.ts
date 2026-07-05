import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { runtimeFetch } from '@/lib/runtime-fetch';

export interface ComposioApp {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  authScheme: string | null;
  isManaged: boolean;
}

export interface ComposioConnectedAccount {
  id: string;
  status: string;
  userId: string;
  toolkit: string;
  createdAt?: string;
}

interface ComposioStore {
  apps: ComposioApp[];
  connectedAccounts: ComposioConnectedAccount[];
  isLoadingApps: boolean;
  isLoadingConnections: boolean;
  loadApps: () => Promise<void>;
  loadConnectedAccounts: () => Promise<void>;
  connectApp: (slug: string) => Promise<{ ok: boolean; redirectUrl?: string; error?: string }>;
  disconnectAccount: (accountId: string) => Promise<boolean>;
}

export const useComposioStore = create<ComposioStore>()(
  devtools(
    (set, get) => ({
      apps: [],
      connectedAccounts: [],
      isLoadingApps: false,
      isLoadingConnections: false,

      loadApps: async () => {
        set({ isLoadingApps: true });
        try {
          const response = await runtimeFetch('/api/composio/apps', {
            headers: { Accept: 'application/json' },
          });
          const data = await response.json();
          set({ apps: data?.items || [], isLoadingApps: false });
        } catch {
          set({ isLoadingApps: false });
        }
      },

      loadConnectedAccounts: async () => {
        set({ isLoadingConnections: true });
        try {
          const response = await runtimeFetch('/api/composio/connections', {
            headers: { Accept: 'application/json' },
          });
          const data = await response.json();
          set({ connectedAccounts: data?.items || [], isLoadingConnections: false });
        } catch {
          set({ isLoadingConnections: false });
        }
      },

      connectApp: async (slug) => {
        try {
          const response = await runtimeFetch(`/api/composio/apps/${slug}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ userId: 'default' }),
          });
          const data = await response.json();
          if (data?.ok && data?.redirectUrl) {
            return { ok: true, redirectUrl: data.redirectUrl };
          }
          return { ok: false, error: data?.error || 'Failed to initiate connection' };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
        }
      },

      disconnectAccount: async (accountId) => {
        try {
          await runtimeFetch(`/api/composio/connections/${accountId}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' },
          });
          await get().loadConnectedAccounts();
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'composio-store' },
  ),
);

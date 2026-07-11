import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { runtimeFetch } from '@/lib/runtime-fetch';

export interface ComposioAppMeta {
  toolsCount: number;
  triggersCount: number;
}

export interface ComposioApp {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  category: string;
  tags: string[];
  authScheme: string | null;
  authSchemes: string[];
  isManaged: boolean;
  meta: ComposioAppMeta;
}

export interface ComposioAuthField {
  name: string;
  type: string;
  displayName: string;
  description: string;
  required?: boolean;
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
  isLoadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  searchQuery: string;
  _searchSeq: number;
  selectedAccountId: string | null;
  loadApps: () => Promise<void>;
  loadMoreApps: () => Promise<void>;
  searchApps: (query: string) => Promise<void>;
  loadConnectedAccounts: () => Promise<void>;
  getAuthFields: (slug: string, scheme: string) => Promise<ComposioAuthField[]>;
  connectApp: (slug: string) => Promise<{ ok: boolean; redirectUrl?: string; connectionId?: string; error?: string }>;
  waitForConnection: (connectionId: string) => Promise<boolean>;
  connectAppCustom: (slug: string, credentials: Record<string, string>, authScheme: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectAccount: (accountId: string) => Promise<boolean>;
  setSelectedAccount: (id: string | null) => void;
}

export const useComposioStore = create<ComposioStore>()(
  devtools(
    (set, get) => ({
      apps: [],
      connectedAccounts: [],
      selectedAccountId: null,
      isLoadingApps: false,
      isLoadingConnections: false,
      isLoadingMore: false,
      hasMore: false,
      nextCursor: null,
      searchQuery: '',
      _searchSeq: 0,

      loadApps: async () => {
        set({ isLoadingApps: true, searchQuery: '' });
        try {
          const response = await runtimeFetch('/api/composio/apps', {
            headers: { Accept: 'application/json' },
          });
          const data = await response.json();
          set({
            apps: data?.items || [],
            nextCursor: data?.nextCursor || null,
            hasMore: !!data?.nextCursor,
            isLoadingApps: false,
          });
        } catch {
          set({ isLoadingApps: false });
        }
      },

      loadMoreApps: async () => {
        const { nextCursor, isLoadingMore, hasMore } = get();
        if (!nextCursor || isLoadingMore || !hasMore) return;
        set({ isLoadingMore: true });
        try {
          const response = await runtimeFetch(`/api/composio/apps?cursor=${encodeURIComponent(nextCursor)}`, {
            headers: { Accept: 'application/json' },
          });
          const data = await response.json();
          set((state) => ({
            apps: [...state.apps, ...(data?.items || [])],
            nextCursor: data?.nextCursor || null,
            hasMore: !!data?.nextCursor,
            isLoadingMore: false,
          }));
        } catch {
          set({ isLoadingMore: false });
        }
      },

      searchApps: async (query: string) => {
        const seq = get()._searchSeq + 1;
        set({ isLoadingApps: true, searchQuery: query, _searchSeq: seq });
        try {
          const response = await runtimeFetch(`/api/composio/apps?search=${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/json' },
          });
          if (get()._searchSeq !== seq) return;
          const data = await response.json();
          set({
            apps: data?.items || [],
            nextCursor: data?.nextCursor || null,
            hasMore: !!data?.nextCursor,
            isLoadingApps: false,
          });
        } catch {
          set((s) => s._searchSeq === seq ? { isLoadingApps: false } : {});
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

      getAuthFields: async (slug, scheme) => {
        try {
          const response = await runtimeFetch(`/api/composio/apps/${slug}/auth-fields?scheme=${encodeURIComponent(scheme)}`, {
            headers: { Accept: 'application/json' },
          });
          const data = await response.json();
          return data?.fields || [];
        } catch {
          return [];
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
            return { ok: true, redirectUrl: data.redirectUrl, connectionId: data.connectionId };
          }
          return { ok: false, error: data?.error || 'Failed to initiate connection' };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
        }
      },

      waitForConnection: async (connectionId) => {
        try {
          const response = await runtimeFetch(`/api/composio/connections/${connectionId}/wait`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          });
          const data = await response.json();
          return data?.ok === true;
        } catch {
          return false;
        }
      },

      connectAppCustom: async (slug, credentials, authScheme) => {
        try {
          const response = await runtimeFetch(`/api/composio/apps/${slug}/connect-custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ userId: 'default', credentials, authScheme }),
          });
          const data = await response.json();
          if (data?.ok) {
            return { ok: true };
          }
          return { ok: false, error: data?.error || 'Failed to connect' };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
        }
      },

      setSelectedAccount: (id) => {
        set({ selectedAccountId: id });
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

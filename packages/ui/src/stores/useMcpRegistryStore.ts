import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { runtimeFetch } from '@/lib/runtime-fetch';

export interface McpEnvVar {
  name: string;
  description: string;
  isRequired: boolean;
  isSecret: boolean;
  defaultValue: string | null;
  placeholder: string | null;
}

export interface McpRemoteHeader {
  name: string;
  description: string;
  isRequired: boolean;
  isSecret: boolean;
  placeholder: string | null;
}

export interface McpRemoteVariable {
  name: string;
  description: string;
  isRequired: boolean;
  isSecret: boolean;
  choices: string[] | null;
}

export interface McpRegistryServer {
  name: string;
  title: string;
  description: string;
  version: string;
  transportType: 'stdio' | 'streamable-http' | 'sse' | null;
  installType: 'command' | 'url' | null;
  installCommand: string[] | null;
  installUrl: string | null;
  homepage: string | null;
  repository: string | null;
  websiteUrl: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string | null;
  isLatest: boolean;
  envVars: McpEnvVar[];
  remoteHeaders: McpRemoteHeader[];
  remoteVariables: McpRemoteVariable[];
  hasAuth: boolean;
  hasOAuth: boolean;
  icons: Record<string, unknown> | null;
  categories: string[];
}

export type McpRegistryCategory = { id: string; label: string; icon: string };

interface McpRegistryResponse {
  ok: boolean;
  servers: McpRegistryServer[];
  nextCursor: string | null;
  count: number;
  error?: string;
}

export type FetchErrorType = 'network' | 'registry_error' | 'rate_limited' | 'unknown';

interface FetchError {
  type: FetchErrorType;
  message: string;
}

interface McpRegistryState {
  servers: McpRegistryServer[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: FetchError | null;
  nextCursor: string | null;
  hasMore: boolean;
  lastFetched: number;
  searchQuery: string;
  categories: Array<{id: string; label: string; icon: string}>;
  activeCategory: string | null;

  fetchServers: (searchQuery?: string, category?: string | null) => Promise<void>;
  fetchMore: () => Promise<void>;
  setSearch: (query: string) => void;
  fetchCategories: () => Promise<void>;
  setActiveCategory: (categoryId: string | null) => void;
  reset: () => void;
}

const PAGE_SIZE = 30;

export const useMcpRegistryStore = create<McpRegistryState>()(
  devtools(
    (set, get) => ({
      servers: [],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      nextCursor: null,
      hasMore: true,
      lastFetched: 0,
      searchQuery: '',
      categories: [],
      activeCategory: null,

      fetchServers: async (searchQuery, category) => {
        set({ isLoading: true, error: null, servers: [], nextCursor: null, hasMore: true });

        try {
          const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
          if (searchQuery) params.set('search', searchQuery);
          if (category) params.set('category', category);

          const response = await runtimeFetch(`/api/mcp-registry?${params.toString()}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (!response.ok) {
            const errType = response.status === 429 ? 'rate_limited' : response.status >= 500 ? 'registry_error' : 'unknown';
            throw { type: errType, message: `MCP Registry responded with ${response.status}` };
          }

          const data: McpRegistryResponse = await response.json();

          if (!data.ok) {
            throw { type: 'registry_error', message: data.error || 'Invalid response from MCP Registry' };
          }

          set({
            servers: data.servers,
            nextCursor: data.nextCursor,
            hasMore: !!data.nextCursor,
            lastFetched: Date.now(),
            isLoading: false,
            searchQuery: searchQuery || '',
          });
        } catch (err) {
          const fetchErr = err as FetchError;
          set({
            error: {
              type: fetchErr.type || 'network',
              message: fetchErr.message || 'Failed to connect to MCP Registry',
            },
            isLoading: false,
          });
        }
      },

      fetchMore: async () => {
        const { nextCursor, isLoadingMore, isLoading } = get();
        if (!nextCursor || isLoadingMore || isLoading) return;

        set({ isLoadingMore: true });

        try {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            cursor: nextCursor,
          });
          const searchQuery = get().searchQuery;
          if (searchQuery) params.set('search', searchQuery);

          const response = await runtimeFetch(`/api/mcp-registry?${params.toString()}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Registry responded with ${response.status}`);
          }

          const data: McpRegistryResponse = await response.json();

          if (!data.ok) {
            throw new Error(data.error || 'Invalid response');
          }

          set((state) => ({
            servers: [...state.servers, ...data.servers],
            nextCursor: data.nextCursor,
            hasMore: !!data.nextCursor,
            isLoadingMore: false,
          }));
        } catch {
          set({ isLoadingMore: false });
        }
      },

      setSearch: (query) => {
        set({ searchQuery: query });
      },

      fetchCategories: async () => {
        try {
          const response = await runtimeFetch('/api/mcp-registry/categories', {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.ok) {
              set({ categories: data.categories });
            }
          }
        } catch {
          // non-critical
        }
      },

      setActiveCategory: (categoryId) => {
        set({ activeCategory: categoryId });
        get().fetchServers(get().searchQuery, categoryId);
      },

      reset: () => {
        set({
          servers: [],
          isLoading: false,
          isLoadingMore: false,
          error: null,
          nextCursor: null,
          hasMore: true,
          lastFetched: 0,
        });
      },
    }),
    { name: 'mcp-registry-store' }
  )
);

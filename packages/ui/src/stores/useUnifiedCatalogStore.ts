import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { runtimeFetch } from '@/lib/runtime-fetch';
import type {
  UnifiedCatalogItem,
  UnifiedCatalogItemType,
  UnifiedCatalogSourceStatus,
  UnifiedCatalogResponse,
  UnifiedCatalogSourcesResponse,
} from '@/lib/api/types';

export type UnifiedCatalogCategory = 'all' | 'files' | 'tools' | 'chat' | 'agents' | 'services';

export interface UnifiedCatalogState {
  items: UnifiedCatalogItem[];
  sources: UnifiedCatalogSourceStatus[];

  // Filters
  selectedType: UnifiedCatalogItemType | 'all';
  selectedCategory: UnifiedCatalogCategory;
  searchQuery: string;

  // Pagination
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isInstalling: Record<string, boolean>;

  // Selected item for detail dialog
  selectedItem: UnifiedCatalogItem | null;

  // Actions
  loadCatalog: (options?: { refresh?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  setTypeFilter: (type: UnifiedCatalogItemType | 'all') => void;
  setCategoryFilter: (category: UnifiedCatalogCategory) => void;
  setSearch: (query: string) => void;
  setSelectedItem: (item: UnifiedCatalogItem | null) => void;
  installItem: (item: UnifiedCatalogItem) => Promise<{ ok: boolean; message?: string }>;
  refreshSources: () => Promise<void>;
}

const CATALOG_CACHE_TTL_MS = 5000;
let lastCatalogLoad = 0;

export const useUnifiedCatalogStore = create<UnifiedCatalogState>()(
  devtools(
    (set, get) => ({
      items: [],
      sources: [],

      selectedType: 'all',
      selectedCategory: 'all',
      searchQuery: '',

      hasMore: false,

      isLoading: false,
      isLoadingMore: false,
      isInstalling: {},

      selectedItem: null,

      loadCatalog: async (options) => {
        const now = Date.now();
        if (!options?.refresh && get().items.length > 0 && now - lastCatalogLoad < CATALOG_CACHE_TTL_MS) {
          return;
        }

        set({ isLoading: true });

        try {
          const { selectedType, selectedCategory, searchQuery } = get();
          const params = new URLSearchParams();

          if (selectedType !== 'all') params.set('type', selectedType);
          if (selectedCategory !== 'all') params.set('category', selectedCategory);
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          if (options?.refresh) params.set('refresh', 'true');

          const queryString = params.toString();
          const url = `/api/catalog${queryString ? `?${queryString}` : ''}`;

          const response = await runtimeFetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Failed to load catalog: ${response.status}`);
          }

          const data: UnifiedCatalogResponse = await response.json();

          if (data.ok && data.items) {
            set({
              items: data.items,
              hasMore: false, // Pagination handled per-source in the backend
            });
            lastCatalogLoad = Date.now();
          }

          // Load source statuses
          void get().refreshSources();
        } catch (err) {
          console.error('[UnifiedCatalogStore] Failed to load catalog:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      loadMore: async () => {
        // Pagination is handled server-side; this is a no-op for now
        // Future: implement cursor-based pagination per source
      },

      setTypeFilter: (type) => {
        set({ selectedType: type });
        void get().loadCatalog({ refresh: true });
      },

      setCategoryFilter: (category) => {
        set({ selectedCategory: category });
        void get().loadCatalog({ refresh: true });
      },

      setSearch: (query) => {
        set({ searchQuery: query });
        // Debounce search
        const timeoutId = setTimeout(() => {
          void get().loadCatalog({ refresh: true });
        }, 300);
        return () => clearTimeout(timeoutId);
      },

      setSelectedItem: (item) => {
        set({ selectedItem: item });
      },

      installItem: async (item) => {
        set((state) => ({
          isInstalling: { ...state.isInstalling, [item.id]: true },
        }));

        try {
          const config = item.installConfig;

          if (item.type === 'skill') {
            const source = config.repo || config.slug;
            if (!source) {
              return { ok: false, message: 'No install source found for this skill' };
            }

            const response = await runtimeFetch('/api/config/skills/install', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source,
                scope: 'user',
              }),
            });

            const result = await response.json();
            if (result.ok) {
              return { ok: true, message: result.message || `${item.name} installed successfully` };
            }
            return { ok: false, message: result.error?.message || 'Failed to install skill' };
          }

          if (item.type === 'mcp') {
            const name = item.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const mcpConfig: Record<string, unknown> = {
              type: config.command ? 'local' : 'remote',
            };

            if (config.command) {
              mcpConfig.command = config.command;
            }
            if (config.env) {
              mcpConfig.env = config.env;
            }
            if (config.url) {
              mcpConfig.url = config.url;
            }

            const response = await runtimeFetch(`/api/config/mcp/${encodeURIComponent(name)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mcpConfig),
            });

            if (response.ok) {
              return { ok: true, message: `${item.name} MCP server added` };
            }
            const err = await response.json().catch(() => null);
            return { ok: false, message: err?.error || 'Failed to add MCP server' };
          }

          if (item.type === 'plugin') {
            const spec = config.spec;
            if (!spec) {
              return { ok: false, message: 'No plugin spec found' };
            }

            const response = await runtimeFetch('/api/config/plugins/entry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ spec }),
            });

            const result = await response.json();
            if (result.ok !== false) {
              return { ok: true, message: `${item.name} plugin installed` };
            }
            return { ok: false, message: result.error || 'Failed to install plugin' };
          }

          return { ok: false, message: `Unknown item type: ${item.type}` };
        } catch (err) {
          console.error('[UnifiedCatalogStore] Failed to install item:', err);
          return { ok: false, message: err instanceof Error ? err.message : 'Installation failed' };
        } finally {
          set((state) => ({
            isInstalling: { ...state.isInstalling, [item.id]: false },
          }));
        }
      },

      refreshSources: async () => {
        try {
          const response = await runtimeFetch('/api/catalog/sources', {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (response.ok) {
            const data: UnifiedCatalogSourcesResponse = await response.json();
            if (data.ok && data.sources) {
              set({ sources: data.sources });
            }
          }
        } catch (err) {
          console.error('[UnifiedCatalogStore] Failed to refresh sources:', err);
        }
      },
    }),
    { name: 'unified-catalog-store' }
  )
);

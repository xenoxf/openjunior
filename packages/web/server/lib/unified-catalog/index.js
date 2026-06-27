/**
 * Unified Catalog — Orchestrator
 *
 * Aggregates all catalog sources, manages cache, and provides
 * the main API for fetching and installing catalog items.
 */

import { getSources, getSourceById } from './sources.js';
import { readCache, writeCache } from './cache.js';

// Import sources to trigger registration
import './clawdhub-source.js';
import './github-source.js';
import './npm-source.js';
import './mcp-directory-source.js';

/**
 * Load all catalog items from all sources with hybrid cache fallback.
 * @param {{ refresh?: boolean, query?: string, type?: string, category?: string, source?: string }} [options]
 * @returns {Promise<{ items: import('./sources.js').UnifiedCatalogItem[], sourceStatus: Record<string, { online: boolean, itemCount: number, cached: boolean }> }>}
 */
export async function loadCatalog(options = {}) {
  const { refresh = false, query, type, category, source: sourceFilter } = options;
  const sources = getSources();
  const allItems = [];
  const sourceStatus = {};

  const fetchPromises = sources.map(async (src) => {
    // If filtering by source, skip others
    if (sourceFilter && src.id !== sourceFilter) {
      sourceStatus[src.id] = { online: false, itemCount: 0, cached: false };
      return [];
    }

    try {
      const result = await src.fetchItems({ query, cursor: null, category });
      const items = result.items || [];

      // Write to disk cache
      writeCache(src.id, items);

      sourceStatus[src.id] = { online: true, itemCount: items.length, cached: false };
      return items;
    } catch (err) {
      console.error(`[UnifiedCatalog] Source ${src.id} failed:`, err.message);

      // Fallback to cache
      const cached = readCache({ sourceId: src.id });
      if (cached && cached.items.length > 0) {
        sourceStatus[src.id] = { online: false, itemCount: cached.items.length, cached: true };
        return cached.items;
      }

      sourceStatus[src.id] = { online: false, itemCount: 0, cached: false };
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // Apply type filter
  let filtered = allItems;
  if (type && type !== 'all') {
    filtered = filtered.filter((item) => item.type === type);
  }

  // Apply category filter
  if (category && category !== 'all') {
    filtered = filtered.filter((item) => item.category === category);
  }

  // Apply query filter (for sources that don't support server-side search)
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort by popularity (descending)
  filtered.sort((a, b) => b.popularity - a.popularity);

  return { items: filtered, sourceStatus };
}

/**
 * Load more items from a specific source (pagination).
 * @param {string} sourceId
 * @param {string} cursor
 * @param {{ query?: string, category?: string }} [options]
 * @returns {Promise<{ items: import('./sources.js').UnifiedCatalogItem[], nextCursor: string|null }>}
 */
export async function loadMoreFromSource(sourceId, cursor, options = {}) {
  const src = getSourceById(sourceId);
  if (!src) {
    return { items: [], nextCursor: null };
  }

  try {
    const result = await src.fetchItems({ query: options.query, cursor, category: options.category });
    return { items: result.items || [], nextCursor: result.nextCursor || null };
  } catch (err) {
    console.error(`[UnifiedCatalog] Load more from ${sourceId} failed:`, err.message);
    return { items: [], nextCursor: null };
  }
}

/**
 * Get a single catalog item by ID.
 * @param {string} globalId
 * @returns {Promise<import('./sources.js').UnifiedCatalogItem|null>}
 */
export async function getCatalogItem(globalId) {
  // Search across all sources
  for (const src of getSources()) {
    const item = await src.fetchItem(globalId);
    if (item) return item;
  }
  return null;
}

/**
 * Get status of all sources.
 * @returns {Promise<Array<{ id: string, label: string, online: boolean, cached: boolean }>>}
 */
export async function getSourceStatuses() {
  const sources = getSources();
  const statuses = [];

  for (const src of sources) {
    const cached = readCache({ sourceId: src.id });
    statuses.push({
      id: src.id,
      label: src.label,
      online: true, // We assume online unless proven otherwise during loadCatalog
      cached: Boolean(cached),
    });
  }

  return statuses;
}

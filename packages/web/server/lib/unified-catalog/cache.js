/**
 * Unified Catalog — Disk Cache
 *
 * Persists catalog data to disk with TTL-based expiration.
 * Location: ~/.cache/openchamber/catalog-cache.json
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_VERSION = 1;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_FILENAME = 'catalog-cache.json';

function getCacheDir() {
  const xdgCache = process.env.XDG_CACHE_HOME;
  if (xdgCache) return path.join(xdgCache, 'openchamber');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Caches', 'openchamber');
  return path.join(os.homedir(), '.cache', 'openchamber');
}

function getCachePath() {
  return path.join(getCacheDir(), CACHE_FILENAME);
}

/**
 * Read the disk cache. Returns null if missing, corrupted, or expired.
 * @param {{ sourceId?: string }} [options]
 * @returns {{ items: import('./sources.js').UnifiedCatalogItem[], fetchedAt: number, sourceId?: string } | null}
 */
export function readCache(options = {}) {
  try {
    const raw = fs.readFileSync(getCachePath(), 'utf8');
    const parsed = JSON.parse(raw);

    if (parsed.version !== CACHE_VERSION) return null;

    if (options.sourceId) {
      const sourceCache = parsed.sources?.[options.sourceId];
      if (!sourceCache) return null;
      if (Date.now() - sourceCache.fetchedAt > DEFAULT_TTL_MS) return null;
      return { items: sourceCache.items, fetchedAt: sourceCache.fetchedAt, sourceId: options.sourceId };
    }

    // Return all sources merged
    const allItems = [];
    const sources = parsed.sources || {};
    for (const [sourceId, cache] of Object.entries(sources)) {
      if (Date.now() - cache.fetchedAt <= DEFAULT_TTL_MS) {
        allItems.push(...cache.items.map((item) => ({ ...item, source: sourceId })));
      }
    }
    if (allItems.length === 0) return null;
    return { items: allItems, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

/**
 * Write catalog data to disk cache.
 * @param {string} sourceId
 * @param {import('./sources.js').UnifiedCatalogItem[]} items
 */
export function writeCache(sourceId, items) {
  try {
    const cacheDir = getCacheDir();
    fs.mkdirSync(cacheDir, { recursive: true });

    let existing = {};
    try {
      const raw = fs.readFileSync(getCachePath(), 'utf8');
      existing = JSON.parse(raw);
    } catch {
      // ignore
    }

    const sources = existing.sources || {};
    sources[sourceId] = { items, fetchedAt: Date.now() };

    const payload = {
      version: CACHE_VERSION,
      sources,
    };

    fs.writeFileSync(getCachePath(), JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('[UnifiedCatalog] Failed to write cache:', err.message);
  }
}

/**
 * Clear cache for a specific source or all sources.
 * @param {string} [sourceId]
 */
export function clearCache(sourceId) {
  try {
    if (!sourceId) {
      fs.unlinkSync(getCachePath());
      return;
    }

    const raw = fs.readFileSync(getCachePath(), 'utf8');
    const parsed = JSON.parse(raw);
    delete parsed.sources?.[sourceId];
    fs.writeFileSync(getCachePath(), JSON.stringify(parsed, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

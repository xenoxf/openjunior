/**
 * Unified Catalog — API Routes
 *
 * Express routes for /api/catalog/*
 */

import express from 'express';
import { loadCatalog, loadMoreFromSource, getCatalogItem, getSourceStatuses } from './index.js';

const router = express.Router();

/**
 * GET /api/catalog
 *
 * Unified catalog listing with filters.
 * Query params:
 *   - type: 'all' | 'skill' | 'mcp' | 'plugin'
 *   - category: string
 *   - search: string
 *   - source: string (source ID filter)
 *   - cursor: string (pagination cursor)
 *   - refresh: 'true' to force refresh
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, search, source, refresh } = req.query;

    const result = await loadCatalog({
      refresh: refresh === 'true',
      query: search || undefined,
      type: type || undefined,
      category: category || undefined,
      source: source || undefined,
    });

    res.json({
      ok: true,
      items: result.items,
      sourceStatus: result.sourceStatus,
      total: result.items.length,
    });
  } catch (err) {
    console.error('[Catalog Routes] Failed to load catalog:', err);
    res.status(500).json({
      ok: false,
      error: { kind: 'serverError', message: 'Failed to load catalog' },
    });
  }
});

/**
 * GET /api/catalog/sources
 *
 * Status of all catalog sources.
 */
router.get('/sources', async (_req, res) => {
  try {
    const statuses = await getSourceStatuses();
    res.json({ ok: true, sources: statuses });
  } catch (err) {
    console.error('[Catalog Routes] Failed to get source statuses:', err);
    res.status(500).json({
      ok: false,
      error: { kind: 'serverError', message: 'Failed to get source statuses' },
    });
  }
});

/**
 * GET /api/catalog/:id
 *
 * Get a single catalog item by global ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await getCatalogItem(req.params.id);
    if (!item) {
      return res.status(404).json({
        ok: false,
        error: { kind: 'notFound', message: 'Item not found' },
      });
    }
    res.json({ ok: true, item });
  } catch (err) {
    console.error('[Catalog Routes] Failed to get item:', err);
    res.status(500).json({
      ok: false,
      error: { kind: 'serverError', message: 'Failed to get item' },
    });
  }
});

/**
 * GET /api/catalog/more/:sourceId
 *
 * Load more items from a specific source (pagination).
 * Query params:
 *   - cursor: string
 *   - search: string
 *   - category: string
 */
router.get('/more/:sourceId', async (req, res) => {
  try {
    const { cursor, search, category } = req.query;
    const result = await loadMoreFromSource(req.params.sourceId, cursor, {
      query: search || undefined,
      category: category || undefined,
    });

    res.json({
      ok: true,
      items: result.items,
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    console.error('[Catalog Routes] Failed to load more:', err);
    res.status(500).json({
      ok: false,
      error: { kind: 'serverError', message: 'Failed to load more items' },
    });
  }
});

/**
 * POST /api/catalog/refresh
 *
 * Force refresh all catalog sources.
 */
router.post('/refresh', async (_req, res) => {
  try {
    const result = await loadCatalog({ refresh: true });
    res.json({
      ok: true,
      items: result.items,
      sourceStatus: result.sourceStatus,
      total: result.items.length,
    });
  } catch (err) {
    console.error('[Catalog Routes] Failed to refresh:', err);
    res.status(500).json({
      ok: false,
      error: { kind: 'serverError', message: 'Failed to refresh catalog' },
    });
  }
});

export default router;

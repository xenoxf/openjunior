console.log('[Composio:routes] ===== MODULE LOADED =====');

import express from 'express';
import {
  listToolkits,
  getToolkitBySlug,
  authorizeToolkit,
  listConnectedAccounts,
  getConnectedAccount,
  deleteConnectedAccount,
  executeTool,
} from './service.js';

export function registerComposioRoutes(app, composioApiKey, composioUserId) {
  console.log('[Composio:routes] registerComposioRoutes() called');
  console.log('[Composio:routes] composioApiKey present:', !!composioApiKey);
  console.log('[Composio:routes] composioUserId:', composioUserId || '(not set, will use body/fallback)');
  if (composioApiKey && typeof composioApiKey === 'string') {
    console.log('[Composio:routes] composioApiKey first 8 chars:', composioApiKey.slice(0, 8) + '...');
    console.log('[Composio:routes] composioApiKey length:', composioApiKey.length);
  } else {
    console.warn('[Composio:routes] WARNING: No composioApiKey provided! Routes will fail with 500.');
  }

  const getApiKey = () => composioApiKey;

  const PAGE_SIZE = 20;
  const paginationCache = new Map();

  function getCachedOrFetch(search) {
    const cacheKey = btoa(search || '');
    return paginationCache.get(cacheKey) || null;
  }

  function setCache(search, items) {
    const cacheKey = btoa(search || '');
    paginationCache.set(cacheKey, items);
  }

  function buildCursor(offset, total, search) {
    return btoa(`${offset}:${total}:${search || ''}`);
  }

  function parseCursor(cursor) {
    try {
      const decoded = atob(cursor);
      const parts = decoded.split(':');
      return { offset: parseInt(parts[0], 10), total: parseInt(parts[1], 10), search: parts[2] || '' };
    } catch {
      return null;
    }
  }

  app.get('/api/composio/apps', async (req, res) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const { cursor, search } = req.query;

      let allItems;
      let offset = 0;

      if (cursor) {
        const parsed = parseCursor(cursor);
        if (!parsed) {
          return res.status(400).json({ ok: false, error: 'Invalid cursor' });
        }
        offset = parsed.offset;
        allItems = getCachedOrFetch(parsed.search);
        if (!allItems) {
          return res.status(400).json({ ok: false, error: 'Cursor expired, please refresh' });
        }
        console.log('[Composio:routes]   -> cursor page:', { offset, total: parsed.total, search: parsed.search });
      } else {
        allItems = await listToolkits(apiKey, { search });
        setCache(search, allItems);
        console.log('[Composio:routes]   -> fetched', allItems.length, 'items from SDK');
      }

      const page = allItems.slice(offset, offset + PAGE_SIZE);
      const nextOffset = offset + PAGE_SIZE;
      const nextCursor = nextOffset < allItems.length ? buildCursor(nextOffset, allItems.length, search) : null;

      console.log('[Composio:routes]   -> returning', page.length, 'items, nextCursor:', !!nextCursor);
      res.json({ ok: true, items: page, nextCursor });
    } catch (err) {
      console.error('[Composio:routes] GET /api/composio/apps ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/api/composio/apps/:slug', async (req, res) => {
    console.log('[Composio:routes] GET /api/composio/apps/:slug', req.params.slug);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const toolkit = await getToolkitBySlug(apiKey, req.params.slug);
      console.log('[Composio:routes]   -> toolkit:', toolkit?.name || 'null');
      res.json({ ok: true, item: toolkit });
    } catch (err) {
      console.error('[Composio:routes] GET /api/composio/apps/:slug ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/api/composio/connections', async (req, res) => {
    console.log('[Composio:routes] GET /api/composio/connections');
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const { userIds, toolkitSlugs } = req.query;
      console.log('[Composio:routes]   -> query params:', { userIds, toolkitSlugs });
      const accounts = await listConnectedAccounts(apiKey, {
        userIds: userIds ? userIds.split(',') : undefined,
        toolkitSlugs: toolkitSlugs ? toolkitSlugs.split(',') : undefined,
      });
      console.log('[Composio:routes]   -> returning', accounts.length, 'accounts');
      res.json({ ok: true, items: accounts });
    } catch (err) {
      console.error('[Composio:routes] GET /api/composio/connections ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/api/composio/connections/:id', async (req, res) => {
    console.log('[Composio:routes] GET /api/composio/connections/:id', req.params.id);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const account = await getConnectedAccount(apiKey, req.params.id);
      console.log('[Composio:routes]   -> account:', account?.id || 'null');
      res.json({ ok: true, item: account });
    } catch (err) {
      console.error('[Composio:routes] GET /api/composio/connections/:id ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete('/api/composio/connections/:id', async (req, res) => {
    console.log('[Composio:routes] DELETE /api/composio/connections/:id', req.params.id);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      await deleteConnectedAccount(apiKey, req.params.id);
      console.log('[Composio:routes]   -> delete successful');
      res.json({ ok: true });
    } catch (err) {
      console.error('[Composio:routes] DELETE /api/composio/connections/:id ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post('/api/composio/apps/:slug/connect', express.json(), async (req, res) => {
    console.log('[Composio:routes] POST /api/composio/apps/:slug/connect', req.params.slug);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const effectiveUserId = req.body.userId || composioUserId;
      console.log('[Composio:routes]   -> userId from body:', req.body.userId);
      console.log('[Composio:routes]   -> composioUserId from env:', composioUserId);
      console.log('[Composio:routes]   -> effectiveUserId:', effectiveUserId);
      if (!effectiveUserId) {
        return res.status(400).json({ ok: false, error: 'userId is required. Set COMPOSIO_USER_ID in .env or send userId in body.' });
      }
      const connectionRequest = await authorizeToolkit(apiKey, effectiveUserId, req.params.slug);
      console.log('[Composio:routes]   -> redirectUrl present:', !!connectionRequest?.redirectUrl);
      console.log('[Composio:routes]   -> connectionId:', connectionRequest?.id);
      res.json({
        ok: true,
        redirectUrl: connectionRequest.redirectUrl,
        connectionId: connectionRequest.id,
        status: connectionRequest.status,
      });
    } catch (err) {
      console.error('[Composio:routes] POST /api/composio/apps/:slug/connect ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post('/api/composio/execute', express.json(), async (req, res) => {
    console.log('[Composio:routes] POST /api/composio/execute');
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const { actionName, connectedAccountId, params } = req.body;
      console.log('[Composio:routes]   -> actionName:', actionName);
      console.log('[Composio:routes]   -> connectedAccountId:', connectedAccountId);
      if (!actionName || !connectedAccountId) {
        return res.status(400).json({ ok: false, error: 'actionName and connectedAccountId are required' });
      }
      const result = await executeTool(apiKey, actionName, connectedAccountId, params || {});
      console.log('[Composio:routes]   -> execute result keys:', Object.keys(result || {}));
      res.json({ ok: true, result });
    } catch (err) {
      console.error('[Composio:routes] POST /api/composio/execute ERROR:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  console.log('[Composio:routes] All Composio routes registered successfully');
}

console.log('[Composio:routes] ===== MODULE EXPORTS READY =====');

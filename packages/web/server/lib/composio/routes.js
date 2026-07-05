console.log('[Composio:routes] ===== MODULE LOADED =====');

import {
  listToolkits,
  getToolkitBySlug,
  authorizeToolkit,
  listConnectedAccounts,
  getConnectedAccount,
  deleteConnectedAccount,
  executeTool,
} from './service.js';

export function registerComposioRoutes(app, composioApiKey) {
  console.log('[Composio:routes] registerComposioRoutes() called');
  console.log('[Composio:routes] composioApiKey present:', !!composioApiKey);
  if (composioApiKey && typeof composioApiKey === 'string') {
    console.log('[Composio:routes] composioApiKey first 8 chars:', composioApiKey.slice(0, 8) + '...');
    console.log('[Composio:routes] composioApiKey length:', composioApiKey.length);
  } else {
    console.warn('[Composio:routes] WARNING: No composioApiKey provided! Routes will fail with 500.');
  }

  function getApiKey() {
    if (!composioApiKey || typeof composioApiKey !== 'string' || composioApiKey.trim().length === 0) {
      console.error('[Composio:routes] ERROR: composioApiKey is empty/missing! Cannot proceed.');
      return null;
    }
    return composioApiKey.trim();
  }

  app.get('/api/composio/apps', async (req, res) => {
    console.log('[Composio:routes] GET /api/composio/apps');
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const { category, limit, cursor } = req.query;
      console.log('[Composio:routes]   -> query params:', { category, limit, cursor });
      const toolkits = await listToolkits(apiKey, { category, limit, cursor });
      console.log('[Composio:routes]   -> returning', toolkits.length, 'toolkits');
      res.json({ ok: true, items: toolkits });
    } catch (err) {
      console.error('[Composio:routes] GET /api/composio/apps ERROR:', err.message);
      console.error('[Composio:routes] Full error:', err);
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

  app.post('/api/composio/apps/:slug/connect', async (req, res) => {
    console.log('[Composio:routes] POST /api/composio/apps/:slug/connect', req.params.slug);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'Composio API key not configured' });
      }
      const { userId } = req.body;
      console.log('[Composio:routes]   -> userId:', userId);
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId is required' });
      }
      const connectionRequest = await authorizeToolkit(apiKey, userId, req.params.slug);
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

  app.post('/api/composio/execute', async (req, res) => {
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

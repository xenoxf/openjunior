import { Composio } from '@composio/core';

const DEFAULT_API_KEY = 'ak_cb7aSsToqkPtHH_cPv_V';

export function resolveApiKey() {
  if (typeof process.env.COMPOSIO_API_KEY === 'string' && process.env.COMPOSIO_API_KEY.trim().length > 0) {
    return process.env.COMPOSIO_API_KEY.trim();
  }
  return DEFAULT_API_KEY;
}

export function createComposioClient(apiKey) {
  return new Composio({ apiKey: apiKey || resolveApiKey() });
}

export async function listToolkits(apiKey, options = {}) {
  const client = createComposioClient(apiKey);
  const result = await client.toolkits.get({
    category: options.category || undefined,
    limit: options.limit || 50,
    cursor: options.cursor || undefined,
  });
  const items = result?.items || [];
  return items.map((tk) => ({
    id: tk.slug || tk.name,
    name: tk.name || tk.slug,
    description: tk.description || '',
    category: tk.category || 'tools',
    tags: tk.tags || [],
    authScheme: tk.authScheme || null,
    isManaged: tk.isManaged || false,
    meta: tk.meta || null,
  }));
}

export async function getToolkitBySlug(apiKey, slug) {
  const client = createComposioClient(apiKey);
  return client.toolkits.get(slug);
}

export async function authorizeToolkit(apiKey, userId, toolkitSlug) {
  const client = createComposioClient(apiKey);
  return client.toolkits.authorize(userId, toolkitSlug);
}

export async function listConnectedAccounts(apiKey, options = {}) {
  try {
    const client = createComposioClient(apiKey);
    const result = await client.connectedAccounts.list({
      userIds: options.userIds || undefined,
      toolkitSlugs: options.toolkitSlugs || undefined,
    });
    return Array.isArray(result) ? result : (result?.items || []);
  } catch (err) {
    console.error('[Composio] Failed to fetch connected accounts:', err.message);
    return [];
  }
}

export async function getConnectedAccount(apiKey, accountId) {
  const client = createComposioClient(apiKey);
  return client.connectedAccounts.get(accountId);
}

export async function deleteConnectedAccount(apiKey, accountId) {
  const client = createComposioClient(apiKey);
  return client.connectedAccounts.delete(accountId);
}

export async function listAuthConfigs(apiKey, options = {}) {
  try {
    const client = createComposioClient(apiKey);
    const result = await client.authConfigs.list({
      toolkit: options.toolkit || undefined,
    });
    return Array.isArray(result) ? result : (result?.items || []);
  } catch (err) {
    console.error('[Composio] Failed to fetch auth configs:', err.message);
    return [];
  }
}

export async function executeTool(apiKey, actionName, connectedAccountId, params) {
  const client = createComposioClient(apiKey);
  const result = await client.tools.execute(actionName, {
    connectedAccountId,
    arguments: params,
  });
  return result;
}

export async function waitForConnection(apiKey, connectedAccountId, timeout) {
  const client = createComposioClient(apiKey);
  return client.connectedAccounts.waitForConnection(connectedAccountId, timeout);
}

export { DEFAULT_API_KEY };

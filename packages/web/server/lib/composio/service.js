import { Composio } from '@composio/core';

console.log('[Composio:service] ===== MODULE LOADED =====');
console.log('[Composio:service] @composio/core version check - Composio class:', typeof Composio);
console.log('[Composio:service] NOTE: API key will NOT be hardcoded. Must be passed from settings.json');
console.log('[Composio:service] NOTE: process.env.COMPOSIO_API_KEY will NOT be used');

export function createComposioClient(apiKey) {
  console.log('[Composio:service] createComposioClient() called');
  console.log('[Composio:service]   -> apiKey param type:', typeof apiKey);
  console.log('[Composio:service]   -> apiKey present:', !!apiKey);
  if (apiKey && typeof apiKey === 'string') {
    console.log('[Composio:service]   -> apiKey first 8 chars:', apiKey.slice(0, 8) + '...');
    console.log('[Composio:service]   -> apiKey length:', apiKey.length);
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    console.error('[Composio:service] FATAL: No valid Composio API key provided.');
    console.error('[Composio:service] The API key MUST be configured in Settings > Connectors.');
    console.error('[Composio:service] It is stored in ~/.config/openjunior/settings.json as composioApiKey.');
    throw new Error(
      'Composio API key is not configured. '
      + 'Go to Settings > Connectors > Composio and enter your API key.'
    );
  }

  const trimmedKey = apiKey.trim();
  console.log('[Composio:service] Creating new Composio() SDK client...');

  let client;
  try {
    client = new Composio({ apiKey: trimmedKey });
    console.log('[Composio:service] Composio SDK client created SUCCESSFULLY');
  } catch (err) {
    console.error('[Composio:service] Failed to create Composio client:', err.message);
    throw err;
  }

  return client;
}

export async function listToolkits(apiKey, options = {}) {
  console.log('[Composio:service] listToolkits() called');
  console.log('[Composio:service]   -> options:', JSON.stringify(options));
  const client = createComposioClient(apiKey);
  const result = await client.toolkits.get({
    category: options.category || undefined,
    limit: 100,
    search: options.search || undefined,
  });
  const items = Array.isArray(result) ? result : (result?.items || []);
  console.log('[Composio:service]   -> items count from SDK:', items.length);
  const mapped = items.map((tk) => ({
    id: tk.slug || tk.name,
    slug: tk.slug || tk.name,
    name: tk.name || tk.slug,
    description: tk.meta?.description || '',
    logoUrl: tk.logoUrl || tk.logo || tk.meta?.logoUrl || tk.meta?.logo || null,
    category: tk.meta?.categories?.[0]?.name || tk.meta?.categories?.[0]?.slug || 'tools',
    tags: Array.isArray(tk.tags)
      ? tk.tags
      : (tk.meta?.categories?.length
        ? tk.meta.categories.map((c) => c.name || c.slug)
        : []
      ),
    meta: {
      toolsCount: tk.meta?.toolsCount ?? 0,
      triggersCount: tk.meta?.triggersCount ?? 0,
    },
    authScheme: Array.isArray(tk.authSchemes) ? tk.authSchemes[0] : (tk.authScheme || null),
    isManaged: tk.isLocalToolkit === true,
  }));
  console.log('[Composio:service] listToolkits() returning', mapped.length, 'items');
  return mapped;
}

export async function getToolkitBySlug(apiKey, slug) {
  console.log('[Composio:service] getToolkitBySlug() called');
  console.log('[Composio:service]   -> slug:', slug);
  const client = createComposioClient(apiKey);
  const result = await client.toolkits.get(slug);
  console.log('[Composio:service]   -> result:', result?.name || 'null');
  return result;
}

export async function authorizeToolkit(apiKey, userId, toolkitSlug) {
  console.log('[Composio:service] authorizeToolkit() called');
  console.log('[Composio:service]   -> userId:', userId, 'toolkitSlug:', toolkitSlug);

  // 1) get auth config for the toolkit via SDK
  console.log('[Composio:service]   -> fetching auth configs for toolkit...');
  const configs = await listAuthConfigs(apiKey, { toolkit: toolkitSlug });
  const authConfigId = configs?.[0]?.id;
  console.log('[Composio:service]   -> authConfigId:', authConfigId);

  if (!authConfigId) {
    throw new Error(`No auth config found for toolkit "${toolkitSlug}"`);
  }

  // 2) call v3 link endpoint directly (SDK uses /api/v3.1/connected_accounts which is deprecated for OAuth)
  const COMPOSIO_BASE = 'https://backend.composio.dev';
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  console.log('[Composio:service]   -> calling /api/v3/connected_accounts/link...');
  const linkRes = await fetch(`${COMPOSIO_BASE}/api/v3/connected_accounts/link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ auth_config_id: authConfigId, user_id: userId }),
  });

  if (!linkRes.ok) {
    const errBody = await linkRes.json().catch(() => ({}));
    console.error('[Composio:service]   -> link request failed:', linkRes.status, errBody);
    throw new Error(errBody?.error?.message || errBody?.message || `Link request failed with status ${linkRes.status}`);
  }

  const linkData = await linkRes.json();
  console.log('[Composio:service]   -> link result keys:', Object.keys(linkData || {}));
  console.log('[Composio:service]   -> redirectUrl present:', !!linkData?.redirectUrl);

  return {
    redirectUrl: linkData.redirect_url || linkData.redirectUrl,
    id: linkData.connected_account_id || linkData.id,
    status: linkData.status,
  };
}

export async function listConnectedAccounts(apiKey, options = {}) {
  console.log('[Composio:service] listConnectedAccounts() called');
  console.log('[Composio:service]   -> options:', JSON.stringify(options));
  try {
    const client = createComposioClient(apiKey);
    console.log('[Composio:service]   -> calling client.connectedAccounts.list()...');
    const result = await client.connectedAccounts.list({
      userIds: options.userIds || undefined,
      toolkitSlugs: options.toolkitSlugs || undefined,
    });
    const accounts = Array.isArray(result) ? result : (result?.items || []);
    console.log('[Composio:service]   -> connected accounts count:', accounts.length);
    const mapped = accounts.map((acct) => ({
      id: acct.id,
      status: acct.status || 'connected',
      userId: acct.userId || acct.user_id || '',
      toolkit: typeof acct.toolkit === 'object' && acct.toolkit !== null ? (acct.toolkit.slug || acct.toolkit.name || acct.toolkit.toolkit || '') : (acct.toolkit || ''),
      createdAt: acct.createdAt || acct.created_at,
    }));
    console.log('[Composio:service]   -> returning', mapped.length, 'mapped accounts');
    return mapped;
  } catch (err) {
    console.error('[Composio:service] Failed to fetch connected accounts:', err.message);
    console.error('[Composio:service] Full error:', err);
    return [];
  }
}

export async function getConnectedAccount(apiKey, accountId) {
  console.log('[Composio:service] getConnectedAccount() called');
  console.log('[Composio:service]   -> accountId:', accountId);
  const client = createComposioClient(apiKey);
  const result = await client.connectedAccounts.get(accountId);
  console.log('[Composio:service]   -> account:', result?.id || 'null');
  return result;
}

export async function deleteConnectedAccount(apiKey, accountId) {
  console.log('[Composio:service] deleteConnectedAccount() called');
  console.log('[Composio:service]   -> accountId:', accountId);
  const client = createComposioClient(apiKey);
  const result = await client.connectedAccounts.delete(accountId);
  console.log('[Composio:service]   -> delete result:', result);
  return result;
}

export async function listAuthConfigs(apiKey, options = {}) {
  console.log('[Composio:service] listAuthConfigs() called');
  console.log('[Composio:service]   -> options:', JSON.stringify(options));
  try {
    const client = createComposioClient(apiKey);
    const result = await client.authConfigs.list({
      toolkit_slug: options.toolkit || undefined,
    });
    const configs = Array.isArray(result) ? result : (result?.items || []);
    console.log('[Composio:service]   -> auth configs count:', configs.length);
    return configs;
  } catch (err) {
    console.error('[Composio:service] Failed to fetch auth configs:', err.message);
    return [];
  }
}

export async function executeTool(apiKey, actionName, connectedAccountId, params) {
  console.log('[Composio:service] executeTool() called');
  console.log('[Composio:service]   -> actionName:', actionName);
  console.log('[Composio:service]   -> connectedAccountId:', connectedAccountId);
  console.log('[Composio:service]   -> params keys:', Object.keys(params || {}));
  const client = createComposioClient(apiKey);
  const result = await client.tools.execute(actionName, {
    connectedAccountId,
    arguments: params,
  });
  console.log('[Composio:service]   -> execute result keys:', Object.keys(result || {}));
  return result;
}

export async function waitForConnection(apiKey, connectedAccountId, timeout) {
  console.log('[Composio:service] waitForConnection() called');
  console.log('[Composio:service]   -> connectedAccountId:', connectedAccountId);
  console.log('[Composio:service]   -> timeout:', timeout);
  const client = createComposioClient(apiKey);
  return client.connectedAccounts.waitForConnection(connectedAccountId, timeout);
}

console.log('[Composio:service] ===== MODULE EXPORTS READY =====');

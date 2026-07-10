import { createComposioClient } from './service.js';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_USER_ID = process.env.COMPOSIO_USER_ID;

if (!COMPOSIO_API_KEY) {
  console.error('[composio-mcp] FATAL: COMPOSIO_API_KEY not set');
  process.exit(1);
}

const client = createComposioClient(COMPOSIO_API_KEY);

async function getTools() {
  const accounts = await client.connectedAccounts.list({
    userIds: COMPOSIO_USER_ID ? [COMPOSIO_USER_ID] : undefined,
  });

  if (!accounts || accounts.length === 0) {
    return [];
  }

  const tools = [];

  for (const account of accounts) {
    const toolkit = account.toolkit || account.appName || account.app || 'unknown';
    const actions = account.actions || [];

    if (actions.length === 0) {
      continue;
    }

    for (const action of actions) {
      const actionName = action.name || action.actionName || action.key;
      if (!actionName) continue;

      const inputSchema = action.parameters || action.input_schema || {
        type: 'object',
        properties: {},
      };

      tools.push({
        name: `composio_${toolkit}_${actionName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        description: action.display_name || action.description || `Execute ${actionName} via ${toolkit}`,
        inputSchema: {
          type: 'object',
          properties: {
            ...(inputSchema.properties || {}),
            connectedAccountId: {
              type: 'string',
              description: 'Connected account ID',
            },
          },
          required: inputSchema.required || [],
        },
        _composio: {
          accountId: account.id,
          actionName,
          toolkit,
        },
      });
    }
  }

  return tools;
}

async function executeTool(name, args) {
  const accounts = await client.connectedAccounts.list({
    userIds: COMPOSIO_USER_ID ? [COMPOSIO_USER_ID] : undefined,
  });

  for (const account of accounts) {
    const toolkit = account.toolkit || account.appName || account.app || 'unknown';
    const actions = account.actions || [];

    for (const action of actions) {
      const actionName = action.name || action.actionName || action.key;
      if (!actionName) continue;

      const toolName = `composio_${toolkit}_${actionName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      if (toolName !== name) continue;

      const { connectedAccountId, ...params } = args;
      const acctId = connectedAccountId || account.id;

      const result = await client.tools.execute(actionName, {
        connectedAccountId: acctId,
        arguments: params,
      });

      return result;
    }
  }

  throw new Error(`Tool "${name}" not found`);
}

async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'tools/list': {
      const tools = await getTools();
      return { id, result: { tools } };
    }

    case 'tools/call': {
      const { name, arguments: args } = params;
      const result = await executeTool(name, args);
      const content = typeof result === 'string'
        ? result
        : JSON.stringify(result, null, 2);

      return {
        id,
        result: {
          content: [{ type: 'text', text: content }],
          isError: false,
        },
      };
    }

    default:
      return { id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const request = JSON.parse(trimmed);
      handleRequest(request).then((response) => {
        process.stdout.write(JSON.stringify(response) + '\n');
      }).catch((err) => {
        process.stdout.write(JSON.stringify({
          id: request.id,
          error: { code: -32603, message: err.message },
        }) + '\n');
      });
    } catch (err) {
      // skip invalid JSON
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

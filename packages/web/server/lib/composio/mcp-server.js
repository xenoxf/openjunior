#!/usr/bin/env node

import { Composio } from '@composio/core';

const API_KEY = process.env.COMPOSIO_API_KEY;
const USER_ID = process.env.COMPOSIO_USER_ID || 'default';

if (!API_KEY) {
  console.error(JSON.stringify({ error: 'COMPOSIO_API_KEY not set' }));
  process.exit(1);
}

const client = new Composio({ apiKey: API_KEY });

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}

async function listTools() {
  const accounts = await client.connectedAccounts.list({
    userIds: [USER_ID],
  });

  const tools = [];
  const seen = new Set();

  for (const acct of (accounts || [])) {
    const toolkitName = acct.appName || acct.toolkit || acct.app || 'unknown';
    const actions = acct.actions || [];

    for (const action of (actions || [])) {
      const actionName = action.name || action.actionName || action.key;
      if (!actionName) continue;

      const name = `composio_${toolkitName}_${actionName}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);

      tools.push({
        name,
        description: action.display_name || action.description || `${toolkitName}: ${actionName}`,
        inputSchema: action.parameters?.type === 'object' ? action.parameters : {
          type: 'object',
          properties: {},
        },
      });
    }
  }

  return tools;
}

async function callTool(name, args) {
  try {
    const accounts = await client.connectedAccounts.list({
      userIds: [USER_ID],
    });

    for (const acct of (accounts || [])) {
      const toolkitName = acct.appName || acct.toolkit || acct.app || 'unknown';
      const actions = acct.actions || [];

      for (const action of (actions || [])) {
        const actionName = action.name || action.actionName || action.key;
        if (!actionName) continue;

        const expected = `composio_${toolkitName}_${actionName}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        if (expected !== name) continue;

        const result = await client.tools.execute(actionName, {
          connectedAccountId: acct.id,
          arguments: args || {},
        });

        return JSON.stringify(result, null, 2);
      }
    }

    throw new Error(`No connected account found for tool "${name}"`);
  } catch (err) {
    throw new Error(`Failed to execute ${name}: ${err.message}`);
  }
}

let buffer = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const req = JSON.parse(trimmed);
      const { id, method, params } = req;

      if (method === 'tools/list') {
        listTools().then(
          (tools) => sendResponse(id, { tools }),
          (err) => sendError(id, -32603, err.message),
        );
      } else if (method === 'tools/call') {
        callTool(params.name, params.arguments).then(
          (text) => sendResponse(id, { content: [{ type: 'text', text }] }),
          (err) => sendError(id, -32603, err.message),
        );
      } else if (method === 'ping') {
        sendResponse(id, {});
      } else if (method === 'initialize') {
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'composio-mcp', version: '1.0.0' },
        });
      } else if (method === 'notifications/initialized' || method === 'notifications/') {
        // ignore notifications
      } else if (method && method.startsWith('notifications/')) {
        // ignore all notifications
      } else {
        sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (err) {
      // skip invalid JSON lines
    }
  }
});

process.stdin.on('end', () => process.exit(0));

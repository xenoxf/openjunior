import {
  intro as clackIntro, outro as clackOutro,
  text as clackText, cancel as clackCancel,
  isCancel as clackIsCancel,
  isJsonMode,
  shouldRenderHumanOutput,
  canPrompt,
  printJson,
  logStatus,
} from './cli-output.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('[Composio:CLI] ===== MODULE LOADED =====');

const SETTINGS_FILE_PATH = path.join(
  process.env.OPENJUNIOR_DATA_DIR
    ? path.resolve(process.env.OPENJUNIOR_DATA_DIR)
    : path.join(os.homedir(), '.config', 'openjunior'),
  'settings.json'
);

function readSetting(key) {
  try {
    console.log('[Composio:CLI] Reading settings from:', SETTINGS_FILE_PATH);
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      console.log('[Composio:CLI] settings.json does not exist at:', SETTINGS_FILE_PATH);
      return null;
    }
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    const settings = JSON.parse(raw);
    const value = settings && typeof settings === 'object' ? settings[key] : undefined;
    console.log('[Composio:CLI] Setting', key, 'present:', !!value);
    return value || null;
  } catch (err) {
    console.log('[Composio:CLI] Error reading settings.json:', err.message);
    return null;
  }
}

function resolveApiKey() {
  console.log('[Composio:CLI] resolveApiKey() called');
  console.log('[Composio:CLI] Will read from settings.json (NOT process.env, NOT hardcoded)');

  const fromSettings = readSetting('composioApiKey');
  if (fromSettings && typeof fromSettings === 'string' && fromSettings.trim().length > 0) {
    console.log('[Composio:CLI] API key resolved from settings.json');
    return fromSettings.trim();
  }

  console.error('[Composio:CLI] ERROR: Composio API key not found in settings.json!');
  console.error('[Composio:CLI] Configure it via Settings > Connectors > Composio in the UI');
  console.error('[Composio:CLI] Or run OpenJunior web server and set it in settings');
  throw new Error(
    'Composio API key is not configured. '
    + 'Go to Settings > Connectors > Composio and enter your API key.'
    + '\nSettings file location: ' + SETTINGS_FILE_PATH
  );
}

function maskToolkitName(name) {
  if (!name || name.length < 10) return name || 'unknown';
  return name.slice(0, 20) + '...';
}

export function showComposioHelp() {
  const help = `
 Composio Integration Manager

 USAGE:
   openjunior composio <SUBCOMMAND> [OPTIONS]

 SUBCOMMANDS:
   list          List available apps/integrations
   connect       Connect an app
   status        Show connected accounts
   help          Show this help

 OPTIONS:
   --json        Output machine-readable JSON
   -q, --quiet   Suppress non-essential output
   -h, --help    Show help

 SETTINGS:
   API key is read from ~/.config/openjunior/settings.json (composioApiKey).
   Configure it via Settings > Connectors > Composio in the OpenJunior UI.

 EXAMPLES:
   openjunior composio list
   openjunior composio list --json
   openjunior composio connect github
   openjunior composio status
`;
  console.log(help);
}

async function handleList(options) {
  console.log('[Composio:CLI] handleList() called');
  const apiKey = resolveApiKey();
  console.log('[Composio:CLI] API key resolved OK');
  try {
    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
      console.log('[Composio:CLI] @composio/core imported successfully');
    } catch {
      console.error('[Composio:CLI] @composio/core not found');
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      if (isJsonMode(options)) {
        printJson({ status: 'error', error: '@composio/core not found' });
      }
      return;
    }

    console.log('[Composio:CLI] Creating Composio client...');
    const client = new composio({ apiKey });
    console.log('[Composio:CLI] Calling client.toolkits.get({ limit: 50 })...');
    const result = await client.toolkits.get({ limit: 50 });
    const items = result?.items || [];
    console.log('[Composio:CLI] Items received:', items.length);

    if (isJsonMode(options)) {
      printJson({
        status: 'ok',
        total: items.length,
        items: items.map((tk) => ({
          id: tk.slug || tk.name,
          name: tk.name,
          description: tk.description,
          category: tk.category,
          authSchemes: tk.authScheme ? [tk.authScheme] : [],
        })),
      });
      return;
    }

    if (shouldRenderHumanOutput(options)) {
      clackIntro('Composio Apps');
      if (items.length === 0) {
        logStatus('info', 'No apps found');
      } else {
        for (const tk of items.slice(0, 20)) {
          console.log(`  ${tk.name} (${tk.slug || ''})`);
          if (tk.description) console.log(`    ${tk.description}`);
          console.log('');
        }
        if (items.length > 20) {
          logStatus('info', `... and ${items.length - 20} more`);
        }
        logStatus('success', `Found ${items.length} apps`);
      }
      clackOutro('List complete');
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[Composio:CLI] handleList ERROR:', message);
    console.error('[Composio:CLI] Full error:', err);
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to list apps: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

async function handleConnect(options) {
  console.log('[Composio:CLI] handleConnect() called');
  const toolkitSlug = options.composioAction === 'connect'
    ? (options.composioArgs?.[0] || null)
    : null;

  if (!toolkitSlug && canPrompt(options)) {
    const result = await clackText({
      message: 'Enter app slug to connect (e.g. github, slack, linear)',
      placeholder: 'github',
      validate: (value) => {
        if (!(value || '').trim()) return 'App slug is required';
        return undefined;
      },
    });
    if (clackIsCancel(result)) {
      clackCancel('Connect cancelled.');
      return;
    }
    options._toolkitSlug = result.trim();
  } else if (toolkitSlug) {
    options._toolkitSlug = toolkitSlug;
  } else {
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', 'App slug is required. Usage: openjunior composio connect <app>');
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: 'App slug required' });
    }
    return;
  }

  const slug = options._toolkitSlug;
  console.log('[Composio:CLI] Connecting to:', slug);

  try {
    if (shouldRenderHumanOutput(options)) {
      clackIntro(`Connecting ${slug}`);
    }

    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
    } catch {
      console.error('[Composio:CLI] @composio/core not found');
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      return;
    }

    const apiKey = resolveApiKey();
    console.log('[Composio:CLI] Creating client for connect...');
    const client = new composio({ apiKey });
    console.log('[Composio:CLI] Calling client.toolkits.authorize("default", slug)...');
    const connectionRequest = await client.toolkits.authorize('default', slug);
    console.log('[Composio:CLI] Connection request redirectUrl:', !!connectionRequest?.redirectUrl);
    console.log('[Composio:CLI] Connection request id:', connectionRequest?.id);

    if (shouldRenderHumanOutput(options)) {
      if (connectionRequest?.redirectUrl) {
        logStatus('success', `Connection initiated for ${slug}`);
        logStatus('info', `Open this URL to authenticate: ${connectionRequest.redirectUrl}`);
        logStatus('info', 'After authentication, the integration will be available.');
      } else {
        logStatus('warning', `Connection request sent for ${slug}. Check Composio dashboard.`);
      }
      clackOutro('Connect complete');
    }

    if (isJsonMode(options)) {
      printJson({
        status: 'ok',
        app: slug,
        redirectUrl: connectionRequest?.redirectUrl || null,
        connectionId: connectionRequest?.id || null,
      });
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[Composio:CLI] handleConnect ERROR:', message);
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to connect ${slug}: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

async function handleStatus(options) {
  console.log('[Composio:CLI] handleStatus() called');
  const apiKey = resolveApiKey();
  console.log('[Composio:CLI] API key resolved OK');

  try {
    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
    } catch {
      console.error('[Composio:CLI] @composio/core not found');
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      return;
    }

    console.log('[Composio:CLI] Creating client for status...');
    const client = new composio({ apiKey });
    console.log('[Composio:CLI] Calling client.connectedAccounts.list()...');
    const result = await client.connectedAccounts.list();
    const accounts = Array.isArray(result) ? result : (result?.items || []);
    console.log('[Composio:CLI] Connected accounts count:', accounts.length);

    if (shouldRenderHumanOutput(options)) {
      clackIntro('Composio Status');
      logStatus('success', `API key: read from settings.json (not env, not hardcoded)`);
      logStatus('success', `${accounts.length} connected account(s)`);
      for (const acct of accounts.slice(0, 10)) {
        const toolkit = acct.toolkit || acct.toolkitName || 'unknown';
        console.log(`  - ${toolkit}: ${acct.status || 'active'}`);
      }
      if (accounts.length > 10) {
        logStatus('info', `... and ${accounts.length - 10} more`);
      }
      clackOutro('Status check complete');
    }

    if (isJsonMode(options)) {
      printJson({
        status: 'ok',
        apiKeyConfigured: true,
        envKeyConfigured: false,
        connectedAccounts: accounts.map((a) => ({
          id: a.id,
          toolkit: a.toolkit || a.toolkitName || 'unknown',
          status: a.status || 'active',
        })),
      });
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error('[Composio:CLI] handleStatus ERROR:', message);
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to check status: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

export async function runComposioCommand(options) {
  console.log('[Composio:CLI] runComposioCommand() called with action:', options.composioAction);
  const action = options.composioAction || 'help';

  switch (action) {
    case 'list':
      await handleList(options);
      break;
    case 'connect':
      await handleConnect(options);
      break;
    case 'status':
      await handleStatus(options);
      break;
    case 'help':
    default:
      showComposioHelp();
      break;
  }
  console.log('[Composio:CLI] ===== COMMAND FINISHED =====');
}

console.log('[Composio:CLI] ===== MODULE EXPORTS READY =====');

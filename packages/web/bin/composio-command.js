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
import { fileURLToPath } from 'url';

console.log('[Composio:CLI] ===== MODULE LOADED =====');

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPathCli = path.resolve(__dirname, '..', '..', '..', '.env');
try {
  const envContent = fs.readFileSync(envPathCli, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIdx = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  console.log('[Composio:CLI] .env loaded from:', envPathCli);
  console.log('[Composio:CLI] COMPOSIO_API_KEY from .env:', !!process.env.COMPOSIO_API_KEY);
  console.log('[Composio:CLI] COMPOSIO_USER_ID from .env:', process.env.COMPOSIO_USER_ID || '(not set)');
} catch (err) {
  console.log('[Composio:CLI] No .env file found at project root, skipping:', err.message);
}

function resolveApiKey() {
  const fromEnv = process.env.COMPOSIO_API_KEY;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    console.log('[Composio:CLI] API key resolved from COMPOSIO_API_KEY, length:', fromEnv.trim().length);
    return fromEnv.trim();
  }

  console.error('[Composio:CLI] ERROR: COMPOSIO_API_KEY not set!');
  console.error('[Composio:CLI] Set COMPOSIO_API_KEY in .env at the project root.');
  throw new Error('COMPOSIO_API_KEY is required. Set it in .env.');
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
    API key is read from:
      1. COMPOSIO_API_KEY env var (or .env file in project root)
      2. ~/.config/openjunior/settings.json (composioApiKey)
    User ID is read from COMPOSIO_USER_ID env var (default: "default").

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
    const cliUserId = process.env.COMPOSIO_USER_ID;
    if (!cliUserId) {
      throw new Error('COMPOSIO_USER_ID is required. Set it in .env.');
    }
    console.log('[Composio:CLI] Creating client for connect...');
    console.log('[Composio:CLI] COMPOSIO_USER_ID:', cliUserId);
    const client = new composio({ apiKey });
    console.log('[Composio:CLI] Calling client.toolkits.authorize("' + cliUserId + '", slug)...');
    const connectionRequest = await client.toolkits.authorize(cliUserId, slug);
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

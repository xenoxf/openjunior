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

const DEFAULT_API_KEY = 'ak_cb7aSsToqkPtHH_cPv_V';

function resolveApiKey() {
  if (typeof process.env.COMPOSIO_API_KEY === 'string' && process.env.COMPOSIO_API_KEY.trim().length > 0) {
    return process.env.COMPOSIO_API_KEY.trim();
  }
  return DEFAULT_API_KEY;
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

 ENVIRONMENT:
   COMPOSIO_API_KEY    Override the default Composio API key

 EXAMPLES:
   openjunior composio list
   openjunior composio list --json
   openjunior composio connect github
   openjunior composio status
`;
  console.log(help);
}

async function handleList(options) {
  const apiKey = resolveApiKey();
  try {
    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
    } catch {
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      if (isJsonMode(options)) {
        printJson({ status: 'error', error: '@composio/core not found' });
      }
      return;
    }

    const client = new composio({ apiKey });
    const result = await client.toolkits.get({ limit: 50 });
    const items = result?.items || [];

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
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to list apps: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

async function handleConnect(options) {
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

  try {
    if (shouldRenderHumanOutput(options)) {
      clackIntro(`Connecting ${slug}`);
    }

    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
    } catch {
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      return;
    }

    const apiKey = resolveApiKey();
    const client = new composio({ apiKey });
    const connectionRequest = await client.toolkits.authorize('default', slug);

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
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to connect ${slug}: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

async function handleStatus(options) {
  const apiKey = resolveApiKey();
  const envKeySet = !!process.env.COMPOSIO_API_KEY;

  try {
    let composio;
    try {
      const mod = await import('@composio/core');
      composio = mod.Composio;
    } catch {
      if (shouldRenderHumanOutput(options)) {
        logStatus('error', '@composio/core not found. Run the OpenJunior web server first.');
      }
      return;
    }

    const client = new composio({ apiKey });
    const result = await client.connectedAccounts.list();
    const accounts = Array.isArray(result) ? result : (result?.items || []);

    if (shouldRenderHumanOutput(options)) {
      clackIntro('Composio Status');
      logStatus('success', `API key configured: ${envKeySet ? 'env override' : 'default key'}`);
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
        envKeyConfigured: envKeySet,
        connectedAccounts: accounts.map((a) => ({
          id: a.id,
          toolkit: a.toolkit || a.toolkitName || 'unknown',
          status: a.status || 'active',
        })),
      });
    }
  } catch (err) {
    const message = err?.message || String(err);
    if (shouldRenderHumanOutput(options)) {
      logStatus('error', `Failed to check status: ${message}`);
    }
    if (isJsonMode(options)) {
      printJson({ status: 'error', error: message });
    }
  }
}

export async function runComposioCommand(options) {
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
}

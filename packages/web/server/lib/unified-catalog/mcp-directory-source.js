/**
 * Unified Catalog — MCP Directory Source
 *
 * Fetches MCP server definitions from curated public lists.
 * Sources: awesome-mcp-servers (GitHub raw), modelcontextprotocol/servers.
 */

import { registerSource, generateGlobalId } from './sources.js';

const AWESOME_MCP_RAW_URL = 'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md';
const MCP_PROTOCOL_SERVERS_URL = 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md';
const FETCH_TIMEOUT = 15000;

// Well-known MCP servers with pre-defined configs
const KNOWN_MCP_SERVERS = [
  {
    name: 'GitHub',
    description: 'Access repositories, issues, pull requests, and code search via GitHub API.',
    npm: '@modelcontextprotocol/server-github',
    category: 'tools',
    tags: ['git', 'code', 'repositories', 'github'],
    official: true,
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: { label: 'Personal Access Token', type: 'password', required: true } },
  },
  {
    name: 'Filesystem',
    description: 'Read, write, and manage files on your local system.',
    npm: '@modelcontextprotocol/server-filesystem',
    category: 'files',
    tags: ['files', 'read', 'write', 'local'],
    official: true,
    env: { path: { label: 'Allowed directory', type: 'text', required: true, placeholder: '/home/user/documents' } },
  },
  {
    name: 'Brave Search',
    description: 'Search the web using Brave Search API.',
    npm: '@modelcontextprotocol/server-brave-search',
    category: 'tools',
    tags: ['search', 'web', 'internet'],
    official: true,
    env: { BRAVE_API_KEY: { label: 'API Key', type: 'password', required: true } },
  },
  {
    name: 'PostgreSQL',
    description: 'Query and manage PostgreSQL databases.',
    npm: '@modelcontextprotocol/server-postgres',
    category: 'files',
    tags: ['database', 'sql', 'postgres'],
    official: true,
    env: { DATABASE_URL: { label: 'Connection URL', type: 'text', required: true, placeholder: 'postgresql://user:pass@localhost:5432/db' } },
  },
  {
    name: 'Slack',
    description: 'Read and send messages in Slack channels.',
    npm: '@modelcontextprotocol/server-slack',
    category: 'chat',
    tags: ['messaging', 'communication', 'channels', 'slack'],
    official: true,
    env: {
      SLACK_BOT_TOKEN: { label: 'Bot Token', type: 'password', required: true },
      SLACK_TEAM_ID: { label: 'Team ID', type: 'text', required: true },
    },
  },
  {
    name: 'Linear',
    description: 'Manage issues, projects, and team workflows in Linear.',
    npm: '@modelcontextprotocol/server-linear',
    category: 'services',
    tags: ['project management', 'issues', 'tasks', 'linear'],
    official: true,
    env: { LINEAR_API_KEY: { label: 'API Key', type: 'password', required: true } },
  },
  {
    name: 'Notion',
    description: 'Read and write Notion pages and databases.',
    npm: '@modelcontextprotocol/server-notion',
    category: 'files',
    tags: ['notes', 'documentation', 'databases', 'notion'],
    official: true,
    env: { NOTION_API_KEY: { label: 'Integration Token', type: 'password', required: true } },
  },
  {
    name: 'Google Drive',
    description: 'Access and manage files in Google Drive.',
    npm: '@modelcontextprotocol/server-gdrive',
    category: 'services',
    tags: ['google', 'cloud', 'files', 'storage'],
    official: true,
    env: {
      GOOGLE_CLIENT_ID: { label: 'Client ID', type: 'text', required: true },
      GOOGLE_CLIENT_SECRET: { label: 'Client Secret', type: 'password', required: true },
    },
  },
  {
    name: 'Memory',
    description: 'Persistent memory and knowledge graph for AI assistants.',
    npm: '@modelcontextprotocol/server-memory',
    category: 'agents',
    tags: ['memory', 'knowledge', 'graph', 'persistent'],
    official: true,
    env: {},
  },
  {
    name: 'Puppeteer',
    description: 'Browser automation and web scraping with Puppeteer.',
    npm: '@modelcontextprotocol/server-puppeteer',
    category: 'tools',
    tags: ['browser', 'automation', 'scraping', 'web'],
    official: true,
    env: {},
  },
  {
    name: 'Fetch',
    description: 'Make HTTP requests and fetch web content.',
    npm: '@modelcontextprotocol/server-fetch',
    category: 'tools',
    tags: ['http', 'fetch', 'web', 'api'],
    official: true,
    env: {},
  },
  {
    name: 'SQLite',
    description: 'Query and manage SQLite databases.',
    npm: '@modelcontextprotocol/server-sqlite',
    category: 'files',
    tags: ['database', 'sql', 'sqlite', 'local'],
    official: true,
    env: { DB_PATH: { label: 'Database path', type: 'text', required: true, placeholder: '/path/to/database.db' } },
  },
  {
    name: 'Google Maps',
    description: 'Access Google Maps APIs for directions, places, and geocoding.',
    npm: '@modelcontextprotocol/server-google-maps',
    category: 'services',
    tags: ['maps', 'geocoding', 'directions', 'google'],
    official: true,
    env: { GOOGLE_MAPS_API_KEY: { label: 'API Key', type: 'password', required: true } },
  },
  {
    name: 'Microsoft 365',
    description: 'Access Outlook, OneDrive, and Office documents.',
    npm: '@modelcontextprotocol/server-ms365',
    category: 'services',
    tags: ['microsoft', 'outlook', 'onedrive', 'office'],
    official: true,
    env: {
      MS_CLIENT_ID: { label: 'Application (client) ID', type: 'text', required: true },
      MS_CLIENT_SECRET: { label: 'Client Secret', type: 'password', required: true },
      MS_TENANT_ID: { label: 'Directory (tenant) ID', type: 'text', required: true },
    },
  },
  {
    name: 'Sentry',
    description: 'Access Sentry error tracking and issue management.',
    npm: '@modelcontextprotocol/server-sentry',
    category: 'tools',
    tags: ['errors', 'monitoring', 'sentry', 'debugging'],
    official: false,
    env: { SENTRY_AUTH_TOKEN: { label: 'Auth Token', type: 'password', required: true } },
  },
  {
    name: 'Cloudflare',
    description: 'Manage Cloudflare Workers, KV, and DNS.',
    npm: '@modelcontextprotocol/server-cloudflare',
    category: 'services',
    tags: ['cloudflare', 'dns', 'workers', 'cdn'],
    official: false,
    env: {
      CLOUDFLARE_API_TOKEN: { label: 'API Token', type: 'password', required: true },
      CLOUDFLARE_ACCOUNT_ID: { label: 'Account ID', type: 'text', required: true },
    },
  },
];

function normalizeKnownMcp(server) {
  const popularity = server.official ? 85 : 60;
  const configFields = Object.entries(server.env || {}).map(([key, field]) => ({
    key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    description: field.description,
  }));

  return {
    id: generateGlobalId('mcp-directory', server.npm),
    type: 'mcp',
    name: server.name,
    description: server.description,
    longDescription: server.description,
    source: 'mcp-directory',
    sourceId: server.npm,
    category: server.category,
    tags: server.tags,
    popularity,
    version: undefined,
    author: server.official ? 'Model Context Protocol' : '',
    official: server.official,
    installConfig: {
      type: 'mcp',
      command: ['npx', '-y', server.npm],
      env: Object.fromEntries(Object.entries(server.env || {}).map(([k]) => [k, ''])),
    },
    setupGuideUrl: `https://www.npmjs.com/package/${server.npm}`,
    installSteps: [
      `Install ${server.name} MCP server`,
      ...configFields.map((f) => `Configure ${f.label}`),
      'Connect the server from the MCP settings',
    ],
    configFields,
  };
}

async function parseAwesomeMcpServers() {
  try {
    const response = await fetch(AWESOME_MCP_RAW_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!response.ok) return [];

    const text = await response.text();
    const items = [];

    // Parse markdown list items with links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const lines = text.split('\n');

    for (const line of lines) {
      if (!line.startsWith('- ') && !line.startsWith('  ')) continue;

      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const name = match[1];
        const url = match[2];

        // Skip non-MCP links
        if (!url.includes('github.com') && !url.includes('npmjs.com')) continue;
        if (name.length < 3 || name.length > 80) continue;

        // Extract description after the link
        const afterLink = line.slice(match.index + match[0].length).trim();
        const description = afterLink.replace(/^[-:]\s*/, '').slice(0, 200);

        // Guess npm package from GitHub URL
        let npm = '';
        const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (githubMatch) {
          npm = `${githubMatch[1]}/${githubMatch[2]}`;
        }

        items.push({
          id: generateGlobalId('mcp-directory', `awesome-${name.toLowerCase().replace(/\s+/g, '-')}`),
          type: 'mcp',
          name,
          description: description || `MCP server: ${name}`,
          longDescription: description,
          source: 'mcp-directory',
          sourceId: npm || name.toLowerCase().replace(/\s+/g, '-'),
          category: 'tools',
          tags: ['mcp', 'awesome'],
          popularity: 50,
          version: undefined,
          author: githubMatch?.[1] || '',
          official: false,
          installConfig: {
            type: 'mcp',
            repo: githubMatch ? `${githubMatch[1]}/${githubMatch[2]}` : undefined,
          },
          setupGuideUrl: url,
          installSteps: [`Install ${name} from the awesome-mcp-servers list`],
        });
      }
    }

    return items.slice(0, 100); // Cap at 100 items from awesome list
  } catch {
    return [];
  }
}

registerSource({
  id: 'mcp-directory',
  label: 'MCP Directory',
  enabled: true,

  async fetchItems({ query, category }) {
    // Start with well-known MCP servers
    let items = KNOWN_MCP_SERVERS.map(normalizeKnownMcp);

    // Try to augment with awesome-mcp-servers list
    const awesomeItems = await parseAwesomeMcpServers();
    const seen = new Set(items.map((i) => i.sourceId));
    for (const item of awesomeItems) {
      if (!seen.has(item.sourceId)) {
        seen.add(item.sourceId);
        items.push(item);
      }
    }

    // Apply filters
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    return { items, nextCursor: null };
  },

  async fetchItem(sourceId) {
    // Check well-known servers first
    const known = KNOWN_MCP_SERVERS.find((s) => s.npm === sourceId);
    if (known) return normalizeKnownMcp(known);
    return null;
  },
});

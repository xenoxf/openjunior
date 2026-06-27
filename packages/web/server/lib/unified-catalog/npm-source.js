/**
 * Unified Catalog — npm Source
 *
 * Fetches OpenCode plugins from the npm registry.
 * Searches for packages matching common plugin naming patterns.
 */

import { registerSource, generateGlobalId } from './sources.js';

const NPM_SEARCH_API = 'https://registry.npmjs.org/-/v1/search';
const NPM_PAGE_LIMIT = 25;
const NPM_REQUEST_TIMEOUT = 10000;

// Search queries that find relevant OpenCode/MCP plugins
const PLUGIN_SEARCH_QUERIES = [
  'opencode-plugin',
  'opencode-wakatime',
  'mcp-server',
  '@modelcontextprotocol/server',
];

function normalizeNpmPackage(pkg) {
  const name = pkg.package?.name || '';
  const displayName = pkg.package?.links?.npm
    ? name.replace(/^@[^/]+\//, '')
    : name;
  const description = pkg.package?.description || '';
  const version = pkg.package?.version || '';
  const author = typeof pkg.package?.author === 'string'
    ? pkg.package.author
    : pkg.package?.author?.name || '';
  const keywords = pkg.package?.keywords || [];
  const date = pkg.package?.date || '';
  const scope = pkg.package?.scope || '';

  // Determine type from name/keywords
  let type = 'plugin';
  const nameLower = name.toLowerCase();
  const keywordsStr = keywords.join(' ').toLowerCase();
  if (nameLower.includes('mcp') || keywordsStr.includes('mcp')) {
    type = 'mcp';
  }

  // Category
  let category = 'tools';
  if (keywordsStr.includes('database') || keywordsStr.includes('sql')) category = 'files';
  else if (keywordsStr.includes('chat') || keywordsStr.includes('slack')) category = 'chat';
  else if (keywordsStr.includes('ai') || keywordsStr.includes('agent')) category = 'agents';
  else if (keywordsStr.includes('search') || keywordsStr.includes('web')) category = 'tools';

  // Popularity from score
  const score = pkg.score?.detail?.quality || 0;
  const popularity = Math.min(100, Math.round(score * 100));

  // Collect scores for better ranking
  const qualityScore = pkg.score?.detail?.quality || 0;
  const maintenanceScore = pkg.score?.detail?.maintenance || 0;
  const adjustedPopularity = Math.min(100, Math.round(
    (qualityScore * 40) + (maintenanceScore * 30) + (popularity * 0.3)
  ));

  const tags = keywords.slice(0, 8);

  return {
    id: generateGlobalId('npm', name),
    type,
    name: displayName || name,
    description: description.slice(0, 200),
    longDescription: description,
    source: 'npm',
    sourceId: name,
    category,
    tags,
    popularity: adjustedPopularity,
    version,
    author: author || scope.replace('@', ''),
    official: name.startsWith('@modelcontextprotocol/'),
    installConfig: {
      type,
      spec: name,
    },
    setupGuideUrl: `https://www.npmjs.com/package/${name}`,
    installSteps: [
      `Install ${name} via the plugin system`,
      'Configure the plugin in your OpenCode settings',
    ],
  };
}

async function searchNpm(query, cursor) {
  const page = cursor ? parseInt(cursor, 10) || 1 : 1;
  const size = NPM_PAGE_LIMIT;
  const from = (page - 1) * size;

  const searchQuery = query || PLUGIN_SEARCH_QUERIES[0];
  const url = `${NPM_SEARCH_API}?text=${encodeURIComponent(searchQuery)}&size=${size}&from=${from}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(NPM_REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    return { items: [], nextCursor: null };
  }

  const data = await response.json();
  const items = (data.objects || []).map(normalizeNpmPackage);

  // Calculate next page
  const total = data.total || 0;
  const nextCursor = from + size < total ? String(page + 1) : null;

  return { items, nextCursor };
}

registerSource({
  id: 'npm',
  label: 'npm',
  enabled: true,

  async fetchItems({ query, cursor }) {
    if (query) {
      return searchNpm(query, cursor);
    }

    // Without query, fetch from multiple search terms and merge
    const results = await Promise.allSettled(
      PLUGIN_SEARCH_QUERIES.slice(0, 2).map((q) => searchNpm(q, null))
    );

    const allItems = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const item of result.value.items) {
          if (!seen.has(item.sourceId)) {
            seen.add(item.sourceId);
            allItems.push(item);
          }
        }
      }
    }

    // Sort by popularity
    allItems.sort((a, b) => b.popularity - a.popularity);

    return { items: allItems, nextCursor: null };
  },

  async fetchItem(name) {
    try {
      const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(NPM_REQUEST_TIMEOUT),
      });

      if (!response.ok) return null;

      const pkg = await response.json();
      const latest = pkg['dist-tags']?.latest;
      if (!latest) return null;

      const versionData = pkg.versions?.[latest];
      return normalizeNpmPackage({
        package: {
          name: pkg.name,
          version: latest,
          description: pkg.description,
          author: pkg.author,
          keywords: pkg.keywords,
          date: pkg.time?.[latest],
          links: { npm: `https://www.npmjs.com/package/${pkg.name}` },
          scope: pkg.name.startsWith('@') ? pkg.name.split('/')[0] : '',
        },
        score: { detail: { quality: 0.5, maintenance: 0.5 } },
      });
    } catch {
      return null;
    }
  },
});

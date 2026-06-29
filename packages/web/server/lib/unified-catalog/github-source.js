/**
 * Unified Catalog — GitHub Source
 *
 * Fetches skills and MCPs from GitHub repositories.
 * Uses the GitHub Search API to find repos with SKILL.md files
 * and MCP server implementations.
 */

import { registerSource, generateGlobalId } from './sources.js';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_PAGE_LIMIT = 30;

// Curated repos that are known to contain skills or MCPs
const CURATED_REPOS = [
  { owner: 'anthropics', repo: 'skills', type: 'skill', category: 'agents', official: true },
];

async function githubFetch(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'OpenJunior/1.0',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 403 || response.status === 429) {
    // Rate limited — return empty rather than crashing
    return null;
  }

  return response;
}

function normalizeGitHubRepo(repo) {
  const fullName = repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}`;
  const description = repo.description || '';
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const language = repo.language || '';
  const topics = repo.topics || [];
  const updatedAt = repo.updated_at || '';
  const url = repo.html_url || '';

  // Determine type from topics or description
  let type = 'skill';
  const descLower = description.toLowerCase();
  const topicsStr = topics.join(' ').toLowerCase();
  if (topicsStr.includes('mcp') || descLower.includes('mcp server') || descLower.includes('model context protocol')) {
    type = 'mcp';
  }

  // Normalize popularity to 0-100
  const popularity = Math.min(100, Math.round(
    (Math.log10(stars + 1) * 15) + (Math.log10(forks + 1) * 5)
  ));

  // Determine category from topics
  let category = 'tools';
  if (topicsStr.includes('database') || topicsStr.includes('sql')) category = 'files';
  else if (topicsStr.includes('communication') || topicsStr.includes('slack') || topicsStr.includes('chat')) category = 'chat';
  else if (topicsStr.includes('ai') || topicsStr.includes('agent')) category = 'agents';
  else if (topicsStr.includes('search') || topicsStr.includes('web')) category = 'tools';
  else if (topicsStr.includes('productivity') || topicsStr.includes('notion') || topicsStr.includes('linear')) category = 'services';

  const tags = topics.slice(0, 8);
  if (language && !tags.includes(language.toLowerCase())) tags.push(language.toLowerCase());

  return {
    id: generateGlobalId('github', fullName),
    type,
    name: repo.name || fullName.split('/').pop(),
    description: description.slice(0, 200),
    longDescription: description,
    source: 'github',
    sourceId: fullName,
    category,
    tags,
    popularity,
    version: undefined,
    author: repo.owner?.login || '',
    official: CURATED_REPOS.some((r) => r.owner === repo.owner?.login && r.repo === repo.name),
    installConfig: {
      type,
      repo: fullName,
    },
    setupGuideUrl: url,
    installSteps: [
      `Clone or add ${fullName} as a source`,
      'Browse available skills/MCPs in the repository',
      'Install the ones you need',
    ],
  };
}

async function searchGitHubRepos(query, cursor) {
  const page = cursor ? parseInt(cursor, 10) || 1 : 1;
  const searchQuery = query
    ? `${query} in:name,description,readme`
    : 'SKILL.md OR mcp-server OR opencode-skill in:readme';

  const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=${GITHUB_PAGE_LIMIT}&page=${page}`;

  const response = await githubFetch(url);
  if (!response || !response.ok) {
    return { items: [], nextCursor: null };
  }

  const data = await response.json();
  const items = (data.items || []).map(normalizeGitHubRepo);
  const totalPages = Math.ceil((data.total_count || 0) / GITHUB_PAGE_LIMIT);
  const nextCursor = page < totalPages ? String(page + 1) : null;

  return { items, nextCursor };
}

async function fetchCuratedRepos() {
  const items = [];
  for (const curated of CURATED_REPOS) {
    try {
      const url = `${GITHUB_API_BASE}/repos/${curated.owner}/${curated.repo}`;
      const response = await githubFetch(url);
      if (response && response.ok) {
        const repo = await response.json();
        const normalized = normalizeGitHubRepo(repo);
        normalized.type = curated.type;
        normalized.category = curated.category;
        normalized.official = curated.official;
        items.push(normalized);
      }
    } catch {
      // Skip failed curated repos
    }
  }
  return items;
}

registerSource({
  id: 'github',
  label: 'GitHub',
  enabled: true,

  async fetchItems({ query, cursor }) {
    // First page with no query: include curated repos
    if (!query && !cursor) {
      const [searchResult, curatedItems] = await Promise.all([
        searchGitHubRepos(query, cursor),
        fetchCuratedRepos(),
      ]);

      // Merge curated items at the top, deduplicated by sourceId
      const seen = new Set(curatedItems.map((i) => i.sourceId));
      const uniqueSearch = searchResult.items.filter((i) => !seen.has(i.sourceId));

      return {
        items: [...curatedItems, ...uniqueSearch],
        nextCursor: searchResult.nextCursor,
      };
    }

    return searchGitHubRepos(query, cursor);
  },

  async fetchItem(fullName) {
    try {
      const response = await githubFetch(`${GITHUB_API_BASE}/repos/${fullName}`);
      if (!response || !response.ok) return null;
      const repo = await response.json();
      return normalizeGitHubRepo(repo);
    } catch {
      return null;
    }
  },
});

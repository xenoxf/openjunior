/**
 * Unified Catalog — ClawdHub Source
 *
 * Fetches skills from the ClawdHub public registry API.
 * Reuses the existing ClawdHub API client patterns.
 */

import { registerSource, generateGlobalId } from './sources.js';

const CLAWDHUB_API_BASE = 'https://clawdhub.com/api/v1';
const CLAWDHUB_PAGE_LIMIT = 25;
const RATE_LIMIT_DELAY_MS = 100;
let lastRequestTime = 0;

async function rateLimitedFetch(url, options = {}) {
  const maxAttempts = 6;
  let lastResponse = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS - elapsed));
    }
    lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OpenChamber/1.0',
          ...options.headers,
        },
        signal: AbortSignal.timeout(15000),
      });

      lastResponse = response;

      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
          continue;
        }
      }

      return response;
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  return lastResponse;
}

function normalizeClawdHubItem(item) {
  const slug = item.slug || item.name || '';
  const displayName = item.displayName || item.name || slug;
  const description = item.description || '';
  const downloads = item.downloads || 0;
  const stars = item.stars || 0;
  const version = item.version || item.latestVersion || '1.0.0';
  const owner = item.owner || item.author || '';

  // Normalize popularity to 0-100
  const popularity = Math.min(100, Math.round(
    (Math.log10(downloads + 1) * 10) + (stars * 2)
  ));

  return {
    id: generateGlobalId('clawdhub', slug),
    type: 'skill',
    name: displayName,
    description,
    longDescription: item.readme || description,
    source: 'clawdhub',
    sourceId: slug,
    category: 'agents',
    tags: item.tags || [],
    popularity,
    version,
    author: owner,
    official: false,
    installConfig: {
      type: 'skill',
      slug,
      version,
    },
    setupGuideUrl: item.homepage || `https://clawdhub.com/skills/${slug}`,
    installSteps: [
      `Install "${displayName}" from ClawdHub registry`,
      'The skill will be available in your skills catalog',
    ],
  };
}

async function fetchClawdHubPage(cursor) {
  const url = cursor
    ? `${CLAWDHUB_API_BASE}/skills?cursor=${encodeURIComponent(cursor)}&limit=${CLAWDHUB_PAGE_LIMIT}`
    : `${CLAWDHUB_API_BASE}/skills?limit=${CLAWDHUB_PAGE_LIMIT}`;

  const response = await rateLimitedFetch(url);
  if (!response.ok) {
    throw new Error(`ClawdHub API error: ${response.status}`);
  }

  const data = await response.json();
  const items = (data.items || []).map(normalizeClawdHubItem);
  const nextCursor =
    (typeof data.nextCursor === 'string' && data.nextCursor) ||
    (typeof data.next_cursor === 'string' && data.next_cursor) ||
    (typeof data.next === 'string' && data.next) ||
    null;

  return { items, nextCursor };
}

registerSource({
  id: 'clawdhub',
  label: 'ClawdHub',
  enabled: true,

  async fetchItems({ cursor, query }) {
    // ClawdHub doesn't support server-side search, so we fetch all and filter client-side
    // For pagination, we rely on cursor-based navigation
    const result = await fetchClawdHubPage(cursor);

    if (query) {
      const q = query.toLowerCase();
      result.items = result.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  },

  async fetchItem(slug) {
    try {
      const response = await rateLimitedFetch(`${CLAWDHUB_API_BASE}/skills/${encodeURIComponent(slug)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return normalizeClawdHubItem(data.skill || data);
    } catch {
      return null;
    }
  },
});

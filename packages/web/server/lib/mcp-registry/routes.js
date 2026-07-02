import express from 'express';

const REGISTRY_BASE = 'https://registry.modelcontextprotocol.io';
const CACHE_TTL_MS = 300_000;
let cache = { data: null, timestamp: 0, cursor: null, totalCount: 0 };

const CATEGORIES = [
  { id: 'web-search', label: 'Web Search', icon: 'search', keywords: ['search', 'web', 'brave', 'google', 'crawl', 'scrape'] },
  { id: 'time-calendar', label: 'Time & Calendar', icon: 'calendar', keywords: ['time', 'calendar', 'date', 'schedule', 'appointment'] },
  { id: 'weather', label: 'Weather', icon: 'cloud', keywords: ['weather', 'climate', 'forecast', 'temperature'] },
  { id: 'files-storage', label: 'Files & Storage', icon: 'folder', keywords: ['file', 'filesystem', 'disk', 'storage', 'directory', 'folder', 'path'] },
  { id: 'database', label: 'Databases & Data', icon: 'database', keywords: ['database', 'sql', 'postgres', 'mysql', 'sqlite', 'query', 'warehouse'] },
  { id: 'finance', label: 'Finance & Payments', icon: 'currency', keywords: ['finance', 'trading', 'stock', 'crypto', 'payment', 'invoice', 'banking', 'accounting'] },
  { id: 'github', label: 'Git & Development', icon: 'git-branch', keywords: ['github', 'gitlab', 'git', 'repository', 'pull request', 'commit', 'coding'] },
  { id: 'dev-tools', label: 'Developer Tools', icon: 'code', keywords: ['developer', 'tool', 'api', 'sdk', 'deploy', 'container', 'cli'] },
  { id: 'communication', label: 'Communication', icon: 'chat', keywords: ['slack', 'teams', 'discord', 'chat', 'message', 'email', 'mail', 'notification'] },
  { id: 'marketing', label: 'Marketing & Ads', icon: 'megaphone', keywords: ['marketing', 'seo', 'ads', 'campaign', 'analytics', 'social media'] },
  { id: 'cloud-infra', label: 'Cloud & Infrastructure', icon: 'cloud', keywords: ['cloud', 'aws', 'gcp', 'azure', 'kubernetes', 'docker', 'hosting'] },
  { id: 'legal', label: 'Legal & Compliance', icon: 'shield', keywords: ['legal', 'compliance', 'regulation', 'audit', 'gdpr', 'contract', 'policy'] },
  { id: 'ai-ml', label: 'AI & Media', icon: 'sparkles', keywords: ['llm', 'machine learning', 'ai model', 'image generation', 'audio', 'video'] },
  { id: 'health', label: 'Health & Medical', icon: 'heart', keywords: ['health', 'medical', 'healthcare', 'pharma', 'clinical', 'patient'] },
  { id: 'travel', label: 'Travel & Transportation', icon: 'map', keywords: ['travel', 'hotel', 'flight', 'booking', 'trip', 'transportation'] },
  { id: 'shopping', label: 'Shopping & E-commerce', icon: 'shopping-cart', keywords: ['shopping', 'ecommerce', 'product', 'price', 'store', 'retail'] },
  { id: 'news-media', label: 'News & Content', icon: 'news', keywords: ['news', 'media', 'article', 'content', 'blog', 'publish'] },
  { id: 'security', label: 'Security & Identity', icon: 'lock', keywords: ['security', 'oauth', 'identity', 'trust', 'encryption', 'zero-day'] },
  { id: 'analytics', label: 'Analytics & BI', icon: 'bar-chart-2', keywords: ['analytics', 'insight', 'dashboard', 'metrics', 'report'] },
  { id: 'maps-location', label: 'Maps & Location', icon: 'map-pin', keywords: ['maps', 'location', 'geospatial', 'coordinates', 'address'] },
  { id: 'design', label: 'Design & Visual', icon: 'palette', keywords: ['design', 'image', 'photo', 'visual', 'presentation', 'slide', 'video'] },
  { id: 'productivity', label: 'Productivity & PM', icon: 'checklist', keywords: ['productivity', 'project management', 'jira', 'notion', 'task', 'todo'] },
  { id: 'education', label: 'Education & Learning', icon: 'book', keywords: ['education', 'learning', 'study', 'flashcard', 'course', 'training'] },
  { id: 'gaming', label: 'Gaming', icon: 'gamepad', keywords: ['game', 'gaming', 'minecraft'] },
  { id: 'music-audio', label: 'Music & Audio', icon: 'music', keywords: ['music', 'audio', 'song', 'sound', 'podcast'] },
];

function deriveCategoryFromServer(server) {
  const text = [server.name, server.title, server.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const matched = [];
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (text.includes(kw.toLowerCase())) {
        matched.push(cat.id);
        break;
      }
    }
  }
  return matched;
}

const router = express.Router();

async function fetchPage(cursor, limit, search) {
  const params = new URLSearchParams({ limit: String(limit), version: 'latest' });
  if (cursor) params.set('cursor', cursor);
  if (search) params.set('search', search);

  const url = `${REGISTRY_BASE}/v0.1/servers?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Registry responded with ${response.status}: ${text.slice(0, 200)}`);
  }

  return await response.json();
}

function normalizeServer(entry) {
  const s = entry.server;
  if (!s || !s.name) return null;

  const pkg = s.packages?.[0] || null;
  const remote = s.remotes?.[0] || null;

  const envVars = [];
  if (pkg?.environmentVariables) {
    for (const ev of pkg.environmentVariables) {
      envVars.push({
        name: ev.name,
        description: ev.description || '',
        isRequired: ev.isRequired || false,
        isSecret: ev.isSecret || false,
        defaultValue: ev.default || null,
        placeholder: ev.placeholder || null,
      });
    }
  }

  const remoteHeaders = [];
  const remoteVariables = [];
  if (remote?.headers) {
    for (const h of remote.headers) {
      remoteHeaders.push({
        name: h.name,
        description: h.description || '',
        isRequired: h.isRequired || false,
        isSecret: h.isSecret || false,
        placeholder: h.placeholder || null,
      });
    }
  }
  if (remote?.variables) {
    for (const [key, val] of Object.entries(remote.variables)) {
      remoteVariables.push({
        name: key,
        description: val.description || '',
        isRequired: val.isRequired || false,
        isSecret: val.isSecret || false,
        choices: val.choices || null,
      });
    }
  }

  const hasAuth = envVars.some((e) => e.isSecret) || remoteHeaders.some((h) => h.isSecret);
  const hasOAuth = remoteHeaders.some(
    (h) => h.name.toLowerCase() === 'authorization' && h.description?.toLowerCase().includes('oauth')
  );

  const GENERIC_CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

  function deriveFaviconUrl(s) {
    if (s.icons && Array.isArray(s.icons) && s.icons.length > 0) {
      const icon = s.icons[0];
      if (icon && icon.src && (icon.src.startsWith('http') || icon.src.startsWith('data:'))) {
        return icon.src;
      }
    }

    const url = s.websiteUrl || s.repository?.url;
    if (url) {
      try {
        const domain = new URL(url).hostname;
        if (!GENERIC_CODE_HOSTS.has(domain)) {
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }
      } catch {}
    }

    return null;
  }

  const normalized = {
    name: s.name,
    title: s.title || s.name,
    description: s.description || '',
    version: s.version,
    transportType: pkg ? 'stdio' : remote?.type || null,
    installType: pkg ? 'command' : remote ? 'url' : null,
    installCommand: pkg
      ? [pkg.runtimeHint || (pkg.registryType === 'npm' ? 'npx' : pkg.registryType === 'pypi' ? 'pipx' : pkg.registryType === 'oci' ? 'docker' : 'uvx'), '-y', pkg.identifier]
      : null,
    installUrl: remote?.url || null,
    homepage: s.websiteUrl || s.repository?.url || null,
    repository: s.repository?.url || null,
    websiteUrl: s.websiteUrl || null,
    status: entry._meta?.['io.modelcontextprotocol.registry/official']?.status || 'active',
    publishedAt: entry._meta?.['io.modelcontextprotocol.registry/official']?.publishedAt || null,
    updatedAt: entry._meta?.['io.modelcontextprotocol.registry/official']?.updatedAt || null,
    isLatest: entry._meta?.['io.modelcontextprotocol.registry/official']?.isLatest || false,
    envVars,
    remoteHeaders,
    remoteVariables,
    hasAuth,
    hasOAuth,
    icons: s.icons || null,
    faviconUrl: deriveFaviconUrl(s),
  };

  normalized.categories = deriveCategoryFromServer(normalized);
  return normalized;
}

router.get('/', async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const search = req.query.search || null;
    const category = req.query.category || null;

    if (!cursor) {
      cache = { data: null, timestamp: 0, cursor: null, totalCount: 0 };
    }

    const body = await fetchPage(cursor, limit, search);

    let servers = (body.servers || [])
      .map(normalizeServer)
      .filter(Boolean);

    // Deduplicate by name: keep latest version only
    const seen = new Map();
    for (const s of servers) {
      const key = s.name.toLowerCase();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, s);
      } else if (s.isLatest && !existing.isLatest) {
        seen.set(key, s);
      } else if (!existing.isLatest) {
        // Compare semver versions, keep the higher one
        const existingVer = existing.version || '0.0.0';
        const currentVer = s.version || '0.0.0';
        if (currentVer.localeCompare(existingVer, undefined, { numeric: true }) > 0) {
          seen.set(key, s);
        }
      }
    }
    servers = Array.from(seen.values());

    // Supplemental local filter: registry search is name-only, we also match title/description
    if (search) {
      const q = search.toLowerCase();
      servers = servers.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      const catId = category.toLowerCase();
      servers = servers.filter((s) => s.categories.includes(catId));
    }

    // Cache first page for quick re-fetch
    if (!cursor) {
      cache = {
        data: servers,
        timestamp: Date.now(),
        cursor: body.metadata?.nextCursor || null,
        totalCount: body.metadata?.count || servers.length,
      };
    }

    res.json({
      ok: true,
      servers,
      nextCursor: body.metadata?.nextCursor || null,
      count: servers.length,
    });
  } catch (err) {
    console.error('[MCP Registry] Failed to fetch servers:', err);
    res.status(502).json({
      ok: false,
      error: err.message?.includes('Registry responded')
        ? err.message
        : 'Failed to connect to the MCP Registry. The registry may be temporarily unavailable.',
    });
  }
});

router.get('/categories', (req, res) => {
  res.json({ ok: true, categories: CATEGORIES });
});

export default router;

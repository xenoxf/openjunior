import type { IconName } from '@/components/icon/icons';
import type { McpRegistryServer } from '@/stores/useMcpRegistryStore';

export interface AppIconInfo {
  icon: IconName;
  label: string;
}

export interface ResolvedIcon extends AppIconInfo {
  matchSource: 'name_exact' | 'name' | 'title_exact' | 'title' | 'tags' | 'description' | 'author' | 'platform' | 'fallback';
}

export interface TagMapping {
  tag: string;
  icon: AppIconInfo;
}

export const KNOWN_APP_ICONS: Record<string, AppIconInfo> = {
  'google': { icon: 'global', label: 'Google' },
  'gmail': { icon: 'send-plane', label: 'Gmail' },
  'github': { icon: 'github-fill', label: 'GitHub' },
  'gitlab': { icon: 'git-branch', label: 'GitLab' },
  'slack': { icon: 'chat-4', label: 'Slack' },
  'figma': { icon: 'palette', label: 'Figma' },
  'notion': { icon: 'book-open', label: 'Notion' },
  'linear': { icon: 'node-tree', label: 'Linear' },
  'postgres': { icon: 'database-2', label: 'PostgreSQL' },
  'postgresql': { icon: 'database-2', label: 'PostgreSQL' },
  'brave': { icon: 'search-eye', label: 'Brave' },
  'brave-search': { icon: 'search-eye', label: 'Brave Search' },
  'puppeteer': { icon: 'robot-2', label: 'Puppeteer' },
  'playwright': { icon: 'bug', label: 'Playwright' },
  'scrapling': { icon: 'search-eye', label: 'Scrapling' },
  'sentry': { icon: 'bug', label: 'Sentry' },
  'context7': { icon: 'book-open', label: 'Context7' },
  'markitdown': { icon: 'file-text', label: 'MarkItDown' },
  'markitdown-win': { icon: 'file-text', label: 'MarkItDown' },
  'n8n': { icon: 'node-tree', label: 'n8n' },
  'netdata': { icon: 'bar-chart-box', label: 'Netdata' },
  'duckduckgo': { icon: 'search', label: 'DuckDuckGo' },
  'mindsdb': { icon: 'brain', label: 'MindsDB' },
  'firebase': { icon: 'cloud', label: 'Firebase' },
  'redis': { icon: 'database-2', label: 'Redis' },
  'mongodb': { icon: 'database-2', label: 'MongoDB' },
  'docker': { icon: 'terminal-box', label: 'Docker' },
  'cloudflare': { icon: 'cloud', label: 'Cloudflare' },
  'aws': { icon: 'cloud', label: 'AWS' },
  'gcp': { icon: 'cloud', label: 'GCP' },
  'azure': { icon: 'cloud', label: 'Azure' },
  'jira': { icon: 'task', label: 'Jira' },
  'confluence': { icon: 'file-text', label: 'Confluence' },
  'openai': { icon: 'sparkling', label: 'OpenAI' },
  'chatgpt': { icon: 'sparkling', label: 'ChatGPT' },
  'anthropic': { icon: 'sparkling', label: 'Anthropic' },
  'perplexity': { icon: 'search', label: 'Perplexity' },
  'exa': { icon: 'search', label: 'Exa' },
  'vercel': { icon: 'cloud', label: 'Vercel' },
  'supabase': { icon: 'database-2', label: 'Supabase' },
  'pinecone': { icon: 'database-2', label: 'Pinecone' },
  'weaviate': { icon: 'database-2', label: 'Weaviate' },
  'clickhouse': { icon: 'database-2', label: 'ClickHouse' },
  'datadog': { icon: 'bar-chart-box', label: 'Datadog' },
  'splunk': { icon: 'search', label: 'Splunk' },
  'discord': { icon: 'discord-fill', label: 'Discord' },
  'telegram': { icon: 'send-plane', label: 'Telegram' },
  'whatsapp': { icon: 'chat-4', label: 'WhatsApp' },
  'microsoft': { icon: 'window', label: 'Microsoft' },
  'windows': { icon: 'window', label: 'Windows' },
  'teams': { icon: 'chat-4', label: 'Teams' },
  'outlook': { icon: 'send-plane', label: 'Outlook' },
  'office': { icon: 'file-text', label: 'Office' },
  'chrome': { icon: 'global', label: 'Chrome' },
  'firefox': { icon: 'flashlight', label: 'Firefox' },
  'safari': { icon: 'compass-3', label: 'Safari' },
  'edge': { icon: 'global', label: 'Edge' },
  'amazon': { icon: 'cloud', label: 'Amazon' },
  's3': { icon: 'cloud', label: 'S3' },
  'android': { icon: 'smartphone', label: 'Android' },
  'apple': { icon: 'apple', label: 'Apple' },
  'ios': { icon: 'smartphone', label: 'iOS' },
  'airflow': { icon: 'cloud', label: 'Airflow' },
  'kafka': { icon: 'node-tree', label: 'Kafka' },
  'elastic': { icon: 'search', label: 'Elasticsearch' },
  'elasticsearch': { icon: 'search', label: 'Elasticsearch' },
  'grafana': { icon: 'bar-chart-box', label: 'Grafana' },
  'prometheus': { icon: 'bar-chart-box', label: 'Prometheus' },
  'npm': { icon: 'code-box', label: 'npm' },
  'react': { icon: 'code-ai', label: 'React' },
  'vue': { icon: 'code-ai', label: 'Vue' },
  'nextjs': { icon: 'code-ai', label: 'Next.js' },
  'prisma': { icon: 'database-2', label: 'Prisma' },
  'twilio': { icon: 'chat-4', label: 'Twilio' },
  'langchain': { icon: 'ai-agent', label: 'LangChain' },
  'llamaindex': { icon: 'ai-agent', label: 'LlamaIndex' },
  'huggingface': { icon: 'ai-agent', label: 'Hugging Face' },
  'replicate': { icon: 'ai-agent', label: 'Replicate' },
  'cohere': { icon: 'ai-agent', label: 'Cohere' },
  'claude': { icon: 'sparkling', label: 'Claude' },
  'gpt': { icon: 'sparkling', label: 'GPT' },
  'gemini': { icon: 'sparkling', label: 'Gemini' },
  'llama': { icon: 'ai-agent', label: 'Llama' },
  'mysql': { icon: 'database-2', label: 'MySQL' },
  'mariadb': { icon: 'database-2', label: 'MariaDB' },
  'sqlserver': { icon: 'database-2', label: 'SQL Server' },
  'sqlite': { icon: 'database-2', label: 'SQLite' },
  'heroku': { icon: 'cloud', label: 'Heroku' },
  'netlify': { icon: 'cloud', label: 'Netlify' },
  'fly': { icon: 'cloud', label: 'Fly.io' },
  'railway': { icon: 'cloud', label: 'Railway' },
  'circleci': { icon: 'loop-right-ai', label: 'CircleCI' },
  'jenkins': { icon: 'tools', label: 'Jenkins' },
  'okta': { icon: 'shield', label: 'Okta' },
  'auth0': { icon: 'shield', label: 'Auth0' },
  'algolia': { icon: 'search', label: 'Algolia' },
  'meilisearch': { icon: 'search', label: 'Meilisearch' },
  'paypal': { icon: 'sparkling', label: 'PayPal' },
  'shopify': { icon: 'briefcase', label: 'Shopify' },
  'salesforce': { icon: 'cloud', label: 'Salesforce' },
  'zendesk': { icon: 'chat-4', label: 'Zendesk' },
  'asana': { icon: 'task', label: 'Asana' },
  'trello': { icon: 'list-check-3', label: 'Trello' },
  'clickup': { icon: 'task', label: 'ClickUp' },
  'monday': { icon: 'task', label: 'Monday.com' },
  'obsidian': { icon: 'book-open', label: 'Obsidian' },
  'dropbox': { icon: 'folder', label: 'Dropbox' },
  'zoom': { icon: 'camera', label: 'Zoom' },
  'meet': { icon: 'camera', label: 'Google Meet' },
  'drive': { icon: 'folder', label: 'Google Drive' },
  'calendar': { icon: 'calendar', label: 'Google Calendar' },
  'youtube': { icon: 'camera', label: 'YouTube' },
  'maps': { icon: 'compass-3', label: 'Google Maps' },
  'sheets': { icon: 'file-text', label: 'Google Sheets' },
  'docs': { icon: 'file-text', label: 'Google Docs' },
  'slides': { icon: 'file-text', label: 'Google Slides' },
  'stripe': { icon: 'sparkling', label: 'Stripe' },
  'newrelic': { icon: 'bar-chart-box', label: 'New Relic' },
  'pagerduty': { icon: 'notification-3', label: 'PagerDuty' },
  'opsgenie': { icon: 'notification-3', label: 'Opsgenie' },
  'segment': { icon: 'node-tree', label: 'Segment' },
  'mixpanel': { icon: 'bar-chart-box', label: 'Mixpanel' },
  'amplitude': { icon: 'bar-chart-box', label: 'Amplitude' },
  'posthog': { icon: 'bar-chart-box', label: 'PostHog' },
  'snowflake': { icon: 'cloud', label: 'Snowflake' },
  'bigquery': { icon: 'cloud', label: 'BigQuery' },
  'redshift': { icon: 'cloud', label: 'Redshift' },
  'dbt': { icon: 'tools', label: 'dbt' },
  'terraform': { icon: 'tools', label: 'Terraform' },
  'ansible': { icon: 'tools', label: 'Ansible' },
  'kubernetes': { icon: 'terminal-box', label: 'Kubernetes' },
  'k8s': { icon: 'terminal-box', label: 'Kubernetes' },
  'helm': { icon: 'tools', label: 'Helm' },
  'istio': { icon: 'node-tree', label: 'Istio' },
  'argo': { icon: 'loop-right-ai', label: 'ArgoCD' },
  'flux': { icon: 'loop-right-ai', label: 'Flux' },
  'vault': { icon: 'shield', label: 'Vault' },
  'consul': { icon: 'node-tree', label: 'Consul' },
  'nginx': { icon: 'global', label: 'NGINX' },
  'apache': { icon: 'global', label: 'Apache' },
  'caddy': { icon: 'global', label: 'Caddy' },
  'fastly': { icon: 'cloud', label: 'Fastly' },
  'akamai': { icon: 'cloud', label: 'Akamai' },
  'square': { icon: 'sparkling', label: 'Square' },
  'mistral': { icon: 'sparkling', label: 'Mistral' },
  'together': { icon: 'cloud', label: 'Together AI' },
  'groq': { icon: 'cloud', label: 'Groq' },
  'deepseek': { icon: 'sparkling', label: 'DeepSeek' },
  'ollama': { icon: 'terminal-box', label: 'Ollama' },
  'tavily': { icon: 'search', label: 'Tavily' },
  'serp': { icon: 'search', label: 'SERP' },
  'serper': { icon: 'search', label: 'Serper' },
  'jina': { icon: 'search', label: 'Jina AI' },
  'qdrant': { icon: 'database-2', label: 'Qdrant' },
  'chroma': { icon: 'database-2', label: 'Chroma' },
  'milvus': { icon: 'database-2', label: 'Milvus' },
  'neo4j': { icon: 'node-tree', label: 'Neo4j' },
  'dgraph': { icon: 'node-tree', label: 'Dgraph' },
  'faiss': { icon: 'database-2', label: 'FAISS' },
  'redisearch': { icon: 'search', label: 'RediSearch' },
  'typesense': { icon: 'search', label: 'TypeSense' },
  'solar': { icon: 'search', label: 'Solar' },
};

export const TAG_TO_ICON: TagMapping[] = [
  { tag: 'search', icon: { icon: 'search', label: 'Search' } },
  { tag: 'database', icon: { icon: 'database-2', label: 'Database' } },
  { tag: 'ai', icon: { icon: 'ai-agent', label: 'AI' } },
  { tag: 'llm', icon: { icon: 'sparkling', label: 'LLM' } },
  { tag: 'cloud', icon: { icon: 'cloud', label: 'Cloud' } },
  { tag: 'devops', icon: { icon: 'tools', label: 'DevOps' } },
  { tag: 'monitoring', icon: { icon: 'bar-chart-box', label: 'Monitoring' } },
  { tag: 'analytics', icon: { icon: 'bar-chart-box', label: 'Analytics' } },
  { tag: 'storage', icon: { icon: 'folder', label: 'Storage' } },
  { tag: 'files', icon: { icon: 'folder', label: 'Files' } },
  { tag: 'messaging', icon: { icon: 'chat-4', label: 'Messaging' } },
  { tag: 'chat', icon: { icon: 'chat-4', label: 'Chat' } },
  { tag: 'communication', icon: { icon: 'chat-4', label: 'Communication' } },
  { tag: 'email', icon: { icon: 'send-plane', label: 'Email' } },
  { tag: 'calendar', icon: { icon: 'calendar', label: 'Calendar' } },
  { tag: 'productivity', icon: { icon: 'task', label: 'Productivity' } },
  { tag: 'project-management', icon: { icon: 'task', label: 'Project Management' } },
  { tag: 'crm', icon: { icon: 'briefcase', label: 'CRM' } },
  { tag: 'browser', icon: { icon: 'global', label: 'Browser' } },
  { tag: 'automation', icon: { icon: 'loop-right-ai', label: 'Automation' } },
  { tag: 'security', icon: { icon: 'shield', label: 'Security' } },
  { tag: 'auth', icon: { icon: 'shield', label: 'Auth' } },
  { tag: 'testing', icon: { icon: 'bug', label: 'Testing' } },
  { tag: 'developer-tools', icon: { icon: 'code-box', label: 'Developer Tools' } },
  { tag: 'documentation', icon: { icon: 'file-text', label: 'Documentation' } },
  { tag: 'design', icon: { icon: 'palette', label: 'Design' } },
  { tag: 'payment', icon: { icon: 'sparkling', label: 'Payments' } },
  { tag: 'finance', icon: { icon: 'sparkling', label: 'Finance' } },
  { tag: 'geolocation', icon: { icon: 'compass-3', label: 'Geolocation' } },
  { tag: 'video', icon: { icon: 'camera', label: 'Video' } },
  { tag: 'image', icon: { icon: 'camera', label: 'Image' } },
  { tag: 'music', icon: { icon: 'music', label: 'Music' } },
  { tag: 'social', icon: { icon: 'chat-4', label: 'Social' } },
  { tag: 'travel', icon: { icon: 'global', label: 'Travel' } },
  { tag: 'weather', icon: { icon: 'cloud', label: 'Weather' } },
  { tag: 'health', icon: { icon: 'heart', label: 'Health' } },
  { tag: 'fitness', icon: { icon: 'heart', label: 'Fitness' } },
  { tag: 'map', icon: { icon: 'compass-3', label: 'Maps' } },
  { tag: 'notifications', icon: { icon: 'notification-3', label: 'Notifications' } },
];

export const PLATFORM_TO_ICON: Record<string, AppIconInfo> = {
  'npm': { icon: 'code-box', label: 'npm' },
  'pypi': { icon: 'code-box', label: 'PyPI' },
  'github': { icon: 'github-fill', label: 'GitHub' },
  'gitlab': { icon: 'git-branch', label: 'GitLab' },
  'docker': { icon: 'terminal-box', label: 'Docker Hub' },
  'mcp': { icon: 'server', label: 'MCP' },
};

export const POPULAR_MCPS_RANK: Record<string, number> = {
  'markitdown': 1,
  'filesystem': 2,
  'github': 3,
  'playwright': 4,
  'google': 5,
  'slack': 6,
  'postgres': 7,
  'context7': 8,
  'scrapling': 9,
  'brave-search': 10,
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchWholeWord(text: string, keyword: string): boolean {
  const escaped = escapeRegex(keyword);
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function getToolName(name: string): string {
  const lower = name.toLowerCase();
  const segments = lower.split('/');

  if (segments.length >= 2) {
    return segments[segments.length - 1] || lower;
  }

  if (lower.includes('.')) {
    return lower.split('.').pop() || lower;
  }
  return lower;
}

function tokenizeToolName(toolName: string): string[] {
  return toolName.split(/[._-]+/).filter(Boolean);
}

function matchBrandKey(tokens: string[], key: string, exact: boolean): boolean {
  for (const token of tokens) {
    if (exact ? token === key : token.includes(key)) return true;
  }
  return false;
}

function extractAuthor(name: string): string | null {
  const match = name.match(/^io\.github\/([^/]+)/i);
  if (match) return match[1].toLowerCase();
  const matchDot = name.match(/^github\.com\/([^/]+)/i);
  if (matchDot) return matchDot[1].toLowerCase();
  const matchScoped = name.match(/^@([a-z0-9_-]+)/);
  if (matchScoped) return matchScoped[1].toLowerCase();
  return null;
}

function matchByCategory(categories: string[]): AppIconInfo | null {
  if (!categories || categories.length === 0) return null;

  for (const cat of categories) {
    const lowerCat = cat.toLowerCase();
    for (const mapping of TAG_TO_ICON) {
      if (lowerCat === mapping.tag) {
        return mapping.icon;
      }
    }
  }

  for (const cat of categories) {
    const lowerCat = cat.toLowerCase();
    for (const mapping of TAG_TO_ICON) {
      if (lowerCat.includes(mapping.tag)) {
        return mapping.icon;
      }
    }
  }

  return null;
}

function matchByTags(tags: string[]): AppIconInfo | null {
  if (!tags || tags.length === 0) return null;

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    for (const mapping of TAG_TO_ICON) {
      if (lowerTag === mapping.tag || lowerTag.includes(mapping.tag)) {
        return mapping.icon;
      }
    }
  }

  return null;
}

function matchByAuthor(name: string): AppIconInfo | null {
  const author = extractAuthor(name);
  if (!author) return null;

  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (author.includes(key) || key.includes(author)) {
      return info;
    }
  }

  return null;
}

function matchByPlatform(name: string): AppIconInfo | null {
  const lowerName = name.toLowerCase();
  for (const [platform, info] of Object.entries(PLATFORM_TO_ICON)) {
    if (lowerName.startsWith(platform) || lowerName.includes(`/${platform}`)) {
      return info;
    }
  }
  return null;
}

export function resolveAppIcon(server: McpRegistryServer): ResolvedIcon | null {
  const lowerTitle = server.title.toLowerCase();
  const toolName = getToolName(server.name);
  const toolTokens = tokenizeToolName(toolName);

  // Priority 1: tool name tokens, exact match
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (matchBrandKey(toolTokens, key, true)) {
      return { ...info, matchSource: 'name_exact' };
    }
  }

  // Priority 2: tool name tokens, substring match
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (matchBrandKey(toolTokens, key, false)) {
      return { ...info, matchSource: 'name' };
    }
  }

  // Priority 3: whole-word in title
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (matchWholeWord(lowerTitle, key)) {
      return { ...info, matchSource: 'title_exact' };
    }
  }

  // Priority 4: substring in title
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerTitle.includes(key)) {
      return { ...info, matchSource: 'title' };
    }
  }

  // Priority 5: match by categories
  if (server.categories && server.categories.length > 0) {
    const byCategory = matchByCategory(server.categories);
    if (byCategory) {
      return { ...byCategory, matchSource: 'tags' };
    }
  }

  // Priority 6: whole-word in description
  if (server.description) {
    const lowerDesc = server.description.toLowerCase();
    for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
      if (matchWholeWord(lowerDesc, key)) {
        return { ...info, matchSource: 'description' };
      }
    }
  }

  // Priority 7: author match from io.github/(user)/...
  const byAuthor = matchByAuthor(server.name);
  if (byAuthor) {
    return { ...byAuthor, matchSource: 'author' };
  }

  // Priority 8: platform match (npm, pypi, etc.)
  const byPlatform = matchByPlatform(server.name);
  if (byPlatform) {
    return { ...byPlatform, matchSource: 'platform' };
  }

  return null;
}

export function findAppIcon(name: string, title: string, tags?: string[], author?: string): AppIconInfo | null {
  const lowerName = name.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Exact match in name
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerName === key || lowerTitle === key) {
      return info;
    }
  }

  // Substring in name
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerName.includes(key)) {
      return info;
    }
  }

  // Title match
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerTitle.includes(key)) {
      return info;
    }
  }

  // Tags
  if (tags && tags.length > 0) {
    const byTags = matchByTags(tags);
    if (byTags) return byTags;
  }

  // Author
  if (author) {
    const lowerAuthor = author.toLowerCase();
    for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
      if (lowerAuthor.includes(key) || key.includes(lowerAuthor)) {
        return info;
      }
    }
  }

  return null;
}

export function getPopularityRank(name: string, title: string): number | null {
  const lowerName = name.toLowerCase();
  const lowerTitle = title.toLowerCase();
  for (const [key, rank] of Object.entries(POPULAR_MCPS_RANK)) {
    if (lowerName.includes(key) || lowerTitle.includes(key)) {
      return rank;
    }
  }
  return null;
}

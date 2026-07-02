import type { IconName } from '@/components/icon/icons';
import type { McpRegistryServer } from '@/stores/useMcpRegistryStore';

export interface AppIconInfo {
  icon: IconName;
  label: string;
}

export interface ResolvedIcon extends AppIconInfo {
  matchSource: 'name' | 'title' | 'description';
}

export const KNOWN_APP_ICONS: Record<string, AppIconInfo> = {
  'google': { icon: 'global', label: 'Google' },
  'gmail': { icon: 'send-plane', label: 'Gmail' },
  'github': { icon: 'github-fill', label: 'GitHub' },
  'slack': { icon: 'chat-4', label: 'Slack' },
  'figma': { icon: 'palette', label: 'Figma' },
  'notion': { icon: 'book-open', label: 'Notion' },
  'linear': { icon: 'node-tree', label: 'Linear' },
  'postgres': { icon: 'database-2', label: 'PostgreSQL' },
  'brave': { icon: 'search-eye', label: 'Brave' },
  'puppeteer': { icon: 'robot-2', label: 'Puppeteer' },
  'playwright': { icon: 'bug', label: 'Playwright' },
  'scrapling': { icon: 'search-eye', label: 'Scrapling' },
  'sentry': { icon: 'bug', label: 'Sentry' },
  'context7': { icon: 'book-open', label: 'Context7' },
  'markitdown': { icon: 'file-text', label: 'MarkItDown' },
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
  if (lower.includes('/')) {
    return lower.split('/').pop() || lower;
  }
  if (lower.includes('.')) {
    return lower.split('.').pop() || lower;
  }
  return lower;
}

function tokenizeToolName(toolName: string): string[] {
  return toolName.split(/[._\-]+/).filter(Boolean);
}

function matchBrandKey(tokens: string[], key: string, exact: boolean): boolean {
  for (const token of tokens) {
    if (exact ? token === key : token.includes(key)) return true;
  }
  return false;
}

export function resolveAppIcon(server: McpRegistryServer): ResolvedIcon | null {
  const lowerTitle = server.title.toLowerCase();
  const toolName = getToolName(server.name);

  // Priority 1: tool name tokens (from after / or last domain segment), exact match
  const toolTokens = tokenizeToolName(toolName);
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (matchBrandKey(toolTokens, key, true)) {
      return { ...info, matchSource: 'name' };
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
      return { ...info, matchSource: 'title' };
    }
  }

  // Priority 4: substring in title
  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerTitle.includes(key)) {
      return { ...info, matchSource: 'title' };
    }
  }

  // Priority 5: whole-word in description (lowest confidence)
  if (server.description) {
    const lowerDesc = server.description.toLowerCase();
    for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
      if (matchWholeWord(lowerDesc, key)) {
        return { ...info, matchSource: 'description' };
      }
    }
  }

  return null;
}

export function findAppIcon(name: string, title: string): AppIconInfo | null {
  const lowerName = name.toLowerCase();
  const lowerTitle = title.toLowerCase();

  for (const [key, info] of Object.entries(KNOWN_APP_ICONS)) {
    if (lowerName.includes(key) || lowerTitle.includes(key)) {
      return info;
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

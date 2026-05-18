interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Public Suffix List MCP.
 *
 * Caches the list 24h in-worker; uses ICANN section only.
 */


const SRC = 'https://publicsuffix.org/list/public_suffix_list.dat';
const UA = 'pipeworx-mcp-public-suffix-list/1.0 (+https://pipeworx.io)';

let CACHE: { at: number; rules: Set<string>; wild: Set<string>; bang: Set<string>; lines: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

const tools: McpToolExport['tools'] = [
  {
    name: 'parse',
    description: 'Split a domain into (subdomain, registrable_domain, public_suffix).',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain'],
    },
  },
  {
    name: 'public_suffix',
    description: 'Just the public suffix.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain'],
    },
  },
  {
    name: 'registrable_domain',
    description: 'Domain + nearest suffix (the "site").',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain'],
    },
  },
  {
    name: 'list_version',
    description: 'Last refresh + rule count.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'parse': {
      const d = canonicalDomain(reqStr(args, 'domain', '"www.example.co.uk"'));
      const { suffix, registrable, subdomain } = await split(d);
      return { input: d, subdomain, registrable_domain: registrable, public_suffix: suffix };
    }
    case 'public_suffix': {
      const d = canonicalDomain(reqStr(args, 'domain', '"www.example.co.uk"'));
      return { input: d, public_suffix: (await split(d)).suffix };
    }
    case 'registrable_domain': {
      const d = canonicalDomain(reqStr(args, 'domain', '"www.example.co.uk"'));
      return { input: d, registrable_domain: (await split(d)).registrable };
    }
    case 'list_version': {
      const c = await load();
      return { refreshed_at: new Date(c.at).toISOString(), rule_lines: c.lines };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function load() {
  const now = Date.now();
  if (CACHE && now - CACHE.at < TTL_MS) return CACHE;
  const res = await fetch(SRC, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`PSL: ${res.status}`);
  const text = await res.text();
  const rules = new Set<string>();
  const wild = new Set<string>();
  const bang = new Set<string>();
  let lines = 0;
  let icann = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '// ===BEGIN ICANN DOMAINS===') { icann = true; continue; }
    if (line === '// ===END ICANN DOMAINS===') { icann = false; continue; }
    if (!icann) continue;
    if (!line || line.startsWith('//')) continue;
    lines++;
    if (line.startsWith('!')) bang.add(line.slice(1).toLowerCase());
    else if (line.startsWith('*.')) wild.add(line.slice(2).toLowerCase());
    else rules.add(line.toLowerCase());
  }
  CACHE = { at: now, rules, wild, bang, lines };
  return CACHE;
}

async function split(domain: string): Promise<{ suffix: string; registrable: string | null; subdomain: string | null }> {
  const labels = domain.split('.').filter(Boolean);
  const c = await load();
  let bestLen = 0;
  for (let i = 0; i < labels.length; i++) {
    const candidate = labels.slice(i).join('.');
    if (c.bang.has(candidate)) {
      bestLen = labels.length - i - 1;
      break;
    }
    if (c.rules.has(candidate)) bestLen = Math.max(bestLen, labels.length - i);
    if (i > 0) {
      const wildBase = labels.slice(i).join('.');
      if (c.wild.has(wildBase)) bestLen = Math.max(bestLen, labels.length - i + 1);
    }
  }
  if (bestLen === 0) bestLen = 1; // last-label fallback
  const suffix = labels.slice(labels.length - bestLen).join('.');
  if (labels.length <= bestLen) return { suffix, registrable: null, subdomain: null };
  const registrable = labels.slice(labels.length - bestLen - 1).join('.');
  const subdomain = labels.slice(0, labels.length - bestLen - 1).join('.') || null;
  return { suffix, registrable, subdomain };
}

function canonicalDomain(d: string): string {
  return d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:.*$/, '');
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

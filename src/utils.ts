// Pure, side-effect-free helpers shared by the server and unit tests.
// Keeping these out of index.ts means they can be imported and tested
// without booting the HTTP/MCP server.

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Default LLM request parameters (used when the matching env var is unset)
export const DEFAULT_LLM_TEMPERATURE = 0.1;
export const DEFAULT_LLM_MAX_TOKENS = 2000;

// Input validation utilities
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  // Remove any potentially dangerous characters
  return url.trim().replace(/[<>'"]/g, '');
}

export function validatePrompt(prompt: string): boolean {
  // Basic prompt validation - prevent extremely long prompts
  return prompt.length > 0 && prompt.length < 10000;
}

// Parse proxy URL with range support (e.g. https://example.com:10001-10010)
export function parseProxyUrls(proxyUrl: string): string[] {
  if (!proxyUrl) return [];

  // Check for port range syntax: https://example.com:10001-10010
  const rangeMatch = proxyUrl.match(/^(https?:\/\/[^:]+):(\d+)-(\d+)$/);
  if (rangeMatch) {
    const [, baseUrl, startPort, endPort] = rangeMatch;
    const start = parseInt(startPort, 10);
    const end = parseInt(endPort, 10);
    const proxies: string[] = [];

    for (let port = start; port <= end; port++) {
      proxies.push(`${baseUrl}:${port}`);
    }

    return proxies;
  }

  // Single proxy URL
  return [proxyUrl];
}

// Parse user agent env value, which may be a JSON array or a single string
export function parseUserAgents(
  userAgentEnv: string,
  defaultUserAgent: string = DEFAULT_USER_AGENT
): string[] {
  if (!userAgentEnv) return [defaultUserAgent];

  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(userAgentEnv);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const filtered = parsed.filter(
        (ua) => typeof ua === 'string' && ua.trim().length > 0
      );
      return filtered.length > 0 ? filtered : [defaultUserAgent];
    }
  } catch {
    // Not JSON, treat as single user agent
  }

  // Single user agent string
  return [userAgentEnv.trim()];
}

// Resolved LLM request configuration
export interface LlmConfig {
  apiKey?: string;
  providerBaseUrl?: string;
  model?: string;
  reasoningEffort?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
}

// Read LLM settings from the environment, applying sensible defaults.
// Optional tuning params (reasoning effort, top_p) are left undefined when
// unset so they are omitted from the request rather than sent as null.
export function parseLlmConfig(
  env: Record<string, string | undefined> = process.env
): LlmConfig {
  const maxTokens = Number(env.LLM_MAX_TOKENS);
  const temperature = Number(env.LLM_TEMPERATURE);
  const topP = Number(env.LLM_TOP_P);

  return {
    apiKey: env.LLM_API_KEY,
    providerBaseUrl: env.LLM_PROVIDER_BASE_URL,
    model: env.LLM_MODEL,
    reasoningEffort: env.LLM_REASONING_EFFORT?.trim() || undefined,
    maxTokens:
      env.LLM_MAX_TOKENS && Number.isFinite(maxTokens) && maxTokens > 0
        ? maxTokens
        : DEFAULT_LLM_MAX_TOKENS,
    temperature:
      env.LLM_TEMPERATURE !== undefined && Number.isFinite(temperature)
        ? temperature
        : DEFAULT_LLM_TEMPERATURE,
    topP:
      env.LLM_TOP_P !== undefined && Number.isFinite(topP) ? topP : undefined,
  };
}

// Build the chat-completions request body, only including optional tuning
// parameters when they have been explicitly configured.
export function buildLlmRequestBody(
  model: string,
  messages: Array<{ role: string; content: string }>,
  llm: LlmConfig
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: llm.temperature,
    max_tokens: llm.maxTokens,
  };

  if (llm.topP !== undefined) {
    body.top_p = llm.topP;
  }

  if (llm.reasoningEffort) {
    body.reasoning_effort = llm.reasoningEffort;
  }

  return body;
}

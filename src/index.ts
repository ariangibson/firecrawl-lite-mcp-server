#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  Tool,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import FirecrawlApp, {
  type ScrapeOptions,
  type MapOptions,
  type Document,
} from '@mendable/firecrawl-js';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

// Lightweight tool definitions for essential Firecrawl functionality
const SCRAPE_TOOL: Tool = {
  name: 'scrape_page',
  description: 'Extract content from a single webpage',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Webpage URL to scrape' },
      onlyMainContent: {
        type: 'boolean',
        description: 'Extract only main content',
        default: true
      },
    },
    required: ['url'],
  },
};

const BATCH_SCRAPE_TOOL: Tool = {
  name: 'batch_scrape',
  description: 'Scrape multiple URLs in a single request',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of URLs to scrape'
      },
      onlyMainContent: {
        type: 'boolean',
        description: 'Extract only main content',
        default: true
      },
    },
    required: ['urls'],
  },
};

const EXTRACT_DATA_TOOL: Tool = {
  name: 'extract_data',
  description: 'Extract structured data from webpages using LLM',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'URLs to extract data from'
      },
      prompt: {
        type: 'string',
        description: 'Instructions for what data to extract'
      },
      enableWebSearch: {
        type: 'boolean',
        description: 'Enable web search for additional context',
        default: false
      },
    },
    required: ['urls', 'prompt'],
  },
};

const EXTRACT_WITH_SCHEMA_TOOL: Tool = {
  name: 'extract_with_schema',
  description: 'Extract structured data using a JSON schema',
  inputSchema: {
    type: 'object',
    properties: {
      urls: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'URLs to extract data from'
      },
      schema: { 
        type: 'object', 
        description: 'JSON schema defining the data structure to extract'
      },
      prompt: { 
        type: 'string', 
        description: 'Optional instructions for extraction'
      },
      enableWebSearch: { 
        type: 'boolean', 
        description: 'Enable web search for additional context',
        default: false
      },
    },
    required: ['urls', 'schema'],
  },
};

// Remove all complex tools - keep only essential ones above

// /**
//  * Parameters for LLMs.txt generation operations.
//  */
// interface GenerateLLMsTextParams {
//   /**
//    * Maximum number of URLs to process (1-100)
//    * @default 10
//    */
//   maxUrls?: number;
//   /**
//    * Whether to show the full LLMs-full.txt in the response
//    * @default false
//    */
//   showFullText?: boolean;
//   /**
//    * Experimental flag for streaming
//    */
//   __experimental_stream?: boolean;
// }

/**
 * Response interface for LLMs.txt generation operations.
 */
// interface GenerateLLMsTextResponse {
//   success: boolean;
//   id: string;
// }

/**
 * Status response interface for LLMs.txt generation operations.
 */
// interface GenerateLLMsTextStatusResponse {
//   success: boolean;
//   data: {
//     llmstxt: string;
//     llmsfulltxt?: string;
//   };
//   status: 'processing' | 'completed' | 'failed';
//   error?: string;
//   expiresAt: string;
// }

interface StatusCheckOptions {
  id: string;
}

interface SearchOptions {
  query: string;
  limit?: number;
  lang?: string;
  country?: string;
  tbs?: string;
  filter?: string;
  location?: {
    country?: string;
    languages?: string[];
  };
  scrapeOptions?: {
    formats?: any[];
    onlyMainContent?: boolean;
    waitFor?: number;
    includeTags?: string[];
    excludeTags?: string[];
    timeout?: number;
  };
  sources?: Array<
    | {
        type: 'web';
        tbs?: string;
        location?: string;
      }
    | {
        type: 'images';
      }
    | {
        type: 'news';
      }
  >;
}

// Add after other interfaces
interface ExtractParams<T = any> {
  prompt?: string;
  schema?: T | object;
  allowExternalLinks?: boolean;
  enableWebSearch?: boolean;
  includeSubdomains?: boolean;
  origin?: string;
}

interface ExtractArgs {
  urls: string[];
  prompt?: string;
  schema?: object;
  allowExternalLinks?: boolean;
  enableWebSearch?: boolean;
  includeSubdomains?: boolean;
  origin?: string;
}

interface ExtractResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  warning?: string;
  creditsUsed?: number;
}

// Type guards
function isScrapeOptions(
  args: unknown
): args is ScrapeOptions & { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isMapOptions(args: unknown): args is MapOptions & { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

//@ts-expect-error todo: fix
function isCrawlOptions(args: unknown): args is CrawlOptions & { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isStatusCheckOptions(args: unknown): args is StatusCheckOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    'id' in args &&
    typeof (args as { id: unknown }).id === 'string'
  );
}

function isSearchOptions(args: unknown): args is SearchOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    'query' in args &&
    typeof (args as { query: unknown }).query === 'string'
  );
}

function isExtractOptions(args: unknown): args is ExtractArgs {
  if (typeof args !== 'object' || args === null) return false;
  const { urls } = args as { urls?: unknown };
  return (
    Array.isArray(urls) &&
    urls.every((url): url is string => typeof url === 'string')
  );
}

function removeEmptyTopLevel<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (
      typeof v === 'object' &&
      !Array.isArray(v) &&
      Object.keys(v).length === 0
    )
      continue;
    // @ts-expect-error dynamic assignment
    out[k] = v;
  }
  return out;
}

// Server implementation
const server = new Server(
  {
    name: 'firecrawl-lite-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Get optional API URL
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Check if API key is required (not needed for cloud service)
if (process.env.CLOUD_SERVICE !== 'true' && !FIRECRAWL_API_KEY) {
  console.error('Error: FIRECRAWL_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Firecrawl client with optional API URL
const client = new FirecrawlApp({
  apiKey: FIRECRAWL_API_KEY || 'dummy', // Dummy key for local instance
  ...(FIRECRAWL_API_URL ? { apiUrl: FIRECRAWL_API_URL } : {}),
});

// Configuration for retries and monitoring
const CONFIG = {
  retry: {
    maxAttempts: Number(process.env.FIRECRAWL_RETRY_MAX_ATTEMPTS) || 3,
    initialDelay: Number(process.env.FIRECRAWL_RETRY_INITIAL_DELAY) || 1000,
    maxDelay: Number(process.env.FIRECRAWL_RETRY_MAX_DELAY) || 10000,
    backoffFactor: Number(process.env.FIRECRAWL_RETRY_BACKOFF_FACTOR) || 2,
  },
  credit: {
    warningThreshold:
      Number(process.env.FIRECRAWL_CREDIT_WARNING_THRESHOLD) || 1000,
    criticalThreshold:
      Number(process.env.FIRECRAWL_CREDIT_CRITICAL_THRESHOLD) || 100,
  },
};

// Add utility function for delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let isStdioTransport = false;

function safeLog(
  level:
    | 'error'
    | 'debug'
    | 'info'
    | 'notice'
    | 'warning'
    | 'critical'
    | 'alert'
    | 'emergency',
  data: any
): void {
  try {
    // Always log to stderr to avoid relying on MCP logging capability
    const message = `[${level}] ${
      typeof data === 'object' ? JSON.stringify(data) : String(data)
    }`;
    console.error(message);
  } catch (_) {
    // ignore
  }
}

// Add retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  attempt = 1
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('rate limit') || error.message.includes('429'));

    if (isRateLimit && attempt < CONFIG.retry.maxAttempts) {
      const delayMs = Math.min(
        CONFIG.retry.initialDelay *
          Math.pow(CONFIG.retry.backoffFactor, attempt - 1),
        CONFIG.retry.maxDelay
      );

      safeLog(
        'warning',
        `Rate limit hit for ${context}. Attempt ${attempt}/${CONFIG.retry.maxAttempts}. Retrying in ${delayMs}ms`
      );

      await delay(delayMs);
      return withRetry(operation, context, attempt + 1);
    }

    throw error;
  }
}

// Tool handlers
server.setRequestHandler(
  ListToolsRequestSchema,
  async function listToolsRequestHandler() {
    return {
      tools: [
        SCRAPE_TOOL,
        BATCH_SCRAPE_TOOL,
        EXTRACT_DATA_TOOL,
        EXTRACT_WITH_SCHEMA_TOOL,
      ],
    };
  }
);

server.setRequestHandler(
  CallToolRequestSchema,
  async function callToolRequestHandler(request) {
    const startTime = Date.now();
    try {
      const { name, arguments: args } = request.params;
      const apiKey =
        process.env.CLOUD_SERVICE === 'true'
          ? (request.params._meta?.apiKey as string)
          : FIRECRAWL_API_KEY;
      if (process.env.CLOUD_SERVICE === 'true' && !apiKey) {
        throw new Error('No API key provided');
      }

      const client = new FirecrawlApp({
        apiKey,
        ...(FIRECRAWL_API_URL ? { apiUrl: FIRECRAWL_API_URL } : {}),
      });
      // Log incoming request with timestamp
      safeLog(
        'info',
        `[${new Date().toISOString()}] Received request for tool: ${name}`
      );

      if (!args) {
        throw new Error('No arguments provided');
      }

      switch (name) {
        case 'scrape_page': {
          if (!isScrapeOptions(args)) {
            throw new Error('Invalid arguments for scrape_page');
          }
          const options: ScrapeOptions = {
            formats: ['markdown'],
            onlyMainContent: args.onlyMainContent !== false,
          };
          const response = await client.scrape(args.url, options);
          return {
            content: [{ type: 'text', text: response.markdown || response.html || 'No content found' }],
            isError: false,
          };
        }

        case 'batch_scrape': {
          if (!Array.isArray(args.urls) || args.urls.length === 0) {
            throw new Error('Invalid arguments for batch_scrape: urls array required');
          }
          const options: ScrapeOptions = {
            formats: ['markdown'],
            onlyMainContent: args.onlyMainContent !== false,
          };
          const results = [];
          for (const url of args.urls) {
            try {
              const response = await client.scrape(url, options);
              results.push({
                url,
                success: true,
                content: response.markdown || response.html || 'No content found'
              });
            } catch (error) {
              results.push({
                url,
                success: false,
                error: error instanceof Error ? error.message : String(error)
              });
            }
            // Add small delay to prevent overwhelming the API
            await delay(200);
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            isError: false,
          };
        }

        case 'extract_data': {
          if (!Array.isArray(args.urls) || args.urls.length === 0 || !args.prompt) {
            throw new Error('Invalid arguments for extract_data: urls array and prompt required');
          }
          const response = await client.extract({
            urls: args.urls,
            prompt: args.prompt as string,
            enableWebSearch: args.enableWebSearch as boolean || false,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
            isError: false,
          };
        }

        case 'extract_with_schema': {
          if (!Array.isArray(args.urls) || args.urls.length === 0 || !args.schema) {
            throw new Error('Invalid arguments for extract_with_schema: urls array and schema required');
          }
          const response = await client.extract({
            urls: args.urls,
            schema: args.schema as Record<string, unknown>,
            prompt: args.prompt as string,
            enableWebSearch: args.enableWebSearch as boolean || false,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
            isError: false,
          };
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      // Log detailed error information
      safeLog('error', {
        message: `Request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        tool: request.params.name,
        arguments: request.params.arguments,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      });
      return {
        content: [
          {
            type: 'text',
            text: trimResponseText(
              `Error: ${error instanceof Error ? error.message : String(error)}`
            ),
          },
        ],
        isError: true,
      };
    } finally {
      // Log request completion with performance metrics
      safeLog('info', `Request completed in ${Date.now() - startTime}ms`);
    }
  }
);

// Helper function to format results
function formatResults(data: Document[]): string {
  return data
    .map((doc) => {
      const content = doc.markdown || doc.html || doc.rawHtml || 'No content';
      return `Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}
${doc.metadata?.title ? `Title: ${doc.metadata.title}` : ''}`;
    })
    .join('\n\n');
}

// Utility function to trim trailing whitespace from text responses
// This prevents Claude API errors with "final assistant content cannot end with trailing whitespace"
function trimResponseText(text: string): string {
  return text.trim();
}

// Server startup
async function runLocalServer() {
  try {
    console.error('Initializing Firecrawl Lite MCP Server...');

    const transport = new StdioServerTransport();

    // Detect if we're using stdio transport
    isStdioTransport = transport instanceof StdioServerTransport;
    if (isStdioTransport) {
      console.error(
        'Running in stdio mode, logging will be directed to stderr'
      );
    }

    await server.connect(transport);

    // Now that we're connected, we can send logging messages
    safeLog('info', 'Firecrawl Lite MCP Server initialized successfully');
    safeLog(
      'info',
      `Configuration: API URL: ${FIRECRAWL_API_URL || 'default'}`
    );

    console.error('Firecrawl Lite MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}
async function runSSELocalServer() {
  let transport: SSEServerTransport | null = null;
  const app = express();

  app.get('/sse', async (req, res) => {
    transport = new SSEServerTransport(`/messages`, res);
    res.on('close', () => {
      transport = null;
    });
    await server.connect(transport);
  });

  // Endpoint for the client to POST messages
  // Remove express.json() middleware - let the transport handle the body
  app.post('/messages', (req, res) => {
    if (transport) {
      transport.handlePostMessage(req, res);
    }
  });

  const PORT = process.env.PORT || 3000;
  console.log('Starting server on port', PORT);
  try {
    app.listen(PORT, () => {
      console.log(`MCP SSE Server listening on http://localhost:${PORT}`);
      console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
      console.log(`Message endpoint: http://localhost:${PORT}/messages`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}
async function runHTTPStreamableServer() {
  const app = express();
  app.use(express.json());

  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // A single endpoint handles all MCP requests.
  app.all('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (
        !sessionId &&
        req.method === 'POST' &&
        req.body &&
        typeof req.body === 'object' &&
        (req.body as any).method === 'initialize'
      ) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => {
            const id = randomUUID();
            return id;
          },
          onsessioninitialized: (sid: string) => {
            transports[sid] = transport;
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };
        console.log('Creating server instance');
        console.log('Connecting transport to server');
        await server.connect(transport);

        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Invalid or missing session ID',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  const PORT = 3000;
  const appServer = app.listen(PORT, () => {
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    for (const sessionId in transports) {
      try {
        console.log(`Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(
          `Error closing transport for session ${sessionId}:`,
          error
        );
      }
    }
    appServer.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
  });
}
// Old runSSECloudServer function removed - now using versioned server

if (process.env.CLOUD_SERVICE === 'true') {
  // Use versioned server for cloud service
  import('./versioned-server.js')
    .then(({ runVersionedSSECloudServer }) => {
      runVersionedSSECloudServer().catch((error: any) => {
        console.error('Fatal error running versioned server:', error);
        process.exit(1);
      });
    })
    .catch((error: any) => {
      console.error('Fatal error importing versioned server:', error);
      process.exit(1);
    });
} else if (process.env.SSE_LOCAL === 'true') {
  runSSELocalServer().catch((error: any) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
  });
} else if (process.env.HTTP_STREAMABLE_SERVER === 'true') {
  console.log('Running HTTP Streamable Server');
  runHTTPStreamableServer().catch((error: any) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
  });
} else {
  runLocalServer().catch((error: any) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
  });
}

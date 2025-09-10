#!/usr/bin/env node

// Core MCP SDK imports
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  Tool,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Web framework and utilities
import express, { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

// External dependencies
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Puppeteer will be loaded dynamically to handle mixed module issues
let puppeteer: any;
let StealthPlugin: any;

// Initialize puppeteer modules
async function initializePuppeteer() {
  if (!puppeteer) {
    const puppeteerExtra = await import('puppeteer-extra');
    const stealthPlugin = await import('puppeteer-extra-plugin-stealth');
    
    puppeteer = puppeteerExtra.default;
    StealthPlugin = stealthPlugin.default;
    
    // Configure puppeteer-extra with stealth plugin
    puppeteer.use(StealthPlugin());
  }
}

// Constants
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DEFAULT_VIEWPORT_WIDTH = 1920;
const DEFAULT_VIEWPORT_HEIGHT = 1080;
const DEFAULT_SCRAPE_DELAY_MIN = 1000;
const DEFAULT_SCRAPE_DELAY_MAX = 3000;
const DEFAULT_BATCH_DELAY_MIN = 2000;
const DEFAULT_BATCH_DELAY_MAX = 5000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_INITIAL_DELAY = 1000;
const DEFAULT_RETRY_MAX_DELAY = 10000;
const DEFAULT_RETRY_BACKOFF_FACTOR = 2;

// Security constants
const MAX_URLS_PER_REQUEST = 10;

// Input validation utilities
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string): string {
  // Remove any potentially dangerous characters
  return url.trim().replace(/[<>'"]/g, '');
}

function validatePrompt(prompt: string): boolean {
  // Basic prompt validation - prevent extremely long prompts
  return prompt.length > 0 && prompt.length < 10000;
}

// Types
interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  markdown: string;
  html: string;
  success: boolean;
  error?: string;
}

interface ExtractedData {
  url: string;
  data: any;
  success: boolean;
  error?: string;
}

interface ScrapeOptions {
  url: string;
  onlyMainContent?: boolean;
}

interface BatchScrapeOptions {
  urls: string[];
  onlyMainContent?: boolean;
}

interface ExtractOptions {
  urls: string[];
  prompt: string;
  schema?: any;
  enableWebSearch?: boolean;
}
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

const SCREENSHOT_TOOL: Tool = {
  name: 'screenshot',
  description: 'Take a screenshot of a webpage using stealth browser',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Webpage URL to screenshot' },
      width: { 
        type: 'number', 
        description: 'Viewport width in pixels',
        default: 1920
      },
      height: { 
        type: 'number', 
        description: 'Viewport height in pixels', 
        default: 1080
      },
      fullPage: { 
        type: 'boolean', 
        description: 'Capture full page height',
        default: false
      },
    },
    required: ['url'],
  },
};

// Lightweight tool definitions for essential Firecrawl functionality

// Local web scraping functions
async function screenshotWebpage(url: string, width: number = 1920, height: number = 1080, fullPage: boolean = false): Promise<{ success: boolean; imagePath?: string; error?: string; }> {
  // Initialize puppeteer modules
  await initializePuppeteer();
  
  // SECURITY: Validate and sanitize URL
  if (!isValidUrl(url)) {
    return {
      success: false,
      error: 'Invalid URL format. Only HTTP and HTTPS URLs are allowed.'
    };
  }

  const sanitizedUrl = sanitizeUrl(url);

  let browser;
  try {
    // Get proxy configuration with rotation
    const proxyUrl = getNextProxy();
    const proxyUsername = CONFIG.proxy.username;
    const proxyPassword = CONFIG.proxy.password;
    
    // Get scraping configuration with user agent rotation
    const customUserAgent = getNextUserAgent();
    const delayMin = CONFIG.scraping.delayMin;
    const delayMax = CONFIG.scraping.delayMax;

    // Build Puppeteer launch options with enhanced anti-detection
    const launchOptions: any = {
      headless: 'new', // Use new headless mode for better stealth
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--no-default-browser-check',
        '--no-experiments',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-pings',
        '--no-session-id',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        `--user-agent=${customUserAgent}`
      ]
    };
    
    // Add proxy configuration if available
    if (proxyUrl) {
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
      
      if (proxyUsername && proxyPassword) {
        console.error(`Using authenticated proxy for screenshot: [REDACTED]`);
      } else {
        console.error(`Using proxy for screenshot: ${proxyUrl}`);
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Enhanced anti-detection setup
    await page.setUserAgent(customUserAgent);
    
    // Set viewport
    await page.setViewport({ width, height });
    
    // Add common browser properties to avoid detection
    await page.evaluateOnNewDocument(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // Mock common browser APIs
      (window as any).chrome = { runtime: {} };
    });
    
    // Handle proxy authentication if credentials are provided
    if (proxyUrl && proxyUsername && proxyPassword) {
      await page.authenticate({
        username: proxyUsername,
        password: proxyPassword
      });
    }
    
    // Add random delay before navigation
    const delay = Math.floor(Math.random() * (delayMax - delayMin)) + delayMin;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Navigate to the page
    await page.goto(sanitizedUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Simulate human-like behavior
    const humanDelay = Math.floor(Math.random() * 3000) + 2000;
    await new Promise(resolve => setTimeout(resolve, humanDelay));
    
    // Simulate human scrolling behavior
    await page.evaluate(() => {
      window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
    });
    
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
    
    // Scroll back up slightly
    await page.evaluate(() => {
      window.scrollBy(0, -Math.floor(Math.random() * 100) - 50);
    });
    
    // Final wait for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create local tmp directory if it doesn't exist
    const fs = await import('fs/promises');
    const path = await import('path');
    const tmpDir = path.join(process.cwd(), 'tmp');
    
    try {
      await fs.mkdir(tmpDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const domain = new URL(sanitizedUrl).hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `screenshot-${domain}-${timestamp}.png`;
    const imagePath = path.join(tmpDir, filename);
    
    // Take the screenshot
    await page.screenshot({ 
      path: imagePath,
      fullPage,
      type: 'png'
    });
    
    return {
      success: true,
      imagePath
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeWebpage(url: string, onlyMainContent: boolean = true): Promise<ScrapedContent> {
  // Initialize puppeteer modules
  await initializePuppeteer();
  
  // SECURITY: Validate and sanitize URL
  if (!isValidUrl(url)) {
    return {
      url,
      title: '',
      content: '',
      markdown: '',
      html: '',
      success: false,
      error: 'Invalid URL format. Only HTTP and HTTPS URLs are allowed.'
    };
  }

  const sanitizedUrl = sanitizeUrl(url);

  let browser;
  try {
    // Get proxy configuration with rotation
    const proxyUrl = getNextProxy();
    const proxyUsername = CONFIG.proxy.username;
    const proxyPassword = CONFIG.proxy.password;
    

    // Get scraping configuration with user agent rotation
    const customUserAgent = getNextUserAgent();
    const viewportWidth = CONFIG.scraping.viewportWidth;
    const viewportHeight = CONFIG.scraping.viewportHeight;
    const delayMin = CONFIG.scraping.delayMin;
    const delayMax = CONFIG.scraping.delayMax;

    // Build Puppeteer launch options with enhanced anti-detection
    // SECURITY: Removed --disable-web-security which is a major security risk
    const launchOptions: any = {
      headless: 'new', // Use new headless mode for better stealth
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--no-default-browser-check',
        '--no-experiments',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-pings',
        '--no-session-id',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        `--user-agent=${customUserAgent}`
      ]
    };
    
    // Add proxy configuration if available
    if (proxyUrl) {
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
      
      // If proxy requires authentication, we'll handle it in the page setup
      if (proxyUsername && proxyPassword) {
        // SECURITY: Never log proxy URLs that might contain credentials
        console.error(`Using authenticated proxy: [REDACTED]`);
      } else {
        console.error(`Using proxy: ${proxyUrl}`);
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Enhanced anti-detection setup
    await page.setUserAgent(customUserAgent);
    
    // Set viewport to common desktop size
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
    
    // Add common browser properties to avoid detection
    await page.evaluateOnNewDocument(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // Mock common browser APIs
      (window as any).chrome = { runtime: {} };
    });
    
    // Handle proxy authentication if credentials are provided
    if (proxyUrl && proxyUsername && proxyPassword) {
      await page.authenticate({
        username: proxyUsername,
        password: proxyPassword
      });
    }
    
    // Add random delay before navigation
    const delay = Math.floor(Math.random() * (delayMax - delayMin)) + delayMin;
    await new Promise(resolve => setTimeout(resolve, delay));

    // SECURITY: Use sanitized URL and add timeout
    await page.goto(sanitizedUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Simulate human-like behavior
    // Random delay between 2-5 seconds
    const humanDelay = Math.floor(Math.random() * 3000) + 2000;
    await new Promise(resolve => setTimeout(resolve, humanDelay));
    
    // Simulate human scrolling behavior
    await page.evaluate(() => {
      // Scroll a bit like a human would
      window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
    });
    
    // Another small delay
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
    
    // Scroll back up slightly
    await page.evaluate(() => {
      window.scrollBy(0, -Math.floor(Math.random() * 100) - 50);
    });
    
    // Final wait for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract title
    const title = await page.title();
    
    // Extract content based on preference
    let content = '';
    let markdown = '';
    
    if (onlyMainContent) {
      // Try to extract main content using common selectors
      const mainContent = await page.evaluate(() => {
        const selectors = [
          'main',
          '[role="main"]',
          '.content',
          '.post-content',
          '.entry-content',
          'article',
          '.article-content',
          '#content',
          '.main-content'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.trim().length > 100) {
            return element.textContent.trim();
          }
        }
        
        // Fallback to body content
        return document.body.textContent || '';
      });
      content = mainContent;
      markdown = content;
    } else {
      // Extract full page content
      content = await page.evaluate(() => document.body.textContent || '');
      markdown = content;
    }
    
    // Get HTML
    const html = await page.content();
    
    
    return {
      url,
      title,
      content,
      markdown,
      html,
      success: true
    };
    
  } catch (error) {
    return {
      url,
      title: '',
      content: '',
      markdown: '',
      html: '',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function extractDataWithLLM(url: string, prompt: string, schema?: any): Promise<ExtractedData> {
  // SECURITY: Validate inputs
  if (!isValidUrl(url)) {
    return {
      url,
      data: null,
      success: false,
      error: 'Invalid URL format. Only HTTP and HTTPS URLs are allowed.'
    };
  }

  if (!validatePrompt(prompt)) {
    return {
      url,
      data: null,
      success: false,
      error: 'Invalid prompt. Prompt must be between 1 and 10,000 characters.'
    };
  }

  const sanitizedUrl = sanitizeUrl(url);
  const sanitizedPrompt = prompt.trim();

  try {
    // First scrape the webpage
    const scraped = await scrapeWebpage(url, true);
    if (!scraped.success) {
      return {
        url,
        data: null,
        success: false,
        error: scraped.error
      };
    }
    
    // Get LLM configuration
    const LLM_API_KEY = CONFIG.llm.apiKey;
    const LLM_PROVIDER_BASE_URL = CONFIG.llm.providerBaseUrl;
    const LLM_MODEL = CONFIG.llm.model;
    
    if (!LLM_API_KEY || !LLM_PROVIDER_BASE_URL || !LLM_MODEL) {
      return {
        url,
        data: null,
        success: false,
        error: 'LLM configuration not available'
      };
    }
    
    // Prepare the extraction prompt
    const extractionPrompt = `
You are a data extraction assistant. Extract information from the following webpage content based on the user's request.

Webpage URL: ${sanitizedUrl}
Webpage Title: ${scraped.title}

Content:
${scraped.content}

${schema ? `Extract data according to this JSON schema: ${JSON.stringify(schema, null, 2)}` : ''}

User Request: ${sanitizedPrompt}

Please provide the extracted data in JSON format. ${schema ? 'Ensure the response matches the provided schema.' : 'Structure the data logically based on the content and request.'}
`;
    
    // Get proxy configuration for LLM API calls with rotation
    const proxyUrl = getNextProxy();
    const proxyUsername = CONFIG.proxy.username;
    const proxyPassword = CONFIG.proxy.password;
    
    // Build axios configuration
    const axiosConfig: any = {
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Add proxy configuration if available
    if (proxyUrl) {
      const proxyConfig: any = {
        host: proxyUrl.replace(/^https?:\/\//, '').split(':')[0],
        port: parseInt(proxyUrl.split(':').pop() || '80'),
        protocol: proxyUrl.startsWith('https') ? 'https' : 'http'
      };
      
      if (proxyUsername && proxyPassword) {
        proxyConfig.auth = {
          username: proxyUsername,
          password: proxyPassword
        };
      }
      
      axiosConfig.proxy = proxyConfig;
      // SECURITY: Never log proxy URLs that might contain credentials
      console.error(`Using proxy for LLM API: [REDACTED]`);
    }
    
    // Call LLM API with timeout for security
    const response = await axios.post(`${LLM_PROVIDER_BASE_URL}/chat/completions`, {
      model: LLM_MODEL,
      messages: [
        {
          role: 'user',
          content: extractionPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      ...axiosConfig,
      timeout: 60000, // 60 second timeout for security
      maxContentLength: 10 * 1024 * 1024, // 10MB max response size
      maxBodyLength: 10 * 1024 * 1024
    });
    
    const llmResponse = response.data.choices[0].message.content;
    
    // Try to parse JSON from the response
    try {
      const extractedData = JSON.parse(llmResponse);
      return {
        url,
        data: extractedData,
        success: true
      };
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      return {
        url,
        data: { raw_response: llmResponse },
        success: true
      };
    }
    
  } catch (error) {
    // SECURITY: Prevent information disclosure in error messages
    const isAxiosError = axios.isAxiosError(error);
    let safeErrorMessage = 'An error occurred while processing the request';

    if (isAxiosError) {
      // Only expose safe error information
      if (error.response?.status === 401) {
        safeErrorMessage = 'Authentication failed with LLM provider';
      } else if (error.response?.status === 429) {
        safeErrorMessage = 'Rate limit exceeded with LLM provider';
      } else if (error.code === 'ECONNABORTED') {
        safeErrorMessage = 'Request timeout - LLM provider took too long to respond';
      }
    }

    return {
      url: sanitizedUrl,
      data: null,
      success: false,
      error: safeErrorMessage
    };
  }
}

// Type guards
function isScrapeOptions(args: unknown): args is { url: string; onlyMainContent?: boolean } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isScreenshotOptions(args: unknown): args is { url: string; width?: number; height?: number; fullPage?: boolean } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isBatchScrapeOptions(args: unknown): args is { urls: string[]; onlyMainContent?: boolean } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'urls' in args &&
    Array.isArray((args as { urls: unknown }).urls)
  );
}

function isExtractOptions(args: unknown): args is { urls: string[]; prompt: string; schema?: any; enableWebSearch?: boolean } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'urls' in args &&
    'prompt' in args &&
    Array.isArray((args as { urls: unknown }).urls) &&
    typeof (args as { prompt: unknown }).prompt === 'string'
  );
}

// Remove all complex tools - keep only essential ones above

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

// Proxy rotation state
let currentProxyIndex = 0;
let availableProxies: string[] = [];

// Parse proxy URL with range support
function parseProxyUrls(proxyUrl: string): string[] {
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

// Get next proxy URL with rotation
function getNextProxy(): string | undefined {
  if (availableProxies.length === 0) return undefined;
  
  const proxy = availableProxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % availableProxies.length;
  
  return proxy;
}

// Initialize proxy list
availableProxies = parseProxyUrls(process.env.PROXY_SERVER_URL || '');

// User agent rotation state
let currentUserAgentIndex = 0;
let availableUserAgents: string[] = [];

// Parse user agent array with JSON support
function parseUserAgents(userAgentEnv: string): string[] {
  if (!userAgentEnv) return [DEFAULT_USER_AGENT];
  
  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(userAgentEnv);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(ua => typeof ua === 'string' && ua.trim().length > 0);
    }
  } catch {
    // Not JSON, treat as single user agent
  }
  
  // Single user agent string
  return [userAgentEnv.trim()];
}

// Get next user agent with rotation
function getNextUserAgent(): string {
  if (availableUserAgents.length === 0) return DEFAULT_USER_AGENT;
  
  const userAgent = availableUserAgents[currentUserAgentIndex];
  currentUserAgentIndex = (currentUserAgentIndex + 1) % availableUserAgents.length;
  
  return userAgent;
}

// Initialize user agent list
availableUserAgents = parseUserAgents(process.env.SCRAPE_USER_AGENT || '');

// Configuration for retries and monitoring
const CONFIG = {
  scraping: {
    userAgent: process.env.SCRAPE_USER_AGENT || DEFAULT_USER_AGENT,
    viewportWidth: Number(process.env.SCRAPE_VIEWPORT_WIDTH) || DEFAULT_VIEWPORT_WIDTH,
    viewportHeight: Number(process.env.SCRAPE_VIEWPORT_HEIGHT) || DEFAULT_VIEWPORT_HEIGHT,
    delayMin: Number(process.env.SCRAPE_DELAY_MIN) || DEFAULT_SCRAPE_DELAY_MIN,
    delayMax: Number(process.env.SCRAPE_DELAY_MAX) || DEFAULT_SCRAPE_DELAY_MAX,
    batchDelayMin: Number(process.env.SCRAPE_BATCH_DELAY_MIN) || DEFAULT_BATCH_DELAY_MIN,
    batchDelayMax: Number(process.env.SCRAPE_BATCH_DELAY_MAX) || DEFAULT_BATCH_DELAY_MAX,
  },
  retry: {
    maxAttempts: Number(process.env.FIRECRAWL_RETRY_MAX_ATTEMPTS) || DEFAULT_RETRY_ATTEMPTS,
    initialDelay: Number(process.env.FIRECRAWL_RETRY_INITIAL_DELAY) || DEFAULT_RETRY_INITIAL_DELAY,
    maxDelay: Number(process.env.FIRECRAWL_RETRY_MAX_DELAY) || DEFAULT_RETRY_MAX_DELAY,
    backoffFactor: Number(process.env.FIRECRAWL_RETRY_BACKOFF_FACTOR) || DEFAULT_RETRY_BACKOFF_FACTOR,
  },
  llm: {
    apiKey: process.env.LLM_API_KEY,
    providerBaseUrl: process.env.LLM_PROVIDER_BASE_URL,
    model: process.env.LLM_MODEL,
  },
  proxy: {
    url: process.env.PROXY_SERVER_URL,
    username: process.env.PROXY_SERVER_USERNAME,
    password: process.env.PROXY_SERVER_PASSWORD,
  },
};

// Get LLM configuration
const LLM_PROVIDER_BASE_URL = CONFIG.llm.providerBaseUrl;
const LLM_MODEL = CONFIG.llm.model;

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
        SCREENSHOT_TOOL,
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

          // SECURITY: Validate URL before processing
          if (!isValidUrl(args.url)) {
            throw new Error('Invalid URL format. Only HTTP and HTTPS URLs are allowed.');
          }

          const result = await scrapeWebpage(args.url, args.onlyMainContent !== false);
          return {
            content: [{ type: 'text', text: result.success ? result.markdown : `Error: ${result.error}` }],
            isError: !result.success,
          };
        }

        case 'screenshot': {
          if (!isScreenshotOptions(args)) {
            throw new Error('Invalid arguments for screenshot');
          }

          // SECURITY: Validate URL before processing
          if (!isValidUrl(args.url)) {
            throw new Error('Invalid URL format. Only HTTP and HTTPS URLs are allowed.');
          }

          const result = await screenshotWebpage(
            args.url, 
            args.width || 1920, 
            args.height || 1080, 
            args.fullPage || false
          );
          
          if (result.success && result.imagePath) {
            return {
              content: [{ 
                type: 'text', 
                text: `Screenshot saved successfully: ${result.imagePath}` 
              }],
              isError: false,
            };
          } else {
            return {
              content: [{ 
                type: 'text', 
                text: `Screenshot failed: ${result.error}` 
              }],
              isError: true,
            };
          }
        }

        case 'batch_scrape': {
          if (!isBatchScrapeOptions(args)) {
            throw new Error('Invalid arguments for batch_scrape: urls array required');
          }

          // SECURITY: Validate all URLs before processing
          const invalidUrls = args.urls.filter(url => !isValidUrl(url));
          if (invalidUrls.length > 0) {
            throw new Error(`Invalid URL format detected: ${invalidUrls.join(', ')}. Only HTTP and HTTPS URLs are allowed.`);
          }

          // SECURITY: Limit batch size to prevent abuse
          if (args.urls.length > 10) {
            throw new Error('Batch size limited to 10 URLs maximum for security and performance reasons.');
          }

          const results = [];
          for (const url of args.urls) {
            try {
              const result = await scrapeWebpage(url, args.onlyMainContent !== false);
              results.push({
                url,
                success: result.success,
                title: result.title,
                content: result.success ? result.markdown : `Error: ${result.error}`
              });
            } catch (error) {
              results.push({
                url,
                success: false,
                error: error instanceof Error ? error.message : String(error)
              });
            }
            // Add random delay between requests to avoid rate limiting
            const batchDelay = Math.floor(Math.random() * (CONFIG.scraping.batchDelayMax - CONFIG.scraping.batchDelayMin)) + CONFIG.scraping.batchDelayMin;
            await delay(batchDelay);
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            isError: false,
          };
        }

        case 'extract_data': {
          if (!isExtractOptions(args)) {
            throw new Error('Invalid arguments for extract_data: urls array and prompt required');
          }

          // SECURITY: Validate all URLs
          const invalidUrls = args.urls.filter(url => !isValidUrl(url));
          if (invalidUrls.length > 0) {
            throw new Error(`Invalid URL format detected: ${invalidUrls.join(', ')}. Only HTTP and HTTPS URLs are allowed.`);
          }

          // SECURITY: Validate prompt
          if (!validatePrompt(args.prompt)) {
            throw new Error('Invalid prompt. Prompt must be between 1 and 10,000 characters.');
          }

          // SECURITY: Limit batch size
          if (args.urls.length > 5) {
            throw new Error('Extraction limited to 5 URLs maximum for security and performance reasons.');
          }

          const results = [];
          for (const url of args.urls) {
            try {
              const result = await extractDataWithLLM(url, args.prompt);
              results.push({
                url,
                success: result.success,
                data: result.success ? result.data : `Error: ${result.error}`
              });
            } catch (error) {
              results.push({
                url,
                success: false,
                error: error instanceof Error ? error.message : String(error)
              });
            }
            // Add delay between requests
            await delay(1000);
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            isError: false,
          };
        }

        case 'extract_with_schema': {
          if (!isExtractOptions(args) || !args.schema) {
            throw new Error('Invalid arguments for extract_with_schema: urls array, schema, and prompt required');
          }

          // Security validations
          if (!Array.isArray(args.urls) || args.urls.length === 0) {
            throw new Error('Invalid arguments: urls must be a non-empty array');
          }

          if (args.urls.length > MAX_URLS_PER_REQUEST) {
            throw new Error(`Too many URLs: maximum ${MAX_URLS_PER_REQUEST} URLs allowed per request`);
          }

          // Validate and sanitize each URL
          const sanitizedUrls: string[] = [];
          for (const url of args.urls) {
            if (typeof url !== 'string') {
              throw new Error('Invalid URL format: all URLs must be strings');
            }

            if (!isValidUrl(url)) {
              throw new Error(`Invalid URL: ${url}`);
            }

            const sanitizedUrl = sanitizeUrl(url);
            if (!sanitizedUrl) {
              throw new Error(`Failed to sanitize URL: ${url}`);
            }

            sanitizedUrls.push(sanitizedUrl);
          }

          // Validate and sanitize prompt
          if (typeof args.prompt !== 'string') {
            throw new Error('Invalid prompt: must be a string');
          }

          if (!validatePrompt(args.prompt)) {
            throw new Error('Invalid prompt: must be between 1 and 10,000 characters');
          }

          const sanitizedPrompt = args.prompt.trim();

          // Validate schema (basic validation)
          if (typeof args.schema !== 'object' || args.schema === null) {
            throw new Error('Invalid schema: must be a valid object');
          }

          const results = [];
          for (const url of sanitizedUrls) {
            try {
              const result = await extractDataWithLLM(url, sanitizedPrompt, args.schema);
              results.push({
                url,
                success: result.success,
                data: result.success ? result.data : `Error: ${result.error}`
              });
            } catch (error) {
              // Prevent information disclosure in error messages
              const safeErrorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              results.push({
                url,
                success: false,
                error: safeErrorMessage.replace(/[^\w\s\-.:]/g, '') // Remove potentially sensitive characters
              });
            }
            // Add delay between requests to prevent rate limiting
            await delay(1000);
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
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
      `LLM Configuration: ${LLM_PROVIDER_BASE_URL ? 'Configured' : 'Not configured'} (${LLM_MODEL || 'no model'})`
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

  app.get('/sse', async (_req, res) => {
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

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      server: 'Firecrawl Lite MCP Server',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

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
// Server startup - conditional based on environment
if (process.env.HTTP_STREAMABLE_SERVER === 'true') {
  console.error('Starting HTTP Streamable MCP Server...');
  runHTTPStreamableServer().catch((error: any) => {
    console.error('Fatal error running HTTP server:', error);
    process.exit(1);
  });
} else {
  console.error('Starting stdio MCP Server...');
  runLocalServer().catch((error: any) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
  });
}

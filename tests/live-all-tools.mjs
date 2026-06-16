import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const BASE = process.argv[2];
if (!BASE) {
  console.error('Usage: node tests/live-all-tools.mjs <base-url>');
  process.exit(2);
}

const client = new Client({ name: 'all-tools', version: '1.0.0' }, { capabilities: {} });
await client.connect(new SSEClientTransport(new URL(`${BASE}/sse`)));
console.log('Connected.\n');

function textOf(res) {
  return (res.content ?? []).filter((p) => p.type === 'text').map((p) => p.text).join('\n');
}

async function run(label, args) {
  const t = Date.now();
  try {
    const res = await client.callTool(args);
    const secs = ((Date.now() - t) / 1000).toFixed(1);
    let body = textOf(res);
    if (body.length > 600) body = body.slice(0, 600) + ` … [${body.length} chars total]`;
    console.log(`▶ ${label}  (${secs}s)\n${body}\n`);
  } catch (e) {
    console.log(`▶ ${label}  ERROR: ${e.message}\n`);
  }
}

await run('scrape_page', {
  name: 'scrape_page',
  arguments: { url: 'https://example.com' },
});

await run('batch_scrape', {
  name: 'batch_scrape',
  arguments: { urls: ['https://example.com', 'https://example.org'], onlyMainContent: true },
});

await run('extract_data', {
  name: 'extract_data',
  arguments: {
    urls: ['https://example.com'],
    prompt: 'Return JSON with page_title and first_paragraph.',
  },
});

await run('extract_with_schema', {
  name: 'extract_with_schema',
  arguments: {
    urls: ['https://example.com'],
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
      },
      required: ['title'],
    },
  },
});

await run('screenshot', {
  name: 'screenshot',
  arguments: { url: 'https://example.com', fullPage: false },
});

await client.close();
process.exit(0);

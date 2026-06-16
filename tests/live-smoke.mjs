import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Manual end-to-end smoke test against a running SSE deployment.
//   node tests/live-smoke.mjs http://your-host:3000
// Not run in CI (the Tests workflow only runs *.test.ts unit tests).
const BASE = process.argv[2] || process.env.SMOKE_BASE_URL;
if (!BASE) {
  console.error('Usage: node tests/live-smoke.mjs <base-url>  (e.g. http://host:3000)');
  process.exit(2);
}

const client = new Client({ name: 'live-smoke', version: '1.0.0' }, { capabilities: {} });
const transport = new SSEClientTransport(new URL(`${BASE}/sse`));

console.log(`Connecting to ${BASE}/sse ...`);
await client.connect(transport);
console.log('✅ Connected (MCP handshake OK)');

const { tools } = await client.listTools();
console.log(`✅ Tools (${tools.length}): ${tools.map((t) => t.name).join(', ')}`);

console.log('\nCalling extract_data on https://example.com (exercises the LLM path)...');
const started = Date.now();
const res = await client.callTool({
  name: 'extract_data',
  arguments: {
    urls: ['https://example.com'],
    prompt: 'Return JSON with the page title and the first paragraph of body text.',
  },
});
console.log(`✅ extract_data returned in ${((Date.now() - started) / 1000).toFixed(1)}s`);
for (const part of res.content ?? []) {
  if (part.type === 'text') console.log(part.text.slice(0, 1200));
}

await client.close();
process.exit(0);

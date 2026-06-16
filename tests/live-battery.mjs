import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const BASE = process.argv[2];
if (!BASE) { console.error('Usage: node tests/live-battery.mjs <base-url>'); process.exit(2); }

const URLS = [
  'https://books.toscrape.com/',
  'https://quotes.toscrape.com/js/',
  'https://quotes.toscrape.com/js-delayed/',
  'https://webscraper.io/test-sites/e-commerce/ajax',
  'https://webscraper.io/test-sites/e-commerce/scroll/computers/tablets',
  'https://www.zillow.com/charlotte-nc/',
  'https://www.amazon.com/laptop/s?k=laptop',
  'https://www.linkedin.com/jobs/artificial-intelligence-jobs-raleigh-nc/?currentJobId=4381110630',
  'https://www.google.com/maps/search/restaurants%2Bnear%2Bme/@35.7487994,-78.8797973,13z',
  'https://www.reddit.com/r/LocalLLaMA/comments/14djns5/llamacpp_and_thread_count_optimization/',
];

const client = new Client({ name: 'battery', version: '1.0.0' }, { capabilities: {} });
await client.connect(new SSEClientTransport(new URL(`${BASE}/sse`)));
console.log(`Connected to ${BASE}\n`);

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`client-timeout ${ms}ms`)), ms))]);

for (const url of URLS) {
  const t = Date.now();
  let line;
  try {
    const res = await withTimeout(
      client.callTool({ name: 'scrape_page', arguments: { url } }),
      90000,
    );
    const text = (res.content ?? []).filter((p) => p.type === 'text').map((p) => p.text).join('\n');
    const secs = ((Date.now() - t) / 1000).toFixed(1);
    const isErr = res.isError || text.startsWith('Error:');
    const preview = text.replace(/\n+/g, ' ⏎ ').slice(0, 220);
    line = `${isErr ? '❌' : '✅'} [${secs}s] ${url}\n   chars=${text.length}  ${preview}`;
  } catch (e) {
    const secs = ((Date.now() - t) / 1000).toFixed(1);
    line = `⏱️  [${secs}s] ${url}\n   ${e.message}`;
  }
  console.log(line + '\n');
}

await client.close();
process.exit(0);

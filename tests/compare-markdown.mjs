// Before/after demo: previous plain-text output vs new Markdown pipeline.
//   node tests/compare-markdown.mjs <url> [charLimit]
import { load } from 'cheerio';
import { htmlToMarkdown } from '../dist/htmlToMarkdown.js';

const url = process.argv[2];
const LIMIT = Number(process.argv[3] || 900);
if (!url) {
  console.error('Usage: node tests/compare-markdown.mjs <url> [charLimit]');
  process.exit(2);
}

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; firecrawl-lite-demo)' } });
const html = await res.text();

// "OLD" — approximate the previous behavior: document.body.textContent.
// (Give it the benefit of the doubt by stripping <script>/<style> first.)
const $ = load(html);
$('script, style, noscript').remove();
const oldText = ($('body').text() || '').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();

// "NEW" — real markdown, main content only.
const newMd = htmlToMarkdown(html, { onlyMainContent: true, baseUrl: url });

const clip = (s) => (s.length > LIMIT ? s.slice(0, LIMIT) + `\n… [${s.length} chars total]` : s);

console.log(`\n############ ${url}\n`);
console.log('============ BEFORE (plain text blob) ============\n');
console.log(clip(oldText));
console.log('\n============ AFTER (markdown, onlyMainContent) ============\n');
console.log(clip(newMd));
console.log('\n');

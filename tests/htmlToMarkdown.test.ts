import { test } from 'node:test';
import assert from 'node:assert/strict';

import { htmlToMarkdown, htmlToText } from '../src/htmlToMarkdown.js';

const SAMPLE = `
<html>
  <head><title>T</title><style>.x{}</style><script>console.log(1)</script></head>
  <body>
    <header><nav><a href="/home">Home</a></nav></header>
    <main>
      <h1>Main Title</h1>
      <p>A paragraph with a <a href="/docs">relative link</a> and <strong>bold</strong>.</p>
      <ul><li>One</li><li>Two</li></ul>
      <img src="/img/pic.png" alt="pic" />
    </main>
    <footer>Copyright 2026 · <a href="/privacy">Privacy</a></footer>
  </body>
</html>`;

test('htmlToMarkdown produces real markdown structure', () => {
  const md = htmlToMarkdown(SAMPLE, { baseUrl: 'https://example.com' });
  assert.match(md, /^# Main Title/m); // heading
  assert.match(md, /^-\s+One/m); // list item
  assert.match(md, /\*\*bold\*\*/); // bold
});

test('htmlToMarkdown resolves relative links and images to absolute', () => {
  const md = htmlToMarkdown(SAMPLE, { baseUrl: 'https://example.com' });
  assert.match(md, /\(https:\/\/example\.com\/docs\)/); // link resolved
  assert.match(md, /https:\/\/example\.com\/img\/pic\.png/); // image resolved
});

test('htmlToMarkdown strips script/style content', () => {
  const md = htmlToMarkdown(SAMPLE);
  assert.doesNotMatch(md, /console\.log/);
  assert.doesNotMatch(md, /\.x\{\}/);
});

test('onlyMainContent removes header/nav/footer chrome', () => {
  const full = htmlToMarkdown(SAMPLE, { baseUrl: 'https://example.com' });
  const main = htmlToMarkdown(SAMPLE, { onlyMainContent: true, baseUrl: 'https://example.com' });
  assert.match(full, /Home/); // nav link present without onlyMainContent
  assert.doesNotMatch(main, /Home/); // nav removed
  assert.doesNotMatch(main, /Copyright/); // footer removed
  assert.match(main, /Main Title/); // main content kept
});

test('htmlToText returns readable text without markup', () => {
  const text = htmlToText(SAMPLE, { onlyMainContent: true });
  assert.match(text, /Main Title/);
  assert.match(text, /relative link/);
  assert.doesNotMatch(text, /[#*]/); // no markdown symbols
});

test('htmlToMarkdown handles empty/whitespace input', () => {
  assert.equal(htmlToMarkdown(''), '');
  assert.equal(htmlToMarkdown('   '), '');
});

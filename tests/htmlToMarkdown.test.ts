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

test('htmlToMarkdown converts tables to GFM (pipe) tables', () => {
  const html = `<table>
    <thead><tr><th>Name</th><th>Age</th></tr></thead>
    <tbody><tr><td>Ada</td><td>36</td></tr><tr><td>Alan</td><td>41</td></tr></tbody>
  </table>`;
  const md = htmlToMarkdown(html);
  assert.match(md, /\| Name \| Age \|/);
  assert.match(md, /\| --- \| --- \|/);
  assert.match(md, /\| Ada \| 36 \|/);
});

test('htmlToMarkdown strips inline base64 data-URI images', () => {
  const html =
    '<p>Hi</p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA" alt="tiny">' +
    '<img src="/real.png" alt="real">';
  const md = htmlToMarkdown(html, { baseUrl: 'https://example.com' });
  assert.doesNotMatch(md, /base64/);
  assert.doesNotMatch(md, /data:image/);
  assert.match(md, /https:\/\/example\.com\/real\.png/); // real image kept
});

test('onlyMainContent scopes to the dominant semantic container', () => {
  const html = `<body>
    <nav><a href="/x">nav junk</a></nav>
    <article>
      <h1>Real Article</h1>
      <p>${'This is the substantial body of the article. '.repeat(10)}</p>
    </article>
    <footer>footer junk</footer>
  </body>`;
  const md = htmlToMarkdown(html, { onlyMainContent: true });
  assert.match(md, /Real Article/);
  assert.doesNotMatch(md, /nav junk/);
  assert.doesNotMatch(md, /footer junk/);
});

test('htmlToMarkdown recovers lazy-loaded images from data-src', () => {
  const html =
    '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="/real/photo.jpg" alt="photo">';
  const md = htmlToMarkdown(html, { baseUrl: 'https://example.com' });
  assert.match(md, /https:\/\/example\.com\/real\/photo\.jpg/);
  assert.doesNotMatch(md, /data:image/);
});

test('tidy removes empty headings and stray image markers', () => {
  const html = '<h2></h2><p>Real text</p><img src="" alt=""><h3>   </h3>';
  const md = htmlToMarkdown(html);
  assert.doesNotMatch(md, /^#{1,6}\s*$/m); // no empty headings
  assert.doesNotMatch(md, /^!+\s*$/m); // no lone image markers
  assert.match(md, /Real text/);
});

test('tidy preserves bracket characters inside code blocks', () => {
  const html = '<pre><code>const a = [\n  1,\n  2,\n];</code></pre>';
  const md = htmlToMarkdown(html);
  assert.match(md, /\[\n\s+1,/); // array literal newline kept intact
});

test('tidy removes empty links and images', () => {
  const html = '<p>Text <a href="">empty</a> <a href="/ok">ok</a></p>';
  const md = htmlToMarkdown(html, { baseUrl: 'https://example.com' });
  assert.doesNotMatch(md, /\]\(\s*\)/); // no empty-target links
  assert.match(md, /\[ok\]\(https:\/\/example\.com\/ok\)/);
});

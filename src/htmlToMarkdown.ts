// HTML cleaning and Markdown conversion.
//
// Clean-room implementation using only permissively-licensed libraries
// (cheerio: MIT, turndown: MIT, turndown-plugin-gfm: MIT). Deliberately does
// NOT copy code from the AGPL-licensed Firecrawl project — only well-known,
// standard techniques.

import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Semantic containers that usually wrap the primary article/content.
const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '#main',
  '#content',
  '.main-content',
  '.post-content',
  '.entry-content',
  '.article-content',
  '.article-body',
];

// Elements that never carry readable content — always removed.
const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'iframe',
  'head',
  'meta',
  'link',
  'base',
];

// Structural / chrome elements removed when onlyMainContent is requested.
// These are common, generic selectors (not a copied list).
const NON_MAIN_SELECTORS = [
  'header',
  'footer',
  'nav',
  'aside',
  'form',
  '.header',
  '.footer',
  '.nav',
  '.navbar',
  '.navigation',
  '.menu',
  '.sidebar',
  '.aside',
  '.ad',
  '.ads',
  '.advert',
  '.advertisement',
  '.social',
  '.share',
  '.sharing',
  '.newsletter',
  '.subscribe',
  '.cookie',
  '.cookie-banner',
  '.consent',
  '.popup',
  '.modal',
  '.overlay',
  '.breadcrumb',
  '.breadcrumbs',
  '.pagination',
  '.related',
  '.comments',
  '#header',
  '#footer',
  '#nav',
  '#sidebar',
  '#comments',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="contentinfo"]',
  '[aria-hidden="true"]',
];

export interface CleanOptions {
  onlyMainContent?: boolean;
  baseUrl?: string;
}

// Find the semantic container that holds the bulk of the page's text. Returns
// the element only when it clearly dominates the body (avoids scoping to a tiny
// or empty <main>), otherwise undefined so the caller falls back to chrome
// stripping.
function pickMainContainer($: ReturnType<typeof load>): any | undefined {
  const bodyLen = $('body').text().replace(/\s+/g, ' ').trim().length;
  if (bodyLen === 0) return undefined;

  let best: any | undefined;
  let bestLen = 0;
  for (const selector of MAIN_CONTENT_SELECTORS) {
    $(selector).each((_, el) => {
      const len = $(el).text().replace(/\s+/g, ' ').trim().length;
      if (len > bestLen) {
        bestLen = len;
        best = el;
      }
    });
  }

  // Require the container to hold a meaningful share of the page text.
  if (best && bestLen >= 200 && bestLen / bodyLen >= 0.4) {
    return best;
  }
  return undefined;
}

// Load HTML into cheerio and strip noise, optionally reduce to main content,
// and resolve relative links/images to absolute URLs.
function clean(html: string, options: CleanOptions) {
  const $ = load(html);

  $(STRIP_SELECTORS.join(',')).remove();

  // Recover lazy-loaded images: many sites put a placeholder in src and the
  // real URL in a data-* attribute. Promote it before the base64 cull below.
  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    const lazy =
      $img.attr('data-src') ||
      $img.attr('data-original') ||
      $img.attr('data-lazy-src') ||
      $img.attr('data-lazy') ||
      $img.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0];
    if ((!src || src.startsWith('data:')) && lazy) {
      $img.attr('src', lazy);
    }
  });

  // Drop inline base64 / data-URI images — they bloat the output enormously
  // and carry no value for an LLM reader.
  $('img[src^="data:"]').remove();
  $('img[srcset^="data:"]').removeAttr('srcset');

  // Flatten layout tables (no <th> header row, or role="presentation"). The GFM
  // plugin only converts true data tables and leaves the rest as raw HTML, so
  // we collapse non-data tables to plain divs to keep that HTML out of the
  // Markdown. Genuine data tables (with <th>) are left for GFM to convert.
  $('table').each((_, el) => {
    const $t = $(el);
    const isPresentation = ($t.attr('role') || '').toLowerCase() === 'presentation';
    const hasHeader = $t.find('tr').first().find('th').length > 0;
    if (isPresentation || !hasHeader) {
      const rows = $t
        .find('tr')
        .map((_, r) =>
          `<div>${$(r)
            .find('td,th')
            .map((_, c) => $(c).html() ?? '')
            .get()
            .join(' ')}</div>`,
        )
        .get()
        .join('');
      $t.replaceWith(rows || '');
    }
  });

  if (options.onlyMainContent) {
    // Prefer a clear semantic content container when one holds the bulk of the
    // page text; otherwise fall back to stripping generic chrome from the body.
    const main = pickMainContainer($);
    if (main) {
      const mainHtml = $.html(main);
      $('body').empty().append(mainHtml);
    }
    $(NON_MAIN_SELECTORS.join(',')).remove();
  }

  if (options.baseUrl) {
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          $(el).attr('href', new URL(href, options.baseUrl).href);
        } catch {
          /* leave as-is if it can't be resolved */
        }
      }
    });
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          $(el).attr('src', new URL(src, options.baseUrl).href);
        } catch {
          /* leave as-is */
        }
      }
    });
  }

  return $;
}

function makeTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });
  // GFM support: tables, strikethrough, task lists.
  td.use(gfm);
  // Drop anything that survived but carries no readable value.
  td.remove(['script', 'style', 'noscript', 'iframe', 'form']);
  return td;
}

// Tidy up common turndown artifacts: empty links/images, stray escapes, and
// runs of blank lines.
function tidyMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\(\s*\)/g, '') // images with empty src
    .replace(/\[\s*\]\([^)]*\)/g, '') // links with empty text
    .replace(/\[([^\]]+)\]\(\s*\)/g, '$1') // links with empty href -> text
    .replace(/[ \t]+$/gm, '') // trailing whitespace
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim();
}

// Convert HTML to Markdown. Returns trimmed Markdown text.
export function htmlToMarkdown(html: string, options: CleanOptions = {}): string {
  const $ = clean(html, options);
  const body = $('body').html() ?? $.html() ?? '';
  if (!body.trim()) return '';

  const markdown = makeTurndown().turndown(body);
  return tidyMarkdown(markdown);
}

// Extract readable plain text (used for the `content` field).
export function htmlToText(html: string, options: CleanOptions = {}): string {
  const $ = clean(html, options);
  const text = ($('body').text() || $.root().text() || '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

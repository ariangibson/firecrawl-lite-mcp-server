// HTML cleaning and Markdown conversion.
//
// Clean-room implementation using only permissively-licensed libraries
// (cheerio: MIT, turndown: MIT). Deliberately does NOT copy code from the
// AGPL-licensed Firecrawl project — only well-known, standard techniques.

import { load } from 'cheerio';
import TurndownService from 'turndown';

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

// Load HTML into cheerio and strip noise, optionally reduce to main content,
// and resolve relative links/images to absolute URLs.
function clean(html: string, options: CleanOptions) {
  const $ = load(html);

  $(STRIP_SELECTORS.join(',')).remove();

  if (options.onlyMainContent) {
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
  // Drop anything that survived but carries no readable value.
  td.remove(['script', 'style', 'noscript', 'iframe', 'form']);
  return td;
}

// Convert HTML to Markdown. Returns trimmed Markdown text.
export function htmlToMarkdown(html: string, options: CleanOptions = {}): string {
  const $ = clean(html, options);
  const body = $('body').html() ?? $.html() ?? '';
  if (!body.trim()) return '';

  const markdown = makeTurndown().turndown(body);
  // Collapse excessive blank lines that turndown can leave behind.
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
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

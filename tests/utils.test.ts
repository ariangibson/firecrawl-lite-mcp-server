import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_USER_AGENT,
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_MAX_TOKENS,
  isValidUrl,
  sanitizeUrl,
  validatePrompt,
  parseProxyUrls,
  parseUserAgents,
  parseLlmConfig,
  buildLlmRequestBody,
  parseLlmJson,
} from '../src/utils.js';

test('isValidUrl accepts http and https', () => {
  assert.equal(isValidUrl('https://example.com'), true);
  assert.equal(isValidUrl('http://example.com/path?q=1'), true);
});

test('isValidUrl rejects non-http(s) and malformed urls', () => {
  assert.equal(isValidUrl('ftp://example.com'), false);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('not a url'), false);
  assert.equal(isValidUrl(''), false);
});

test('sanitizeUrl trims and strips dangerous characters', () => {
  assert.equal(sanitizeUrl('  https://example.com  '), 'https://example.com');
  assert.equal(
    sanitizeUrl('https://example.com/<script>"\''),
    'https://example.com/script'
  );
});

test('validatePrompt enforces length bounds', () => {
  assert.equal(validatePrompt(''), false);
  assert.equal(validatePrompt('extract the title'), true);
  assert.equal(validatePrompt('a'.repeat(9999)), true);
  assert.equal(validatePrompt('a'.repeat(10000)), false);
});

test('parseProxyUrls returns empty array when unset', () => {
  assert.deepEqual(parseProxyUrls(''), []);
});

test('parseProxyUrls passes through a single proxy url', () => {
  assert.deepEqual(parseProxyUrls('https://proxy.example.com:8080'), [
    'https://proxy.example.com:8080',
  ]);
});

test('parseProxyUrls expands a port range', () => {
  assert.deepEqual(parseProxyUrls('https://us.decodo.com:10001-10003'), [
    'https://us.decodo.com:10001',
    'https://us.decodo.com:10002',
    'https://us.decodo.com:10003',
  ]);
});

test('parseUserAgents falls back to the default when unset', () => {
  assert.deepEqual(parseUserAgents(''), [DEFAULT_USER_AGENT]);
});

test('parseUserAgents parses a JSON array', () => {
  const json = JSON.stringify(['UA-One', 'UA-Two']);
  assert.deepEqual(parseUserAgents(json), ['UA-One', 'UA-Two']);
});

test('parseUserAgents filters out blank entries in an array', () => {
  const json = JSON.stringify(['UA-One', '   ', 'UA-Two']);
  assert.deepEqual(parseUserAgents(json), ['UA-One', 'UA-Two']);
});

test('parseUserAgents treats non-JSON input as a single agent', () => {
  assert.deepEqual(parseUserAgents('  Custom/1.0  '), ['Custom/1.0']);
});

test('parseLlmConfig applies defaults when tuning vars are unset', () => {
  const cfg = parseLlmConfig({
    LLM_API_KEY: 'k',
    LLM_PROVIDER_BASE_URL: 'https://api.example.com/v1',
    LLM_MODEL: 'some-model',
  });
  assert.equal(cfg.apiKey, 'k');
  assert.equal(cfg.model, 'some-model');
  assert.equal(cfg.temperature, DEFAULT_LLM_TEMPERATURE);
  assert.equal(cfg.maxTokens, DEFAULT_LLM_MAX_TOKENS);
  assert.equal(cfg.topP, undefined);
  assert.equal(cfg.reasoningEffort, undefined);
});

test('parseLlmConfig reads tuning vars from the environment', () => {
  const cfg = parseLlmConfig({
    LLM_REASONING_EFFORT: 'high',
    LLM_MAX_TOKENS: '32768',
    LLM_TEMPERATURE: '1.0',
    LLM_TOP_P: '0.95',
  });
  assert.equal(cfg.reasoningEffort, 'high');
  assert.equal(cfg.maxTokens, 32768);
  assert.equal(cfg.temperature, 1.0);
  assert.equal(cfg.topP, 0.95);
});

test('parseLlmConfig honors an explicit temperature of 0', () => {
  const cfg = parseLlmConfig({ LLM_TEMPERATURE: '0' });
  assert.equal(cfg.temperature, 0);
});

test('parseLlmConfig honors an explicit top_p of 0', () => {
  const cfg = parseLlmConfig({ LLM_TOP_P: '0' });
  assert.equal(cfg.topP, 0);
});

test('parseLlmConfig ignores invalid numeric values', () => {
  const cfg = parseLlmConfig({
    LLM_MAX_TOKENS: 'not-a-number',
    LLM_TEMPERATURE: 'nope',
    LLM_TOP_P: 'bad',
  });
  assert.equal(cfg.maxTokens, DEFAULT_LLM_MAX_TOKENS);
  assert.equal(cfg.temperature, DEFAULT_LLM_TEMPERATURE);
  assert.equal(cfg.topP, undefined);
});

test('buildLlmRequestBody includes defaults and omits unset optionals', () => {
  const body = buildLlmRequestBody(
    'm',
    [{ role: 'user', content: 'hi' }],
    parseLlmConfig({})
  );
  assert.equal(body.model, 'm');
  assert.equal(body.temperature, DEFAULT_LLM_TEMPERATURE);
  assert.equal(body.max_tokens, DEFAULT_LLM_MAX_TOKENS);
  assert.equal('top_p' in body, false);
  assert.equal('reasoning_effort' in body, false);
});

test('parseLlmJson parses plain JSON', () => {
  assert.deepEqual(parseLlmJson('{"a":1,"b":"x"}'), { a: 1, b: 'x' });
});

test('parseLlmJson strips a ```json code fence', () => {
  const fenced = '```json\n{\n  "title": "Example Domain"\n}\n```';
  assert.deepEqual(parseLlmJson(fenced), { title: 'Example Domain' });
});

test('parseLlmJson strips a bare ``` code fence', () => {
  assert.deepEqual(parseLlmJson('```\n[1, 2, 3]\n```'), [1, 2, 3]);
});

test('parseLlmJson recovers a JSON object embedded in prose', () => {
  const text = 'Here is the data you requested:\n{"k": "v"}\nHope that helps!';
  assert.deepEqual(parseLlmJson(text), { k: 'v' });
});

test('parseLlmJson throws when there is no JSON', () => {
  assert.throws(() => parseLlmJson('sorry, I could not find anything'));
});

test('buildLlmRequestBody includes optional tuning params when set', () => {
  const cfg = parseLlmConfig({
    LLM_REASONING_EFFORT: 'high',
    LLM_MAX_TOKENS: '32768',
    LLM_TEMPERATURE: '1.0',
    LLM_TOP_P: '0.95',
  });
  const body = buildLlmRequestBody('m', [{ role: 'user', content: 'hi' }], cfg);
  assert.equal(body.max_tokens, 32768);
  assert.equal(body.temperature, 1.0);
  assert.equal(body.top_p, 0.95);
  assert.equal(body.reasoning_effort, 'high');
});

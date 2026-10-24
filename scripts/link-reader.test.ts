import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { anchorExists, createLinkReader, FETCH_TIMEOUT_MS, RETRY_DELAYS_MS, urls } from './link-reader.ts';

type Outcome = Response | Error | (() => Response | Promise<Response>);
const url = 'https://example.test/guide';
let root: string;
beforeAll(() => {
  const scratch = resolve(import.meta.dir, '../.scratch/issue-21');
  mkdirSync(scratch, { recursive: true });
  root = mkdtempSync(join(scratch, 'link-reader-test-'));
  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs/guide.md'), '# Present\n\n## Same\n\n## Same\n');
});
afterAll(() => { rmSync(root, { recursive: true, force: true }); });

function harness(outcomes: Outcome[], tutorialUrl = (link: string) => link.replace('http://localhost:3000', 'http://127.0.0.1:32123')) {
  const requests: { url: string; init?: RequestInit }[] = [];
  const sleeps: number[] = [];
  const reader = createLinkReader({ root, profileRef: 'fixed-ref', tutorialUrl }, {
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      const outcome = outcomes.shift();
      if (!outcome) throw new Error('unexpected fetch beyond supplied outcomes');
      if (outcome instanceof Error) throw outcome;
      return typeof outcome === 'function' ? outcome() : outcome;
    }) as typeof fetch,
    sleep: async milliseconds => { sleeps.push(milliseconds); },
  });
  return { ...reader, requests, sleeps };
}
const network = (code = 'ECONNRESET') => Object.assign(new TypeError('Unable to connect. Is the computer able to access the url?'), { code });
const ok = (body = 'readable') => new Response(body);
const check = (h: ReturnType<typeof harness>, link: string, source = '', local = true) => h.checkLink(link, source, 'rig-c/example', 'docs', local);

describe('production transport retry budget', () => {
  test('normal success is one fetch, preserves User-Agent, and has a finite timeout signal', async () => {
    const h = harness([ok()]);
    expect(await h.get(url)).toBe('readable');
    expect(h.requests.length).toBe(1); expect(h.sleeps).toEqual([]);
    expect(h.requests[0].init?.signal).toBeInstanceOf(AbortSignal);
    expect(h.requests[0].init?.signal?.aborted).toBe(false);
    expect(new Headers(h.requests[0].init?.headers).get('User-Agent')).toBe('rig-c-onboarding-link-check');
    expect(FETCH_TIMEOUT_MS).toBe(10_000);
    expect(RETRY_DELAYS_MS).toEqual([250, 750]);
    expect((RETRY_DELAYS_MS.length + 1) * FETCH_TIMEOUT_MS + RETRY_DELAYS_MS.reduce((a, b) => a + b, 0)).toBe(31_000);
  });
  test('503 then success releases the failed body and backs off once', async () => {
    let cancelled = 0;
    const failed = new Response(new ReadableStream({ cancel() { cancelled++; } }), { status: 503 });
    const h = harness([failed, ok()]);
    expect(await h.get(url)).toBe('readable');
    expect(cancelled).toBe(1); expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([250]);
  });
  test('different 5xx statuses recover at the last allowed attempt', async () => {
    const h = harness([new Response('', { status: 500 }), new Response('', { status: 599 }), ok('last')]);
    expect(await h.get(url)).toBe('last'); expect(h.requests.length).toBe(3); expect(h.sleeps).toEqual([250, 750]);
  });
  test('observed Bun ConnectionRefused network error recovers', async () => {
    const h = harness([network('ConnectionRefused'), ok()]);
    expect(await h.get(url)).toBe('readable'); expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([250]);
  });
  test('fetch network cause and generic cause-less network TypeError recover', async () => {
    const h = harness([new TypeError('fetch failed', { cause: Object.assign(new Error('socket'), { code: 'UND_ERR_SOCKET' }) }), new TypeError('Failed to fetch'), ok()]);
    expect(await h.get(url)).toBe('readable'); expect(h.requests.length).toBe(3); expect(h.sleeps).toEqual([250, 750]);
  });
  test('network failure while consuming a successful body retries transport only', async () => {
    const response = ok(); response.text = async () => { throw network(); };
    const h = harness([response, ok('complete body')]);
    expect(await h.get(url)).toBe('complete body'); expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([250]);
  });
  test('timeout/abort recovery remains bounded', async () => {
    const h = harness([new DOMException('deadline', 'TimeoutError'), new DOMException('deadline', 'AbortError'), ok()]);
    expect(await h.get(url)).toBe('readable'); expect(h.requests.length).toBe(3); expect(h.sleeps).toEqual([250, 750]);
  });
  test('exhausted 5xx budget remains LINK_HTTP failure', async () => {
    const h = harness([503, 502, 503].map(status => new Response('', { status })));
    await expect(h.get(url)).rejects.toThrow(`LINK_HTTP: ${url} returned 503`);
    expect(h.requests.length).toBe(3); expect(h.sleeps).toEqual([250, 750]);
  });
  test('exhausted network/timeout budgets preserve the last error', async () => {
    for (const last of [network(), new DOMException('deadline', 'TimeoutError')]) {
      const h = harness([network(), network(), last]);
      await expect(h.get(url)).rejects.toBe(last);
      expect(h.requests.length).toBe(3); expect(h.sleeps).toEqual([250, 750]);
    }
  });
  test('404 fails on exactly the first fetch; other non-5xx statuses also fail immediately', async () => {
    for (const status of [400, 401, 403, 404, 408, 429, 499]) {
      const h = harness([new Response('', { status })]);
      await expect(h.get(url)).rejects.toThrow(`LINK_HTTP: ${url} returned ${status}`);
      expect(h.requests.length).toBe(1); expect(h.sleeps).toEqual([]);
    }
  });
  test('programmer errors and explicit non-network fetch causes are never retried', async () => {
    for (const error of [new TypeError('Cannot read properties of undefined'), new Error('bug'), new TypeError('fetch failed', { cause: new Error('invalid request option') })]) {
      const h = harness([error]); await expect(h.get(url)).rejects.toBe(error);
      expect(h.requests.length).toBe(1); expect(h.sleeps).toEqual([]);
    }
  });
  test('response parser/programmer errors are not transport retries', async () => {
    const error = new SyntaxError('broken source parser'); const response = ok(); response.text = async () => { throw error; };
    const h = harness([response]); await expect(h.get(url)).rejects.toBe(error);
    expect(h.requests.length).toBe(1); expect(h.sleeps).toEqual([]);
  });
  test('invalid URLs fail before transport and sleep failures propagate', async () => {
    const h = harness([]); await expect(h.get('not a URL')).rejects.toBeInstanceOf(TypeError);
    expect(h.requests.length).toBe(0); expect(h.sleeps).toEqual([]);
    const error = new Error('sleep implementation failed'); let attempts = 0;
    const reader = createLinkReader({ root, profileRef: 'fixed-ref', tutorialUrl: s => s }, {
      fetch: (async () => { attempts++; return new Response('', { status: 503 }); }) as typeof fetch,
      sleep: async () => { throw error; },
    });
    await expect(reader.get(url)).rejects.toBe(error); expect(attempts).toBe(1);
  });
});

describe('production link/anchor readers retain strict content semantics', () => {
  test('successful HTML with a missing GitHub issue anchor fails without retry', async () => {
    const h = harness([ok('<main id="present"></main>')]);
    await expect(check(h, 'https://github.com/rig-c/core/issues/1#missing')).rejects.toThrow('LINK_ANCHOR');
    expect(h.requests.length).toBe(1); expect(h.sleeps).toEqual([]);
  });
  test('503 recovery does not retry a subsequent missing anchor', async () => {
    const h = harness([new Response('', { status: 503 }), ok('<main id="present"></main>')]);
    await expect(check(h, 'https://github.com/rig-c/core/issues/1#missing')).rejects.toThrow('LINK_ANCHOR');
    expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([250]);
  });
  test('a GitHub README missing anchor reads raw HEAD once, never API or content retry', async () => {
    const h = harness([ok('<html></html>'), ok('# Present\n')]);
    await expect(check(h, 'https://github.com/rig-c/core#missing')).rejects.toThrow('LINK_ANCHOR');
    expect(h.requests.map(r => r.url)).toEqual(['https://github.com/rig-c/core', 'https://raw.githubusercontent.com/rig-c/core/HEAD/README.md']);
    expect(h.sleeps).toEqual([]);
  });
  test('raw HEAD transport recovery retains successful source anchor checking', async () => {
    const h = harness([ok('<html></html>'), new Response('', { status: 503 }), ok('# Present\n')]);
    await check(h, 'https://github.com/rig-c/core#present');
    expect(h.requests.map(r => r.url)).toEqual(['https://github.com/rig-c/core', 'https://raw.githubusercontent.com/rig-c/core/HEAD/README.md', 'https://raw.githubusercontent.com/rig-c/core/HEAD/README.md']);
    expect(h.sleeps).toEqual([250]);
  });
  test('explicit GitHub blob/tree references retain their raw-source paths and readme special anchor', async () => {
    for (const [link, raw] of [
      ['https://github.com/rig-c/core/blob/tag/docs/NOTICE.md#present', 'https://raw.githubusercontent.com/rig-c/core/tag/docs/NOTICE.md'],
      ['https://github.com/rig-c/core/tree/main/docs#readme', 'https://raw.githubusercontent.com/rig-c/core/main/docs/README.md'],
    ]) {
      const h = harness([ok('<html></html>'), ok('# Present\n')]); await check(h, link);
      expect(h.requests[1].url).toBe(raw); expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([]);
    }
  });
  test('HTML user-content anchors are accepted and non-GitHub anchor policy stays unchanged', async () => {
    const h = harness([ok('<div id="user-content-present"></div>'), ok('external')]);
    await check(h, 'https://github.com/rig-c/core/issues/1#present'); await check(h, url + '#external-anchor');
    expect(h.requests.map(r => r.url)).toEqual(['https://github.com/rig-c/core/issues/1', url]); expect(h.sleeps).toEqual([]);
  });
  test('local file, same-document and duplicate-heading anchors do not fetch', async () => {
    const h = harness([]); await check(h, 'guide.md#present'); await check(h, 'guide.md#same-1'); await check(h, '#same-1', '# Same\n\n# Same\n');
    await expect(check(h, 'guide.md#missing')).rejects.toThrow('LINK_ANCHOR'); await expect(check(h, 'missing.md')).rejects.toThrow('ENOENT');
    expect(h.requests.length).toBe(0); expect(h.sleeps).toEqual([]);
  });
  test('remote relative files use the exact profile ref/directory', async () => {
    const h = harness([ok('# Present\n')]); await check(h, 'guide.md#present', '', false);
    expect(h.requests.map(r => r.url)).toEqual(['https://raw.githubusercontent.com/rig-c/example/fixed-ref/docs/guide.md']); expect(h.sleeps).toEqual([]);
  });
  test('malformed anchor decoding stays a parse error, not a retry', async () => {
    const h = harness([ok('html'), ok('# Present\n')]);
    await expect(check(h, 'https://github.com/rig-c/core#%E0%A4%A')).rejects.toBeInstanceOf(URIError);
    expect(h.requests.length).toBe(2); expect(h.sleeps).toEqual([]);
  });
  test('tutorial requests use the existing owned-server mapper; mapper failures never fetch', async () => {
    const h = harness([ok()]); await check(h, 'http://localhost:3000/?model=x&anim=hello');
    expect(h.requests[0].url).toBe('http://127.0.0.1:32123/?model=x&anim=hello'); expect(h.sleeps).toEqual([]);
    const error = new Error('TUTORIAL_MODEL'); const bad = harness([], () => { throw error; });
    await expect(check(bad, 'http://localhost:3000/?model=bad')).rejects.toBe(error); expect(bad.requests.length).toBe(0);
  });
  test('the original URL extraction and Unicode/duplicate slug semantics are preserved', () => {
    expect(urls('[a](docs/guide.md#same) [b](docs/guide.md#same) <https://example.test/>\n<a href="https://example.test/a">x</a>\n[ref]: docs/ref.md')).toEqual(['docs/guide.md#same', 'https://example.test/a', 'docs/ref.md', 'https://example.test/']);
    expect(anchorExists('# 한글 이름\n\n# Same\n# Same\n', '%ED%95%9C%EA%B8%80-%EC%9D%B4%EB%A6%84')).toBe(true);
    expect(anchorExists('# Same\n# Same\n', 'same-1')).toBe(true); expect(anchorExists('# Same\n', 'same-1')).toBe(false);
  });
});

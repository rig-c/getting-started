import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Three transport attempts, at most 31 s per request including response text:
// 3 * 10 s + 250 ms + 750 ms. Content/anchor validation is outside this loop.
export const FETCH_TIMEOUT_MS = 10_000;
export const RETRY_DELAYS_MS = [250, 750] as const;

const networkCodes = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN',
  'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE',
  'ConnectionRefused', 'ConnectionClosed', 'ConnectionReset',
  'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
]);

function networkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return true;
  const seen = new Set<object>();
  let cause: unknown = error;
  while (typeof cause === 'object' && cause !== null && !seen.has(cause)) {
    seen.add(cause);
    const value = cause as { code?: unknown; cause?: unknown };
    if (typeof value.code === 'string' && networkCodes.has(value.code)) return true;
    cause = value.cause;
  }
  // Fetch's generic network TypeError has no cause in some runtimes. Do not
  // retry arbitrary TypeErrors or a fetch failure with an unknown explicit cause.
  return error instanceof TypeError && error.cause == null &&
    ['fetch failed', 'Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'].includes(error.message);
}

export interface LinkReaderOptions {
  root: string;
  profileRef: string;
  tutorialUrl: (link: string) => string;
}

export interface LinkReaderDependencies {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
}

export function urls(source: string): string[] {
  const found = [
    ...[...source.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]),
    ...[...source.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]),
    ...[...source.matchAll(/^\[[^\]]+\]:\s*(\S+)/gm)].map(m => m[1]),
    ...[...source.matchAll(/<(https?:\/\/[^>]+)>/g)].map(m => m[1]),
  ];
  return [...new Set(found)];
}
const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
export function anchorExists(source: string, anchor: string) {
  const seen = new Map<string, number>();
  return source.split('\n').some(line => {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (!heading) return false;
    const base = slug(heading[1]); const n = seen.get(base) ?? 0; seen.set(base, n + 1);
    return (n ? `${base}-${n}` : base) === decodeURIComponent(anchor);
  });
}

export function createLinkReader(options: LinkReaderOptions, dependencies: LinkReaderDependencies = {}) {
  const { root, profileRef, tutorialUrl } = options;
  const fetchRequest = dependencies.fetch ?? fetch;
  const sleep = dependencies.sleep ?? ((milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds)));
  async function get(url: string): Promise<string> {
    // Invalid URL/programmer failures must not enter the transport retry loop.
    new URL(url);
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      let response: Response;
      try {
        response = await fetchRequest(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { 'User-Agent': 'rig-c-onboarding-link-check' } });
        if (response.ok) return await response.text();
      } catch (error) {
        if (!networkError(error) || attempt === RETRY_DELAYS_MS.length) throw error;
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      // Do not retain failed response bodies/connections while backing off.
      // Cleanup/programmer errors are not swallowed as network errors.
      await response.body?.cancel();
      if (response.status >= 500 && response.status <= 599 && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      assert(response.ok, `LINK_HTTP: ${url} returned ${response.status}`);
    }
    throw new Error('LINK_HTTP: exhausted transport attempts');
  }

  async function checkLink(link: string, source: string, repo: string, directory: string, local: boolean) {
    if (link.startsWith('#')) { assert(anchorExists(source, link.slice(1)), `LINK_ANCHOR: ${repo} ${link}`); return; }
    if (!/^https?:/.test(link)) {
      const [path, anchor] = link.split('#');
      const content = local ? readFileSync(resolve(root, directory, path), 'utf8') : await get(`https://raw.githubusercontent.com/${repo}/${profileRef}/${directory}/${path}`);
      if (anchor) assert(anchorExists(content, anchor), `LINK_ANCHOR: ${repo} ${link}`);
      return;
    }
    if (new URL(link).hostname === 'localhost') { await get(tutorialUrl(link)); return; }
    const url = new URL(link); const anchor = url.hash.slice(1); url.hash = '';
    const html = await get(url.href);
    // GitHub renders README headings dynamically; check the source Markdown too.
    if (anchor && url.hostname === 'github.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 2 || parts[2] === 'tree' || parts[2] === 'blob') {
        // Read the default-branch README directly; metadata API quotas do not
        // decide whether a public heading exists. Explicit blob/tree refs stay explicit.
        const branch = parts.length === 2 ? 'HEAD' : parts[3];
        const file = parts.length === 2 ? 'README.md' : parts.slice(4).join('/') + (parts[2] === 'tree' ? '/README.md' : '');
        const md = await get(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${branch}/${file}`);
        assert(anchor === 'readme' || anchorExists(md, anchor), `LINK_ANCHOR: ${link}`);
      } else assert(html.includes(`id="${anchor}"`) || html.includes(`id="user-content-${anchor}"`), `LINK_ANCHOR: ${link}`);
    }
  }

  return { get, checkLink };
}

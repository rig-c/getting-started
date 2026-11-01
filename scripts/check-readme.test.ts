import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { checkReadme, README_HEADINGS, README_WORD_CAP, wordCount } from './check-readme.ts';
import { anchorExists, createLinkReader, urls } from './link-reader.ts';
import { digest, extract, TOPIC_PAGES } from './try-it.ts';

const root = resolve(import.meta.dir, '..');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const reference = readFileSync(resolve(root, 'docs/REFERENCE.md'), 'utf8');
const topicSources = new Map(TOPIC_PAGES.map(page => [page, readFileSync(resolve(root, page), 'utf8')]));
const normal = '# Guide\n\n## Use what you made\n\nOne first result.\n';

test('current README and all topic pages satisfy CI budget, heading and dated-measurement rules', () => {
  expect(checkReadme(readme)).toEqual([]);
  for (const [page, topic] of topicSources) {
    expect(checkReadme(topic), page).toEqual([]);
  }
});

const plants = [
  ['word-over-cap', 'word '.repeat(README_WORD_CAP + 1), 'README_WORDS'],
  ['unlisted-h2', normal + '\n## Feature history\n', 'README_HEADING'],
  ['measured-on-20', normal + '\nMeasured on 2026-10-29 on one GPU.\n', 'README_DATED_PHRASE'],
  ['read-on-20', normal + '\nRead on 2026-10-29.\n', 'README_DATED_PHRASE'],
  ['table-cell-date', normal + '\n| Run | Time |\n| --- | --- |\n| 2026-10-29 | 44 s |\n', 'README_TABLE_DATE'],
  ['table-header-date', normal + '\n2026-10-29 | Time\n:--- | ---:\nrun | 44 s\n', 'README_TABLE_DATE'],
  ['single-column-table-date', normal + '\n| Run |\n| --- |\n| 2026-10-29 |\n', 'README_TABLE_DATE'],
  ['mixed-case-wrapped-phrase', normal + '\nMEASURED\non\n2026-10-29\n', 'README_DATED_PHRASE'],
] as const;
for (const [name, source, expected] of plants) test(`planted ${name} refuses by name`, () => {
  const failures = checkReadme(source);
  expect(failures.some(failure => failure.startsWith(expected + ':'))).toBe(true);
  console.log(`[plant:${name}] REFUSED ${expected}`);
});

test('normal and edge controls: exact cap, empty input, whitespace and permitted headings', () => {
  expect(checkReadme('word '.repeat(README_WORD_CAP))).toEqual([]);
  expect(wordCount(' \r\n\t')).toBe(0);
  expect(wordCount('one\t two\r\nthree')).toBe(3);
  expect(checkReadme('')).toEqual([]);
  expect(checkReadme(README_HEADINGS.map(heading => `## ${heading} ###`).join('\n'))).toEqual([]);
  expect(checkReadme(normal + '\n### Further detail\nA prose date: 2026-10-29.\n')).toEqual([]);
});

test('edge controls: code fences are not prose headings or measurement tables', () => {
  for (const fence of ['```', '````', '~~~']) {
    expect(checkReadme(`${normal}\n${fence}sh\n## Fake heading\nmeasured on 2026-10-29\n| Run | Time |\n| --- | --- |\n| 2026-10-29 | 44 |\n${fence}\n`)).toEqual([]);
    expect(checkReadme(`${normal}\n${fence}sh\n## Fake heading\n${fence}\n## Feature history\n`).some(f => f.startsWith('README_HEADING:'))).toBe(true);
  }
  expect(checkReadme(normal + '\nRun | Time\n:--- | ---:\ncurrent | 44 s\n\nA date outside the table: 2026-10-29.\n')).toEqual([]);
});

test('moved figures remain pinned in REFERENCE and guide pointers and inbound anchors resolve', () => {
  for (const pin of [
    '**44 seconds** for the painting and **3 minutes 45 seconds**',
    'That wait was **44 seconds** on the box above.',
    'The full run took **225 seconds**',
    '138,556,890 bytes on PyPI',
    '6,938,418,620 bytes (6.94 GB)',
    '584 MB\nin 44 seconds',
    'what the terms turn\non is the integration',
    'restates it. Integrating a Spine Runtime into a product is permitted',
  ]) {
    expect(reference.includes(pin)).toBe(true);
    expect(readme.includes(pin)).toBe(false);
    for (const topic of topicSources.values()) expect(topic.includes(pin)).toBe(false);
  }
  const makeCharacter = topicSources.get('docs/guide/make-your-own-character.md')!;
  for (const anchor of ['route-comparison', 'route-a-measured-2026-10-29', 'the-model-files-exactly', 'route-b-downloads', 'the-joint-script-scriptskeypointspy']) {
    expect(urls(makeCharacter)).toContain('../REFERENCE.md#' + anchor);
    expect(anchorExists(reference, anchor)).toBe(true);
  }
  for (const page of TOPIC_PAGES) {
    expect(urls(readme).some(url => url === page || url.startsWith(page + '#'))).toBe(true);
  }
  for (const anchor of [
    '9b-say-hello',
    '9c-let-the-hair-and-the-skirt-answer',
    '9d-turn-the-head-with-depth',
    'use-what-you-made',
    'make-your-own-character',
    'route-a-your-own-nvidia-gpu',
    'route-c-no-gpu-at-all',
    'the-joints',
    'troubleshooting',
  ]) {
    expect(anchorExists(readme, anchor)).toBe(true);
  }
  for (const page of ['README.md', ...TOPIC_PAGES, 'docs/PAINTING-RECIPE.md', 'docs/REFERENCE.md', 'docs/demo/README.md']) {
    const file = resolve(root, page);
    const content = readFileSync(file, 'utf8');
    for (const raw of urls(content)) {
      if (/^(?:https?:|mailto:)/.test(raw)) continue;
      const [relPath, hash] = raw.split('#');
      const targetFile = relPath ? resolve(dirname(file), relPath) : file;
      expect(existsSync(targetFile)).toBe(true);
      if (hash) expect(anchorExists(readFileSync(targetFile, 'utf8'), hash)).toBe(true);
    }
  }
});

test('all executable tutorial steps stay, including 9b, 9c and the landed 9d, and adapter snippet/links stay intact', async () => {
  const steps = extract(readme);
  expect(steps.map(step => step.title.split('.')[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '9b', '9c', '9d', '10']);
  expect(steps.at(-1)!.blocks.at(-1)!.mode).toBe('server');
  const useStub = readme.split('## Use what you made\n')[1]?.split('\n## ')[0] ?? '';
  expect(useStub.includes('(docs/guide/use-what-you-made.md)')).toBe(true);
  const useWhatYouMade = topicSources.get('docs/guide/use-what-you-made.md')!;
  const engine = useWhatYouMade.split('### Inside a game engine or renderer you already use\n')[1]?.split('\n### ')[0] ?? '';
  const shBlock = [...engine.matchAll(/```sh\n([\s\S]*?)```/g)].map(m => m[1])[0];
  const jsBlock = [...engine.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1])[0];
  expect(digest(shBlock)).toBe('9cdf980d1713b6485ec9da936d08c272ce7980e014df0a677ad78936d8a93387');
  expect(digest(jsBlock)).toBe('b886f769699042a0a79ccbe620616540a75af596e81c40e9132f389ef988a947');
  const { checkLink } = createLinkReader({ root, profileRef: 'main', tutorialUrl: link => link });
  for (const page of ['README.md', ...TOPIC_PAGES]) {
    const text = readFileSync(resolve(root, page), 'utf8');
    const dir = page.includes('/') ? 'docs/guide' : '';
    for (const link of urls(text).filter(u => !/^https?:/.test(u))) {
      await checkLink(link, text, 'rig-c/getting-started', dir, true);
    }
  }
  await expect(checkLink('../REFERENCE.md#missing-anchor-plant', useWhatYouMade, 'rig-c/getting-started', 'docs/guide', true)).rejects.toThrow('LINK_ANCHOR');
  await expect(checkLink('../missing-file-plant.md', useWhatYouMade, 'rig-c/getting-started', 'docs/guide', true)).rejects.toThrow();
});

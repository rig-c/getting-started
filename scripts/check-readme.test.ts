import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkReadme, README_HEADINGS, README_WORD_CAP, wordCount } from './check-readme.ts';
import { anchorExists, urls } from './link-reader.ts';
import { extract } from './try-it.ts';

const root = resolve(import.meta.dir, '..');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const reference = readFileSync(resolve(root, 'docs/REFERENCE.md'), 'utf8');
const normal = '# Guide\n\n## Use what you made\n\nOne first result.\n';

test('current README satisfies its CI budget and structure', () => {
  expect(checkReadme(readme)).toEqual([]);
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

test('moved figures remain pinned in REFERENCE and README pointers resolve', () => {
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
  }
  const prefix = 'docs/REFERENCE.md#';
  for (const anchor of ['route-comparison', 'route-a-measured-2026-10-29', 'the-model-files-exactly', 'route-b-downloads', 'the-joint-script-scriptskeypointspy']) {
    expect(urls(readme)).toContain(prefix + anchor);
    expect(anchorExists(reference, anchor)).toBe(true);
  }
});

test('all executable tutorial steps stay, including 9b, 9c and the landed 9d', () => {
  const steps = extract(readme);
  expect(steps.map(step => step.title.split('.')[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '9b', '9c', '9d', '10']);
  expect(steps.at(-1)!.blocks.at(-1)!.mode).toBe('server');
});

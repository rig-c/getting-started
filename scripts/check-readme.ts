import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// #48: post-cut 2,451 whitespace-delimited words * 1.10 = 2,696.1;
// rounded UP to the next 50 = 2,700.
export const README_WORD_CAP = 2700;
export const README_HEADINGS = [
  'The whole thing in one glance',
  'Try it first — no GPU, about 3 minutes',
  'Use what you made',
  'Make your own character',
  'Troubleshooting',
  'Where to go next',
  'Credits and licences',
] as const;

export const wordCount = (source: string) => source.trim() ? source.trim().split(/\s+/u).length : 0;

export function checkReadme(source: string): string[] {
  const failures: string[] = [];
  const words = wordCount(source);
  if (words > README_WORD_CAP) failures.push(`README_WORDS: ${words} > ${README_WORD_CAP}`);
  let fence = '', length = 0;
  const lines = source.split(/\r?\n/).map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence && marker[1].length >= length && !marker[2].trim()) fence = '';
      return '';
    }
    if (marker) { fence = marker[1][0]; length = marker[1].length; return ''; }
    return line;
  });
  for (const match of lines.join('\n').matchAll(/\b(?:measured|read)\s+on\s+20/gi)) {
    failures.push(`README_DATED_PHRASE: ${match[0].replace(/\s+/g, ' ')}`);
  }
  let table = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(/^ {0,3}##[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/);
    if (heading && !README_HEADINGS.some(allowed => allowed === heading[1])) failures.push(`README_HEADING: line ${i + 1}: ${heading[1]}`);
    // GFM pipe tables, including omitted outer pipes and alignment markers.
    const cells = line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/);
    if (line.includes('|') && cells.every(cell => /^\s*:?-+:?\s*$/.test(cell)) && lines[i - 1]?.includes('|')) {
      table = true;
      if (/\b\d{4}-\d{2}-\d{2}\b/.test(lines[i - 1])) failures.push(`README_TABLE_DATE: line ${i}`);
      continue;
    }
    if (table && line.includes('|') && line.trim()) {
      if (/\b\d{4}-\d{2}-\d{2}\b/.test(line)) failures.push(`README_TABLE_DATE: line ${i + 1}`);
    } else table = false;
  }
  return failures;
}

if (import.meta.main) {
  const source = readFileSync(resolve(import.meta.dir, '../README.md'), 'utf8');
  const failures = checkReadme(source);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
  else console.log(`README PASS: ${wordCount(source)}/${README_WORD_CAP} words; headings and dated measurements checked`);
}

import { test, expect } from 'bun:test';
import { readFileSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { extract, execute, digest, packages, readRecord, updateRecord, sameInputs, assertVersions } from './try-it.ts';
import { publish } from './try-it-publish.ts';

const root = resolve(import.meta.dir, '..');
const scratch = join(root, '.try-it/tests'); mkdirSync(scratch, { recursive: true });
const versions = Object.fromEntries(packages.map(p => [p, '1.0.0']));
const record = { status: 'PASS', complete: true, date: '2026-10-25', versions, guide_sha256: 'guide', run: 'https://example.invalid/run/1' };
const reference = '# Reference\n\n## Tested with\n\nMac timing: 42 s, measured 2026-10-13.\n';
const fixture = (commands: string) => `## Try it first\n\n### 1. Set up\n\n\`\`\`sh\n${commands}\n\`\`\`\n\n### 2. Read state\n\n\`\`\`sh\ntest "$saved" = retained\ntest "$PWD" = "$start/sub"\n\`\`\`\n\n## Outside\n\n\`\`\`sh\nexit 99\n\`\`\`\n`;
async function inDirectory(fn: (directory: string) => Promise<void>) {
  const directory = mkdtempSync(join(scratch, 'control-'));
  try { await fn(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('extracts the real guide, including 9b/9c and the server; no hand-copied commands', () => {
  const source = readFileSync(join(root, 'README.md'), 'utf8');
  const steps = extract(source);
  expect(steps.map(s => s.title.split('.')[0])).toEqual(['1','2','3','4','5','6','7','8','9','9b','9c','10']);
  expect(steps[0].blocks[0].command).toContain('git clone https://github.com/rig-c/getting-started\n');
  expect(steps[5].blocks[0].command).toContain('uv run --with rtmlib --with onnxruntime');
  expect(steps.at(-1)!.blocks[0].mode).toBe('server');
  const added = source.replace('### 2. Get', '### 1b. Added step\n\n```sh\nprintf added\n```\n\n### 2. Get');
  expect(extract(added).some(s => s.title === '1b. Added step')).toBe(true);
});
test('real shell preserves cwd and variables between extracted steps', async () => {
  await inDirectory(async directory => {
    const result = await execute(extract(fixture('start="$PWD"\nmkdir sub\ncd sub\nsaved=retained')), directory, []);
    expect(result.exit).toBe(0); expect(result.rows.map(r => r.status)).toEqual(['PASS', 'PASS']);
  });
});
test('planted broken README command names its actual step and prevents later PASS', async () => {
  await inDirectory(async directory => {
    const doc = fixture('start="$PWD"\nmkdir sub\ncd sub\nsaved=retained').replace('saved=retained', 'command_that_does_not_exist_try_it');
    const result = await execute(extract(doc), directory, []);
    expect(result.exit).not.toBe(0); expect(result.rows[0].status).toBe('FAIL');
    expect(result.rows[0].step).toBe('1. Set up'); expect(result.rows[0].line).toBe(doc.split('\n').indexOf('command_that_does_not_exist_try_it') + 1);
    expect(result.rows[1].status).toBe('NOT RUN');
  });
});
test('marked NOT RUN is incomplete, names the reason and executes nothing', async () => {
  await inDirectory(async directory => {
    const doc = fixture('exit 99').replace('```sh', '<!-- try-it-ci: not-run reason="requires a licensed desktop" -->\n```sh');
    const result = await execute(extract(doc), directory, []);
    expect(result.exit).toBe(2); expect(result.rows.every(r => r.status === 'NOT RUN')).toBe(true);
    expect(result.rows[0].reason).toBe('requires a licensed desktop');
    expect(() => updateRecord(reference, { ...record, complete: false })).toThrow('complete PASS');
  });
});
test('missing blocks, unterminated fences and unsupported executable fences refuse', () => {
  for (const doc of ['## Try it first\n### 1. Empty\n', '## Try it first\n### 1. Broken\n```sh\ntrue\n', '## Try it first\n### 1. Unknown\n```bash\ntrue\n```\n']) expect(() => extract(doc)).toThrow();
  expect(() => extract(fixture('true').replace('```sh', '<!-- try-it-ci: not-run -->\n```sh'))).toThrow('reason');
  expect(() => extract(fixture('true').replace('```sh', '<!-- try-it-ci: not-run reason="desktop" -->\n\n```sh'))).toThrow('immediately');
});
test('unclassified persistent command times out and names the step', async () => {
  await inDirectory(async directory => {
    const result = await execute(extract(fixture('sleep 20')), directory, [], process.env, 100);
    expect(result.exit).toBe(124); expect(result.rows[0].step).toBe('1. Set up'); expect(result.rows[0].status).toBe('FAIL');
  });
});
test('record preserves every historical byte; new guide can refresh unchanged versions', () => {
  const first = updateRecord(reference, record);
  expect(first.endsWith(reference.split('## Tested with\n')[1])).toBe(true);
  expect(readRecord(first)).toEqual(record);
  expect(updateRecord(first, { ...record, date: '2026-11-01' })).toBe(first);
  expect(sameInputs(readRecord(first), versions, 'guide')).toBe(true);
  expect(updateRecord(first, { ...record, guide_sha256: 'edited', date: '2026-11-01' })).not.toBe(first);
  expect(digest(reference)).toHaveLength(64);
});
test('an already-current weekly record makes ZERO git, PR or dispatch calls', async () => {
  await inDirectory(async directory => {
    mkdirSync(join(directory, 'docs')); const current = updateRecord(reference, record);
    writeFileSync(join(directory, 'docs/REFERENCE.md'), current);
    let calls = 0;
    expect(await publish(directory, updateRecord(reference, { ...record, date: '2026-11-01' }), { status: 'PASS', complete: true }, () => { calls++; throw Error('unexpected publication'); })).toEqual({ changed: false });
    expect(calls).toBe(0); expect(readFileSync(join(directory, 'docs/REFERENCE.md'), 'utf8')).toBe(current);
  });
});
test('registry races, missing installs and incomplete publication refuse', async () => {
  expect(() => assertVersions(versions, versions, versions)).not.toThrow();
  expect(() => assertVersions({}, versions, versions)).toThrow('installed');
  expect(() => assertVersions(versions, versions, { ...versions, 'rig-c': '2.0.0' })).toThrow('latest changed');
  await expect(publish(root, '', { status: 'FAIL' }, () => { throw Error('must not run'); })).rejects.toThrow('incomplete');
});

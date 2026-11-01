import { test, expect, afterAll } from 'bun:test';
import { readFileSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, symlinkSync, unlinkSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { extract, execute, digest, guideDigest, TOPIC_PAGES, packages, readRecord, updateRecord, sameInputs, assertVersions, externalTemp } from './try-it.ts';
import { publish } from './try-it-publish.ts';

const root = resolve(import.meta.dir, '..');
const scratch = join(root, '.try-it/tests'); mkdirSync(scratch, { recursive: true });
afterAll(() => { rmSync(join(root, '.try-it'), { recursive: true, force: true }); });
const versions = Object.fromEntries(packages.map(p => [p, '1.0.0']));
const record = { status: 'PASS', complete: true, date: '2026-10-25', versions, guide_sha256: 'guide', run: 'https://example.invalid/run/1' };
const reference = '# Reference\n\n## Tested with\n\nMac timing: 42 s, measured 2026-10-13.\n';
const fixture = (commands: string) => `## Try it first\n\n### 1. Set up\n\n\`\`\`sh\n${commands}\n\`\`\`\n\n### 2. Read state\n\n\`\`\`sh\ntest "$saved" = retained\ntest "$PWD" = "$start/sub"\n\`\`\`\n\n## Outside\n\n\`\`\`sh\nexit 99\n\`\`\`\n`;
async function inDirectory(fn: (directory: string) => Promise<void>) {
  const directory = mkdtempSync(join(scratch, 'control-'));
  try { await fn(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('extracts the real guide across README and topic pages, including 9b/9c/9d and the server; no hand-copied commands', () => {
  const source = readFileSync(join(root, 'README.md'), 'utf8');
  const steps = extract(source);
  expect(steps.map(s => s.title.split('.')[0])).toEqual(['1','2','3','4','5','6','7','8','9','9b','9c','9d','10']);
  expect(steps.map(s => s.page)).toEqual([
    'README.md', 'README.md', 'README.md', 'README.md', 'README.md',
    'README.md', 'README.md', 'README.md', 'README.md',
    'docs/guide/motion.md', 'docs/guide/motion.md', 'docs/guide/depth-turn.md',
    'README.md',
  ]);
  expect(steps.map(s => digest(s.blocks[0].command))).toEqual([
    '6ad0518d53e1c441272ae977212a45105e06e817220fc1411e661f80f587243d',
    '4c4f1c7bbf2707036d4f52810ffc7b4a3baa827fa3e40e1ef2049001212ce4c4',
    '283fcfcbba4c1750b1462d74861b656895d9a599d3962b0fa50da6c1e625b8ee',
    'dc06a6b83b35479e0ea945119d6d08160bcf162a388b713971969a17b0e284c2',
    '9c6d46d56363011ddd3c8519cfdb5ab18c01076c20cc88a382f737540bd2e53d',
    'd9dda4cdb5bc9dee770dcd6e399664811567201c71aa88f05eacbe29008765fc',
    '5b5ecefca0997326286acf5fa6f5709cb293c04c48e9ac2fdee11c843d1a3d44',
    'e7dcc14694f90a3532f8ec2a5e72134b52dc0da6fd407ce29e1a88b484470575',
    '804d077e121a6e6ded75f0a393bbe7adf86de21678fce58183c36351c6c27646',
    '7d2d9d80295ad6f601ad94e8f6a68474fb0930ac3572376309dc7198fe596a3d',
    'aacaf9a0de336b5149b497eb8ea1faf288b347c8a4766b76eaa3805748d03d73',
    'b619bf6c3b2e07babbfd8225c0cd30f2e03959006d3e7954e9d70c5264e47f3b',
    'fbc7f1c02ff448f52b928a5fe804edfd2e4609edea7b6cd7cfda1ba27e481df8',
  ]);
  expect(steps[0].blocks[0].command).toContain('git clone https://github.com/rig-c/getting-started\n');
  expect(steps[5].blocks[0].command).toContain('uv run --with rtmlib --with onnxruntime');
  expect(steps.at(-1)!.blocks[0].mode).toBe('server');
  const added = source.replace('### 2. Get', '### 1b. Added step\n\n```sh\nprintf added\n```\n\n### 2. Get');
  expect(extract(added).some(s => s.title === '1b. Added step')).toBe(true);
});
test('removing a step stub or breaking a topic link in README refuses naming the page and step', () => {
  const source = readFileSync(join(root, 'README.md'), 'utf8');
  const without9b = source.replace(/### 9b\. Say hello\n\n[^\n]+\n\n/, '');
  expect(() => extract(without9b)).toThrow('GUIDE docs/guide/motion.md, Step 9b. Say hello, line 3: walkthrough step not linked from README.md Try it first');
  const without9d = source.replace(/### 9d\. Turn the head with depth\n\n[^\n]+\n\n/, '');
  expect(() => extract(without9d)).toThrow('GUIDE docs/guide/depth-turn.md, Step 9d. Turn the head with depth, line 3: walkthrough step not linked from README.md Try it first');
  const brokenAnchor = source.replace('docs/guide/motion.md#9b-say-hello', 'docs/guide/motion.md#missing-anchor');
  expect(() => extract(brokenAnchor)).toThrow('GUIDE docs/guide/motion.md, Step 9b. Say hello');
  const brokenFile = source.replace('docs/guide/motion.md#9b-say-hello', 'docs/guide/missing.md#9b-say-hello');
  expect(() => extract(brokenFile)).toThrow('GUIDE README.md, Step 9b. Say hello');
});
test('planted broken topic-page command names its topic page, step and line and prevents later PASS', async () => {
  await inDirectory(async directory => {
    for (const rel of TOPIC_PAGES) {
      const target = join(directory, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(join(root, rel), 'utf8'));
    }
    const motionPath = join(directory, 'docs/guide/motion.md');
    const motion = readFileSync(motionPath, 'utf8').replace('bun ../getting-started/scripts/hello.ts', 'command_that_does_not_exist_on_topic_page');
    writeFileSync(motionPath, motion);
    const readmeStubOnly = [
      '## Try it first',
      '### 1. Quick pass',
      '```sh',
      'true',
      '```',
      '### 9b. Say hello',
      'Run [9b](docs/guide/motion.md#9b-say-hello).',
      '### 9c. Let the hair and the skirt answer',
      'Run [9c](docs/guide/motion.md#9c-let-the-hair-and-the-skirt-answer).',
      '### 9d. Turn the head with depth',
      'Run [9d](docs/guide/depth-turn.md#9d-turn-the-head-with-depth).',
    ].join('\n');
    const steps = extract(readmeStubOnly, { root: directory });
    const result = await execute(steps, directory, []);
    expect(result.exit).not.toBe(0);
    expect(result.rows[0].status).toBe('PASS');
    expect(result.rows[1].status).toBe('FAIL');
    expect(result.rows[1].page).toBe('docs/guide/motion.md');
    expect(result.rows[1].step).toBe('9b. Say hello');
    expect(result.rows[1].line).toBe(motion.split('\n').findIndex(line => line.includes('command_that_does_not_exist_on_topic_page')) + 1);
    expect(result.rows[2].status).toBe('NOT RUN');
    expect(result.rows[3].status).toBe('NOT RUN');
  });
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
test('a failed browser stops its server and closes inherited output pipes promptly', async () => {
  await inDirectory(async directory => {
    const source = '## Try it first\n### 10. Browser\n<!-- try-it-ci: server -->\n```sh\nsleep 30\n```\n';
    const start = performance.now();
    const result = await execute(extract(source), directory, ['bash', '-c', 'exit 7'], process.env, 2000);
    expect(result.exit).toBe(7); expect(result.rows[0].status).toBe('FAIL');
    expect(performance.now() - start).toBeLessThan(1500);
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
  expect(() => assertVersions(versions, versions, { ...versions, '@rig-c/core': '2.0.0' })).toThrow('latest changed');
  await expect(publish(root, '', { status: 'FAIL' }, () => { throw Error('must not run'); })).rejects.toThrow('incomplete');
});
test('repository TMPDIR is refused, including a symlink resolving into it', () => {
  expect(() => externalTemp(root)).toThrow('set TRY_IT_TEMP_ROOT');
  expect(() => externalTemp(root, root)).toThrow('outside the repository');
  expect(() => externalTemp(root, scratch)).toThrow('outside the repository');
  const link = join(scratch, 'repo-link'); symlinkSync(root, link);
  try { expect(() => externalTemp(root, link)).toThrow('outside the repository'); } finally { unlinkSync(link); }
});
test('a changed complete record opens one bot PR and explicitly dispatches its branch, and refuses if a topic page changes', async () => {
  await inDirectory(async directory => {
    mkdirSync(join(directory, 'docs/guide'), { recursive: true });
    writeFileSync(join(directory, 'docs/REFERENCE.md'), reference);
    writeFileSync(join(directory, 'README.md'), 'tested guide');
    for (const rel of TOPIC_PAGES) writeFileSync(join(directory, rel), `topic ${rel}`);
    const next = { ...record, guide_sha256: guideDigest(directory) };
    const commands: string[][] = [];
    const previous = process.env.GITHUB_REPOSITORY; process.env.GITHUB_REPOSITORY = 'rig-c/getting-started';
    try {
      const result = await publish(directory, updateRecord(reference, next), { ...next }, args => {
        commands.push(args);
        if (args[0] === 'gh' && args[1] === 'pr' && args[2] === 'list') return '[]';
        return '';
      });
      expect(result.changed).toBe(true);
      expect(commands.filter(c => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'create')).toHaveLength(1);
      expect(commands.at(-1)).toEqual(['gh', 'workflow', 'run', 'adapters.yml', '--repo', 'rig-c/getting-started', '--ref', 'automation/try-it-tested', '-f', 'try_it=force']);
      expect(commands.find(c => c[0] === 'git' && c[1] === 'add')).toEqual(['git', 'add', '--', 'docs/REFERENCE.md']);
      expect(commands.some(c => c[0] === 'git' && c[1] === 'push' && c.includes('HEAD:refs/heads/main'))).toBe(false);
      writeFileSync(join(directory, 'docs/REFERENCE.md'), reference);
      writeFileSync(join(directory, 'docs/guide/motion.md'), 'edited after verification');
      await expect(publish(directory, updateRecord(reference, next), { ...next }, () => '')).rejects.toThrow('guide or versions changed since verification');
    } finally {
      if (previous === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = previous;
    }
  });
});

// Trusted default-branch job only. Verification jobs never receive write scopes.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { updateRecord, readRecord, digest, packages } from './try-it.ts';

export async function publish(root: string, proposal: string, receipt: any, run: (args: string[]) => string) {
  if (receipt.status !== 'PASS' || receipt.complete !== true) throw Error('PUBLISH: incomplete walkthrough');
  const path = resolve(root, 'docs/REFERENCE.md');
  const current = readFileSync(path, 'utf8');
  const record = readRecord(proposal);
  const updated = updateRecord(current, record);
  // This return precedes every git, PR and dispatch call, including branch creation.
  if (updated === current) return { changed: false };
  if (digest(readFileSync(resolve(root, 'README.md'), 'utf8')) !== receipt.guide_sha256 || record.guide_sha256 !== receipt.guide_sha256 || !packages.every(p => receipt.versions?.[p] === record.versions[p])) throw Error('PUBLISH: guide or versions changed since verification');
  if (!process.env.GITHUB_REPOSITORY) throw Error('PUBLISH: repository missing');
  const repo = process.env.GITHUB_REPOSITORY;
  const branch = 'automation/try-it-tested';
  run(['git', 'config', 'user.name', 'github-actions[bot]']);
  run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  run(['git', 'checkout', '-B', branch]);
  writeFileSync(path, updated);
  run(['git', 'add', '--', 'docs/REFERENCE.md']);
  run(['git', 'commit', '-m', 'docs: record tested published walkthrough\n\nCo-Authored-By: Naru <342599188+fj-naru[bot]@users.noreply.github.com>']);
  // Refuse to overwrite anyone's concurrent push; force-with-lease is not unconditional.
  const remote = run(['git', 'ls-remote', '--heads', 'origin', branch]).split(/\s/)[0];
  run(['git', 'push', `--force-with-lease=refs/heads/${branch}:${remote}`, 'origin', `HEAD:refs/heads/${branch}`]);
  const found = JSON.parse(run(['gh', 'pr', 'list', '--repo', repo, '--state', 'open', '--head', branch, '--json', 'number,url']));
  if (!found.length) run(['gh', 'pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--title', 'docs: update tested published walkthrough', '--body', `A complete automated Try it first run verified the latest published packages.\n\nRun: ${record.run}\n\nReferences #1 item 1. Items 2 and 3 remain open. Historical timing measurements are unchanged.`]);
  run(['gh', 'workflow', 'run', 'adapters.yml', '--repo', repo, '--ref', branch, '-f', 'try_it=force']);
  return { changed: true };
}

if (import.meta.main) {
  try {
    if (!['schedule', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME ?? '') || process.env.GITHUB_REF !== 'refs/heads/main') throw Error('PUBLISH: trusted default-branch schedule/dispatch only');
    const root = resolve(import.meta.dir, '..'), out = resolve(process.argv[2] ?? '.try-it');
    const receipt = JSON.parse(readFileSync(resolve(out, 'receipt.json'), 'utf8'));
    const run = (args: string[]) => {
      const result = Bun.spawnSync(args, { cwd: root, env: process.env });
      if (result.exitCode) throw Error(`${args[0]} ${args[1]}: ${result.stderr.toString()}`);
      return result.stdout.toString().trim();
    };
    console.log(await publish(root, readFileSync(resolve(out, 'REFERENCE.md'), 'utf8'), receipt, run));
  } catch (error) {
    console.error(`::error::Record publication failed: ${String(error)}. Enable Actions PR creation and workflow dispatch permissions, then rerun the trusted workflow.`);
    process.exitCode = 1;
  }
}

// Commands come from README.md, never from a second copy of the tutorial.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

export const packages = ['@rig-c/parts', 'rig-c', '@rig-c/pose', '@rig-c/play'] as const;
export type Versions = Record<string, string>;
export type Step = { title: string; line: number; text: string; blocks: { command: string; line: number; mode: 'shell' | 'server' | 'not-run'; reason?: string }[] };
const begin = '<!-- try-it-tested:start -->', end = '<!-- try-it-tested:end -->';
export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const quote = (text: string) => "'" + text.replaceAll("'", "'\\''") + "'";

export function extract(source: string): Step[] {
  const lines = source.split('\n');
  const first = lines.findIndex(line => /^## Try it first(?:\s|$)/.test(line));
  if (first < 0) throw Error('GUIDE: missing Try it first heading');
  let last = lines.findIndex((line, i) => i > first && /^## /.test(line));
  if (last < 0) last = lines.length;
  const steps: Step[] = [];
  let step: Step | undefined;
  for (let i = first + 1; i < last; i++) {
    const line = lines[i];
    if (line.includes('<!-- try-it-ci:') && lines[i + 1] !== '```sh') throw Error(`GUIDE line ${i + 1}: CI marker must immediately precede a sh fence`);
    if (/^### /.test(line)) {
      step = { title: line.slice(4), line: i + 1, text: '', blocks: [] }; steps.push(step);
    }
    if (step) step.text += line + '\n';
    if (/^\s*(?:```|~~~)/.test(line)) {
      if (!step) throw Error(`GUIDE line ${i + 1}: executable block outside a step`);
      if (line !== '```sh') throw Error(`Step ${step.title}, line ${i + 1}: unsupported fence ${line}`);
      const start = i + 1;
      const marker = lines[i - 1]?.match(/^<!-- try-it-ci: (server|not-run)(?: reason="([^"]+)")? -->$/);
      if (lines[i - 1]?.includes('try-it-ci:') && !marker) throw Error(`Step ${step.title}, line ${i}: malformed CI marker`);
      const mode = marker?.[1] as 'server' | 'not-run' | undefined;
      if (mode === 'not-run' && !marker?.[2]) throw Error(`Step ${step.title}: NOT RUN needs a reason`);
      const command: string[] = [];
      while (++i < last && lines[i] !== '```') command.push(lines[i]);
      if (i === last || command.join('\n').trim() === '') throw Error(`Step ${step.title}, line ${start}: missing or empty closing fence`);
      step.blocks.push({ command: command.join('\n') + '\n', line: start + 1, mode: mode ?? 'shell', reason: marker?.[2] });
      step.text += command.join('\n') + '\n```\n';
    }
  }
  if (!steps.length || steps.some(s => !s.blocks.length)) throw Error('GUIDE: every step must have an executable fence');
  const servers = steps.flatMap(s => s.blocks).filter(b => b.mode === 'server');
  if (servers.length > 1 || (servers.length && steps.at(-1)?.blocks.at(-1)?.mode !== 'server')) throw Error('GUIDE: server must be the last block');
  return steps;
}

export function readRecord(reference: string): any | null {
  if (!reference.includes(begin) && !reference.includes(end)) return null;
  const match = reference.match(/<!-- try-it-tested:start -->\n([\s\S]*?)\n<!-- try-it-tested:end -->/g);
  if (match?.length !== 1) throw Error('RECORD: missing or duplicate delimiters');
  const json = match[0].match(/```json\n([\s\S]*?)\n```/);
  if (!json) throw Error('RECORD: missing JSON');
  return JSON.parse(json[1]);
}
export function sameInputs(record: any, versions: Versions, guide: string) {
  return record?.status === 'PASS' && record.guide_sha256 === guide && packages.every(p => record.versions?.[p] === versions[p]);
}
export function updateRecord(reference: string, record: any) {
  if (record.status !== 'PASS' || !record.complete || !packages.every(p => typeof record.versions?.[p] === 'string')) throw Error('RECORD: complete PASS required');
  if (sameInputs(readRecord(reference), record.versions, record.guide_sha256)) return reference;
  const block = `${begin}\n### Automated walkthrough\n\nLatest complete CI run; timings below retain their original dates and machines.\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n${end}`;
  if (readRecord(reference)) return reference.replace(/<!-- try-it-tested:start -->[\s\S]*?<!-- try-it-tested:end -->/, block);
  if (!reference.includes('## Tested with\n')) throw Error('RECORD: missing Tested with heading');
  return reference.replace('## Tested with\n', '## Tested with\n\n' + block + '\n\n### Published walkthrough measured 2026-10-25\n');
}
export async function latest(): Promise<Versions> {
  const entries = await Promise.all(packages.map(async name => {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`REGISTRY ${name}: HTTP ${response.status}`);
    const doc: any = await response.json();
    if (doc.name !== name || typeof doc.version !== 'string') throw Error(`REGISTRY ${name}: invalid latest response`);
    return [name, doc.version];
  }));
  return Object.fromEntries(entries);
}
export function assertVersions(installed: Versions, before: Versions, after: Versions) {
  for (const name of packages) {
    if (before[name] !== after[name]) throw Error(`VERSIONS ${name}: latest changed ${before[name]} -> ${after[name]}; rerun`);
    if (installed[name] !== before[name]) throw Error(`VERSIONS ${name}: installed ${installed[name] ?? 'missing'}, latest ${before[name]}`);
  }
}

export type Row = { step: string; line: number; status: string; seconds?: number; reason?: string };
// A single bash process preserves cd, variables and shell state between every fence.
export async function execute(steps: Step[], directory: string, browserCommand: string[], env: Record<string, string | undefined> = process.env, timeoutMs = 55 * 60 * 1000) {
  const rows: Row[] = steps.map(s => ({ step: s.title, line: s.line, status: 'NOT RUN', reason: 'not reached' }));
  const skipped = steps.flatMap((s, index) => s.blocks.filter(b => b.mode === 'not-run').map(b => ({ index, block: b })));
  if (skipped.length) {
    for (const { index, block } of skipped) rows[index] = { step: steps[index].title, line: block.line, status: 'NOT RUN', reason: block.reason };
    for (const row of rows) console.log(`NOT RUN Step ${row.step}, README line ${row.line}: ${row.reason}`);
    return { rows, exit: 2 };
  }
  mkdirSync(directory, { recursive: true });
  const nonce = `TRY_IT_${crypto.randomUUID()}`;
  let script = "set -Eeuo pipefail\nserver_pid=''\ntrap 'if [ -n \"$server_pid\" ]; then kill \"$server_pid\" 2>/dev/null || true; wait \"$server_pid\" 2>/dev/null || true; fi' EXIT\n";
  script += `trap 'rc=$?; printf "\\n${nonce} ERROR %s\\n" "$LINENO"; exit "$rc"' ERR\n`;
  const lineMap: Record<number, number> = {};
  for (let index = 0; index < steps.length; index++) {
    script += `printf '\\n${nonce} START ${index}\\n'\n`;
    for (const block of steps[index].blocks) {
      if (block.mode === 'server') script += '{\n';
      const offset = script.split('\n').length;
      block.command.split('\n').forEach((_, j) => { lineMap[offset + j] = block.line + j; });
      script += block.command;
      if (block.mode === 'server') {
        script += `} &\nserver_pid=$!\n${browserCommand.map(quote).join(' ')}\nkill -0 "$server_pid"\nkill "$server_pid"\nwait "$server_pid" 2>/dev/null || true\nserver_pid=''\n`;
      }
    }
    script += `printf '\\n${nonce} PASS ${index}\\n'\n`;
  }
  const scriptPath = join(directory, 'commands.sh'); writeFileSync(scriptPath, script);
  const log = Bun.file(join(directory, 'walkthrough.log')).writer();
  let current = -1, started = 0, timedOut = false;
  const child = Bun.spawn(['bash', '-eu', '-o', 'pipefail', scriptPath], { cwd: directory, env, stdout: 'pipe', stderr: 'pipe', detached: true });
  const stop = () => { try { process.kill(-child.pid, 'SIGTERM'); } catch {} };
  let hardStop: ReturnType<typeof setTimeout> | undefined;
  const timer = setTimeout(() => {
    timedOut = true; stop();
    hardStop = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 5000);
  }, timeoutMs);
  async function drain(stream: ReadableStream<Uint8Array>, stderr = false) {
    let pending = '';
    for await (const bytes of stream) {
      log.write(bytes); (stderr ? process.stderr : process.stdout).write(bytes);
      pending += new TextDecoder().decode(bytes, { stream: true });
      let at: number;
      while ((at = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, at); pending = pending.slice(at + 1);
        const match = line.match(new RegExp(`^${nonce} (START|PASS) (\\d+)$`));
        const failureLine = line.match(new RegExp(`^${nonce} ERROR (\\d+)$`));
        if (failureLine && current >= 0) rows[current].line = lineMap[Number(failureLine[1])] ?? rows[current].line;
        if (match) {
          const i = Number(match[2]);
          if (match[1] === 'START') { current = i; started = performance.now(); rows[i].status = 'RUNNING'; delete rows[i].reason; }
          else { rows[i].status = 'PASS'; rows[i].seconds = +( (performance.now() - started) / 1000).toFixed(3); }
        }
        if (stderr && current >= 0) {
          const failure = line.match(/commands\.sh: line (\d+):/);
          if (failure) rows[current].line = lineMap[Number(failure[1])] ?? rows[current].line;
        }
      }
    }
  }
  try {
    await Promise.all([drain(child.stdout), drain(child.stderr, true), child.exited]);
    const exit = timedOut ? 124 : child.exitCode ?? 1;
    if (exit !== 0 && current >= 0) {
      rows[current].status = 'FAIL'; rows[current].seconds = +((performance.now() - started) / 1000).toFixed(3);
      rows[current].reason = timedOut ? 'walkthrough timeout (including unclassified persistent commands)' : `shell exit ${exit}`;
      console.error(`::error::Step ${rows[current].step}, README line ${rows[current].line}: ${rows[current].reason}`);
    }
    return { rows, exit };
  } finally { clearTimeout(timer); clearTimeout(hardStop); stop(); await log.end(); }
}

function arg(name: string, fallback?: string) { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; }
export async function main() {
  const root = resolve(import.meta.dir, '..');
  const out = resolve(arg('--out', join(root, '.try-it'))!); mkdirSync(out, { recursive: true });
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const reference = readFileSync(join(root, 'docs/REFERENCE.md'), 'utf8');
  let phase = 'GUIDE';
  const started = performance.now();
  const receipt: any = { status: 'FAIL', complete: false, guide_sha256: digest(readme), rows: [] };
  try {
    const steps = extract(readme);
    // Report explicit exceptions even when the final server itself is NOT RUN.
    if (steps.some(s => s.blocks.some(b => b.mode === 'not-run'))) {
      const result = await execute(steps, join(out, 'consumer'), []);
      receipt.rows = result.rows;
      throw Error('NOT RUN: walkthrough incomplete; record publication blocked');
    }
    phase = 'REGISTRY'; const before = await latest();
    const mode = arg('--mode', 'force');
    if (!['poll', 'force'].includes(mode!)) throw Error(`unknown mode ${mode}`);
    if (mode === 'poll' && sameInputs(readRecord(reference), before, digest(readme))) {
      receipt.status = 'UNCHANGED'; console.log('Current versions and guide: no walkthrough or publication needed'); return;
    }
    const server = steps.at(-1)!;
    if (server.blocks.at(-1)?.mode !== 'server') throw Error(`Step ${server.title}: final server needs <!-- try-it-ci: server -->`);
    const links = [...server.text.matchAll(/<http:\/\/localhost:3000\/[^>]+>/g)].map(m => m[0].slice(1, -1));
    if (links.length !== 2) throw Error(`Step ${server.title}: expected two documented playback URLs, got ${links.length}`);
    writeFileSync(join(out, 'browser-input.json'), JSON.stringify({ links, output: join(out, 'browser.json') }));
    const consumer = join(out, 'consumer');
    if (await Bun.file(join(consumer, 'commands.sh')).exists()) throw Error('ISOLATION: consumer already used; choose a fresh --out');
    const isolated = Object.fromEntries(['HOME', 'XDG_CACHE_HOME', 'BUN_INSTALL_CACHE_DIR', 'UV_CACHE_DIR', 'UV_PYTHON_INSTALL_DIR', 'PLAYWRIGHT_BROWSERS_PATH', 'TMPDIR'].map(key => [key, join(out, 'cache', key)]));
    for (const value of Object.values(isolated)) mkdirSync(value, { recursive: true });
    for (const tool of ['bash', 'git', 'bun', 'uv', 'curl', 'tar']) if (!Bun.which(tool)) throw Error(`PREREQUISITE: ${tool} is not on PATH`);
    phase = 'WALKTHROUGH';
    const result = await execute(steps, consumer, [process.execPath, join(root, 'scripts/try-it-browser.ts'), join(out, 'browser-input.json')], { ...process.env, ...isolated, OMP_NUM_THREADS: '4', OPENBLAS_NUM_THREADS: '4', MKL_NUM_THREADS: '4' });
    if (await Bun.file(join(consumer, 'walkthrough.log')).exists()) copyFileSync(join(consumer, 'walkthrough.log'), join(out, 'walkthrough.log'));
    receipt.rows = result.rows;
    if (result.exit || result.rows.some(r => r.status !== 'PASS')) throw Error(`Step ${result.rows.find(r => r.status !== 'PASS')?.step}: incomplete walkthrough (exit ${result.exit})`);
    phase = 'VERSIONS';
    const consumerRoot = join(consumer, 'rig-c-start/my-rig');
    const installed = Object.fromEntries(packages.map(p => [p, JSON.parse(readFileSync(join(consumerRoot, 'node_modules', p, 'package.json'), 'utf8')).version]));
    const after = await latest(); assertVersions(installed, before, after);
    const clone = join(consumer, 'rig-c-start/getting-started');
    const git = Bun.spawnSync(['git', 'rev-parse', 'HEAD'], { cwd: clone });
    if (git.exitCode) throw Error('PROVENANCE: cannot identify literal clone');
    const cloneReadme = readFileSync(join(clone, 'README.md'), 'utf8');
    receipt.clone_commit = git.stdout.toString().trim(); receipt.clone_guide_sha256 = digest(cloneReadme);
    receipt.provenance = receipt.guide_sha256 === receipt.clone_guide_sha256 ? 'same README' : 'checkout README differs from literal clone; helper scripts are from clone_commit';
    console.log(`PROVENANCE: ${receipt.provenance}`);
    Object.assign(receipt, { status: 'PASS', complete: true, versions: installed, latest_before: before, latest_after: after, bun: Bun.version, browser: JSON.parse(readFileSync(join(out, 'browser.json'), 'utf8')) });
    const record = { status: 'PASS', complete: true, date: new Date().toISOString().slice(0, 10), versions: installed, bun: Bun.version, guide_sha256: digest(readme), clone_commit: receipt.clone_commit, run: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'local verification; not a CI publication' };
    phase = 'RECORD';
    const proposed = updateRecord(reference, record);
    writeFileSync(join(out, 'REFERENCE.md'), proposed);
    receipt.record_changed = proposed !== reference;
  } catch (error) {
    receipt.status = 'FAIL'; receipt.complete = false; receipt.error = `${phase}: ${String(error)}`;
    console.error(`::error::${receipt.error}`); process.exitCode = 1;
  } finally {
    receipt.seconds = +((performance.now() - started) / 1000).toFixed(3);
    writeFileSync(join(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
    const summary = [`## Try it first: ${receipt.status}`, '', `Wall time: ${receipt.seconds} s. ${receipt.error ?? ''}`, '', '| Step | README line | Result | Seconds | Reason |', '| --- | --- | --- | --- | --- |', ...receipt.rows.map((r: Row) => `| ${r.step.replaceAll('|', '\\|')} | ${r.line} | ${r.status} | ${r.seconds ?? ''} | ${r.reason ?? ''} |`), '', 'Human visual/seam acceptance: NOT RUN. Historical timings are unchanged.', ''].join('\n');
    writeFileSync(join(out, 'summary.md'), summary);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
    if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `changed=${receipt.status === 'PASS' && receipt.record_changed === true}\n`, { flag: 'a' });
    console.log(`TRY_IT_RESULT ${receipt.status} ${receipt.seconds} s`);
    rmSync(join(out, 'consumer'), { recursive: true, force: true });
    rmSync(join(out, 'cache'), { recursive: true, force: true });
    rmSync(join(out, 'browser-tools'), { recursive: true, force: true });
  }
}
if (import.meta.main) await main();

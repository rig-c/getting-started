// Run from any directory: bun scripts/check-adapters.ts [--profile-file path | --profile-ref ref] [--parts-source path]
// All package installs and generated builds live in a fresh temporary directory.
// CI adds --install-system-deps for its disposable runner; ordinary runs only download Chromium.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dir, '..');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const arg = (key: string) => { const at = process.argv.indexOf(key); return at < 0 ? undefined : process.argv[at + 1]; };
const profileRef = arg('--profile-ref') ?? 'main';
const profilePath = arg('--profile-file');
const partsSource = arg('--parts-source');
if (partsSource) assert.equal(JSON.parse(readFileSync(join(resolve(partsSource), 'package.json'), 'utf8')).name, '@rig-c/parts', 'PARTS_SOURCE: expected a parts package');
const profileUrl = `https://raw.githubusercontent.com/rig-c/.github/${encodeURIComponent(profileRef)}/profile/README.md`;
const profile = profilePath ? readFileSync(resolve(profilePath), 'utf8') : await get(profileUrl);
const temp = mkdtempSync(join(tmpdir(), 'rig-c-onboarding-'));
const consumer = join(temp, 'my-rig');
mkdirSync(consumer);
cpSync(join(root, 'scripts'), join(temp, 'getting-started/scripts'), { recursive: true });
const reports: Record<string, unknown> = {};
let tutorialOrigin: string | undefined;
let stopTutorial = () => {};

function run(command: string[], cwd: string) {
  console.log(`[command] ${command.join(' ')}`);
  const p = Bun.spawnSync(command, { cwd, stdout: 'inherit', stderr: 'inherit', env: { ...process.env, npm_config_jobs: '4', BUN_CONFIG_MAX_HTTP_REQUESTS: '4' } });
  assert.equal(p.exitCode, 0, `COMMAND: ${command.join(' ')} exited ${p.exitCode}`);
}
function rootGate(path: string, phase: string) {
  const check = JSON.parse(readFileSync(join(consumer, path), 'utf8'));
  assert.equal(check.PASS, true, `GUIDE_ROOTS: ${phase} check failed`);
  const seam = check.SEAM_OVER_MOTION;
  if (!seam?.roots) {
    assert(!partsSource, `GUIDE_ROOTS: ${phase} source package did not measure roots`);
    console.log(`[bar:guide-roots] ${phase}: SKIP body-root gate absent in this published package`);
    return;
  }
  assert.equal(seam.roots.status, 'PASS', `GUIDE_ROOTS: ${phase} roots must be measured PASS`);
  assert.equal(seam.roots.failed, 0, `GUIDE_ROOTS: ${phase} root failure`);
  assert.deepEqual([...seam.roots.pairs].sort(), ['bottomwear|thigh_l', 'bottomwear|thigh_r', 'topwear|upperarm_l', 'topwear|upperarm_r'], `GUIDE_ROOTS: ${phase} must read both shoulders and thighs`);
  const rows = seam.rows.filter((r: { pair: string }) => seam.roots.pairs.includes(r.pair));
  assert.equal(rows.length, 4 * seam.animations.length, `GUIDE_ROOTS: ${phase} must read every root in every animation`);
  assert(rows.every((r: { status: string; banded: number; opens: unknown[] }) => r.status === 'read' && r.banded > 0 && r.opens.length === 0), `GUIDE_ROOTS: ${phase} unavailable or open root row`);
  reports[`roots-${phase}`] = { status: seam.roots.status, pairs: seam.roots.pairs, rows: rows.length };
  console.log(`[bar:guide-roots] ${phase}: four measured body-root pairs PASS`);
}
function blocks(source: string, language: string): string[] {
  return [...source.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(m => m[1].trim());
}
function step(number: number | string) {
  const match = readme.match(new RegExp('### ' + number + '\\. [^\\n]+\\n([\\s\\S]*?)(?=\\n### |\\n## )'));
  assert(match, `GUIDE_STEP: missing step ${number}`);
  return match[1];
}
async function get(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'rig-c-onboarding-link-check' } });
  assert(response.ok, `LINK_HTTP: ${url} returned ${response.status}`);
  return response.text();
}
function urls(source: string): string[] {
  const found = [
    ...[...source.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]),
    ...[...source.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]),
    ...[...source.matchAll(/^\[[^\]]+\]:\s*(\S+)/gm)].map(m => m[1]),
    ...[...source.matchAll(/<(https?:\/\/[^>]+)>/g)].map(m => m[1]),
  ];
  return [...new Set(found)];
}
const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
function anchorExists(source: string, anchor: string) {
  const seen = new Map<string, number>();
  return source.split('\n').some(line => {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (!heading) return false;
    const base = slug(heading[1]); const n = seen.get(base) ?? 0; seen.set(base, n + 1);
    return (n ? `${base}-${n}` : base) === decodeURIComponent(anchor);
  });
}
// Step 10's two addresses: the hello from step 9b (on step 9c's physics build) over the idle, and step 9's wave.
const tutorialModels: Record<string, { anim: string; under: string | null }> = {
  'out/check/build/skeleton.model.json': { anim: 'hello', under: 'idle' },
  'wave-build/skeleton.model.json': { anim: 'wave', under: null },
};
function tutorialUrl(link: string) {
  const url = new URL(link);
  assert(tutorialOrigin, 'TUTORIAL_SERVER: owned step-10 server is not running');
  assert(url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '3000' && url.pathname === '/', `TUTORIAL_URL: unexpected tutorial endpoint ${link}`);
  const expected = tutorialModels[url.searchParams.get('model') ?? ''];
  assert(expected, `TUTORIAL_MODEL: expected one of ${Object.keys(tutorialModels).join(', ')}`);
  assert.equal(url.searchParams.get('anim'), expected.anim, `TUTORIAL_ANIMATION: expected ${expected.anim}`);
  assert.equal(url.searchParams.get('under'), expected.under, `TUTORIAL_UNDER: expected ${expected.under}`);
  return tutorialOrigin + url.pathname + url.search;
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
async function links() {
  const failures: string[] = [];
  const baselineGuide = await get('https://raw.githubusercontent.com/rig-c/getting-started/4715d205c2ee47fcc49b2675f737d8dd8ca9c062/README.md');
  const baselineProfile = await get('https://raw.githubusercontent.com/rig-c/.github/93be3f5e11a07e17fb70382a9a074a93bcb06238/profile/README.md');
  const baseline = new Map([['rig-c/getting-started', new Set(urls(baselineGuide))], ['rig-c/.github', new Set(urls(baselineProfile))]]);
  let count = 0;
  for (const doc of [{ text: readme, repo: 'rig-c/getting-started', directory: '', local: true }, { text: profile, repo: 'rig-c/.github', directory: 'profile', local: false }]) {
    const items = urls(doc.text);
    // Network checks are bounded to four concurrent requests.
    for (let at = 0; at < items.length; at += 4) await Promise.all(items.slice(at, at + 4).map(async link => {
      try { await checkLink(link, doc.text, doc.repo, doc.directory, doc.local); console.log(`[link:PASS] ${doc.repo}: ${link}`); }
      catch (error) { failures.push(`${baseline.get(doc.repo)?.has(link) ? 'preexisting' : 'added'} ${doc.repo}: ${link}: ${String(error)}`); console.error(`[link:FAIL] ${failures.at(-1)}`); }
      count++;
    }));
  }
  reports.links = { count, failures };
  return failures;
}
try {
  const engine = readme.split('### Inside a game engine or renderer you already use\n')[1]?.split('\n### ')[0];
  assert(engine, 'SNIPPET: missing adapter destination');
  const snippet = blocks(engine, 'js')[0]; assert(snippet, 'SNIPPET: missing JavaScript');
  reports.snippetSha256 = createHash('sha256').update(snippet).digest('hex');
  const row = profile.split('\n').find(line => line.startsWith('| 5 |') && line.includes('adapters'));
  assert(row, 'PROFILE: adapters row missing (use --profile-file or --profile-ref for the pending profile change)');
  const installs = [...row.matchAll(/`(npm install [^`]+)`/g)].map(m => m[1]);
  assert.equal(installs.length, 3, 'PROFILE: expected three install commands');
  assert(installs.includes(blocks(engine, 'sh')[0]), 'INSTALL: guide install differs from profile');
  for (let i = 0; i < installs.length; i++) {
    const dir = i === 0 ? consumer : join(temp, `host-${i}`); mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{"private":true,"type":"module"}\n');
    run(installs[i].split(' '), dir);
    run(['npm', 'ls', '--depth=0'], dir);
    const graph = Bun.spawnSync(['npm', 'ls', '--all', '--json'], { cwd: dir });
    assert.equal(graph.exitCode, 0, 'INSTALL_TREE: npm ls failed');
    assert(!/@esotericsoftware|spine-core/.test(graph.stdout.toString()), 'INSTALL_TREE: Spine runtime present');
  }
  console.log('[bar:install] three literal published install lines PASS; Spine runtime absent');
  // Follow the guide's documented no-Python route, through the build step 10 plays.
  const install = blocks(step(1), 'sh')[0].split('\n').find(line => line.startsWith('bun add '));
  assert(install, 'GUIDE_INSTALL: missing bun add'); run(install.split(' '), consumer);
  // An isolated source package lets the next parts gate be read before its release.
  if (partsSource) run(['bun', 'add', resolve(partsSource)], consumer);
  for (const n of [2, 3, 4, 5]) run(['bash', '-eu', '-o', 'pipefail', '-c', blocks(step(n), 'sh')[0]], consumer);
  const keypoints = blocks(readFileSync(join(root, 'docs/KEYPOINTS.md'), 'utf8'), 'json')[0];
  assert(keypoints, 'KEYPOINTS: hand-placed guide example absent'); JSON.parse(keypoints);
  writeFileSync(join(consumer, 'keypoints.json'), keypoints);
  const beforeDraft = readFileSync(join(consumer, 'config.json'), 'utf8');
  for (const n of [7, 8]) run(['bash', '-eu', '-o', 'pipefail', '-c', blocks(step(n), 'sh')[0]], consumer);
  // Step 7's ankle correction lets the producer cut the shoes into one part per foot.
  type Built = { animations: { name: string; duration?: number }[]; bones: { name: string }[]; slots: { name: string }[]; constraints: { kind: string; name: string }[] };
  const feetBuild = JSON.parse(readFileSync(join(consumer, 'out/check/build/skeleton.model.json'), 'utf8')) as Built;
  const slotNames = feetBuild.slots.map(slot => slot.name);
  for (const name of ['foot_r', 'foot_l']) assert(slotNames.includes(name), `GUIDE_FEET: step 8's build has no ${name} slot (step 7's l_ankle correction)`);
  assert(!slotNames.includes('shoes'), 'GUIDE_FEET: step 8\'s build still draws the shoes as one part');
  assert.equal(feetBuild.bones.length, 72, `GUIDE_FEET: expected 72 bones in step 8's build, found ${feetBuild.bones.length}`);
  reports.feet = { slots: ['foot_r', 'foot_l'], bones: feetBuild.bones.length };
  rootGate('out/check/check.json', 'idle');
  console.log('[bar:guide-feet] step 8 build: foot_r and foot_l slots, no shoes slot, 72 bones PASS');
  // Revert the real field-copy repair in a private README copy. Its command,
  // over the same proposal and installed packages, must reproduce the refusal.
  const take = blocks(step(7), 'sh')[0].split('\n').find(line => line.includes('/scripts/take.ts '));
  assert(take && take.endsWith(' limbs'), 'GUIDE_LIMBS: step 7 must retain proposed limbs');
  const revertedGuide = readme.replace(take, take.slice(0, -' limbs'.length));
  const revertedPath = join(temp, 'README-with-limbs-reverted.md'); writeFileSync(revertedPath, revertedGuide);
  const revertedStep7 = readFileSync(revertedPath, 'utf8').match(/### 7\. [^\n]+\n([\s\S]*?)(?=\n### )/);
  assert(revertedStep7, 'GUIDE_CONTROL: missing reverted step 7');
  const revertedTake = blocks(revertedStep7[1], 'sh')[0].split('\n').find(line => line.includes('/scripts/take.ts '));
  assert(revertedTake && !revertedTake.endsWith(' limbs'), 'GUIDE_CONTROL: limbs revert did not take effect');
  writeFileSync(join(consumer, 'without-limbs.config.json'), beforeDraft);
  run(['bash', '-eu', '-o', 'pipefail', '-c', revertedTake.replace(' config.json ', ' without-limbs.config.json ')], consumer);
  const rejectedCommand = blocks(step(8), 'sh')[0].replace('--config config.json', '--config without-limbs.config.json').replace('--out out', '--out without-limbs-out');
  const rejected = Bun.spawnSync(['bash', '-eu', '-o', 'pipefail', '-c', rejectedCommand], { cwd: consumer, env: process.env });
  const rejectedLog = new TextDecoder().decode(rejected.stdout) + new TextDecoder().decode(rejected.stderr);
  console.log(`[command:expected-refusal] ${rejectedCommand}\n${rejectedLog}`);
  assert.equal(rejected.exitCode, 1, 'GUIDE_CONTROL: reverted limbs must refuse the build');
  const expectedParts = ['handwear_l', 'handwear_r', 'legwear'];
  const expectedRegions = ['upperarm_r', 'forearm_r', 'upperarm_l', 'forearm_l', 'thigh_r', 'shin_r', 'thigh_l', 'shin_l'];
  for (const name of expectedParts) assert(rejectedLog.includes(`CONFIG_PART_ATTACHED: part "${name}"`), `GUIDE_CONTROL: missing CONFIG_PART_ATTACHED ${name}`);
  for (const name of expectedRegions) assert(rejectedLog.includes(`CONFIG_NAME_RESOLVES: config.regions.${name}`), `GUIDE_CONTROL: missing CONFIG_NAME_RESOLVES ${name}`);
  reports.limbsControl = { exitCode: rejected.exitCode, parts: expectedParts, regions: expectedRegions };
  console.log('[bar:guide-limbs] current packages: repaired step 8 exit 0; exact README limbs revert reproduces 11 named refusals PASS');
  run(['bash', '-eu', '-o', 'pipefail', '-c', blocks(step(9), 'sh')[0]], consumer);
  const retarget = blocks(step(9), 'sh')[0].split('\n').find(line => line.startsWith('bunx rig-pose retarget '));
  assert(retarget && retarget.includes('--pose wave.pose.clean.json'), 'GUIDE_CLEAN: retarget must read the cleaned sequence');
  const rawRetarget = retarget.replace('--pose wave.pose.clean.json', '--pose wave.pose.json').replace('--out wave.motion.json', '--out without-clean.motion.json').replace('--build wave-build', '--build without-clean-build');
  const uncleaned = Bun.spawnSync(['bash', '-eu', '-o', 'pipefail', '-c', rawRetarget], { cwd: consumer, env: process.env });
  const uncleanedLog = new TextDecoder().decode(uncleaned.stdout) + new TextDecoder().decode(uncleaned.stderr);
  console.log(`[command:expected-refusal] ${rawRetarget}\n${uncleanedLog}`);
  assert.equal(uncleaned.exitCode, 1, 'GUIDE_CONTROL: raw sequence must refuse retarget');
  assert(uncleanedLog.includes('POSE_NOT_CLEANED: wave.pose.json'), 'GUIDE_CONTROL: missing POSE_NOT_CLEANED');
  reports.cleanControl = { exitCode: uncleaned.exitCode, rule: 'POSE_NOT_CLEANED' };
  console.log('[bar:guide-clean] cleaned sequence retarget exit 0; exact original raw-sequence command refused POSE_NOT_CLEANED PASS');
  reports.modelSha256 = createHash('sha256').update(readFileSync(join(consumer, 'wave-build/skeleton.model.json'))).digest('hex');
  // Step 9's literal commands check the parts roots as well as the core gate.
  rootGate('wave-check/check.json', 'wave');
  // Step 9b: the hello, named in the config and gated by the build.
  run(['bash', '-eu', '-o', 'pipefail', '-c', blocks(step('9b'), 'sh')[0]], consumer);
  rootGate('out/check/check.json', 'hello');
  const built = JSON.parse(readFileSync(join(consumer, 'out/check/build/skeleton.model.json'), 'utf8')) as Built;
  assert.deepEqual(built.animations.map(a => a.name), ['idle', 'hello'], 'GUIDE_HELLO: the build must hold idle and hello');
  const helloLength = (b: Built) => b.animations.find(a => a.name === 'hello')?.duration;
  assert.equal(helloLength(built), 4.75, `GUIDE_HELLO: expected a 4.75 s hello, found ${helloLength(built)}`);
  console.log('[bar:guide-hello] step 9b build exit 0; out/check/build holds idle, hello (4.75 s) PASS');
  // Step 9c: the cloth recipe puts the side locks, the fringe and the skirt on physics.
  run(['bash', '-eu', '-o', 'pipefail', '-c', blocks(step('9c'), 'sh')[0]], consumer);
  rootGate('out/check/check.json', 'cloth');
  const physical = JSON.parse(readFileSync(join(consumer, 'out/check/build/skeleton.model.json'), 'utf8')) as Built;
  assert.deepEqual(physical.animations.map(a => a.name), ['idle', 'hello'], 'GUIDE_CLOTH: the build must still hold idle and hello');
  assert.equal(helloLength(physical), 4.75, `GUIDE_CLOTH: expected a 4.75 s hello, found ${helloLength(physical)}`);
  for (const name of ['foot_r', 'foot_l']) assert(physical.slots.some(slot => slot.name === name), `GUIDE_CLOTH: the cloth build lost the ${name} slot`);
  const ofKind = (kind: string) => physical.constraints.filter(c => c.kind === kind).map(c => c.name);
  assert.equal(ofKind('physics').length, 27, `GUIDE_CLOTH: expected 27 physics constraints, found ${ofKind('physics').length}`);
  assert.equal(ofKind('transform').length, 3, `GUIDE_CLOTH: expected 3 transform constraints, found ${ofKind('transform').length}`);
  for (const name of ['lockt0_0_physics', 'lock1t0_0_physics', 'bang_c1_physics', 'skirt_swing_physics', 'skirt1_2_physics'])
    assert(ofKind('physics').includes(name), `GUIDE_CLOTH: missing physics constraint ${name}`);
  reports.cloth = { physics: ofKind('physics').length, transform: ofKind('transform').length };
  console.log('[bar:guide-cloth] step 9c build exit 0; 27 physics and 3 transform constraints, idle and hello PASS');
  // Verification tools are separate from each empty consumer installation.
  const tools = join(temp, 'tools'); mkdirSync(tools); writeFileSync(join(tools, 'package.json'), '{"private":true,"type":"module"}');
  run(['npm', 'install', '--no-audit', '--no-fund', 'playwright@1.58.2'], tools);
  run(['bun', join(tools, 'node_modules/playwright/cli.js'), 'install', ...(process.argv.includes('--install-system-deps') ? ['--with-deps'] : []), 'chromium'], tools);
  const { chromium } = await import(join(tools, 'node_modules/playwright/index.mjs'));
  // Run the documented step-10 server ourselves. Remap its advertised port only;
  // never let an unrelated localhost process satisfy a tutorial link.
  const tutorial = Bun.spawn(['bun', '../getting-started/scripts/serve.ts', '--port', '0'], { cwd: consumer, stdout: 'pipe', stderr: 'inherit' });
  stopTutorial = () => { tutorial.kill(); };
  const startup = async () => {
    let text = '';
    for await (const chunk of tutorial.stdout) {
      text += new TextDecoder().decode(chunk);
      const match = text.match(/http:\/\/localhost:(\d+)\//);
      if (match) return `http://127.0.0.1:${match[1]}`;
    }
    throw new Error(`TUTORIAL_SERVER: exited before listening: ${text}`);
  };
  tutorialOrigin = await Promise.race([startup(), new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('TUTORIAL_SERVER: startup timeout')), 30000); timer.unref(); })]);
  console.log(`[tutorial:owned-server] ${tutorialOrigin}`);
  const linkFailures = await links();
  const observation = `
const readFrame = () => {
  app.renderer.render({ container: app.stage });
  const gl = app.renderer.gl;
  if (!gl) throw new Error('FRAME_CONTEXT: expected native WebGL canvas');
  const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let painted = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) painted++;
  return { painted, pixels: Array.from(pixels), pose: JSON.stringify(rig.player.posedFrame()) };
};
window.exampleControls = { hide: () => { rig.visible = false; }, freeze: () => app.ticker.stop() };
window.exampleCheck = async () => {
  const first = readFrame();
  await new Promise(resolve => setTimeout(resolve, 700));
  const second = readFrame();
  let changed = 0; for (let i = 0; i < first.pixels.length; i++) if (first.pixels[i] !== second.pixels[i]) changed++;
  return { first: first.painted, second: second.painted, changed, advanced: first.pose !== second.pose };
};`;
  async function bundle(code: string, name: string) {
    const file = join(consumer, `${name}.js`); writeFileSync(file, code);
    const result = await Bun.build({ entrypoints: [file], target: 'browser', outdir: join(consumer, name), naming: 'entry.js' }).catch((error: unknown) => { throw new Error(`SNIPPET_IMPORT: ${name}: ${String(error)}`, { cause: error }); });
    assert(result.success, `SNIPPET_IMPORT: ${name}: ${result.logs.join('\n')}`);
    return `/${name}/entry.js`;
  }
  await bundle(snippet, 'literal-snippet');
  const entry = await bundle(snippet + observation, 'example');
  // A broken import must be rejected by the exact compiler used for the snippet.
  await assert.rejects(() => bundle("import '@rig-c/does-not-exist-onboarding-control';", 'broken-import'), /SNIPPET_IMPORT/);
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
    const pathname = new URL(req.url).pathname;
    if (pathname === '/') return new Response(`<!doctype html><script type="module" src="${entry}"></script>`, { headers: { 'content-type': 'text/html' } });
    const file = resolve(consumer, '.' + pathname);
    if (!file.startsWith(consumer + '/')) return new Response('outside consumer', { status: 403 });
    const body = Bun.file(file);
    if (!await body.exists()) return new Response('not found', { status: 404 });
    return new Response(body);
  } });
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch((error: Error) => { server.stop(true); throw error; });
  try {
    const tutorialLinks = urls(readme).filter(link => link.startsWith('http://localhost:'));
    assert.deepEqual(tutorialLinks.map(link => new URL(link).searchParams.get('model')).sort(), Object.keys(tutorialModels).sort(), 'TUTORIAL_LINK: expected the two step-10 endpoints');
    for (const link of tutorialLinks) {
      const expected = tutorialModels[new URL(link).searchParams.get('model') ?? ''];
      const tutorialPage = await browser.newPage();
      const tutorialErrors: string[] = [];
      tutorialPage.on('pageerror', (error: Error) => tutorialErrors.push(String(error)));
      await tutorialPage.goto(tutorialUrl(link));
      await tutorialPage.waitForFunction(`window.rigPlayer && document.querySelector("#anim").value === ${JSON.stringify(expected.anim)}`, null, { timeout: 60000 });
      assert(await tutorialPage.evaluate('window.rigPlayer.posedFrame().order.length > 0'), 'TUTORIAL_FRAME: model has no drawn slots');
      const tracks = await tutorialPage.evaluate('[window.rigPlayer.entry(0)?.animation ?? null, window.rigPlayer.entry(1)?.animation ?? null]');
      assert.deepEqual(tracks, expected.under ? [expected.under, expected.anim] : [expected.anim, null], 'TUTORIAL_TRACKS: unexpected tracks');
      assert.deepEqual(tutorialErrors, [], 'TUTORIAL_BROWSER: step-10 page failed');
      await tutorialPage.close();
      console.log(`[bar:tutorial] owned documented server loaded ${new URL(link).search} with tracks ${JSON.stringify(tracks)} PASS`);
    }
    // Step 10's breeze: the page's world, read through the player. The page runs on Playwright's
    // fake clock, one 1/24 s step a frame, so a slow CI GPU changes nothing. After 3 s, over 5 s
    // (one whole gust at 0.2 Hz): with the breeze on, the wind runs 0.75 +/- 0.25 to the right,
    // y 0; with &wind=0 it stands at the runtime's [1, 0]. The side locks' tips, in the head's
    // frame (the idle's own head nod moves them on the canvas), must move at least twice as far
    // in the breeze as without it. The guide's 3 px reading is not asserted: this breeze, held
    // inside the hello's seam bars, moves them about 1.3 page px (docs/REFERENCE.md, step 10).
    const breezeReadings: Record<string, unknown> = {};
    for (const calm of [false, true]) {
      const breezePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const breezeErrors: string[] = [];
      breezePage.on('pageerror', (error: Error) => breezeErrors.push(String(error)));
      breezePage.on('console', (message: { type(): string; text(): string }) => { if (message.type() === 'error') breezeErrors.push(message.text()); });
      await breezePage.clock.install();
      await breezePage.goto(`${tutorialOrigin}/?model=out/check/build/skeleton.model.json&anim=idle${calm ? '&wind=0' : ''}`);
      for (let i = 0; i < 1200 && !(await breezePage.evaluate('!!window.rigPlayer')); i++) await breezePage.clock.runFor(50);
      assert(await breezePage.evaluate('!!window.rigPlayer'), 'TUTORIAL_BREEZE: the step-10 page did not load');
      assert.equal(await breezePage.evaluate('document.getElementById("breeze").checked'), !calm, 'TUTORIAL_BREEZE: the breeze box must follow &wind=');
      const lengths = await breezePage.evaluate(`fetch('/out/check/build/skeleton.json').then(r => r.json()).then(s => Object.fromEntries(s.bones.map(b => [b.name, b.length || 0])))`);
      const sample = `((len) => {
        const p = window.rigPlayer, h = p.bone('head'), det = h.a * h.d - h.b * h.c;
        const scale = parseFloat(document.getElementById('root').style.transform.match(/scale\\(([^)]+)\\)/)[1]);
        const tip = (k) => { const b = p.bone(k), dx = b.x + b.a * len[k] - h.x, dy = b.y + b.c * len[k] - h.y; return [scale * (h.d * dx - h.b * dy) / det, scale * (-h.c * dx + h.a * dy) / det]; };
        return { wind: p.environment().wind, lockt0_2: tip('lockt0_2'), lock1t0_2: tip('lock1t0_2') };
      })(${JSON.stringify(lengths)})`;
      for (let i = 0; i < 3 * 24; i++) await breezePage.clock.runFor(1000 / 24);
      const samples: { wind: number[]; lockt0_2: number[]; lock1t0_2: number[] }[] = [];
      for (let i = 0; i < 5 * 24; i++) { await breezePage.clock.runFor(1000 / 24); samples.push(await breezePage.evaluate(sample)); }
      const span = (points: number[][]) => Math.max(...points.flatMap(a => points.map(b => Math.hypot(a[0] - b[0], a[1] - b[1]))));
      const xs = samples.map(v => v.wind[0]);
      const reading = { wind: [Math.min(...xs), Math.max(...xs)], windY: [...new Set(samples.map(v => v.wind[1]))],
        px: { lockt0_2: +span(samples.map(v => v.lockt0_2)).toFixed(3), lock1t0_2: +span(samples.map(v => v.lock1t0_2)).toFixed(3) } };
      breezeReadings[calm ? 'calm' : 'breeze'] = reading;
      assert.deepEqual(reading.windY, [0], 'TUTORIAL_BREEZE: the wind has no y');
      if (calm) assert.deepEqual(reading.wind, [1, 1], 'TUTORIAL_BREEZE: &wind=0 must stand in the runtime\'s world, wind [1, 0]');
      else assert(reading.wind[0] >= 0.5 && reading.wind[0] < 0.51 && reading.wind[1] <= 1 && reading.wind[1] > 0.99, `TUTORIAL_BREEZE: wind x ${reading.wind} is not one whole gust of 0.75 +/- 0.25`);
      assert.deepEqual(breezeErrors, [], 'TUTORIAL_BREEZE: step-10 page logged errors');
      await breezePage.close();
    }
    const moved = breezeReadings as Record<'breeze' | 'calm', { px: Record<string, number> }>;
    for (const bone of ['lockt0_2', 'lock1t0_2'])
      assert(moved.breeze.px[bone] >= 2 * moved.calm.px[bone], `TUTORIAL_BREEZE: ${bone} tip moved ${moved.breeze.px[bone]} px in the breeze, not twice its ${moved.calm.px[bone]} px without it`);
    reports.breeze = breezeReadings;
    console.log(`[bar:tutorial-breeze] ${JSON.stringify(breezeReadings)} PASS`);
    const page = await browser.newPage(); const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(String(error)));
    page.on('requestfailed', (request: { url(): string; failure(): { errorText: string } | null }) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.goto(`http://127.0.0.1:${server.port}`);
    await page.waitForFunction('typeof window.exampleCheck === "function"', null, { timeout: 60000 });
    const result = await page.evaluate('window.exampleCheck()');
    function frameGate(value: { first: number; second: number; changed: number; advanced: boolean }) {
      assert(value.first > 0 && value.second > 0, 'FRAME_EMPTY: expected native alpha pixels');
      assert(value.changed > 0 && value.advanced, 'FRAME_FROZEN: expected ticker-driven wave movement');
    }
    frameGate(result);
    await page.evaluate('window.exampleControls.hide()');
    const empty = await page.evaluate('window.exampleCheck()');
    assert.throws(() => frameGate(empty), /FRAME_EMPTY/);
    await page.reload();
    await page.waitForFunction('typeof window.exampleCheck === "function"', null, { timeout: 60000 });
    await page.evaluate('window.exampleControls.freeze()');
    const frozen = await page.evaluate('window.exampleCheck()');
    assert.throws(() => frameGate(frozen), /FRAME_FROZEN/);
    reports.controls = { empty, frozen };
    await assert.rejects(() => get(`http://127.0.0.1:${server.port}/missing-link-control`), /LINK_HTTP/);
    assert.deepEqual(errors, [], `BROWSER: ${errors.join('\n')}`);
    reports.frame = result;
    console.log(`[bar:frame] ${JSON.stringify(result)} PASS`);
    console.log('[bar:controls] broken import, empty frame, frozen frame, dead link all rejected PASS');
  } finally { await browser.close(); server.stop(true); }
  console.log(`[evidence] ${JSON.stringify(reports)}`);
  assert.equal(linkFailures.length, 0, `LINKS: ${linkFailures.length} unresolved links (reported above; unrelated content is not rewritten)`);
  console.log('[bar:summary] published installs, step-10 build, literal snippet, native pixels, animation, links PASS');
} finally { stopTutorial(); rmSync(temp, { recursive: true, force: true }); }

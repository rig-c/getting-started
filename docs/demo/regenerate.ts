// Export real walkthrough assets and the unmodified guide player. No character art is generated here.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

function arg(key: string) { const i = process.argv.indexOf(key); return i < 0 ? undefined : process.argv[i + 1]; }
const root = resolve(import.meta.dir, '../..');
const consumer = resolve(arg('--consumer') ?? '.');
const scratchArg = arg('--scratch');
assert(scratchArg, 'Set --scratch to a dedicated directory outside the checkout');
mkdirSync(scratchArg, { recursive: true });
const scratch = realpathSync(scratchArg);
assert(![root, consumer].some(p => scratch === p || scratch.startsWith(p + sep)), 'Scratch must be outside checkout and consumer');
const output = resolve(arg('--out') ?? join(import.meta.dir, 'walkthrough.webp'));
const tools = resolve(arg('--tools') ?? join(scratch, 'browser-tools'));
const modelPath = 'out/check/build/skeleton.model.json';
const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');
const files = new Set<string>();
function input(path: string) {
  const p = resolve(consumer, path);
  assert(p.startsWith(consumer + sep), `Input escapes consumer: ${path}`);
  assert(existsSync(p), `Missing walkthrough output: ${path}`);
  files.add(path); return p;
}
const read = (path: string) => JSON.parse(readFileSync(input(path), 'utf8'));
const model = read(modelPath);
assert(model.spec === 'rigc-compiled/3', 'Expected the walkthrough compiled model');
const skeleton = read('out/check/build/skeleton.json');
assert(skeleton.animations.idle && skeleton.animations.hello, 'Run the walkthrough through step 9c');
input('inputs/painting.png'); input('inputs/seethrough.json'); input('config.json'); input('keypoints.json');
const layerDir = 'inputs/layers/full';
const layers = read(layerDir + '/layers.json');
const selected = ['back hair', 'bottomwear', 'topwear', 'face', 'front hair'];
const cards = selected.map(name => {
  const layer = layers.layers.find((l: any) => l.name === name);
  assert(layer, `Missing See-through layer: ${name}`);
  // The pinned exam ships the normalized parts/<tag>.png layout; its manifest
  // retains the original See-through download filenames, which are not files.
  const filename = `parts/${name}.png`;
  input(layerDir + '/' + filename); return { ...layer, filename };
});
// Every atlas reference must resolve through the same paths loadModel will use.
const pageNames = model.pages.map((p: any) => p.name);
for (const name of pageNames) input(join(dirname(modelPath), name));
console.log('DEMO_READER_PREFLIGHT', JSON.stringify({ layers: cards.map(c => c.name), pages: pageNames, animations: Object.keys(skeleton.animations) }));
assert(existsSync(join(tools, 'node_modules/playwright/index.mjs')), 'Install playwright@1.58.2 in --tools first');
const { chromium } = await import(join(tools, 'node_modules/playwright/index.mjs'));

const W = 720, H = 600, fps = 12, count = 93, duration = 7750;
const presentation = join(scratch, 'presentation');
if (!process.argv.includes('--check')) {
  const prepare = Bun.spawn(['uv', 'run', '--with', 'pillow==11.3.0', 'python', join(import.meta.dir, 'encode.py'), '--prepare', consumer, presentation], { stdout: 'inherit', stderr: 'inherit' });
  assert.equal(await prepare.exited, 0, 'Deterministic presentation thumbnail preparation');
}
const titles = ['1 / One painting', '2 / See-through layers', '3 / Bones + meshes', '4 / Playing in the browser'];
const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const layout = `<style>
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#f4f4f4;color:#222;font:16px/1.4 Arial,sans-serif}
#caption{position:fixed;z-index:99999;inset:0 0 auto;height:74px;background:#172a35;color:white;padding:12px 24px;box-sizing:border-box}
#caption b{display:block;font-size:24px;line-height:30px}#caption span{font-size:15px;color:#d5e8ec}
#bar{margin-top:74px;height:42px;box-sizing:border-box}#stage{height:484px!important}
#painting{position:absolute;top:92px;left:192px}
.card{position:absolute;top:134px;width:142px;height:330px;border:1px solid #abb9bd;background:repeating-conic-gradient(#e7edef 0% 25%,#f8fafb 0% 50%) 0/16px 16px;box-shadow:0 5px 12px #1232;transform-origin:50% 90%}
.card img{position:absolute;left:10px;top:16px}.tag{position:absolute;top:100%;left:0;background:#172a35;color:white;padding:3px 7px;font-size:14px;white-space:nowrap}
</style>`;
const caption = (stage: number, sub: string) => `<div id="caption"><b>${titles[stage]}</b><span>${sub}</span></div>`;
const intro = (stage: number) => `<!doctype html><meta charset="utf-8">${layout}${caption(stage, stage === 0 ? 'The guide’s own example · painting → layers → rig → motion' : 'Five original full-run layers · cropped thumbnails')}${stage === 0 ? '<img id="painting" src="/presentation/painting.png">' : cards.map((c, i) => `<div class="card" data-i="${i}"><img src="/presentation/layer-${i}.png"><span class="tag">${esc(c.name)}</span></div>`).join('')}`;
const playerHtml = readFileSync(join(root, 'scripts/play.html'), 'utf8');
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const path = decodeURIComponent(new URL(req.url).pathname);
  if (/^\/presentation\/(painting|layer-[0-4])\.png$/.test(path)) return new Response(Bun.file(join(presentation, path.slice('/presentation/'.length))));
  if (path === '/painting') return new Response(intro(0), { headers: { 'Content-Type': 'text/html' } });
  if (path === '/layers') return new Response(intro(1), { headers: { 'Content-Type': 'text/html' } });
  if (path === '/') return new Response(playerHtml, { headers: { 'Content-Type': 'text/html' } });
  const p = resolve(consumer, '.' + path);
  if (!p.startsWith(consumer + sep) || !existsSync(p)) return new Response('Not found', { status: 404 });
  return new Response(Bun.file(p));
} });
// Pin presentation rasterization across fresh processes; meshes still require
// the real WebGL backend below. These flags do not change the guide's player.
const graphics = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-rasterization', '--disable-accelerated-2d-canvas', '--force-color-profile=srgb'];
const browser = await chromium.launch({ headless: true, args: graphics });
const passes: any[] = [];
try {
  if (process.argv.includes('--check')) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push(String(e)));
    page.on('response', (r: any) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${server.url}?model=${modelPath}&anim=hello&under=idle`);
    await page.waitForFunction('!!window.rigPlayer', null, { polling: 100, timeout: 60_000 });
    const loaded = await page.evaluate(() => {
      const p = (window as any).rigPlayer; p.frame(0);
      return { backend: p.renderer.meshBackendActive, drawn: p.posedFrame().order.length,
        tracks: [p.entry(0).animation, p.entry(1).animation] };
    });
    assert.equal(loaded.backend, 'webgl'); assert(loaded.drawn > 0);
    assert.deepEqual(loaded.tracks, ['idle', 'hello']); assert.deepEqual(errors, []);
    console.log('DEMO_BROWSER_READER_PASS', JSON.stringify(loaded));
  } else {
  for (let pass = 0; pass < 2; pass++) {
    const frames = join(scratch, `frames-${pass}`); mkdirSync(frames, { recursive: true });
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push(String(e)));
    page.on('response', (r: any) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', (r: any) => errors.push(`${r.url()}: ${r.failure()?.errorText}`));
    // Drive the guide's own RAF tick at fixed 1/24 s, including its breeze clock.
    await page.addInitScript(() => {
      let t = 0, queue: FrameRequestCallback[] = [];
      const present = window.requestAnimationFrame.bind(window);
      (window as any).demoPresent = () => new Promise(resolve => present(() => present(resolve)));
      performance.now = () => t;
      window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
      (window as any).demoTick = () => { t += 1000 / 24; const q = queue; queue = []; for (const cb of q) cb(t); };
    });
    const hashes: string[] = [];
    const capture = async (i: number) => {
      await page.evaluate(() => (window as any).demoPresent());
      const b = await page.screenshot({ animations: 'disabled' }); hashes.push(sha(b));
      writeFileSync(join(frames, `${String(i).padStart(3, '0')}.png`), b);
    };
    await page.goto(`${server.url}painting`); await page.locator('img').evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map(i => i.decode())));
    for (let i = 0; i < 9; i++) await capture(i);
    await page.goto(`${server.url}layers`); await page.locator('img').evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map(i => i.decode())));
    for (let i = 0; i < 15; i++) {
      await page.locator('.card').evaluateAll((elements: HTMLElement[], t: number) => elements.forEach((el, j) => {
        el.style.left = `${289 + (j - 2) * (20 + t * 117)}px`;
        el.style.transform = `rotate(${(j - 2) * (1 + t * 1.5)}deg)`;
      }), Math.min(1, i / 9)); await capture(i + 9);
    }
    await page.goto(`${server.url}?model=${modelPath}&anim=hello&under=idle`);
    await page.waitForFunction('!!window.rigPlayer', null, { polling: 100, timeout: 60_000 });
    await page.addStyleTag({ content: layout.replace('<style>', '').replace('</style>', '') });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.locator('body').evaluate((body: HTMLElement, html: string) => body.insertAdjacentHTML('afterbegin', html), caption(2, 'Actual posed vertices and bone transforms · no edited artwork'));
    // Geometry is read from the player, never a hand-drawn approximation of the rig.
    const geometry = await page.evaluate((bones: any[]) => {
      const p = (window as any).rigPlayer; p.frame(0);
      const frame = p.posedFrame();
      const root = document.getElementById('root')!, stage = document.getElementById('stage')!;
      const style = getComputedStyle(root), scale = new DOMMatrix(style.transform).a;
      const left = parseFloat(style.left), top = parseFloat(style.top);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '720'); svg.setAttribute('height', '484');
      svg.style.cssText = 'position:absolute;inset:0;pointer-events:none';
      const line = (a: number[], b: number[], color: string, width: number) => {
        const l = document.createElementNS(svg.namespaceURI, 'line');
        for (const [k,v] of Object.entries({ x1:left+a[0]*scale,y1:top-a[1]*scale,x2:left+b[0]*scale,y2:top-b[1]*scale,stroke:color,'stroke-width':width })) l.setAttribute(k,String(v));
        svg.appendChild(l);
      };
      let meshes = 0, triangles = 0;
      for (const slot of frame.order) if (slot.kind === 'mesh') {
        meshes++; triangles += slot.triangles.length / 3;
        for (let i = 0; i < slot.triangles.length; i += 3) for (let j = 0; j < 3; j++) {
          const a=slot.triangles[i+j]*2,b=slot.triangles[i+(j+1)%3]*2;
          line(slot.vertices.slice(a,a+2),slot.vertices.slice(b,b+2),'#037d9b',0.65);
        }
      }
      for (const b of bones) { const world = p.bone(b.name); if (b.length > 0) line([world.x,world.y],[world.x+world.a*b.length,world.y+world.c*b.length],'#f59a23',1.5); }
      stage.appendChild(svg);
      return { meshes, triangles, bones: bones.length, backend: p.renderer.meshBackendActive };
    }, skeleton.bones);
    assert.equal(geometry.backend, 'webgl'); assert(geometry.meshes > 0 && geometry.triangles > 0);
    for (let i = 0; i < 12; i++) await capture(i + 24);
    await page.locator('#stage svg').evaluate((el: SVGElement) => el.remove());
    await page.locator('#caption').evaluate((el: HTMLElement, html: string) => el.outerHTML = html, caption(3, 'idle → hello over idle · breathing, blinking, waving · WebGL'));
    // Show the idle's actual blink before the hello's eye-narrowing keys take
    // over. Select through the guide's real menu; never add or modify keys.
    await page.locator('#anim').selectOption('idle');
    await page.evaluate(() => { for (let i = 0; i < 48; i++) (window as any).demoTick(); });
    const poses: string[] = [], readings: any[] = [];
    for (let i = 0; i < 57; i++) {
      if (i === 16) {
        await page.locator('#anim').selectOption('hello');
        await page.evaluate(() => { for (let j = 0; j < 36; j++) (window as any).demoTick(); });
      }
      await page.evaluate(() => { (window as any).demoTick(); (window as any).demoTick(); });
      poses.push(await page.evaluate(() => JSON.stringify((window as any).rigPlayer.posedFrame())));
      readings.push(await page.evaluate(() => {
        const p = (window as any).rigPlayer;
        return { animation: p.entry(1).animation, time: p.entry(1).animationTime, eye_r_scaleY: p.bone('eye_r').scaleY,
          eye_l_scaleY: p.bone('eye_l').scaleY, chest_scaleX: p.bone('chest').scaleX,
          forearm_rotation: p.bone('sleeve_r1').rotationX };
      }));
      await capture(i + 36);
    }
    assert(new Set(poses).size > 1, 'Frozen browser pose'); assert(new Set(hashes.slice(36)).size > 1, 'Frozen browser pixels');
    assert.deepEqual(errors, [], 'Browser load/capture errors');
    const webp = join(scratch, `pass-${pass}.webp`);
    const child = Bun.spawn(['uv', 'run', '--with', 'pillow==11.3.0', 'python', join(import.meta.dir, 'encode.py'), frames, webp], { stdout: 'inherit', stderr: 'inherit' });
    assert.equal(await child.exited, 0, 'WebP encode/reader validation');
    const ranges = Object.fromEntries(['eye_r_scaleY','eye_l_scaleY','chest_scaleX','forearm_rotation'].map(key =>
      [key, { min: Math.min(...readings.map(r => r[key])), max: Math.max(...readings.map(r => r[key])) }]));
    assert(ranges.eye_r_scaleY.min < 0.2 && ranges.eye_l_scaleY.min < 0.2, 'Actual idle blink not captured');
    assert(ranges.chest_scaleX.max > ranges.chest_scaleX.min, 'Actual breath not captured');
    assert(ranges.forearm_rotation.max - ranges.forearm_rotation.min > 30, 'Actual wave not captured');
    const passResult = { frames_sha256: sha(hashes.join('\n') + '\n'), webp_sha256: sha(readFileSync(webp)), geometry, ranges };
    passes.push(passResult);
    console.log('DEMO_PASS', pass, JSON.stringify(passResult));
    await context.close();
  }
  // The rebuild contract is the final animation's bytes. Raw screenshot
  // digests remain provenance; a lossy encoder can map distinct rasters to
  // the same bytes, so PNG equality would impose a different contract.
  assert.equal(passes[0].webp_sha256, passes[1].webp_sha256, 'Encoder is nondeterministic');
  const bytes = readFileSync(join(scratch, 'pass-0.webp')); assert(bytes.length < 2_000_000);
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, bytes);
  const versions = Object.fromEntries(['@rig-c/parts', '@rig-c/core', '@rig-c/pose', '@rig-c/play'].map(n => [n, JSON.parse(readFileSync(join(consumer,'node_modules',n,'package.json'),'utf8')).version]));
  const receipt = { spec: 'walkthrough-demo/1', width: W, height: H, duration_ms: duration, fps, source_frames: count, bytes: bytes.length,
    walkthrough_input: 'rig-c/exam@01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs',
    guide_sha256: sha(readFileSync(join(root,'README.md'))), versions, browser: browser.version(), graphics, encoder: 'Pillow 11.3.0 / libwebp (version printed by encode.py); lossy quality 72, method 6, loop 0',
    input_sha256: Object.fromEntries([...files].sort().map(p => [p, sha(readFileSync(join(consumer,p)))])),
    player_sha256: sha(playerHtml), script_sha256: sha(readFileSync(import.meta.filename)), encoder_script_sha256: sha(readFileSync(join(import.meta.dir,'encode.py'))),
    encoder_runtime: JSON.parse(readFileSync(join(scratch,'pass-0.webp.json'),'utf8')), raw_screenshots_identical: passes[0].frames_sha256 === passes[1].frames_sha256, passes,
    licence: 'Character imagery: CC BY-NC 4.0, rig-c/exam. Painted with Nova Anime XL IL v8.0 by Crody (https://civitai.com/models/376130). Scripts: MIT.',
    provenance: 'Source files are unretouched. Pillow crops layer thumbnail bounds at opaque alpha>=250 plus 8px padding and scales thumbnails with LANCZOS for presentation only. Bone/mesh lines come from actual runtime geometry. Playing frames capture the unchanged guide page driven at fixed 24 Hz, with two compositor frames before each screenshot.' };
  writeFileSync(join(dirname(output), 'provenance.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log('DEMO_RESULT', JSON.stringify({ bytes: bytes.length, duration_ms: duration, sha256: sha(bytes), identical: true, browser: browser.version() }));
  }
} finally { await browser.close(); await server.stop(true); }

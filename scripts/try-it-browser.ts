// Supervise the literal step-10 server; exercise its unmodified page.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const tools = join(dirname(input.output), 'browser-tools'); mkdirSync(tools, { recursive: true });
writeFileSync(join(tools, 'package.json'), '{"private":true,"type":"module"}\n');
for (const command of [['bun', 'add', '--exact', 'playwright@1.58.2'], ['bun', join(tools, 'node_modules/playwright/cli.js'), 'install', ...(process.env.CI ? ['--with-deps'] : []), 'chromium']]) {
  const child = Bun.spawn(command, { cwd: tools, stdout: 'inherit', stderr: 'inherit' });
  assert.equal(await child.exited, 0, `Step 10 browser setup: ${command[0]} ${command[1]}`);
}
const { chromium } = await import(join(tools, 'node_modules/playwright/index.mjs'));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const observations: unknown[] = [];
try {
  for (const link of input.links) {
    const url = new URL(link);
    assert.equal(url.origin, 'http://localhost:3000', 'Step 10 must keep a local documented origin');
    const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push(String(e)));
    page.on('requestfailed', (r: any) => errors.push(`${r.url()}: ${r.failure()?.errorText}`));
    page.on('response', (r: any) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    // Own the exact server: no port remapping or pre-existing process fallback.
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { const r = await fetch(link, { signal: AbortSignal.timeout(500) }); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'Step 10 server did not become ready');
    await page.goto(link);
    await page.waitForFunction('!!window.rigPlayer', null, { timeout: 60000 });
    const sample = () => page.evaluate(`(() => {
      const p = window.rigPlayer;
      p.frame(0);
      let painted = 0, hash = 2166136261;
      // DOM mode rasterizes in shared offscreen GL, then blits to visible 2D canvases.
      for (const c of document.querySelectorAll('#root canvas')) {
        if (!c.width || !c.height) continue;
        const ctx = c.getContext('2d');
        if (!ctx) throw Error('no visible canvas context');
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 0; i < pixels.length; i++) { if (i % 4 === 3 && pixels[i]) painted++; hash = Math.imul(hash ^ pixels[i], 16777619); }
      }
      return { painted, hash: hash >>> 0, backend: p.renderer.meshBackendActive ?? p.renderer.backendActive, pose: JSON.stringify(p.posedFrame()), tracks: [p.entry(0)?.animation ?? null, p.entry(1)?.animation ?? null], wind: p.environment().wind };
    })()`);
    const first = await sample(); const firstScreenshot = await page.locator('#stage').screenshot();
    await page.waitForTimeout(700); const second = await sample(); const secondScreenshot = await page.locator('#stage').screenshot();
    const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
    assert.equal(first.backend, 'webgl', 'Step 10 must rasterize through WebGL');
    assert.equal(second.backend, 'webgl', 'Step 10 must keep the WebGL backend');
    assert(first.painted > 0 && second.painted > 0, 'Step 10 empty canvas');
    assert(first.pose !== second.pose && sha(firstScreenshot) !== sha(secondScreenshot), 'Step 10 frozen pose or screen pixels');
    assert.deepEqual(second.tracks, url.searchParams.get('under') ? [url.searchParams.get('under'), url.searchParams.get('anim')] : [url.searchParams.get('anim'), null]);
    await page.locator('#pause').click(); await page.waitForTimeout(150);
    const paused = await sample(); await page.waitForTimeout(300); const held = await sample();
    assert.equal(held.pose, paused.pose, 'Step 10 pause failed');
    await page.locator('#pause').click(); await page.waitForTimeout(350);
    assert.notEqual((await sample()).pose, held.pose, 'Step 10 resume failed');
    await page.locator('#breeze').uncheck();
    assert.deepEqual((await sample()).wind, [1, 0], 'Step 10 breeze off');
    await page.locator('#breeze').check(); await page.waitForTimeout(100);
    const wind = (await sample()).wind; assert(wind[0] >= 0.5 && wind[0] <= 1 && wind[1] === 0, 'Step 10 breeze on');
    let turn = null;
    if (url.searchParams.get('under') === 'idle') {
      await page.locator('#anim').selectOption('turn');
      const a = await sample(); const sa = await page.locator('#stage').screenshot();
      await page.waitForTimeout(700);
      const b = await sample(); const sb = await page.locator('#stage').screenshot();
      assert.deepEqual(b.tracks, ['idle', 'turn'], 'Step 9d turn menu selection');
      assert.notEqual(a.pose, b.pose, 'Step 9d frozen turn pose');
      assert.notEqual(sha(sa), sha(sb), 'Step 9d frozen turn pixels');
      turn = { tracks: b.tracks, advanced: true, screenshots_sha256: [sha(sa), sha(sb)] };
    }
    assert.deepEqual(errors, [], 'Step 10 browser errors');
    writeFileSync(join(dirname(input.output), `browser-${observations.length}.png`), secondScreenshot);
    observations.push({ url: link, backend: second.backend, painted: second.painted, screenshots_sha256: [sha(firstScreenshot), sha(secondScreenshot)], changed_pixels: true, advanced: true, pause_resume: true, breeze: true, tracks: second.tracks, turn });
    await page.close();
  }
  writeFileSync(input.output, JSON.stringify({ browser: browser.version(), backend: 'WebGL rasterization / visible canvas blits (SwiftShader)', observations }, null, 2) + '\n');
} finally { await browser.close(); }

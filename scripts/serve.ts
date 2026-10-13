// Serve the current directory, with play.html at /, on http://localhost:3000.
//
//   bun serve.ts [--port 3000]
//
// Run it in the directory that holds node_modules/@rig-c/play and your build,
// then open http://localhost:3000/?model=<path to skeleton.model.json>.
// It answers on localhost only and serves files under this directory only.
import { existsSync, statSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';

const i = process.argv.indexOf('--port');
const port = i > 0 ? Number(process.argv[i + 1]) : 3000;
const here = resolve('.');
const page = join(import.meta.dir, 'play.html');

if (!existsSync(join(here, 'node_modules/@rig-c/play/dist/index.js'))) {
  console.error(`serve.ts: no node_modules/@rig-c/play in ${here}; run it where you installed the packages`);
  process.exit(1);
}

const server = Bun.serve({
  hostname: '127.0.0.1',
  port,
  fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (path === '/' || path === '/play.html') return new Response(Bun.file(page));
    const file = normalize(join(here, path));
    if (file !== here && !file.startsWith(here + sep)) return new Response('outside the served directory', { status: 403 });
    if (!existsSync(file) || !statSync(file).isFile()) return new Response(`not found: ${path}`, { status: 404 });
    return new Response(Bun.file(file));
  },
});
console.log(`serve.ts: ${here} on http://localhost:${server.port}/  (Ctrl+C stops it)`);

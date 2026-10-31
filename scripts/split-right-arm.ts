// Replace the exam's one right-arm layer with this repository's two, in place.
//
//   bun split-right-arm.ts <layers dir>
//
// The forearm takes over the `handwear-r` layer and an authored upper arm goes in
// front of it, so a bent elbow shows the forearm's hidden cap and not a cut face.
// A directory with no `handwear-r` layer is refused by name and nothing is written.
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface Layer { name: string; filename?: string; left: number; top: number; right: number; bottom: number; depth_median: number }

const dir = process.argv[2];
if (!dir) {
  console.error('usage: bun split-right-arm.ts <layers dir>');
  process.exit(2);
}

const manifest = join(dir, 'layers.json');
const doc = JSON.parse(readFileSync(manifest, 'utf8')) as { layers: Layer[] };
const hand = doc.layers.find(layer => layer.name === 'handwear-r');
if (!hand) {
  console.error(`split-right-arm.ts: ${manifest} has no handwear-r layer; nothing written`);
  process.exit(1);
}

const root = resolve(import.meta.dir, '..');
for (const file of ['forearm-r.png', 'upperarm-r.png']) copyFileSync(join(root, file), join(dir, file));
rmSync(join(dir, 'parts/handwear-r.png'), { force: true });
hand.filename = 'forearm-r.png';
const { left, top, right, bottom } = hand;
doc.layers.push({ name: 'author:upperarm-r', filename: 'upperarm-r.png', left, top, right, bottom, depth_median: hand.depth_median - 0.001 });
writeFileSync(manifest, JSON.stringify(doc, null, 2) + '\n');
console.log(`split-right-arm.ts: handwear-r -> forearm-r.png, author:upperarm-r in front, in ${dir}`);

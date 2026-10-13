// Copy named fields from one JSON file into config.json, in place.
//
//   bun take.ts <from.json> <config.json> <field> [<field> ...]
//
// A field is a key path with dots: `bones`, `assemble.plan`, `seethrough.head_box`.
// Each one is read from <from.json> and written at the same path in <config.json>,
// replacing what was there; every other field of the config is kept as it was.
// `<to>=<from>` reads one path and writes another: `seethrough.head_box=head_box`.
// A field <from.json> does not have is refused by name and nothing is written.
//
// It does what rig-parts' docs call "paste X into the config", so that a person
// does not have to move a few hundred lines of JSON by hand.
import { readFileSync, writeFileSync } from 'node:fs';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const [from, into, ...fields] = process.argv.slice(2);
if (!from || !into || fields.length === 0) {
  console.error('usage: bun take.ts <from.json> <config.json> <field> [<field> ...]');
  process.exit(2);
}

const src = JSON.parse(readFileSync(from, 'utf8')) as Json;
const dst = JSON.parse(readFileSync(into, 'utf8')) as Json;

function isObject(v: Json | undefined): v is { [k: string]: Json } {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function get(doc: Json, path: string[]): Json | undefined {
  let at: Json | undefined = doc;
  for (const k of path) {
    if (!isObject(at) || !(k in at)) return undefined;
    at = at[k];
  }
  return at;
}

const pairs = fields.map((f) => {
  const [to, fromPath] = f.includes('=') ? f.split('=', 2) : [f, f];
  return { to: to.split('.'), from: fromPath.split('.'), fromName: fromPath };
});
const missing = pairs.filter((p) => get(src, p.from) === undefined).map((p) => p.fromName);
if (missing.length > 0) {
  console.error(`take.ts: ${from} has no ${missing.join(', ')}; nothing written`);
  process.exit(1);
}
if (!isObject(dst)) {
  console.error(`take.ts: ${into} is not a JSON object; nothing written`);
  process.exit(1);
}

for (const p of pairs) {
  const path = p.to;
  let at: { [k: string]: Json } = dst;
  for (const k of path.slice(0, -1)) {
    const next = at[k];
    if (!isObject(next)) at[k] = {};
    at = at[k] as { [k: string]: Json };
  }
  at[path[path.length - 1]] = get(src, p.from) as Json;
}
writeFileSync(into, JSON.stringify(dst, null, 2) + '\n');
console.log(`take.ts: ${fields.join(', ')} from ${from} -> ${into}`);

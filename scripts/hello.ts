// Make a four-second "hello" as one rig-c motion spec, for the config's
// motion.animations_from.
//
//   bun hello.ts <rig.json> [--seconds 4] [--fps 24] [--out hello.anim.json]
//
// <rig.json> is the rig a build wrote, out/rig/rig.json: the bones the hello
// keys are read from it, and the legs' lengths and rest angles for the weight
// shift. The output is {"spec": "rigc-motion/1", "animations": {"hello": …}},
// the shape rig-parts reads beside the idle; `rig-parts build` then gates it
// with the rig and reads it for folds.
//
// Four beats, every track back at rest by the end, so it loops:
//   hm?     the head straightens toward the viewer, a small lean, brows up;
//   heh     the eyes narrow and the mouth widens, two shoulder bobs;
//   wave    the forearm comes up beside the shoulder and waves twice;
//   settle  she shifts her weight onto her right foot and back, to rest.
// Nothing here comes from a video or a dataset: it is an authored test motion,
// keyed on the bones, sampled once per frame.
//
// Two limits come from the example painting, measured with `rigc render --seam`:
//  - The upper arm stays within 4 degrees of rest. Its image is the puff sleeve
//    and the arm in one piece, under a sleeveless top, so swinging it out shows
//    background at the armhole (50 px at 6 degrees). The forearm tucks under
//    the cuff and is free at the elbow, so the wave is the forearm's.
//  - The weight shift is 6 px (0.5 % of the figure). The thigh art starts at the
//    skirt's hem, so a larger hip move opens a gap there; the skirt's first
//    links follow the hip, and both ankles stay where they were painted (the
//    shoes are one image that no leg bone moves).
import { readFileSync, writeFileSync } from 'node:fs';

type Bone = { name: string; parent?: string; x?: number; y?: number; rotation?: number; length?: number };

const args = process.argv.slice(2);
const opt = (name: string, dflt: number): number => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = Number(args[i + 1]);
  if (!Number.isFinite(v) || v <= 0) {
    console.error(`hello.ts: ${name} is ${args[i + 1]}; a positive number is required`);
    process.exit(2);
  }
  args.splice(i, 2);
  return v;
};
const seconds = opt('--seconds', 4);
const fps = opt('--fps', 24);
const oi = args.indexOf('--out');
const outPath = oi >= 0 ? args.splice(oi, 2)[1] : 'hello.anim.json';
const [rigPath] = args;
if (!rigPath || !outPath) {
  console.error('usage: bun hello.ts <rig.json> [--seconds 4] [--fps 24] [--out hello.anim.json]');
  process.exit(2);
}

const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
const bones: Record<string, Bone> = {};
for (const b of rig.bones ?? []) bones[b.name] = b;
const need = ['hip', 'chest', 'head', 'mouth', 'sleeve_r0', 'sleeve_r1', 'leg_r0', 'leg_r1', 'leg_l0', 'leg_l1',
  'skirt_r0', 'skirt_c0', 'skirt_l0'];
const lacking = need.filter((n) => !bones[n]);
if (lacking.length > 0) {
  console.error(`hello.ts: ${rigPath} has no bone ${lacking.join(', ')}; the hello keys all of ${need.join(', ')}`);
  process.exit(1);
}
for (const leg of ['leg_r', 'leg_l']) {
  if (bones[`${leg}0`].parent !== 'hip' || bones[`${leg}1`].parent !== `${leg}0`) {
    console.error(`hello.ts: ${leg}0 must hang from hip and ${leg}1 from ${leg}0 for the weight shift`);
    process.exit(1);
  }
}

// The beat sheet is written for 4 s; another --seconds stretches it evenly.
const k = seconds / 4;
const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
// Through (time, value) points, smoothstep between each pair; times in beat-sheet seconds.
const ramp = (t: number, pts: [number, number][]) => {
  let v = pts[0][1];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t >= t0) v = v0 + (v1 - v0) * smooth(t0, t1, t);
  }
  return v;
};
// Two lifts between a and b: sin² over each half.
const twoLifts = (t: number, a: number, b: number) =>
  t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / ((b - a) / 2)) ** 2;

const UPPER_ARM = -4; // degrees: sleeve_r0, out from her side; the limit above
const FOREARM = -125; // degrees: sleeve_r1, the forearm up beside the shoulder
const WAVE = 15; // degrees each way, twice a second
const SHIFT = -6; // px: hip x, toward the image's left, onto her right foot; the limit above
const SKIRT = 1.66; // degrees: skirt_*0 following the hip

// Settle: out over 3.30–3.65 s, back over 3.65–4.00 s.
const settle = (t: number) => smooth(3.3, 3.65, t) - smooth(3.65, 4.0, t);

// Two-bone leg IK in the hip's frame (the hip has no rotation): the hip moves
// by dx, the ankle stays put, the knee keeps the side it was painted on.
const rad = Math.PI / 180;
const legIK = (leg: string, dx: number): [number, number] => {
  const b0 = bones[`${leg}0`];
  const b1 = bones[`${leg}1`];
  const L0 = b0.length ?? 0;
  const L1 = b1.length ?? 0;
  const r0 = (b0.rotation ?? 0) * rad;
  const r1 = (b1.rotation ?? 0) * rad;
  const R: [number, number] = [b0.x ?? 0, b0.y ?? 0];
  const K: [number, number] = [R[0] + L0 * Math.cos(r0), R[1] + L0 * Math.sin(r0)];
  const A: [number, number] = [K[0] + L1 * Math.cos(r0 + r1), K[1] + L1 * Math.sin(r0 + r1)];
  // The ankle, seen from the moved hip.
  const Ax = A[0] - dx;
  const Ay = A[1];
  const d = Math.hypot(Ax - R[0], Ay - R[1]);
  if (d > L0 + L1) {
    console.error(`hello.ts: ${leg} cannot reach its ankle after a ${dx} px hip shift (${d.toFixed(1)} > ${(L0 + L1).toFixed(1)} px)`);
    process.exit(1);
  }
  const base = Math.atan2(Ay - R[1], Ax - R[0]);
  const inner = Math.acos(Math.min(1, Math.max(-1, (L0 * L0 + d * d - L1 * L1) / (2 * L0 * d))));
  const knee = Math.acos(Math.min(1, Math.max(-1, (L0 * L0 + L1 * L1 - d * d) / (2 * L0 * L1))));
  const side = Math.sign(r1) || 1; // the knee bends the way the rest pose bends it
  const n0 = base - side * inner;
  const n1 = side * (Math.PI - knee);
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a)) / rad;
  return [wrap(n0 - r0), wrap(n1 - r1)];
};

type Curve = (t: number) => number | number[];
const curves: [string, string, Curve, boolean?][] = [
  ['head', 'rotate', (t) => ramp(t, [[0, 0], [0.35, 6], [0.85, 6], [1.05, 4], [3.4, 3], [3.95, 0]]) + 1.2 * twoLifts(t, 0.95, 1.75)],
  ['chest', 'rotate', (t) => ramp(t, [[0, 0], [0.4, 1], [1.9, 1], [2.3, 0]]) + 1.5 * twoLifts(t, 0.95, 1.75) - 0.5 * settle(t)],
  ['chest', 'translatey', (t) => 4 * twoLifts(t, 0.95, 1.75)],
  ['brows', 'translatey', (t) => ramp(t, [[0, 0], [0.3, 3], [0.85, 3], [1.05, 1], [3.4, 1], [3.8, 0]]), true],
  ['eyes', 'scaley', (t) => ramp(t, [[0, 1], [0.85, 1], [1.05, 0.7], [1.7, 0.7], [1.95, 1]]), true],
  ['mouth', 'scale', (t) => [
    ramp(t, [[0, 1], [0.85, 1], [1.05, 1.12], [1.7, 1.12], [1.95, 1]]),
    ramp(t, [[0, 1], [0.85, 1], [1.05, 0.9], [1.7, 0.9], [1.95, 1]]),
  ]],
  ['sleeve_r0', 'rotate', (t) => ramp(t, [[0, 0], [1.9, 0], [2.15, UPPER_ARM], [3.15, UPPER_ARM], [3.4, 0]])],
  ['sleeve_r1', 'rotate', (t) =>
    ramp(t, [[0, 0], [1.9, 0], [2.2, FOREARM], [3.1, FOREARM], [3.4, 0]]) +
    (t >= 2.2 && t <= 3.1 ? WAVE * Math.sin(2 * Math.PI * 2 * (t - 2.2)) * smooth(2.2, 2.3, t) * (1 - smooth(3.0, 3.1, t)) : 0)],
  ['hip', 'translate', (t) => [SHIFT * settle(t), 0]],
  ['leg_r0', 'rotate', (t) => legIK('leg_r', SHIFT * settle(t))[0]],
  ['leg_r1', 'rotate', (t) => legIK('leg_r', SHIFT * settle(t))[1]],
  ['leg_l0', 'rotate', (t) => legIK('leg_l', SHIFT * settle(t))[0]],
  ['leg_l1', 'rotate', (t) => legIK('leg_l', SHIFT * settle(t))[1]],
  ['skirt_r0', 'rotate', (t) => SKIRT * settle(t)],
  ['skirt_c0', 'rotate', (t) => SKIRT * settle(t)],
  ['skirt_l0', 'rotate', (t) => SKIRT * settle(t)],
];

const n = Math.round(seconds * fps);
const r4 = (x: number) => Math.round(x * 1e4) / 1e4 || 0;
let maxUpper = 0;
let maxShift = 0;
const tracks = curves.map(([target, property, f, group]) => {
  const keys = [];
  for (let i = 0; i <= n; i++) {
    const t = i / fps;
    const raw = f(t / k);
    const v = (Array.isArray(raw) ? raw : [raw]).map(r4);
    if (target === 'sleeve_r0') maxUpper = Math.max(maxUpper, Math.abs(v[0]));
    if (target === 'hip') maxShift = Math.max(maxShift, Math.abs(v[0]));
    keys.push({ t: Math.round(t * 1e5) / 1e5, v });
  }
  return { [group ? 'group' : 'bone']: target, property, keys };
});

const doc = {
  spec: 'rigc-motion/1',
  animations: {
    hello: {
      duration: seconds,
      loop: true,
      note: `scripts/hello.ts over ${rigPath}: hm? (head straightens, brows up), heh (eyes narrowed, mouth wide, two shoulder bobs), an elbow-down wave, a weight-shift settle; ${seconds} s at ${fps} fps`,
      tracks,
    },
  },
};
writeFileSync(outPath, JSON.stringify(doc) + '\n');
const [r0, r1] = legIK('leg_r', SHIFT);
const [l0, l1] = legIK('leg_l', SHIFT);
const f2 = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(2);
console.log(
  `hello.ts: 4 beats (hm?, heh, wave, settle), ${seconds} s at ${fps} fps, ${tracks.length} tracks of ${n + 1} keys; ` +
  `sleeve_r0 at most ${maxUpper.toFixed(1)} deg; hip shift ${maxShift.toFixed(1)} px ` +
  `(legs r ${f2(r0)}/${f2(r1)}, l ${f2(l0)}/${f2(l1)} deg, ankles held) -> ${outPath}`,
);

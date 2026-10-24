// Make a hello of under five seconds as one rig-c motion spec, for the config's
// motion.animations_from.
//
//   bun hello.ts <rig.json> [--seconds 4.75] [--fps 24] [--out hello.anim.json] [--no-skirt-keys]
//
// <rig.json> is the rig a build wrote, out/rig/rig.json: the bones the hello
// keys are read from it, and the legs' lengths and rest angles for the settle.
// The output is {"spec": "rigc-motion/1", "animations": {"hello": …}}, the
// shape rig-parts reads beside the idle; `rig-parts build` then gates it with
// the rig and reads it for folds.
//
// Four beats, every track back at rest by the end, so it loops:
//   hm?     the head straightens toward the viewer, a small lean, brows up;
//   heh     the eyes narrow and the mouth widens, two shoulder bobs;
//   wave    the forearm comes up beside the shoulder and waves twice;
//   settle  she re-plants her weight: as the arm comes down, her splayed right
//           leg (the picture's left) slides its foot 10 % of the way in toward
//           parallel with the other, her hip follows it, and both go back.
// Nothing here comes from a video or a dataset: it is an authored test motion,
// keyed on the bones, sampled once per frame.
//
// The limits come from the example painting, measured with `rigc render --seam`:
//  - The upper arm stays within 4 degrees of rest. Its image is the puff sleeve
//    and the arm in one piece, under a sleeveless top, so swinging it out shows
//    background at the armhole (50 px at 6 degrees). The forearm tucks under
//    the cuff and is free at the elbow, so the wave is the forearm's.
//  - The right foot comes 10 % of the way to parallel (8.4 px with the
//    hand-placed joints). Each foot is a part on a bone that keeps the shoe level (step 7's keypoint
//    correction gives the rig foot_r and foot_l), so the ankle slides along the
//    floor and a two-bone solve bends the knee the way it is painted. The thigh
//    art starts at the skirt's hem, so the skirt's link over the right thigh
//    turns with it. At 50 % the skirt's top pulls off the shirt under physics
//    (topwear|bottomwear ghost 54 px, over the guide's 50); past about 75 %
//    the hem opens and the knees meet.
//  - The hip moves 1.5 px (0.125 % of the figure). The former 40 % stance and
//    6 px shift opened both thigh roots: GAP 10/8 over floor 6 at frame 44
//    on the hand-placed joints (getting-started #19). The left foot stays put.
//  - The feet are never keyed: the right shoe is painted turned out, and
//    turning its image reads as a shoe tipped on its side.
// --no-skirt-keys is for step 9c's cloth recipe, which hangs the skirt on
// physics: the hip's move then swings it and no key does, except on skirt0_0,
// the first link of the tree over the right thigh, which carries no physics of
// its own and takes the thigh's turn. That bone is the recipe's, so it is not
// in the rig this reads; the build that follows checks it. Without physics the
// keys are needed: skirt_r0 takes the thigh's turn and skirt_c0, skirt_l0
// follow the hip, or the hem opens over the thighs.
import { readFileSync, writeFileSync } from 'node:fs';

type Bone = { name: string; parent?: string; x?: number; y?: number; rotation?: number; length?: number };

const args = process.argv.slice(2);
const ni = args.indexOf('--no-skirt-keys');
const skirtKeys = ni < 0;
if (!skirtKeys) args.splice(ni, 1);
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
const SHEET = 4.75; // seconds: the beat sheet's own length
const seconds = opt('--seconds', SHEET);
const fps = opt('--fps', 24);
const oi = args.indexOf('--out');
const outPath = oi >= 0 ? args.splice(oi, 2)[1] : 'hello.anim.json';
const [rigPath] = args;
if (!rigPath || !outPath) {
  console.error('usage: bun hello.ts <rig.json> [--seconds 4.75] [--fps 24] [--out hello.anim.json] [--no-skirt-keys]');
  process.exit(2);
}

const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
const bones: Record<string, Bone> = {};
for (const b of rig.bones ?? []) bones[b.name] = b;
const need = ['hip', 'chest', 'head', 'mouth', 'sleeve_r0', 'sleeve_r1', 'leg_r0', 'leg_r1', 'leg_l0', 'leg_l1', 'foot_r', 'foot_l',
  ...(skirtKeys ? ['skirt_r0', 'skirt_c0', 'skirt_l0'] : [])];
const lacking = need.filter((n) => !bones[n]);
if (lacking.length > 0) {
  const feet = lacking.includes('foot_r') || lacking.includes('foot_l')
    ? ' (no foot_r/foot_l: the shoes are one part, which no leg bone moves; see step 7)' : '';
  console.error(`hello.ts: ${rigPath} has no bone ${lacking.join(', ')}; the hello keys all of ${need.join(', ')}${feet}`);
  process.exit(1);
}
for (const leg of ['leg_r', 'leg_l']) {
  if (bones[`${leg}0`].parent !== 'hip' || bones[`${leg}1`].parent !== `${leg}0`) {
    console.error(`hello.ts: ${leg}0 must hang from hip and ${leg}1 from ${leg}0 for the settle`);
    process.exit(1);
  }
}
if (bones.hip.rotation) {
  console.error('hello.ts: the hip is turned at rest; the settle slides the foot along the hip\'s x axis, which is then not the floor');
  process.exit(1);
}

// The beat sheet is written for 4.75 s; another --seconds stretches it evenly.
const k = seconds / SHEET;
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
const STANCE = 0.1; // of the way from the painted stance to parallel: the right ankle's slide; the limit above
const SHIFT = -1.5; // px: hip x, toward the picture's left, over the feet's new middle; the limit above
const SKIRT = 0.415; // degrees: skirt_c0, skirt_l0 following the hip (no physics)

// Settle: out over 3.15–3.75 s, held to 4.15 s, back over 4.15–4.75 s.
const settle = (t: number) => smooth(3.15, 3.75, t) - smooth(4.15, 4.75, t);

// Legs, in the hip's frame (the hip has no rotation, so its x axis is the floor).
const rad = Math.PI / 180;
type Leg = { R: [number, number]; A: [number, number]; L0: number; L1: number; r0: number; r1: number };
const legOf = (leg: string): Leg => {
  const b0 = bones[`${leg}0`];
  const b1 = bones[`${leg}1`];
  const L0 = b0.length ?? 0;
  const L1 = b1.length ?? 0;
  const r0 = (b0.rotation ?? 0) * rad;
  const r1 = (b1.rotation ?? 0) * rad;
  const R: [number, number] = [b0.x ?? 0, b0.y ?? 0];
  const K: [number, number] = [R[0] + L0 * Math.cos(r0), R[1] + L0 * Math.sin(r0)];
  const A: [number, number] = [K[0] + L1 * Math.cos(r0 + r1), K[1] + L1 * Math.sin(r0 + r1)];
  return { R, A, L0, L1, r0, r1 };
};
const legs = { leg_r: legOf('leg_r'), leg_l: legOf('leg_l') };
// Hip-to-ankle angle from straight down, degrees; + leans the ankle toward the picture's left.
const tilt = (l: Leg, ax = l.A[0]) => Math.atan2(l.R[0] - ax, l.R[1] - l.A[1]) / rad;
// The right ankle's x where its hip-to-ankle line is parallel to the left leg's, on the same floor.
const parallelX = legs.leg_r.R[0] - (legs.leg_r.R[1] - legs.leg_r.A[1]) * Math.tan(tilt(legs.leg_l) * rad);
const inward = STANCE * (parallelX - legs.leg_r.A[0]);

// Two-bone IK: the hip moves by dx, the ankle by ax along the floor; the knee
// keeps the side it was painted on. Returns the keys for <leg>0 and <leg>1.
const legIK = (leg: 'leg_r' | 'leg_l', dx: number, ax: number): [number, number] => {
  const { R, A, L0, L1, r0, r1 } = legs[leg];
  // The ankle, seen from the moved hip.
  const Ax = A[0] + ax - dx;
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
const right = (t: number) => legIK('leg_r', SHIFT * settle(t), inward * settle(t));
const left = (t: number) => legIK('leg_l', SHIFT * settle(t), 0);

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
  ['leg_r0', 'rotate', (t) => right(t)[0]],
  ['leg_r1', 'rotate', (t) => right(t)[1]],
  ['leg_l0', 'rotate', (t) => left(t)[0]],
  ['leg_l1', 'rotate', (t) => left(t)[1]],
  ...(skirtKeys
    ? [
      ['skirt_r0', 'rotate', (t: number) => right(t)[0]],
      ['skirt_c0', 'rotate', (t: number) => SKIRT * settle(t)],
      ['skirt_l0', 'rotate', (t: number) => SKIRT * settle(t)],
    ] as [string, string, Curve][]
    : [['skirt0_0', 'rotate', (t: number) => right(t)[0]]] as [string, string, Curve][]),
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
      note: `scripts/hello.ts over ${rigPath}: hm? (head straightens, brows up), heh (eyes narrowed, mouth wide, two shoulder bobs), an elbow-down wave, a settle (the right foot 10 % of the way to parallel, the hip after it); ${seconds} s at ${fps} fps`,
      tracks,
    },
  },
};
writeFileSync(outPath, JSON.stringify(doc) + '\n');
const [r0, r1] = legIK('leg_r', SHIFT, inward);
const [l0, l1] = legIK('leg_l', SHIFT, 0);
const f2 = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(2);
console.log(
  `hello.ts: 4 beats (hm?, heh, wave, settle), ${seconds} s at ${fps} fps, ${tracks.length} tracks of ${n + 1} keys; ` +
  `sleeve_r0 at most ${maxUpper.toFixed(1)} deg; settle: right ankle ${inward.toFixed(1)} px in ` +
  `(${Math.round(STANCE * 100)} % of the way to parallel, ${tilt(legs.leg_r).toFixed(2)} -> ${tilt(legs.leg_r, legs.leg_r.A[0] + inward).toFixed(2)} deg), ` +
  `hip ${maxShift.toFixed(1)} px (legs r ${f2(r0)}/${f2(r1)}, l ${f2(l0)}/${f2(l1)} deg, feet on the floor); ` +
  `${skirtKeys ? 'skirt_r0 follows the thigh' : 'skirt0_0 follows the thigh, the rest left to physics'} -> ${outPath}`,
);

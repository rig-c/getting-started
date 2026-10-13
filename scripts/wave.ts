// Make a short wave from one painting's keypoints, as a pose sequence rig-pose reads.
//
//   bun wave.ts <keypoints.json> <pose.json> [--seconds 3] [--fps 24]
//
// <keypoints.json> is the spine-parts-keypoints/1 file of the painting (from
// scripts/keypoints.py, or placed by hand). <pose.json> is written as
// rig-pose-sequence/1, in the same picture pixels.
//
// Every joint stays where the keypoints put it, except the subject's right arm:
// over the first sixth of the clip the upper arm swings out and up about the
// shoulder, the forearm turns to point up and waves twice a second, and over
// the last sixth the arm comes back down to where it started. The arm keeps the
// lengths the keypoints give it. Nothing here comes from a video or a dataset:
// it is a test motion, made so that the rest of the chain can be run on any
// painting without footage.
import { readFileSync, writeFileSync } from 'node:fs';

type Pt = [number, number];
type Joint = { state: 'observed' | 'occluded' | 'missing'; at?: Pt; score?: number };

const args = process.argv.slice(2);
const opt = (name: string, dflt: number): number => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  const v = Number(args[i + 1]);
  if (!Number.isFinite(v) || v <= 0) {
    console.error(`wave.ts: ${name} is ${args[i + 1]}; a positive number is required`);
    process.exit(2);
  }
  args.splice(i, 2);
  return v;
};
const seconds = opt('--seconds', 3);
const fps = opt('--fps', 24);
const [kpPath, outPath] = args;
if (!kpPath || !outPath) {
  console.error('usage: bun wave.ts <keypoints.json> <pose.json> [--seconds 3] [--fps 24]');
  process.exit(2);
}

const kp = JSON.parse(readFileSync(kpPath, 'utf8'));
if (kp.spec !== 'spine-parts-keypoints/1') {
  console.error(`wave.ts: ${kpPath} is ${JSON.stringify(kp.spec)}; spine-parts-keypoints/1 is required`);
  process.exit(1);
}
const person = kp.people?.[0];
const joints: Record<string, Joint> = person?.joints ?? {};
const need = ['r_shoulder', 'r_elbow', 'r_wrist'];
const lacking = need.filter((n) => !joints[n]?.at);
if (lacking.length > 0) {
  console.error(`wave.ts: ${kpPath} gives no position for ${lacking.join(', ')}; the wave needs all three`);
  process.exit(1);
}

const sh = joints.r_shoulder.at as Pt;
const el = joints.r_elbow.at as Pt;
const wr = joints.r_wrist.at as Pt;
const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ang = (a: Pt, b: Pt) => Math.atan2(b[1] - a[1], b[0] - a[0]); // picture angle, y down
const upperLen = len(sh, el);
const foreLen = len(el, wr);
const upperRest = ang(sh, el);
const foreRest = ang(el, wr);

// Angles in the picture's own frame (y down, so +90 deg points down). The
// subject's right arm is on the picture's left: pointing left is 180 deg,
// pointing up is 270 deg.
const deg = Math.PI / 180;
const upperUp = 200 * deg; // out to the side, a little above level
const foreUp = 270 * deg; // straight up
const waveAmp = 22 * deg;
const waveHz = 2;

// Unwrap a target angle so the turn from `from` is the short way round.
const near = (from: number, to: number) => {
  let t = to;
  while (t - from > Math.PI) t -= 2 * Math.PI;
  while (t - from < -Math.PI) t += 2 * Math.PI;
  return t;
};
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

const n = Math.round(seconds * fps) + 1;
const ramp = seconds / 6;
const frames = [];
for (let i = 0; i < n; i++) {
  const t = i / fps;
  const up = t < ramp ? ease(t / ramp) : t > seconds - ramp ? ease((seconds - t) / ramp) : 1;
  const a1 = upperRest + (near(upperRest, upperUp) - upperRest) * up;
  const wave = Math.sin(2 * Math.PI * waveHz * Math.max(0, t - ramp)) * waveAmp;
  const a2 = foreRest + (near(foreRest, foreUp) + wave - foreRest) * up;
  const elbow: Pt = [sh[0] + upperLen * Math.cos(a1), sh[1] + upperLen * Math.sin(a1)];
  const wrist: Pt = [elbow[0] + foreLen * Math.cos(a2), elbow[1] + foreLen * Math.sin(a2)];
  const round = (p: Pt): Pt => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  const js: Record<string, Joint> = {};
  for (const [name, j] of Object.entries(joints)) {
    js[name] = j.at ? { state: j.state, at: j.at } : { state: j.state };
  }
  js.r_elbow = { state: 'observed', at: round(elbow) };
  js.r_wrist = { state: 'observed', at: round(wrist) };
  frames.push({ t: Math.round(t * 1e5) / 1e5, people: [{ id: 'a', joints: js }] });
}

const doc = {
  spec: 'rig-pose-sequence/1',
  space: { units: 'picture-px', origin: 'top-left', y: 'down' },
  width: kp.width,
  height: kp.height,
  source: `scripts/wave.ts over ${kpPath}: the subject's right arm raised and waved, ${seconds} s at ${fps} fps; every other joint held`,
  frames,
};
writeFileSync(outPath, JSON.stringify(doc) + '\n');
console.log(`wave.ts: ${n} frame(s), ${seconds} s at ${fps} fps -> ${outPath}`);

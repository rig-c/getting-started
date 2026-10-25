# Reference: what was measured, where each requirement comes from

This is the evidence behind the [README](../README.md). The README keeps one short line per
claim; this page keeps the figure, the machine it was measured on, or the sentence it was
quoted from. Three words recur:

- **measured**: run by us, on the machine and versions below;
- **stated by \<project\>**: copied from that project's own documentation, with a link;
- **not measured yet**: nobody has run it for this guide. It is not guessed.

## Tested with

<!-- try-it-tested:start -->
### Automated walkthrough

Latest complete CI run; timings below retain their original dates and machines.

```json
{
  "status": "PASS",
  "complete": true,
  "date": "2026-10-25",
  "versions": {
    "@rig-c/parts": "1.64.0",
    "rig-c": "2.70.0",
    "@rig-c/pose": "1.0.2",
    "@rig-c/play": "1.17.1"
  },
  "bun": "1.4.4",
  "guide_sha256": "09d6b2e71aa9cc631fadcb2854b2cb0c6360b615a6c67a4db2a50cd6ee19f2e5",
  "clone_commit": "4a549046c8a089034d24ded782a5d03ad26e416f",
  "run": "https://github.com/rig-c/getting-started/actions/runs/40175216463"
}
```
<!-- try-it-tested:end -->

### Published walkthrough measured 2026-10-25

Measured 2026-10-25 for [#8](https://github.com/rig-c/getting-started/issues/8), on
published packages only. The numbered steps passed **10/10**, with the current **9b and
9c** also passing. These versions and expected lines supersede the earlier walkthroughs
below; the separate motion measurements retain their own dates and toolchains.
The compact [published-run receipt](receipts/issue-8.json) keeps every verbatim command,
exit, output comparison, installed dependency edge, integrity and output hash.

| Latest published walkthrough | Version or environment |
| --- | --- |
| `@rig-c/parts` | 1.61.0 |
| `rig-c` | 2.69.0 |
| `@rig-c/pose` | 1.0.2 |
| `@rig-c/play` | 1.17.0 |
| Bun | 1.4.2 |
| uv / detector Python | 0.12.17 / 3.12.14 |
| Machine | x86_64 Linux / WSL2, ordinary shared pool; job limited to 4 CPUs and 6 GiB |
| Browser | Chromium 145.0.7632.6, Playwright 1.58.2, software ANGLE WebGL |

The versions and SHA-512 integrities came from `npm view`. All **380 installed files**
of those four packages matched the verified npm tarballs before the later guide stages. Both
parts and pose resolved `rig-c` to 2.69.0; the remaining installed packages were ag-psd
31.0.3, base64-js 1.5.1 and pako 2.1.0. No Spine runtime or source override was installed.

The runner executed each README `sh` block with `bash -eu -o pipefail -c`, in order,
from an empty consumer with empty HOME, Bun, uv and XDG/model caches. It selected Python
3.12.14 and ran the actual step-6 `uv run --with rtmlib --with onnxruntime` detector:
18 observed, 0 occluded, 0 missing. Step 1 has two explicit experiment preparations:
Git commands were prohibited to the worker, so its clone was replaced by a byte-identical
copy of guide commit `7db1d11eb09abb7e43a4ec09629148da33499d90`; an exact dependency and
override manifest was seeded before the original unversioned `bun add`, and the installed
graph proved which versions that command consumed. The README commands themselves are
unchanged. The hand-placed route was not re-run for this refresh.

Walkthrough wall clock under `python3 budget.py python3 run.py`: **305.659 s**.
This includes the cold package, Python and pose-model downloads and step 10's browser
installation and real flow. It excludes archive transport and the initial uv executable
bootstrap. It is an observation in a shared pool, not a machine-speed comparison.

| README step | Exit | Seconds |
| --- | --- | --- |
| 1 | 0 | 0.266 |
| 2 | 0 | 2.323 |
| 3 | 0 | 1.230 |
| 4 | 0 | 1.915 |
| 5 | 0 | 16.612 |
| 6 | 0 | 18.237 |
| 7 | 0 | 2.428 |
| 8 | 0 | 37.888 |
| 9 | 0 | 37.569 |
| 9b | 0 | 59.936 |
| 9c | 0 | 103.340 |
| 10 | 0 | 23.139 |

Every quoted output fragment in the README's expected-output paragraphs passed a UTF-8
byte-substring comparison against its stage log (47 checks), along with 41 explicit
comparisons including the exact head-box file and its terminal newline. Only Markdown
source line-wrapping was removed from quoted fragments; stdout bytes were not normalized.
The readings that changed are step 8's `12 of 14 bar(s) measured`, the detected hello's
`right ankle 8.3 px in (10 % of the way to parallel, 15.96 -> 15.19 deg), hip 1.5 px`, and
step 9c's `max |d| 1, 0 px over 40 — the jump at the wrap`. The old hand-placed hello's
8.4 px / 16.05 -> 15.28 degrees remains a historical reading below.

The published checker measured all four body-root pairs: four rows for the idle and
eight rows each for wave, hello and cloth (both animations), all PASS with zero failed
roots. Step 9b and 9c measured 13 of 14 bars, skipping STRESS_OFF_CHAIN. The final config
still holds 27 physics and 3 transform constraints. These are fresh published-package
checks, not the earlier source-run results.

The actual documented server was opened in Chromium for hello over idle and for wave.
Both drew non-empty canvas pixels through the WebGL backend, advanced their poses and
changed their screenshots, paused and resumed, and answered the breeze toggle; the
hello's animation selector and the `wind=0` URL also passed, with no page/request errors.
This checks functional playback, not mixed-track seam correctness. Six final frame sets
were reduced to ordered PNG digests and deleted with the isolated working tree; only
small browser screenshots and receipts remain. Physics reference worlds, internal elbow
WARN and the other exclusions under *Step 9, the forearm wave* remain unchanged.

### Earlier measurements

Recorded 2026-10-13; *Try it first* re-run twice on 2026-10-20, the second time with step 9b, and twice on 2026-10-21, with step 9c and then with the stance settle. Everything marked *measured* on this
page was run on this machine with these versions, except where a later section names
its own run and toolchain.

| | |
| --- | --- |
| Machine | Apple M4, 32 GB memory |
| macOS | 26.6.1 |
| Bun | 1.4.2 |
| uv | 0.12.17, with the Python 3.12.14 it chose |
| Browser | Chromium 152 (the built-in browser of the Claude desktop app), meshes drawn through WebGL (2026-10-13) |
| `@rig-c/parts` | 1.49.1 (2026-10-21, with step 9c; step 9c's readings were taken on 1.48.0's build, byte-identical) · 1.48.0 (2026-10-20, with step 9b; 1.41.1 earlier that day; 1.16.0 on 2026-10-13) |
| `rig-c` | 2.64.1 (2026-10-20 and 2026-10-21, with steps 9b and 9c; 2.61.1 earlier that day; 2.48.0 on 2026-10-13) |
| `@rig-c/pose` | 0.37.0 (2026-10-20, with step 9b; 0.35.0 earlier that day; 0.1.1 on 2026-10-13) |
| `@rig-c/play` | 1.12.0 (2026-10-20, both runs; 1.9.1 on 2026-10-13) |
| Spine editor | Spine 4.3.26 Professional (launcher 4.3.08), driven from the command line only; see *Use what you made* |

The README's `bun add` line pins nothing, so you get the current versions. If an output of
yours differs in a detail from what the README says you should see, the versions above are
the ones that produced that text.

The third-party READMEs quoted below were read on 2026-10-13: ComfyUI at `f9c6185`,
See-through at `df019de`, the ComfyUI-See-through wrapper at `98d754b` (its 0.5.0).

### What was run

On 2026-10-20 *Try it first* was run once more, on the versions above: every `sh` block of
the README extracted and run verbatim in order from an empty folder, with `HOME`, Bun's
cache, uv's cache and `~/.cache/rtmlib` all empty, so the first-time downloads are in its
times. Step 10 was checked by fetching the page and the model from `serve.ts` (both HTTP
200), not by opening a browser. The README's expected lines come from that run. The earlier
runs are kept below.

Later on 2026-10-20, with step 9b added, *Try it first* was run twice more on the current
npm versions (parts 1.48.0, rig-c 2.64.1, pose 0.37.0, play 1.12.0): once with the published
guide's steps 1–10 and then 9b by hand (run 4), and once as a smoke of the finished page,
every `sh` block extracted and run verbatim in order from an empty folder (run 5). Bun's,
uv's and the pose models' caches were warm for both. In run 5, `git clone` was replaced by a
copy of the checkout, because `scripts/hello.ts` was not yet published. Every expected line
on the README held in both, step 9's included, and run 5's outputs were byte-identical to
run 4's (`hello.anim.json`, `config.json`, `wave.motion.json`, the build's `skeleton.json`
and `skeleton.model.json`). Step 10 was checked by fetching the page and both models from
`serve.ts` (HTTP 200), and the `&under=idle` address was opened once in headless Chromium:
`idle` on track 0, `hello` on track 1, both looping, the page's message line empty.

On 2026-10-21, with step 9c added, every `sh` block was extracted and run verbatim in order
from an empty folder once more (run 6), `git clone` again replaced by a copy of the checkout;
`bun add` installed parts 1.49.1, published that day, with rig-c 2.64.1, pose 0.37.0 and play
1.12.0. Every expected line on the README held. Step 9c's outputs (`hello.anim.json`,
`config.json`, the build's `skeleton.json`, `skeleton.model.json` and `skeleton.png`, and
`out/idle.gif`) were byte-identical to the scratch run on parts 1.48.0 whose build the
readings under *Step 9c* were taken on. One line's wording differs between the two: 1.49.1's
`wrote config.cloth.json:` names each chain and track it removed and inserted, where 1.48.0
named the sections. Step 10 was checked by fetching the page and both models (HTTP 200).

Later on 2026-10-21, with step 7's ankle correction and the stance settle, every `sh` block
was run verbatim in order from an empty folder once more (run 7), `git clone` again replaced
by a copy of the checkout; `bun add` installed parts 1.49.1, rig-c 2.64.1, pose 0.37.0 and
play 1.12.0. Every expected line on the README held, the ones changed by this step included
(`44 bone(s)`, `limb cut: "shoes" …`, step 8's `11 of 13`, the two `hello.ts` lines, steps
9b's and 9c's `12 of 13`). Its outputs were byte-identical to the scratch run the readings
under [*The settle: a stance change*](#the-settle-a-stance-change) were taken on
(`keypoints.json`, `config.json`, `wave.motion.json`, `wave-build/`'s `skeleton.json` and
`skeleton.model.json`, step 9b's and step 9c's `skeleton.model.json`, step 9c's
`skeleton.json`, `skeleton.atlas`, `skeleton.png` and `out/idle.gif`), except
`hello.anim.json`'s `note`, whose wording was changed between the two runs; its tracks are
the same. Step 10 was checked by fetching the page and both models (HTTP 200).

*Try it first* (the CPU-only half) was run end to end twice on the machine above: once
command by command while drafting, and once as a smoke, every `sh` block of the finished
page extracted and run verbatim in order from an empty folder with an empty Bun cache. The
one substitution in the smoke: `git clone https://github.com/rig-c/getting-started` was
replaced by a copy of the local checkout, because the page was not yet published. Every
output of the second run was byte-identical to the first (`skeleton.json`,
`skeleton.model.json`, `skeleton.png`, `keypoints.json`, `wave.pose.json`,
`wave.motion.json`, `config.json`).

Of the GPU routes, only the joint script was run. Route A's times come from the project's
own record (below). Route B was not run (owner decision, 2026-10-13: written from the
official docs, one visible note). Route C was not run.

Of *Use what you made*, the Spine editor import was run, from the command line, on a copy
of the smoke run's build — and refused; the whole run is under
[*Use what you made*](#use-what-you-made) below. The web-page exit is step 10 itself. No
game engine was run.

## Measured times and sizes

### Try it first, step by step

Two runs; where they differ, both are given. The README's step numbers are the left column.

| README step | Commands | Run 1 (2026-10-13) | Run 2 (smoke, 2026-10-13) | Run 3 (clean, 2026-10-20) | Run 4 (warm, 2026-10-20) |
| --- | --- | --- | --- | --- | --- |
| 1 install | `bun add` the four packages | 2.05 s (empty cache) | 3.1 s incl. mkdir and copy | 1.9 s incl. `git clone` | 1.6 s |
| 2 example inputs | curl the exam tarball at `01436ee`, extract task 01 inputs | 4.0 s | 4.6 s | 3.6 s | 3.4 s |
| 3 config | `rig-parts inputs` | 3.2 s | 4.2 s | 1.5 s | 2.6 s |
| 4 head box | `layers`, `propose --head-box`, `take.ts`, `inputs` | 1.5 + 2.0 + 3.5 s | 8.0 s | 2.0 s | 4.0 s |
| 5 assemble | `assemble --propose-plan`, `take.ts`, `assemble` | 19.3 + 35.2 s | 67.3 s | 28.3 s | 40.2 s |
| 6 joints | `uv run … keypoints.py` | 3.6 s (models already downloaded) | 3.9 s (models already downloaded) | 42.5 s (models and packages downloaded) | 4.4 s (cached) |
| 7 draft bones | `propose --keypoints`, `take.ts` | 6.9 s | 8.8 s | 6.3 s | 6.2 s |
| 8 build | `rig-parts build --loop` | 71.6 s | 67.2 s | 71.9 s | 60.6 s |
| — look | `rigc inspect`, `rigc render` (under *Where to go next*) | 1.9 + 2.3 s | 2.8 s | not run | not run |
| 9 wave | `wave.ts`, `clean`, map heredoc, `rig-pose retarget --build` | 0.09 + 6.0 s | 5.7 s | 5.2 s | 6.1 s |
| 9b hello | `hello.ts`, the `animations_from` line, `take.ts`, `rig-parts build --loop` | — | — | — | 80.6 s |
| 9c cloth | `hello.ts --no-skirt-keys`, the `cloth` heredoc, `take.ts`, `propose --cloth --write-config`, `mv`, the `bun -e` line, `rig-parts build --loop --lead-in 1` | — | — | — | — (run 6: 153.5 s, under load) |
| 10 play | `serve.ts` | played in Chromium 152; meshes on WebGL | played; 37 requests, last at 242 ms | page and model HTTP 200 | page and both models HTTP 200 |

Run 2 total: **176 s**. Run 3 total: **166 s** wall clock, first-time downloads included. Run
4 total: **214 s** (133 s for steps 1–10 and 81 s for 9b), with the caches warm. The run 5
smoke took 580 s, but the machine's load average was 75–87 while it ran (other jobs), so its
times are not given. The download in step 2 is 41 MB.

Run 6 (clean, 2026-10-21, caches warm, the machine's load average 13–16 from other jobs, so
an upper bound): **495.5 s** in all — steps 1 to 10 took 1.3, 5.3, 4.3, 8.5, 63.7, 4.3, 8.6,
101.5, 16.6, 122.7 (9b), 153.5 (9c) and 2.7 s.

Run 7 (clean, 2026-10-21, caches warm, other jobs running, so an upper bound): **416.6 s**
in all — steps 1 to 10 took 1.0, 3.8, 3.7, 6.8, 42.1, 2.1, 5.5, 75.5, 6.4, 119.5 (9b), 146.1
(9c) and 2.4 s.

Disk after run 2: `my-rig` 79 MB (`node_modules` 37, `inputs` 19, `work` 4.3, `out` 16,
`wave-build` 1.6) and Bun's download cache 38 MB — about 120 MB in all. Bun reported
`7 packages installed`.

Results, run 3 (parts 1.41.1, rig-c 2.61.1): step 7's `propose` reporting
`coverage: 42 bone(s) — 29 checked and clean, 1 checked with a LINT line, 12 not checked;
roles 0 target, 41 deforms, 1 control, 0 unclassified`, the one `LINT` for `foot_l` at
`[428, 1077]` (the script's left ankle, off the leg's art; the nearest art on its joint line
is 10.784 px away); `check: PASS; 11 of 12 bar(s) measured, 1 skipped (STRESS_OFF_CHAIN)`;
`build: PASS`; the packed atlas `skeleton.png 476x1403, 27 region(s), 89.7% covered, padding 2,
page edges free, shape polygon`; retarget `GATE` green, every `LAND` within 0.00120°,
`FOLD   rigc render --folds at 24 fps: no mesh folds`. With the hand-placed joints of
[KEYPOINTS.md](KEYPOINTS.md) instead of the script: 42 bones, no `LINT`, the same
`check` and `build: PASS`. Disk after run 3: `my-rig` 79 MB, Bun's cache 40 MB, the pose
models in `~/.cache/rtmlib` 328 MB.

Results, runs 4 and 5 (parts 1.48.0, rig-c 2.64.1, pose 0.37.0): steps 3–9 printed what
run 3 printed, line for line where the README quotes it; `check` adds `0 warning(s)
(SEAM_OVER_MOTION, not a bar)` to step 8's line. Step 9b: `hello.ts` printing `4 beats (hm?,
heh, wave, settle), 4 s at 24 fps, 16 tracks of 97 keys; sleeve_r0 at most 4.0 deg; hip shift
6.0 px (legs r +2.05/-3.42, l +1.82/-2.90 deg, ankles held)`; the build printing `animations
beside the idle, … as written: hello`, `ANIMATIONS_DO_NOT_FOLD: PASS — 2 animation(s) …
(idle, hello): 0 folding mesh(es)`, one `WARN seam "upperarm_r|forearm_r" opens on 6
frame(s) [26, 29, 31, 33, 35, 39] max 23 px in "hello"`, `check: PASS; 11 of 12 bar(s)
measured, 1 skipped (STRESS_OFF_CHAIN); 1 warning(s) (SEAM_OVER_MOTION, not a bar)`, `build:
PASS`; `out/check/build/skeleton.model.json` holding `idle` and `hello`. The hello's own
readings are under *Step 9b, the hello* below.

Results, runs 1 and 2 (parts 1.16.0, rig-c 2.48.0): `check: PASS; 10 of 10 bar(s) measured, 0 skipped`; `build: PASS`; the
packed atlas `skeleton.png 507x1472, 22 region(s), 90.7% covered, padding 2, page edges free,
shape polygon`; `assemble` reporting `recomposite vs source: mean |d|=1.13, within 8: 97.8%,
error px > 40: 6275, uncovered error px: 2059`; `propose` reporting
`coverage: 40 bone(s) — 29 checked and clean, 2 checked with a LINT line, 9 not checked;
roles 0 target, 39 deforms, 1 control, 0 unclassified`; retarget `GATE` green, every `LAND`
within 0.00123°, one `FOLD` reading (`handwear_r`, 58 frames at 24 fps, t=0.333–2.708, the
sharp elbow bend of the wave). `rigc render` wrote 41 frames and a `contact.png`.

The full `rigc --version` line on an install is `@esotericsoftware/spine-core absent — the
round trip and the commands that need it are not available here`. It is correct: the
published package checks every build with rigc's own validator, and the
[rig-c README](https://github.com/rig-c/core#install) explains the two.

### Step 9, the forearm wave

Re-read 2026-10-24 for [#19](https://github.com/rig-c/getting-started/issues/19),
on Linux with Bun 1.4.2. The input is the public example above and
[KEYPOINTS.md](KEYPOINTS.md)'s hand-placed joints, including step 7's ankle correction.
Parts source is [4f276e0](https://github.com/rig-c/parts/commit/4f276e0deee1915f178aa10a6803a82998befdc4),
which includes the body-root gate from parts #707 and the carrier fix from #710.
The source's package version still says 1.60.2; this is a source-gate reading, not a claim
that the published 1.60.2 contains it. Candidate runs used rig-c 2.67.2 and pose 1.0.2,
without spine-core. No art, gate, floor or retarget output was edited.

**First, the old motions.** The unchanged base passed. Before trying a new motion, the old
wave's frame 5 and hello's frame 44 were rendered at 12 fps. The source checker, with its
locked rig-c 2.60.0, reproduced the issue's three refusals:

| motion and pair | worst GAP cells | frame | one-cell floor | frames above floor |
| --- | --- | --- | --- | --- |
| wave, topwear \| upperarm_r | 4,921 | 5 | 129 | 35 of 37 |
| hello, bottomwear \| thigh_r | 10 | 44 | 6 | 12 of 58 |
| hello, bottomwear \| thigh_l | 8 | 44 | 6 | 8 of 58 |

**The bar, before the candidates.** The shoulder roots must be measured, with no GAP hit
over the producer's existing floor. Its definition is
`px > round(max(box width, box height) / cell)`: cells, not screen pixels, and equality
stays under the floor. Roots gate GAP only. The older internal pairs still warn, aggregate
ghost is INFO, and an absent band is SKIP rather than zero. The source may exempt an entire
GAP box only when every cell centre is covered in the full composite; partial or unavailable
coverage keeps the whole original count. The original controls retained those counts.

The candidate keeps the elbow at its painted position and turns only the forearm, with
the same three-second ramp and 22-degree oscillation at 2 Hz. The domain was fixed at
0–180 degrees, the shortest-turn range. Peak settings 0, 30, 60, 90, 120, 150 and 180 were
sent through the actual `clean` and `retarget` commands. Every setting read **0 GAP cells**
at both shoulders over all 37 frames at 12 fps. The 180-degree endpoint was also read at
24 fps:

| default wave after clean and retarget | 12 fps | 24 fps |
| --- | --- | --- |
| forearm angular span, sleeve_r1 against sleeve_r0 | 176.4812 degrees | 179.3380 degrees |
| upper-arm angular span, sleeve_r0 against chest | 0 degrees | 0 degrees |
| shoulder GAP, either side | 0 cells on 37/37 frames | 0 cells on 73/73 frames |

`--angle-range` follows each relative world direction across frames and reports its
maximum minus minimum; it does not subtract the rig's setup angle. The 24 fps forearm
range is -190.6947 to -11.3567 degrees, and the 12 fps range -187.8379 to -11.3567.

The largest tested setting is therefore 180; this family did not reach a failing shoulder
boundary. This is a sampled shortest-turn endpoint, not a proof over continuous time or
an unrestricted angle search. The final source `check` passed, including all four measured
body-root pairs. The elbow still warned on 25 frames, max 24 cells at 12 fps; the separate
elbow work in [#18](https://github.com/rig-c/getting-started/issues/18) remains open.
The compact [receipt](receipts/issue-19.json) records commands, pins and frame digests;
the frame series were deleted after their digests and sheets were made.

### Step 9b, the body-root reach

The same source-gate run replaced the 40 percent stance and 6 px hip shift. Those old keys
opened the right/left thigh GAP by 10/8 cells at frame 44, over floor 6. Halving both
numbers still failed: 20 percent / 3 px left a right-thigh GAP of 4 cells at frame 45,
over floor 2. The floor follows each hit's box; a smaller count alone does not pass it.

The current keys use **10 percent / 1.5 px**, with `skirt_c0` and `skirt_l0` following by
0.415 degrees. On the hand-placed joints the right ankle travels 8.4 px toward parallel,
from 16.05 to 15.28 degrees; its leg keys reach +3.20 / -5.25 degrees, and the left leg's
+0.48 / -0.78. The two-bone solve and timing are unchanged, and neither foot is keyed.
At 24 fps, the plain hello's right thigh reads **1 GAP cell**, equal to its floor of 1,
and the left **0**, with zero above-floor frames on both over all 115 frames.
The source build and `FEET_STAY_LEVEL` pass. Independent evaluation of all 115 generated
leg keys gives maximum ankle y drift 0.000190 px right and 0.000094 px left, inside the
bound derived from rounding each angle to four decimal places.

**Cloth needed its own correction.** Before the hello's settle, the old shared-swing gains
`[1.2, 1, 1.2]` already opened the right thigh on the idle: GAP 6 / floor 5 at frame 9,
32 idle and 30 hello frames over the floor. Half gains `[0.6, 0.5, 0.6]` still opened
3 frames of each, GAP 4 / floor 3 at frame 10. The source defines these numbers as the
linear rotation gains from the shared physics swing to each tree's first link, not a
seam threshold. The guide now uses **`[0.3, 0.25, 0.3]`**, with the same 27 physics and
3 transform constraints and the same wind, gravity and translation settings.

That source build/check passed. Over all 58 hello frames at 12 fps, the right thigh's
maximum is **4 GAP cells / floor 4**, the left 0; both have zero frames over the floor.
All four roots pass on both idle and hello. Physics reference worlds, aggregate ghost,
internal elbow WARN and named SKIPs retain their meanings. The cloth root reading was
not repeated at 24 fps, nor with the player's mixed hello-over-idle and breeze.

The older bars and readings below are retained as history; they did not read the new
body-root gate. The shoulder/elbow distinction and the reported exclusions remain those
in *Step 9, the forearm wave* above.

### Step 9b, the hello

The settle this section measures (hip 6 px, 0.7 s, the ankles held) was replaced on
2026-10-21 by a stance change, after step 7 began cutting the shoes into one part per foot;
its readings are under [*The settle: a stance change*](#the-settle-a-stance-change). The rest
of this section is as measured then.

`scripts/hello.ts` writes keys, not joint positions: the face is outside the 18 body joints
rig-pose reads, and the arm's limit is an angle, which a key states exactly. It reads the
bones from `out/rig/rig.json` — which bones exist, and the legs' lengths and rest angles,
which a two-bone solve uses so both ankles stay where they were painted while the hip moves.
The keypoints are not read. The file goes in through the config's `motion.animations_from`,
"a path, relative to the config file's directory, to a file in rig-c's motion-spec shape"
(stated by the parts [AUTHORING][authoring], the `motion.animations_from` row), so the build
gates it with the rig and `check` reads it for folds.

**The limits, and where they come from.** Measured on this painting with `rigc render
--seam` in a probe before the step was written (parts 1.42.0, rig-c 2.64.1): the upper-arm image is the puff sleeve and
the arm in one piece under a sleeveless top, and turning it out from rest opened 0 px of
background at the armhole at 3 degrees and 50 px at 6; step 9's wave turns it about 105
degrees and opens 3,772 px. The forearm turned anywhere from −160 to +60 degrees at the
elbow with a gap of 8 px at most and a ghost of 28. The thigh art starts at the skirt's hem, so a hip
move opens background there: 6 px of hip travel (0.5 % of the figure) with the skirt's first
links following passed, 12 px did not. The shoes are one image that no leg bone moves, so no
foot lifts.

**Bars, written down before measuring:** on each seam pair, gap ≤ 25 px and ghost ≤ 50 px
on the worst frame; 0 frames of pass-through; `ANIMATIONS_DO_NOT_FOLD` PASS; `sleeve_r0`
within ±4 degrees of rest; hip travel ≤ 6 px with the skirt links following.

**Readings**, on run 4's build, `rigc render --candidate out/check/build --animation <name>
--fps 24 --seam … --pass-through bottomwear:thigh_r,bottomwear:thigh_l --angle-range
sleeve_r0:chest,sleeve_r1:sleeve_r0` (gap / ghost, px, worst frame):

| pair | `idle` | `hello` |
| --- | --- | --- |
| upperarm_r \| topwear | 0 / 2 | 8 / 8 |
| forearm_r \| upperarm_r | 0 / 2 | 1 / 25 |
| upperarm_l \| topwear | 0 / 0 | 0 / 1 |
| forearm_l \| upperarm_l | 0 / 1 | 0 / 0 |
| neck \| topwear | 0 / 0 | 0 / 5 |
| face \| hair_front | 2 / 0 | 0 / 0 |
| face \| neck | 0 / 0 | 0 / 1 |
| hair_back \| face | 0 / 1 | 0 / 0 |
| topwear \| bottomwear | 0 / 3 | 1 / 9 |
| thigh_r \| bottomwear | 1 / 0 | 0 / 0 |
| thigh_l \| bottomwear | 0 / 1 | 3 / 1 |
| shin_r \| thigh_r | 0 / 0 | 0 / 9 |
| shin_l \| thigh_l | 0 / 0 | 0 / 5 |
| shoes \| shin_r | 0 / 0 | 0 / 0 |
| shoes \| shin_l | SKIP | SKIP |

`SKIP` is rigc's: the two drawings share no band at the setup pose. Pass-through: 0 of 97
frames for both thighs (0 of 81 under the idle). `sleeve_r0` against `chest`: −103.03 to
−99.03 degrees under the hello, rest −99.03, so 4.00 degrees out at most (the idle moves it
0.39). `sleeve_r1` against `sleeve_r0`: −151.23 to −11.32 degrees. Hip: world x from 31.00 to
25.04, 5.96 px on the frames read; both ankles (`leg_r1`'s and `leg_l1`'s tips) moved at most
0.0007 px (`render --geometry`). Every reading is inside its bar.

**Not measured:** the seams with the hello played over the idle on two tracks, as step 10's
`&under=idle` plays it — `rigc render` reads one animation at a time. The idle adds its
breath on `chest_ctl` and its sway on the left sleeve beneath the hello's own keys.

### Step 9c, the hair and the skirt

The recipe is the parts package's *Recipe: cloth and hair that answer the world* (stated by
the parts [AUTHORING][authoring]): the config's `cloth` block holds one recipe per
See-through tag, `propose --cloth` drafts it, and `--write-config` writes the config back
"with what the recipe drafts spliced in", replacing `bones` and `constraints` whole and
keeping every other byte, `motion.animations_from` among them. On this painting the locks
beside the face are in the `front hair` layer, with the fringe (the plan's `hair_front`
part, `head:front hair`); the back hair's `bun` is a single bone, and a `back hair` recipe on
hair that ends above the shoulders is refused (`PROPOSE_CLOTH_DRAFTED`), so the bun keeps its
idle key.

**What the recipe drafted** (parts 1.48.0, measured): the keyed chains `lock`, `lock1_` and
`skirt_r`, `skirt_c`, `skirt_l` and their idle tracks are replaced; the fringe's chains keep
their names and places. The rig goes from 70 bones to 46 (the keyed chains' `_ctl` bones go);
with step 7's ankle correction, from 72 to 48 (the two feet are bones of their own).

| piece | chains | constraints |
| --- | --- | --- |
| side locks | `lockt0_` and `lock1t0_`, 3 links each, from `head` | `<link>_physics` on every link (rotate), `<last link>_translate` on the last: 8 |
| fringe | `bang_r`, `bang_c`, `bang_l`, 2 links each, as drafted in step 7 | the same: 9 |
| skirt | `skirt0_`, `skirt1_`, `skirt2_`, 3 links each, and `skirt_swing`, one link under `hip` | `skirt_swing_physics`; `skirt_swing_0`..`_2` (transform: each tree's first link turns with the swing, times 1.2, 1, 1.2); `_physics` on links 1 and 2 and `_translate` on link 2 of each tree: 13 |

27 physics constraints and 3 transform constraints, 30 in all; `wind` 1 to 6 and `gravity`
2 to 12 from root to tip, multipliers of the world the player sets. The step-10 page sets
none, so the runtime's default world applies: wind (1, 0), gravity (0, 1) (stated by
`rigc render --help`, *--environment*). The readings in this section are in that world; step 10's page
breeze came later ([Step 10, the breeze](#step-10-the-breeze)).

**Two corrections to the draft, both measured on this painting:**

- **The side locks' `strength`.** At the recipe's default (`edge` 50; one tree is its own
  edge) the locks trail the hello's head turn: `face|hair_front` reads a ghost of 122 px at
  hello frame 8 (t 0.333 s), past the bar of 50. With `edge` 100 it reads 47.
- **The bun's idle amplitude.** With the locks', fringe's and skirt's tracks gone, `bun` is
  the head's only keyed child, and `CHAIN_LAG` reads `neck > head_ctl > bun_ctl` as one
  unbranched chain: `CHECK_CHAIN_LAG: bone "bun_ctl" in the chain from "neck" — amplitude
  0.800 below the link above's 0.900`, `check: FAIL`. The draft's own 0.8 under 0.9 was not
  read before, because `head` had other keyed children. Raised to 1: `CHAIN_LAG: PASS`.

**The hello's skirt keys.** `hello.ts` keys `skirt_r0`, `skirt_c0` and `skirt_l0` to follow
the settle's hip shift; under the recipe those bones do not exist and the swing carries the
skirt, so step 9c writes the hello with `--no-skirt-keys` (13 tracks; the other 13 are the
same keys, byte for byte; since the stance change, 14 tracks, the 14th keying `skirt0_0`, see
below). Without physics the keys are needed: step 9b's build with them left
out reads `thigh_l|bottomwear` gap 48 px on the hello, past the bar of 25.

**The build's lines** (run on 2026-10-21): `CLOTH_SETTLES: WARN — 9 physics chain(s) …: 4 of
them settle before the loop's length`, the skirt's three trees at 1.917, 2 and 1.833 s and
`skirt_swing` at 1.25 s of the 3.333 s idle; the hair does not settle, because the idle keys
the head it hangs from. `loop: … with the rig's 27 physics constraint(s) left out … max |d| 0`,
and the `loop physics:` line naming all 27. Without `--lead-in`, `idle.gif` jumps at the wrap
(`f0040.png differs from f0000.png by max |d| 209, 1244 px over 40`); with `--lead-in 1`,
`max |d| 0, 0 px over 40`. `ANIMATIONS_DO_NOT_FOLD` reads both animations with the physics on
and off: 0 folding meshes. `TEXTURE_STRETCH` severity 1.117 (ceiling 1.927), worst in
`bottomwear`.

**Bars, written down before measuring:** on each seam pair, gap ≤ 25 px and ghost ≤ 50 px on
the worst frame, physics on; 0 frames of pass-through; `ANIMATIONS_DO_NOT_FOLD` PASS;
`check: PASS` and `build: PASS`; `sleeve_r0` still within 4 degrees of rest.

**Readings**, on the step's build, `rigc render --candidate out/check/build --animation
<name> --fps 24 --geometry --seam … --pass-through bottomwear:thigh_r,bottomwear:thigh_l
--angle-range …`. `rigc render` starts the physics at rest at frame 0 and steps it, as the
player does when an animation starts, so the frames include the skirt hanging into place in
the first 2 s (gap / ghost, px, worst frame):

| pair | `idle` | `hello` |
| --- | --- | --- |
| upperarm_r \| topwear | 0 / 2 | 8 / 8 |
| forearm_r \| upperarm_r | 0 / 2 | 1 / 25 |
| upperarm_l \| topwear | 0 / 0 | 0 / 1 |
| forearm_l \| upperarm_l | 0 / 1 | 0 / 0 |
| neck \| topwear | 0 / 0 | 0 / 5 |
| face \| hair_front | 0 / 0 | 7 / 47 |
| face \| neck | 0 / 0 | 0 / 1 |
| hair_back \| face | 0 / 1 | 0 / 0 |
| topwear \| bottomwear | 1 / 7 | 3 / 18 |
| thigh_r \| bottomwear | 6 / 1 | 6 / 5 |
| thigh_l \| bottomwear | 1 / 2 | 3 / 8 |
| shin_r \| thigh_r | 0 / 0 | 0 / 9 |
| shin_l \| thigh_l | 0 / 0 | 0 / 5 |
| shoes \| shin_r | 0 / 0 | 0 / 0 |
| shoes \| shin_l | SKIP | SKIP |

Pass-through: 0 of 81 idle frames and 0 of 97 hello frames, both thighs. `sleeve_r0` against
`chest`: 4.00 degrees out at most under the hello. Every reading is inside its bar.

**How far physics moves them.** Each link against the one above (`--angle-range`), the span
over the frames read, degrees, the settle from rest included:

| link | `idle` | `hello` |
| --- | --- | --- |
| `lockt0_0` against `head` | 0.74 | 2.79 |
| `lockt0_1`, `lockt0_2` | 1.23, 1.87 | 3.46, 6.73 |
| `lock1t0_0` against `head` | 0.45 | 2.14 |
| `lock1t0_1`, `lock1t0_2` | 1.29, 2.22 | 3.12, 5.69 |
| `bang_c0` against `head`, `bang_c1` | 0.95, 2.83 | 11.26, 8.63 |
| `skirt_swing` against `hip` | 0.46 | 2.90 |
| `skirt0_0`, `skirt1_0`, `skirt2_0` against `hip` | 0.56, 0.46, 0.56 | 3.48, 2.90, 3.48 |
| `skirt0_2`, `skirt1_2`, `skirt2_2` | 2.61, 2.60, 7.41 | 4.74, 4.61, 8.84 |

The tips, in the frame of the bone the piece hangs from (`--geometry`): under the hello the
side locks' ends move up to 5.17 and 5.67 rig px from their median, at t 3.667 s (the
settle), the fringe's up to 9.82 at t 0.333 s (the head turn), and the skirt's middle tree
6.78 at the end of the settle. Under the idle, once the skirt has hung into place (from
2 s on), the side locks' ends move 0.23 and 0.40 rig px and the skirt's less than 0.01: a
breath on the chest barely reaches hair that hangs from the head, and nothing in the idle
moves the hip. Step 8's keyed idle swung the locks' last links at an amplitude of 3.6 degrees.

**Wind.** `rigc render --environment` with calm (wind (0, 0)) from 0 s and a gust (2, 0)
from 1.5 s, against calm throughout, on the idle: the side locks' ends 9.25 and 10.07 rig px
apart at about 2 s, the fringe 3.89 and 3.57, the skirt's hems 10.90, 8.37 and 12.83. Step
10's page now sets one through the player's `environment()`: [Step 10, the
breeze](#step-10-the-breeze).

**Not measured:** the hello over the idle on two tracks with physics, as step 10's
`&under=idle` plays it (`rigc render` reads one animation at a time); the player's physics
against rigc's render frame by frame.

### The settle: a stance change

The 40 percent / 6 px readings below are historical. The current 10 percent / 1.5 px
settle is measured in *Step 9b, the body-root reach* below.

Added 2026-10-21. The owner asked for the settle to bring the feet toward a parallel stance
and back, which would also drive the skirt. A read-only probe on this build (parts 1.48.0)
designed it; the readings below are the guide's own, on parts 1.49.1 and rig-c 2.64.1.

**The feet, through the producer.** The parts package's limbs rule drafts `foot_r` and
`foot_l` under the shins "when every leg's ankle lies on one footwear part — `foot_<s>` on a
bone of its own at the ankle under the shin, `inherit` `"noRotationOrReflection"`, so the
shoe keeps its setup angle while the leg turns" (stated by the parts [AUTHORING][authoring],
*Limbs: cut at their joints*). The script's `l_ankle`, at painting px `[855.7, 2154.1]`, lies
11.761 px from the leg's art along its joint line, so `propose` prints `LINT foot_l …
(ASSEMBLE_LIMB_JOINT_ON_ART)` and leaves `shoes` whole. The hand-placed set's `[850, 2110]`
lies on the leg but 22 px from the shoes, so it leaves them whole too, with a note and no
`LINT`. At `[848, 2140]` both sets give `propose` 44 bones and 0 `LINT` lines, and `build`
prints `limb cut: "shoes" opaque 13735 = "foot_r" 8071 + "foot_l" 5664` (measured). Step 7's
first line moves the ankle there in whichever `keypoints.json` the reader has, and
[KEYPOINTS.md](KEYPOINTS.md)'s set now holds it too. The build's rig has 72 bones (70
before) and 28 parts; step 8's `check` adds `FEET_STAY_LEVEL`, skipped on the idle, which
turns no leg. The ankle caps are reported missing (`limb cap: … "ankle" … 593 px missing`,
`… 620 px missing`), and `RECOMPOSITE_HOLES` reads the same 402 px hole at the left ankle as
before the split (`error_px 6275`): neither shows while the foot stays level and the shin
draws over it.

**The painted stance** (rig px, from the rig's leg bones): the right leg (the picture's left)
runs 15.96 degrees from straight down, hip to ankle; the left 8.09 degrees, the same way. The
right shoe is painted turned out 44.4 degrees more than the left (the probe's reading of the
shoes' long axes).

**The keys** (`scripts/hello.ts`, from the rig's leg lengths and rest angles):

| | value |
| --- | --- |
| right ankle | 33.2 px in along the floor: 40 % of the 83.0 px to where hip-to-ankle is parallel to the left leg (15.96 → 12.87 degrees) |
| right leg | two-bone IK, the knee bending the way it is painted: `leg_r0` +9.61, `leg_r1` −13.63 degrees at the hold |
| hip | x −6 px, y 0 |
| left leg | ankle held, IK under the hip's move: `leg_l0` +1.70, `leg_l1` −2.65 degrees |
| feet | not keyed: each keeps its shoe level by its inherit and goes with its ankle |
| skirt, step 9b | `skirt_r0` equal to `leg_r0`; `skirt_c0`, `skirt_l0` 1.66 degrees after the hip, as before |
| skirt, step 9c | `skirt0_0` equal to `leg_r0`: the first link of the tree over the right thigh, which takes the swing's turn through a transform constraint and has no physics of its own, so a key adds to it; the rest of the skirt answers the hip by physics |
| timing | out over 3.15–3.75 s as the arm comes down, held to 4.15 s, back over 4.15–4.75 s, smoothstep; the hello is 4.75 s (115 keys at 24 fps), every track at rest at both ends |

**Bars, written down before measuring** (from rig-c/getting-started#13): hem
`thigh_?|bottomwear` gap ≤ 25 px; knee `shin_?|thigh_?` ghost ≤ 50 px, and `shin_?|foot_?`
within the same; 0 frames of pass-through; the ankles (`leg_?1`'s tips) and the soles (each
foot's lowest vertex) within 2 px of rest (`--geometry`); no folds; `sleeve_r0` within 4
degrees; every seam pair within gap ≤ 25 and ghost ≤ 50 on `idle` and `hello`, physics on;
`FEET_STAY_LEVEL` PASS; `check: PASS`; `build: PASS`.

**50 % failed one, and the beat came down to 40 %.** The probe proposed 50 % (41.5 px,
`leg_r0` +11.11, `leg_r1` −15.28 degrees). On step 9c's build, physics on, it read
`topwear|bottomwear` ghost **54** px (frames 86–101, the hold), over the bar of 50: the
skirt's top, turned with `skirt0_0`, pulls off the shirt. Every other pair passed (hem
`thigh_r` 20 / 3, knee 1 / 40), and step 9b's plain build passed everything (`topwear` 1 /
45). At 40 % every bar holds on both builds. The bars were not changed.

**Readings at 40 %**, `rigc render --candidate out/check/build --animation <name> --fps 24
--geometry --folds --seam … --pass-through bottomwear:thigh_r,bottomwear:thigh_l
--angle-range …`, physics on where the rig has it (gap / ghost, px, worst frame; `rigc
render` starts physics at rest, so the frames include the skirt hanging into place):

| pair | 9b `idle` | 9b `hello` | 9c `idle` | 9c `hello` |
| --- | --- | --- | --- | --- |
| upperarm_r \| topwear | 0 / 2 | 8 / 8 | 0 / 2 | 8 / 8 |
| forearm_r \| upperarm_r | 0 / 2 | 1 / 26 | 0 / 2 | 1 / 26 |
| upperarm_l \| topwear | 0 / 0 | 0 / 1 | 0 / 0 | 0 / 1 |
| forearm_l \| upperarm_l | 0 / 1 | 0 / 0 | 0 / 1 | 0 / 0 |
| neck \| topwear | 0 / 0 | 0 / 5 | 0 / 0 | 0 / 5 |
| face \| hair_front | 2 / 0 | 0 / 0 | 0 / 0 | 7 / 47 |
| face \| neck | 0 / 0 | 0 / 1 | 0 / 0 | 0 / 1 |
| hair_back \| face | 0 / 1 | 0 / 0 | 0 / 1 | 0 / 0 |
| topwear \| bottomwear | 0 / 3 | 1 / 38 | 1 / 7 | 3 / 44 |
| thigh_r \| bottomwear | 1 / 0 | 11 / 0 | 6 / 1 | 10 / 2 |
| thigh_l \| bottomwear | 0 / 1 | 11 / 3 | 1 / 2 | 7 / 6 |
| shin_r \| thigh_r | 0 / 0 | 1 / 38 | 0 / 0 | 1 / 38 |
| shin_l \| thigh_l | 0 / 0 | 0 / 5 | 0 / 0 | 0 / 5 |
| shin_r \| foot_r | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| shin_l \| foot_l | SKIP | SKIP | SKIP | SKIP |

The two `shoes` pairs of the earlier tables are gone with the part; the two foot pairs take
their place, and `shin_l|foot_l` is rigc's `SKIP` as `shoes|shin_l` was. Pass-through: 0 of
81 idle and 0 of 115 hello frames, both thighs, both builds. Folds: none. Feet: the ankles'
y and the soles' lowest y move 0.001 px at most on every frame (the right ankle 142, the
left 146, the soles 26 and 22, world y up); the right ankle's x runs −192.00 to −158.80,
33.2 px. `sleeve_r0` against `chest`: 4.00 degrees out at most. The build: `FEET_STAY_LEVEL:
PASS — 2 animation(s) …: each foot's drawing within ±10 degrees of its setup pose while a bone
above it is turned`, `ANIMATIONS_DO_NOT_FOLD: PASS`, `check: PASS; 12 of 13 bar(s) measured,
1 skipped (STRESS_OFF_CHAIN)`, `build: PASS`, on both 9b and 9c. Every reading is inside its
bar; the worst is `face|hair_front` ghost 47 (the head turn at 0.333 s, as before) and
`topwear|bottomwear` 44.

**Angles under the hello** (`--angle-range`, span over the frames read, degrees):

| bone against | 9b | 9c | before, the hip-only settle (9c) |
| --- | --- | --- | --- |
| `leg_r0` against `hip` | 9.61 | 9.61 | — |
| `leg_r1` against `leg_r0` | 13.63 | 13.63 | — |
| `leg_l0`, `leg_l1` | 1.70, 2.65 | 1.70, 2.65 | — |
| `foot_r`, `foot_l` against `hip` | 0, 0 | 0, 0 | — |
| `skirt_r0` / `skirt0_0` against `hip` (keyed) | 9.61 | 10.28 | 3.48 |
| `skirt_swing` against `hip` | — | 1.60 | 2.90 |
| `skirt1_0`, `skirt2_0` against `hip` | 1.66, 1.66 (keyed) | 1.60, 1.92 | 2.90, 3.48 |
| `skirt0_2` against `skirt0_1` | — | 10.44 | 4.74 |
| `skirt2_2` against `skirt2_1` | — | 8.33 | 8.84 |

The feet's bones do not turn, so the right shoe stays drawn at its painted angle, turned out:
the legs come together, the feet do not become parallel. The skirt answers in two ways: the
tree over the right thigh follows the thigh by its key, and its tip link swings 10.44 degrees
against the link above (4.74 under the hip-only settle); the shared swing and the other
trees answer the hip, and less than before (1.60 against 2.90), because the hip now takes
0.6 s to move where it took 0.35 s.

**Needs a part** (from the probe, not changed by this step):

- **A turned-in right shoe.** The toe-out is painted. Turning the foot's image in the
  picture's plane reads as a shoe tipped on its side, pushes the sole 13–22 px through the
  floor, and past 10 degrees fails `FEET_STAY_LEVEL`. A true parallel stance needs a second
  painting of the right shoe, switched in by an attachment key.
- **Thigh art under the hem**, to go further than about 50–75 % of the way: the thigh turns
  about the hip 180 px above the hem and its art starts at the hem, so a turn opens a sliver
  that only the skirt's link covers, and past about 75 % the skirt mesh itself splits.
- **A lower hip or a painting with the legs closer**, for straight parallel legs: with the
  hip where it is the right leg must shorten 18 px, which only the knee gives, and from 75 %
  the knees nearly touch.
- **Ankle caps**, the 593 and 620 px the `limb cap:` lines size, and the 402 px hole at the
  left ankle: unseen while the feet stay level, seen as soon as a foot turns against its
  shin.

**Not measured:** the hello over the idle on two tracks, as step 10 plays it.

### Step 10, the breeze

Added 2026-10-21 (rig-c/getting-started#15). The page supplies a world; the rig, the config,
the recipe and the motion are unchanged.

**The call.** `@rig-c/play` 1.12.0 (the version on npm on 2026-10-21), `RigPlayer.environment`:
"The world the rig's physics answers (#121): `wind` and `gravity`, as spine-core's
skeleton-level `windX/windY` and `gravityX/gravityY` — x to the right and **y down** … The
runtime's start values are `{ wind: [1, 0], gravity: [0, 1] }` … `null` returns both to the
start values, and the call applies from the next step on, at any time … It is the player's, not
a track's: every track and layer answers the same world" (its `dist/player.d.ts`). So one call
reaches both tracks of `&under=idle`. [`scripts/play.html`](../scripts/play.html) calls
`player.environment({ wind: [0.75 + 0.25 × sin(2π × 0.2 t), 0] })` before every `frame`, `t`
the seconds played (held while paused); gravity is left at the runtime's. The **breeze** box,
or `&wind=0`, calls `player.environment(null)`: the runtime's own world, wind (1, 0), the one
every earlier reading in this document was taken in. The page also passes `setsUrl: null` to
`loadModel`, since the build has no `sets.json`: the default probe logged a 404 in the console.

**Why 0.75 ± 0.25.** The first value tried, 1 ± 1 (0 to 2), moved the idle's lock tips 4.3 and
4.7 page px, but failed the hello in three ways, each at a different phase of the gust: a strong
wind during the head turn pushes the locks onto the cheek (`face|hair_front` ghost 70 at wind 2),
a strong wind during the settle lifts the skirt off the shirt (`topwear|bottomwear` ghost 57), and
a weak one during the settle lets the hem leave the thighs (`thigh_l|bottomwear` gap 46). The
same gap shows in still air: wind (0, 0) throughout reads `thigh_r|bottomwear` 33 / 1 and
`thigh_l|bottomwear` 46 / 2 on the hello, against 10 / 2 and 7 / 6 in the runtime's (1, 0). The
rig's skirt was tuned, without anyone choosing it, in that runtime wind. Lowering the gust with
the base at 1 (± 0.75, ± 0.5, ± 0.25) still failed at some phase: at ± 0.25, `face|hair_front`
ghost 52 when the gust peaks (1.25) at the head turn. The wind has to stay between about 0.5 and
1, so the breeze runs 0.5 to 1. A vertical gust instead, wind (1, ± 1), moved the lock tips 0.3
page px: they hang along it.

**Bars, written down before measuring** (rig-c/getting-started#15): with the breeze on, on the
step's build, `idle` and `hello`: every seam pair within gap ≤ 25 / ghost ≤ 50, the 15 pairs of
the stance table, `shin_r|foot_r` among them; 0 frames of pass-through; no folds; `face|hair_front` ≤ 50.
In the browser, the side locks' tips move ≥ 3 px over 5 s of the idle with the breeze on, and
< 1 px with `&wind=0`; no console errors, on `anim=idle` and `anim=hello&under=idle`.

**How the schedule stands in for the sine.** `rigc render --environment` takes steps that hold
until the next. One step a frame at 24 fps, the wind of frame k (time k/24) set at
t = (k − 0.5)/24, so each lands on its own frame (a step at k/24 rounded up lands on the next
frame, and rigc refuses two on one frame). `rigc render` starts the physics at rest at frame 0,
where the page's gust is already running, so each animation was read at four phases of the gust,
the sine starting at 0°, 90°, 180° and 270°. Flags as in the stance section, `--fps 24 --max 640
--geometry --folds --seam … --pass-through bottomwear:thigh_r,bottomwear:thigh_l`.

**Readings at 0.75 ± 0.25** (gap / ghost, px, the worst frame of the four phases; the runtime's
(1, 0) beside it, from the stance section's 9c columns):

| pair | `idle` | `hello` | `hello`, wind (1, 0) |
| --- | --- | --- | --- |
| upperarm_r \| topwear | 0 / 2 | 8 / 8 | 8 / 8 |
| forearm_r \| upperarm_r | 0 / 2 | 1 / 26 | 1 / 26 |
| upperarm_l \| topwear | 0 / 0 | 0 / 1 | 0 / 1 |
| forearm_l \| upperarm_l | 0 / 1 | 0 / 0 | 0 / 0 |
| neck \| topwear | 0 / 0 | 0 / 5 | 0 / 5 |
| face \| hair_front | 0 / 0 | 7 / 47 | 7 / 47 |
| face \| neck | 0 / 0 | 0 / 1 | 0 / 1 |
| hair_back \| face | 0 / 1 | 0 / 0 | 0 / 0 |
| topwear \| bottomwear | 1 / 7 | 3 / 44 | 3 / 44 |
| thigh_r \| bottomwear | 5 / 1 | 20 / 3 | 10 / 2 |
| thigh_l \| bottomwear | 1 / 2 | 24 / 6 | 7 / 6 |
| shin_r \| thigh_r | 0 / 0 | 1 / 38 | 1 / 38 |
| shin_l \| thigh_l | 0 / 0 | 0 / 5 | 0 / 5 |
| shin_r \| foot_r | 0 / 0 | 0 / 0 | 0 / 0 |
| shin_l \| foot_l | SKIP | SKIP | SKIP |

`face|hair_front` 47 at the 90° phase (the gust's peak, wind 1, at the head turn); 39 to 41 at
the others. The tightest is the hem: `thigh_l|bottomwear` gap 24 at 0°, where the gust's low
(wind 0.5) meets the settle. Pass-through: 0 of 81 idle and 0 of 115 hello frames, both thighs,
every phase. Folds: none. Every rigc bar holds.

**In the browser**, `scripts/serve.ts` and headless Chromium (`--use-angle=metal`), 1280 × 720,
where the page fits the rig at scale 0.526. The lock tips (`lockt0_2`, `lock1t0_2`, from
`player.bone()` and the bone's length) are read in the head's frame, since the idle's own head
nod moves them on the canvas 2.4 and 4.3 page px with the breeze off. Over 5 s after 3 s of
settling, the largest distance between two of the frame's positions (page px, rig px in
brackets):

| page | wind x | `lockt0_2` | `lock1t0_2` | skirt tips `skirt0_2`, `skirt1_2`, `skirt2_2` | console errors |
| --- | --- | --- | --- | --- | --- |
| `anim=idle` | 0.5 to 1 | 1.24 (2.35) | 1.33 (2.53) | 1.36, 0.95, 1.59 | 0 |
| `anim=idle&wind=0` | 1 | 0.25 (0.47) | 0.27 (0.52) | 0, 0, 0 | 0 |
| `anim=hello&under=idle` | 0.5 to 1 | 3.30 | 3.48 | 12.90, 3.42, 4.06 | 0 |
| `anim=hello&under=idle&wind=0` | 1 | 2.91 | 3.04 | 13.44, 3.57, 4.26 | 0 |

With `&wind=0` the idle's locks move under 1 px: that bar holds. **The breeze's bar of ≥ 3 px
does not**: 1.24 and 1.33. At 1 ± 1 the same reading is 4.33 and 4.67, and 0.75 ± 0.25 is what
the hello's seams allow. The bars were not changed. Under the hello the head's turn and the
settle move the locks and the skirt far more than any wind the seams allow, breeze or not.

**What it looks like.** Side by side at 2×, the off page's skirt hem is still and the breeze's
hem and lock ends drift a pixel or two over each five-second gust: visible when looked for,
nowhere near stormy. At 1 ± 1 the drift is plain.

**`check-adapters.ts`** opens the step-10 page on the idle with and without `&wind=0` on
Playwright's fake clock, one 1/24 s step a frame, so a slow CI GPU does not change the reading,
and reads the lock tips through `player.bone()` over one whole gust after 3 s. It asserts the
wind the page set (x from 0.5 to 1 and y 0 with the breeze; the runtime's (1, 0) without), no
console errors, and that each tip moves at least twice as far in the breeze as without it. The
3 px bar is not asserted, since this breeze does not meet it. In a clean run of the script
(exit 0, 467 s, software GL with the CI's flags) it read 1.25 / 1.37 px against 0.25 / 0.35 px.

**Not measured:** the hello over the idle on two tracks under `rigc render` (it reads one
animation at a time); the page's breeze is read there only through the player.

### The joint script, `scripts/keypoints.py`

- **Downloads, first run**: two model zips, 94,223,081 and 212,739,469 bytes (sizes from the
  download server by HEAD request), unpacked in `~/.cache/rtmlib` to 101,400,344 +
  228,708,578 bytes (330 MB). uv installs 224 MB of Python packages and, if it needs one, a
  Python (72 MB here). The download time is not measured yet: an earlier job on this Mac had
  already cached both models.
- **Time, warm**: on the example painting, 3.6 s wall, of which models loaded in 0.6 s and
  one image in 1.6 s. On a second painting: models 0.3–0.6 s, inference 1.4–2.4 s, 2.4–2.5 s
  wall. The first run in a new uv environment took 43.5 s wall (5.5 s user), measured twice,
  both times with every package and model already cached — so that 40 s is environment
  set-up and first imports, not downloads.
- **Agreement with hand-placed joints**: on the example painting, within 4–52 painting
  pixels of the set first placed in [KEYPOINTS.md](KEYPOINTS.md) (neck 52, l_hip 49, l_ankle 44,
  r_shoulder 40; elbows, wrists, knees 4–21). The set there now was moved to within a pixel
  of the script's joints, so that the no-Python route gives the same hello
  ([KEYPOINTS.md](KEYPOINTS.md#the-file)).
- **The estimator's joints built green unedited**: `propose --keypoints` (2 LINT lines, both
  the leg chain's top under the skirt) → `take.ts` → `build` PASS 10/10.
- **The hand-placed set** through the same steps: 42 bones, a chain per leg on the one
  `legwear` mesh, `build` PASS 10/10, the same map and wave retarget green, `FOLD` on 32
  frames.

The script uses rtmlib's `Wholebody` in "balanced" mode (YOLOX-m to find the person, RTMW-x
to place the points). rtmlib's `Body` mode (COCO-17 only, which is all this file needs) uses
a different, smaller pose model; it was not tried and would need its own download measured.

### The leg chain moves with the joints

On the example painting both legs are one See-through layer. From the script's joints the
proposer gave one leg chain down the middle of both legs (40 bones); from the hand-placed
set it gave a chain per leg on that same layer (42 bones). On parts 1.49.1 both sets give a
chain per leg, and with step 7's ankle correction both give 44 bones, the feet cut from the
shoes. Which one you get depends on
where the knees and ankles fall on the leg art, and a note on the leg part says which and
why. Both build green. The README's map leaves the legs out for this reason — the wave does
not move them, and a map written for one bone list misses on the other. To give each leg its
own part, the parts guide's `assemble.cuts` cuts the layer in two.

### Route A, from the project's own record

The parts guide, [AUTHORING §8](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md#8-what-one-character-costs),
records 18 to 20 seconds per painting and 171 to 199 seconds per See-through run through the
same ComfyUI wrapper. That page does not name the GPU. The ComfyUI install time, the
PyTorch size, the model download times and the peak GPU memory are not measured yet.

The wrapper's README describes its group offload (`--offload`) as cutting peak VRAM a great
deal at "2–3x slower". The parts guide says the painting comes back at twice the
generation size (1664 x 2432 from an 832 x 1216 latent).

## Requirements and their sources

Where a project states no minimum, this says so rather than filling one in.

### Every route: *Try it first* and the joint script

- **Operating system**: Linux, macOS and Windows are the systems rig-c's install is tested
  on in CI ([rig-c README][core], *Install*). Measured here: macOS 26.6.1. Windows: not
  measured yet.
- **CPU and memory**: not stated by the packages. Measured on an M4 with 32 GB.
- **GPU**: none.
- **Disk**: measured, 0.12 GB for *Try it first* (the packages, Bun's cache, the example
  inputs and every output). The joint script adds about 0.7 GB (Python packages, a Python,
  two models).
- **Bun 1.2.0 or later**: the `engines` field of `rig-c`, `@rig-c/parts` and `@rig-c/pose`.
  Node and npm are not needed when you install with Bun. `@rig-c/play` states no browser
  minimum; measured in Chromium 152.
- **For the joint script**: Python 3.10 or later (rtmlib's package metadata) and
  [uv](https://docs.astral.sh/uv/) (measured with uv 0.12.17 and the Python 3.12.14 it chose).
- **git**, to clone this repository — or download it as a ZIP.
- **Accounts**: none. *Try it first* downloads only from npm and GitHub.

### Route A: NVIDIA GPU

- **Operating system**: Windows or Linux for a manual install; a Windows portable build
  exists for NVIDIA ([ComfyUI README][comfy-readme], *Installing*).
- **CPU and memory**: not stated by ComfyUI or the See-through wrapper.
- **GPU**: NVIDIA. The portable build "supports 20 series and above"; a separate build
  covers the 10 series ([ComfyUI README][comfy-readme]).
- **GPU memory (VRAM)**: See-through: "approximately 12-16 GB of VRAM at 1280 resolution",
  about 8 GB with its quantised (NF4) pipeline ([See-through README][st-readme], *Low-VRAM
  Users*). The wrapper: for "most users (12GB+ VRAM)" the defaults "work well", 8 to 12 GB
  with its listed settings, and its own benchmark table gives "Min VRAM ~16 GB" at
  resolution 1280 ([wrapper README][wrapper]).
- **Disk**: about 23 GB of models (sizes below), plus ComfyUI and PyTorch, whose size is not
  stated by ComfyUI for a manual install.
- **Python**: ComfyUI says 3.13 "is very well supported", 3.12 if a custom node has
  trouble, 3.14 "works but some custom nodes may have issues"; the wrapper requires Python
  3.10 or later (its `pyproject.toml`).
- **PyTorch**: ComfyUI says 2.7 "is minimally supported", and a CUDA 13.0 build is required
  on 20 series and above.
- **git**, to clone ComfyUI and the wrapper (no minimum stated).
- **Accounts**: a Civitai download page for the checkpoint; whether it asks you to sign in
  is not measured yet. The See-through models download from Hugging Face without a stated
  login ([wrapper README][wrapper]).
- **Starting ComfyUI for another machine**: `python main.py --listen` is ComfyUI's flag; it
  listens on every interface.
- **The wrapper's startup line**: its code prints `[ComfyUI-See-through] Loaded 7 nodes`
  (seven at 0.5.0; read in the code, not run). Its README says the nodes appear under a
  **SeeThrough** category.

### Route B: Apple Silicon Mac

- **Operating system**: Apple Silicon (M1 to M4) "with any recent macOS version"
  ([ComfyUI README][comfy-readme], *Apple Mac silicon*); macOS 14.0 or later for PyTorch
  with Metal ([Apple][apple-pytorch]).
- **CPU and memory**: not stated by ComfyUI, Apple or the wrapper. A Mac shares memory
  between CPU and GPU; how much See-through needs there is not stated by any of these
  projects and not measured yet.
- **GPU**: the Mac's own, through PyTorch's MPS backend.
- **Disk**: the same models as Route A. ComfyUI Desktop on macOS recommends "at least
  4.85 GB" per installation ([Comfy docs][comfy-mac]); it is macOS 13 or later, Apple
  Silicon. Where the desktop app keeps custom nodes and on which address it serves were not
  read for this guide.
- **Software**: the same ComfyUI and wrapper requirements as Route A, plus Python 3.10 or
  later and the Xcode command-line tools ([Apple][apple-pytorch]). On the measured Mac,
  `/usr/bin/python3` is 3.9.6.
- **Apple's own check** prints `tensor([1.], device='mps:0')`; the README's shorter
  `python -c` line prints `True`.
- **Two things read in the wrapper's code at `98d754b`, not run**: its group offload hands
  its blocks to the device `'cuda'` by name (`nodes.py`), so `--offload` cannot work on a
  Mac; and its requirements list `bitsandbytes>=0.49.2`, which its 4-bit mode (`--nf4`)
  needs, while its `pyproject.toml` does not list it among its dependencies. Whether
  `bitsandbytes` installs on macOS is not measured yet.
- **Accounts**: as Route A.

### Route C: no GPU

- **Needs**: any system with a web browser.
- **Hugging Face**: "if you register with HuggingFace, you should be able to run 1-2 PSD
  extractions per day (approximately 2-3 mins each, at 1280 resolution)"
  ([See-through README][st-readme], *Online Demo*). Two runs per character, so with that
  limit one character can take two days.
- **ModelScope**: "completely free now" (same section), offered for users in mainland
  China; whether it needs an account is not stated there.
- **The Space centre-crops**: its own page says "non-square images are center-cropped",
  which is why the README says to upload `work/st_input_full.png` rather than the painting.
- **What a PSD does not carry**: a per-layer depth figure, which the wrapper's
  `layers.json` has. The parts README says a PSD's stacking order is read as the draw
  order; one optional proposer feature (turning the head along with `propose
  --full/--head`) needs the depth and refuses a PSD ([AUTHORING][authoring], the head-turn
  rules). *Try it first* on PSD input is not measured yet.

[comfy-readme]: https://github.com/Comfy-Org/ComfyUI#installing
[comfy-mac]: https://docs.comfy.org/installation/desktop/macos
[apple-pytorch]: https://developer.apple.com/metal/pytorch/
[st-readme]: https://github.com/shitagaki-lab/see-through
[wrapper]: https://github.com/jtydhr88/ComfyUI-See-through
[core]: https://github.com/rig-c/core#install
[authoring]: https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md

## The model files, exactly

Sizes as Hugging Face's and Civitai's APIs reported them on 2026-10-13, read without
downloading.

| File | Source | Licence | Size |
| --- | --- | --- | --- |
| `novaAnimeXL_ilV80.safetensors` | [Nova Anime XL "IL v8.0"](https://civitai.com/models/376130) by Crody, Civitai model-version 1854228 | the model's own, on its page | 6,775,799 KB (6.94 GB) |
| `controlnet-openpose-sdxl-1.0.safetensors` | [xinsir/controlnet-openpose-sdxl-1.0](https://huggingface.co/xinsir/controlnet-openpose-sdxl-1.0), `diffusion_pytorch_model.safetensors` | Apache-2.0 | 2,502,139,104 B (2.50 GB) |
| the same name, another public upload | thibaud `OpenPoseXL2.safetensors` | its own | 5,004,167,829 B |
| `4x-AnimeSharp.pth` | [Kim2091/AnimeSharp](https://huggingface.co/Kim2091/AnimeSharp) | CC BY-NC-SA 4.0 | 67,010,245 B (0.07 GB) |
| `layerdifforg/seethroughv0.0.2_layerdiff3d` | [Hugging Face](https://huggingface.co/layerdifforg/seethroughv0.0.2_layerdiff3d) | See-through's | 10.16 GB (sum of repo files) |
| `layerdifforg/seethroughv0.0.1_marigold` | Hugging Face | See-through's | 3.28 GB (sum of repo files) |

Two different public ControlNets share the file name rig-parts expects. Which upload the
project's own GPU box holds is not recorded, so the README's choice of the xinsir upload is
not measured yet. The upscaler's licence is non-commercial; it is used only to enlarge the
painting.

## The inputs, field by field

| Input | What it is | Where it comes from | What reads it |
| --- | --- | --- | --- |
| **The painting** | One PNG of one character: front-facing, full body, taller than wide, on a plain background, arms held away from the body | any image generator; Routes A and B give a recipe | `rig-parts inputs`, `assemble`, `build` |
| **See-through layers, full figure** | The painting split into up to about 23 layers (hair, face, eyes, clothing…), run on the painting padded white to a square | See-through, by any route; `rig-parts inputs` makes the square image to feed it | `rig-parts layers`, `propose --head-box`, `assemble`, `build` (`--full`) |
| **See-through layers, head crop** | The same, run a second time on a square crop around the head, because the eyes of the full run are too small to separate | `rig-parts inputs` cuts the crop once you know the head box | `rig-parts assemble`, `build` (`--head`) |
| **Keypoints** | Where the 18 body joints are on the painting, in painting pixels, as a `spine-parts-keypoints/1` file | `scripts/keypoints.py` on the CPU, or placed by hand ([KEYPOINTS.md](KEYPOINTS.md)) | `rig-parts propose --keypoints`. Needed for arm and leg chains |
| **The config** | `config.json`: what the tools read about this character. A few lines at first, then the plan of parts, then bones, meshes and the idle motion that `propose` drafts | you start it; the tools write each later part for you to copy in | every `rig-parts` command |

The two See-through runs reach `rig-parts` in either form See-through comes in: the ComfyUI
wrapper's (a folder holding `layers.json` and one PNG per layer) or a layered `.psd`. What
each field of the config means is in the parts guide,
[AUTHORING.md](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md). What makes a
painting riggable is being written up in rig-c/parts
[#350](https://github.com/rig-c/parts/issues/350); until it lands, the first row above and
the parts README's [*What it takes in*](https://github.com/rig-c/parts#what-it-takes-in)
are the requirements.

The example inputs are task 01 of [rig-c/exam](https://github.com/rig-c/exam) at commit
`01436ee3f02c189fe1a1e9656fe62068889837f5`.

## Use what you made

The README's three exits, line by line: where each claim comes from, and the one run.
Esoteric Software's pages were read on 2026-10-13; the rig-c files at the versions in
*Tested with*, except where a version is named.

### On a web page

- **What the player loads**: `skeleton.model.json`, "written next to the Spine pair and
  the atlas pages", stating "the skeleton, the animations, and where every region sits on
  its page — so the `.atlas` and `skeleton.json` beside it are not fetched"; poses are
  computed by "`rig-c/core`, rigc's own posing core, which is bundled into this package"
  (stated by the [play README](https://github.com/rig-c/play#install), *Install*).
- **The minimal page**: the play README's own
  [*A minimal page*](https://github.com/rig-c/play#a-minimal-page) — a CDN import of
  `@rig-c/play@1`, `loadModel`, `RigPlayer`, a fit to the container and a frame loop; its
  tests run that block as written (stated by the play README).
- **`wave-build/`**: 1.6 MB, `skeleton.model.json`, `skeleton.json`, `skeleton.atlas` and
  22 part PNGs — one page per part — carrying `idle` and `wave` (measured, run 2;
  `rig-pose retarget --build` wrote it).
- **Licence**: MIT (the play `package.json` and README badge). "At 1.0 it stopped being a
  Spine runtime … links nothing from Esoteric Software; a Spine export is refused by name",
  and "`@rig-c/play` is a third-party renderer and is not affiliated with or endorsed by
  Esoteric Software" (stated by the play README). The chain in rig-c's
  [NOTICE.md](https://github.com/rig-c/core/blob/main/NOTICE.md): "rigc also writes the
  model document its own core poses, and a product may play that or anything else; what the
  terms turn on is the integration" (fact 2), and "whether its output is then played by one,
  by rigc's own core, or by something else is the consumer's choice".

### In the Spine editor

- **The files**: `out/check/build/skeleton.json`, `skeleton.atlas`, `skeleton.png` — the
  parts README's artifact row, "Spine 4.3 skeleton data and one packed page". The build's
  `skeleton.images` is `../../rig/images/`, which resolves to `out/rig/images/`, 22 PNGs
  (read in the smoke run's files).
- **How the editor finds the parts**: "The editor's JSON import reads `skeleton.images` and
  finds each attachment's file by name under it; it never reads an atlas" — rig-c's
  [`tools/editor_roundtrip.ts`](https://github.com/rig-c/core/blob/main/tools/editor_roundtrip.ts),
  which cites its own measurement (its issue #562). Esoteric's walkthrough for a skeleton
  that shows `MISSING`: "Select the `Images` node in the `Tree` view and enter the path to
  the … images folder in `Path`" (stated by
  [Importing skeleton data](https://esotericsoftware.com/blog/Importing-skeleton-data)).
- **The menu path**: "To open the import data dialog, choose `Import Data` from the main
  menu." Fields: the path to "the JSON or binary file to import", a name for the skeleton,
  `New project`, `Scale` (stated by [Import](https://esotericsoftware.com/spine-import),
  *Data*). Where the main menu sits on screen is not said in the text we read; the page
  shows it as a screenshot.
- **Same version only**: exported data "can be imported back into the Spine editor, but
  only into the same version that exported the data" (stated by
  [Versioning](https://esotericsoftware.com/spine-versioning)). rig-c emits 4.3:
  "rigc emits and reads 4.3" and "the editor, run with the data's own generation, is the
  migration path" (stated by
  [GENERATIONS.md](https://github.com/rig-c/core/blob/main/docs/GENERATIONS.md)).
- **The command line the run used**: `Spine -i <skeleton.json> -o <project.spine>
  -r <name>` imports, `-i <project.spine> -o <dir> -e json` exports (stated by Esoteric's
  [command-line interface](https://esotericsoftware.com/spine-command-line-interface);
  the same calls `editor_roundtrip.ts` makes).
- **Licence**: the editor is Esoteric's product under its own
  [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license); its
  [purchase page](https://esotericsoftware.com/spine-purchase) puts saving projects and
  exporting behind a purchased licence, and rig-c's README says the same of the trial:
  "the trial cannot save projects or export animation data" (*The editor round trip*).
  rig-c's own code is MIT and "says nothing about Spine" (rig-c README, *Licensing, stated
  plainly*).

#### The import, run on this build — refused

Measured 2026-10-13 on the Mac in *Tested with*, with Spine 4.3.26 Professional (launcher
4.3.08) at `/Applications/Spine.app`, from the command line only; the editor's window was
never opened. The input was a copy of run 2's `out/` (`skeleton.json` sha256
`7db7e47e…1a9b4`, identical to the smoke run's). Two instruments: rig-c's
`tools/editor_roundtrip.ts` from a checkout at rig-c 2.49.0 (which runs the editor's
import and export, then rigc's `validate`, `diff`, `render` and `check` on what comes
back), and the editor's own command line directly.

**Result: the editor refuses the import.** Exit code 1, 24.8 s, and these lines of its own
(stack lines cut):

```
Project import: skeleton.json into build
ERROR: Unable to import skeleton.
[error] Error reading skeleton: build
Cause: [error] Error reading attachment: hair_back (MOw)
Cause: [aioob] Index -2 out of bounds for length 16
```

The same lines came back for `wave-build/skeleton.json` (imported directly with
`Spine -i … -r wave`), and for the same rig spec rebuilt with rig-c 2.49.0 as a plain
`build --copy-images`. rigc's gate is green on the file (`validate --profile spine` from the
checkout, 14 of 14 measured rules pass, `A00_ROUNDTRIP_PARSE` — the parse by spine-core
4.3.13 — among them), and rig-c's own core played it in step 10 — so this is something the
editor's importer refuses that the runtime's parser and the gate accept.

What it is, by editing one copy of `skeleton.json` at a time and importing again (each
import about 25 s; the nine weighted meshes are `bottomwear`, `hairpin`, `hair_back`,
`hair_front`, `handwear_l`, `handwear_r`, `legwear`, `neck`, `topwear`):

| Edit to the file | Import |
| --- | --- |
| none | refused at `hair_back` |
| `hair_back` removed from the skin | refused at the next mesh, `handwear_l` — every weighted mesh has it |
| `edges` dropped from every mesh | refused at `hair_back` |
| `hair_back` replaced by a 4-vertex mesh, one bone per vertex | passes `hair_back`, refused at `handwear_l` |
| `hair_back` kept, every vertex cut to its heaviest bone | passes `hair_back`, refused at `handwear_l` |
| `hair_back` kept, made unweighted | passes `hair_back`, refused at `handwear_l` |
| `hair_back` kept, `hull` set to 4 and `edges` dropped | refused at `hair_back` |
| `hair_back` kept, each vertex's bones **sorted by bone index** | passes `hair_back`, refused at `handwear_l` |
| **every mesh, each vertex's bones sorted by bone index** (435 of 557 vertices reordered) | **imported** |

So the editor refuses a weighted vertex whose bones are not listed in ascending bone-index
order. The guide's rig lists them heaviest first: `rig.json` from `rig-parts` spells
`hair_back` vertex 11 as `bun` (0.514) then `head` (0.486) where vertex 0 is `head` then
`bun`, and `rigc build` emits the spec's order. Esoteric's
[JSON format](https://esotericsoftware.com/spine-json-format) page gives the per-bone
fields and says nothing about their order; `spine-core` parses either order
(`A00_ROUNDTRIP_PARSE` above) and `A20_MESH_WEIGHTS_COHERENT` passes on both. The
`16` in the message is not a count of anything in the file we could find (no array or
object of 16 in it).

**With that one reordering, the whole round trip is green** (`editor_roundtrip.ts`,
47.1 s): import exit 0; export exit 0, declaring `skeleton.spine` 4.3.26; `validate
--profile spine` green on the export; `diff` moved only `animations.curve_kinds`, 300 of
312 keys — the editor re-spelled the curves — and nothing else; `check` of the export's
41 idle frames against the build's own: mean MAE 0.0097, worst drift 6.374 px on `mouth`
at frame 11; the editor rewrote `skeleton.spine` 4.3.13 → 4.3.26 and `skeleton.images` to
its own relative path. The round trip's logs, the edited copies and the editor's full
output are in the scratch directory of this run, outside the repository. Nothing in
`scripts/` applies the reordering: the guide says the exit is refused, and which package
changes is the packages' decision.

### In a game engine

- **What a runtime loads**: `Atlas("myAtlas.atlas", textureLoader)` "also loads the image
  files for each atlas page", then `SkeletonJson` with an `AtlasAttachmentLoader` and
  `readSkeletonData("mySkeleton.json")` (stated by
  [Loading skeleton data](https://esotericsoftware.com/spine-loading-skeleton-data)).
  rig-c: "a `skeleton.json` and a `skeleton.atlas` that load in any Spine runtime" (stated by
  the [rig-c README](https://github.com/rig-c/core#readme)). Not measured: no engine was run
  for this guide.
- **The runtimes**: Esoteric's [runtimes page](https://esotericsoftware.com/spine-runtimes)
  lists its official ones — Unity, Unreal Engine, Godot, iOS, Android, Flutter, Phaser,
  PixiJS, libGDX, HaxeFlixel, Starling, MonoGame, SDL, SFML, GLFW/OpenGL, Web Canvas, WebGL,
  Web Player, Web Components, CanvasKit, Three.js — and generic C, C++, C#, Haxe and
  TypeScript runtimes. Cocos, Defold and GameMaker are listed there as third-party.
- **The version match**: the editor version "must always match the Spine Runtimes version.
  If not, the Spine Runtimes will not be able to read the data" (stated by
  [Versioning](https://esotericsoftware.com/spine-versioning)). rig-c's
  [GENERATIONS.md](https://github.com/rig-c/core/blob/main/docs/GENERATIONS.md) measured the
  other direction — older data on the 4.3 runtime opens without an error and loses its
  constraints or poses as NaN — and its rule is "play on that generation's official
  runtime".
- **Licence**: the two routes are quoted in the README exactly as rig-c's
  [NOTICE.md](https://github.com/rig-c/core/blob/main/NOTICE.md) fact 3 restates them. The
  licence's own sentences, read on Esoteric's
  [page](https://esotericsoftware.com/spine-runtimes-license): "Integration of the Spine
  Runtimes into software or otherwise creating derivative works of the Spine Runtimes is
  permitted" "under the terms and conditions of Section 2 of the Spine Editor License
  Agreement", and otherwise "provided that each user of the Products must obtain their own
  Spine Editor license".
- **Adapters**: [github.com/rig-c/adapters](https://github.com/rig-c/adapters) exists,
  described as "Game-engine adapters for rig-c: play a rig-c model inside PixiJS, Phaser,
  Three.js", MIT, one commit, and its README marks it planned with no work started
  (read 2026-10-13).

## Not measured yet, and what measuring it needs

| Claim | What it needs |
| --- | --- |
| Route A end to end: ComfyUI install time and disk, PyTorch size, model download times, `comfy paint` and `comfy seethrough` times and peak VRAM, on a named NVIDIA GPU | a run from a clean ComfyUI install on a named card |
| Which ControlNet upload to recommend | reading which upload the project's box holds (sha256 against xinsir's and thibaud's) |
| Whether the Civitai checkpoint download asks for a login | one download attempt, signed out |
| Route B, all of it | an Apple Silicon Mac, ~23 GB of models, and the two code-read risks checked (`--offload` → `'cuda'`; `bitsandbytes` on macOS) |
| Route C: the Space run, its real quota, the PSD it returns going through *Try it first*; ModelScope | a Hugging Face account and two runs (likely two days at the stated 1–2/day), then the steps with `--full x.psd --head y.psd` |
| The joint model download time by itself | a separate download-only timer; the 2026-10-25 cold detector stage above includes both model downloads and inference |
| *Try it first* on Windows; the page in Safari and Firefox | runs on those systems and browsers (Linux/Chromium was run on 2026-10-25 above) |
| `git clone https://github.com/rig-c/getting-started` as written | the guide published (the smoke copied the checkout instead) |
| ComfyUI Desktop on macOS (address, custom nodes folder) | reading its docs further and one install |
| The Spine editor import of the guide's build, as written | the packages writing each weighted vertex's bones in ascending bone-index order (the one edit that imported), then the round trip again on a fresh build |
| The editor's import through its window (`Import Data`), the `MISSING` images step | a licensed editor opened by a person; only the command line was run |
| `out/check/build/` or `wave-build/` loading in a game engine's Spine 4.3 runtime | one engine, one load, one frame compared against `rigc render` |
| The seams of step 10's hello over the idle (`&under=idle`, two tracks) | a reading of the two tracks mixed, frame by frame, as the player poses them |
| The player's physics against `rigc render`'s, and the hello over the idle with physics on | frames read from the player in a browser and compared with the render's, both tracks on |

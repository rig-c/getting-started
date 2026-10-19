# Reference: what was measured, where each requirement comes from

This is the evidence behind the [README](../README.md). The README keeps one short line per
claim; this page keeps the figure, the machine it was measured on, or the sentence it was
quoted from. Three words recur:

- **measured**: run by us, on the machine and versions below;
- **stated by \<project\>**: copied from that project's own documentation, with a link;
- **not measured yet**: nobody has run it for this guide. It is not guessed.

## Tested with

Recorded 2026-10-13; *Try it first* re-run 2026-10-20. Everything marked *measured* on this
page was run on this machine with these versions.

| | |
| --- | --- |
| Machine | Apple M4, 32 GB memory |
| macOS | 26.6.1 |
| Bun | 1.4.2 |
| uv | 0.12.17, with the Python 3.12.14 it chose |
| Browser | Chromium 152 (the built-in browser of the Claude desktop app), meshes drawn through WebGL (2026-10-13) |
| `@rig-c/parts` | 1.41.1 (2026-10-20; 1.16.0 on 2026-10-13) |
| `rig-c` | 2.61.1 (2026-10-20; 2.48.0 on 2026-10-13) |
| `@rig-c/pose` | 0.35.0 (2026-10-20; 0.1.1 on 2026-10-13) |
| `@rig-c/play` | 1.12.0 (2026-10-20; 1.9.1 on 2026-10-13) |
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

| README step | Commands | Run 1 (2026-10-13) | Run 2 (smoke, 2026-10-13) | Run 3 (clean, 2026-10-20) |
| --- | --- | --- | --- | --- |
| 1 install | `bun add` the four packages | 2.05 s (empty cache) | 3.1 s incl. mkdir and copy | 1.9 s incl. `git clone` |
| 2 example inputs | curl the exam tarball at `01436ee`, extract task 01 inputs | 4.0 s | 4.6 s | 3.6 s |
| 3 config | `rig-parts inputs` | 3.2 s | 4.2 s | 1.5 s |
| 4 head box | `layers`, `propose --head-box`, `take.ts`, `inputs` | 1.5 + 2.0 + 3.5 s | 8.0 s | 2.0 s |
| 5 assemble | `assemble --propose-plan`, `take.ts`, `assemble` | 19.3 + 35.2 s | 67.3 s | 28.3 s |
| 6 joints | `uv run … keypoints.py` | 3.6 s (models already downloaded) | 3.9 s (models already downloaded) | 42.5 s (models and packages downloaded) |
| 7 draft bones | `propose --keypoints`, `take.ts` | 6.9 s | 8.8 s | 6.3 s |
| 8 build | `rig-parts build --loop` | 71.6 s | 67.2 s | 71.9 s |
| — look | `rigc inspect`, `rigc render` (under *Where to go next*) | 1.9 + 2.3 s | 2.8 s | not run |
| 9 wave | `wave.ts`, `clean`, map heredoc, `rig-pose retarget --build` | 0.09 + 6.0 s | 5.7 s | 5.2 s |
| 10 play | `serve.ts` | played in Chromium 152; meshes on WebGL | played; 37 requests, last at 242 ms | page and model HTTP 200 |

Run 2 total: **176 s**. Run 3 total: **166 s** wall clock, first-time downloads included. The
download in step 2 is 41 MB.

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
  pixels of the set in [KEYPOINTS.md](KEYPOINTS.md) (neck 52, l_hip 49, l_ankle 44,
  r_shoulder 40; elbows, wrists, knees 4–21).
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
set it gave a chain per leg on that same layer (42 bones). Which one you get depends on
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
| The joint model download time | an empty `~/.cache/rtmlib` (about 307 MB to download) |
| *Try it first* on Windows and Linux; the page in Safari and Firefox | runs on those systems and browsers |
| `git clone https://github.com/rig-c/getting-started` as written | the guide published (the smoke copied the checkout instead) |
| ComfyUI Desktop on macOS (address, custom nodes folder) | reading its docs further and one install |
| The Spine editor import of the guide's build, as written | the packages writing each weighted vertex's bones in ascending bone-index order (the one edit that imported), then the round trip again on a fresh build |
| The editor's import through its window (`Import Data`), the `MISSING` images step | a licensed editor opened by a person; only the command line was run |
| `out/check/build/` or `wave-build/` loading in a game engine's Spine 4.3 runtime | one engine, one load, one frame compared against `rigc render` |

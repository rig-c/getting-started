# Getting started with rig-c

You start with one painting of a character. You end with that character rigged — split
into movable pieces on a skeleton — breathing, blinking and waving in your browser.

<!-- demo gif -->

## The whole thing in one glance

1. **Paint one character.** An image model does this. It wants a GPU, but any image
   generator you already use will do.
2. **Split it into layers, and mark the joints.** [See-through](https://github.com/shitagaki-lab/see-through)
   is a model that cuts a painting into layers (hair, face, eyes, clothes…) the way a PSD is
   layered. It wants a GPU too, or you use its free web demo. The joints — shoulders,
   elbows, knees and so on — come from a small script on the CPU, or your own hand.
3. **Run the four rig-c packages.** They turn the layers into a rig, give it a motion, and
   play it in a browser. **No GPU, ever.**

Only steps 1 and 2 want a GPU, and both have a no-GPU way. The four packages make neither
the painting nor the layers, and ship no model weights.

Everything in *Try it first* was run as written on an Apple Silicon Mac. The versions, the
date and the timings are in [docs/REFERENCE.md](docs/REFERENCE.md) — if an output of yours
differs in a detail, look there first.

**Contents:** [Try it first](#try-it-first--no-gpu-about-3-minutes) ·
[Use what you made](#use-what-you-made) ·
[Make your own character](#make-your-own-character) ·
[Troubleshooting](#troubleshooting) · [Where to go next](#where-to-go-next) ·
[Credits and licences](#credits-and-licences)

## Try it first — no GPU, about 3 minutes

This builds a published example character and plays it. Its painting and layers are
already made, so you skip the GPU steps entirely.

**You'll need:** [Bun](https://bun.sh) 1.2 or later (`bun --version` prints it), and
[uv](https://docs.astral.sh/uv/) for the one Python script in step 6 — or skip the script;
step 6 says how. About 3 minutes of commands, plus the first-time downloads, under 1 GB in
all. The commands are for a macOS or Linux terminal; Windows isn't tested yet.

### 1. Install the packages

```sh
mkdir rig-c-start
cd rig-c-start
git clone https://github.com/rig-c/getting-started
mkdir my-rig
cd my-rig
bun add @rig-c/parts rig-c @rig-c/pose @rig-c/play
```

Every command from here on runs in `my-rig`. `bunx rigc --version` prints the version and
then `@esotericsoftware/spine-core absent`. That line is expected: the installed `rigc`
checks every build with its own validator.

### 2. Get the example inputs

```sh
curl -L -o exam.tar.gz https://codeload.github.com/rig-c/exam/tar.gz/01436ee3f02c189fe1a1e9656fe62068889837f5
tar -xzf exam.tar.gz --strip-components=3 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/tasks/01-build/inputs
tar -xzf exam.tar.gz --strip-components=1 exam-01436ee3f02c189fe1a1e9656fe62068889837f5/LICENSE exam-01436ee3f02c189fe1a1e9656fe62068889837f5/NOTICE.md
rm exam.tar.gz
```

You should now have `inputs/` with `painting.png`, `layers/full/`, `layers/head/`,
`seethrough.json` and `generation.json`. The example is from
[rig-c/exam](https://github.com/rig-c/exam); its licence is under [Credits](#credits-and-licences).

### 3. Start the config

```sh
cat > config.json <<'EOF'
{
  "key": "exam-01",
  "seethrough": { "resolution": 1024, "steps": 30, "seed": 42, "offload": true },
  "assemble": { "rig_scale": 0.5 }
}
EOF
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
```

`config.json` is the one file the tools read about this character; it starts small and
fills in as you go. `rig_scale` 0.5 makes the rig half the painting's size.

You should see `st_input_full.png 2432x2432` and a note that there is no head box yet. With
your own painting, that square is what you feed See-through; here the layers are already in
`inputs/layers/full`.

### 4. Find the head box

The eyes are too small in the full-figure layers, so See-through runs a second time on a
crop around the head. This finds the crop.

```sh
bunx rig-parts layers inputs/layers/full
bunx rig-parts propose --head-box --full inputs/layers/full --canvas 1664x2432 | tail -n 1 > work/head_box.json
bun ../getting-started/scripts/take.ts work/head_box.json config.json seethrough.head_box=head_box
bunx rig-parts inputs --source inputs/painting.png --config config.json --out work
```

`--canvas` is the painting's width x height. [`scripts/take.ts`](scripts/take.ts) copies
fields the tools wrote into `config.json`, so you never move JSON by hand.

You should see `29 layer(s): 29 with opaque pixels` and `0 WARN line(s)`,
`work/head_box.json` reading `{"head_box":[616,32,1132,548]}`, then `st_input_head.png 516x516`
— the image for the head run, which here is already in `inputs/layers/head`.

### 5. Assemble the parts

```sh
bunx rig-parts assemble --propose-plan --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json > work/plan.json
bun ../getting-started/scripts/take.ts work/plan.json config.json assemble.plan=plan assemble.extend_below_crop=extend_below_crop
bunx rig-parts assemble --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --config config.json --out work
```

The plan says which layer becomes which part, and its `notes` say why any were left out.
About a minute.

You should see 22 parts, then `recomposite vs source: mean |d|=1.13, within 8: 97.8%`.
Open `work/render/recomposite_error_rig.png`: red is painting that no part holds. A few
small specks are normal; a large red area means a part is missing.

### 6. Find the joints

```sh
uv run --with rtmlib --with onnxruntime python ../getting-started/scripts/keypoints.py inputs/painting.png --out keypoints.json
```

The first run downloads two pose models (about 300 MB) and some Python packages. You
should see `18 observed, 0 occluded, 0 missing -> keypoints.json`.

No Python? [docs/KEYPOINTS.md](docs/KEYPOINTS.md) has a hand-placed set for this very
painting; save it as `keypoints.json`. You get 42 bones instead of 40, and it builds green
all the same.

### 7. Draft the bones

```sh
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/proposal.json config.json bones meshes regions motion limbs
```

`propose` drafts the bones, the meshes and an idle motion; `take.ts` copies them into the
config. This is where a person corrects the draft. The example uses it as is.

You should see a note per joint, then a coverage line ending `40 bone(s) — 29 checked and
clean, 2 checked with a LINT line, 9 not checked`. The two `LINT` lines say the leg chain's
top sits under the skirt; a `LINT` is something to look at, not a refusal. Open
`work/render/landmarks.png` to see the bones over the painting.

### 8. Build the rig

```sh
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

About a minute. You should see `[check] check: PASS; 10 of 10 bar(s) measured`, then
`build: PASS`. Open `out/idle.gif`: the character breathes and blinks in a 3.3-second loop.
If any line says `FAIL`, nothing was written, and that line says what to change.

### 9. Give it a wave

[`@rig-c/pose`](https://github.com/rig-c/pose) moves a rig from joint positions over time —
from a video, a dataset, or, here, [`scripts/wave.ts`](scripts/wave.ts), which makes a
3-second wave from your keypoints. The map says which bones carry which joints, by the
names `propose` gave this rig.

```sh
bun ../getting-started/scripts/wave.ts keypoints.json wave.pose.json
bunx rig-pose clean --pose wave.pose.json --out wave.pose.clean.json
cat > map.json <<'EOF'
{
  "spec": "rig-pose-map/1",
  "chains": [
    { "name": "trunk", "bones": ["chest"], "joints": ["mid_hip", "neck"], "aim": ["neck"] },
    { "name": "arm_r", "bones": ["sleeve_r0", "sleeve_r1"], "joints": ["r_shoulder", "r_elbow", "r_wrist"], "bend": "free" },
    { "name": "arm_l", "bones": ["sleeve_l0", "sleeve_l1"], "joints": ["l_shoulder", "l_elbow", "l_wrist"], "bend": "free" }
  ],
  "translate": { "bone": "hip", "joint": "mid_hip", "scale": { "pose": ["mid_hip", "neck"], "rig": ["hip", "neck"] } }
}
EOF
bunx rig-pose retarget --rig out/rig --map map.json --pose wave.pose.clean.json --out wave.motion.json --name wave --profile spine-html --build wave-build
```

You should see `73 frame(s), 3 s at 24 fps`, `GATE … green`, and
`wrote wave.motion.json — animations: idle, wave`. A `FOLD` line is a reading, not a
failure: with the forearm bent up sharply the sleeve pinches at the elbow and the hand is
drawn squashed for those frames. `wave-build/` holds the rig with the new animation.

### 10. Play it in your browser

```sh
bun ../getting-started/scripts/serve.ts
```

Open <http://localhost:3000/?model=wave-build/skeleton.model.json&anim=wave>.

You should see the character raise her right arm and wave, over and over; the menu switches
to `idle`. Ctrl+C stops the server. That's the whole chain. The page is
[`scripts/play.html`](scripts/play.html), about sixty lines around `@rig-c/play`;
[`scripts/serve.ts`](scripts/serve.ts) serves it on your own machine only.

## Use what you made

Four places the rig can go from here. Each reads files the steps above already wrote;
the original three are measured in [docs/REFERENCE.md](docs/REFERENCE.md#use-what-you-made).

### On a web page, with `@rig-c/play`

For your own site, with no Spine runtime. The page from step 10 is already this: it loads
`skeleton.model.json`, the document a build writes next to the Spine files, and the part
images beside it. Copy `wave-build/` (that document plus 22 part PNGs, 1.6 MB; it holds
both `idle` and `wave`) next to a page, and start from the play README's
[minimal page](https://github.com/rig-c/play#a-minimal-page): about twenty lines that load
the player from a CDN, fit the rig to a box and play it. Point its `modelUrl` at
`wave-build/skeleton.model.json`. [`scripts/play.html`](scripts/play.html) is the same with
an animation menu.

Licence: `@rig-c/play` is MIT. It links nothing from Esoteric Software and poses the rig with
rig-c's own core, so no Spine licence is involved: the Spine terms turn on integrating a
Spine Runtime, and this path integrates none.

### Inside a game engine or renderer you already use

Keep your game in PixiJS, Phaser or Three.js, and load the same `wave-build/` with
[rig-c's adapters](https://github.com/rig-c/adapters). No Spine runtime. The packages
are MIT, currently 0.x; their APIs may change.

For PixiJS 8, install this in `my-rig`:

```sh
npm install @rig-c/pixi pixi.js @rig-c/play
```

Put this in your app's JavaScript entry point, serve `wave-build/` beside the page,
and you have the wave from step 10 inside a Pixi canvas:

```js
import { Application } from 'pixi.js';
import { loadModel } from '@rig-c/play';
import { PixiRig } from '@rig-c/pixi';

const app = new Application();
await app.init({ width: 800, height: 600, backgroundAlpha: 0 });
document.body.appendChild(app.canvas);
const assets = await loadModel({ modelUrl: '/wave-build/skeleton.model.json' });
const rig = new PixiRig(assets, { ticker: app.ticker });
rig.play('wave');
const box = rig.bounds();
const scale = Math.min(760 / box.width, 560 / box.height);
rig.scale.set(scale);
rig.position.set(400 - (box.x + box.width / 2) * scale,
                 300 + (box.y + box.height / 2) * scale);
app.stage.addChild(rig);
// On removal: rig.destroy(); assets.dispose(); app.destroy();
```

The fit places the rig's upward-growing coordinates inside Pixi's canvas. For the other
hosts, start from the [Phaser 4.2+ example](https://github.com/rig-c/adapters/tree/main/packages/phaser#minimal-usage)
or the [Three.js example](https://github.com/rig-c/adapters/tree/main/packages/three#minimal-usage).
Keep the model document and its image pages together. The
[example check](scripts/check-adapters.ts) installs the published packages and runs this
exact snippet on the guide's build in a headless browser.

### In the Spine editor, to refine by hand

For a person to edit what the tools drafted. The build wrote Spine 4.3 skeleton data:
`out/check/build/skeleton.json` and `skeleton.atlas`, with the one packed page
`skeleton.png`. The editor's import finds the parts as loose images, at the path
`skeleton.json` names: `out/rig/images/`. In a Spine 4.3 editor, choose `Import Data` from
the main menu, enter the path to `out/check/build/skeleton.json` and a name, and press
`Import` ([Esoteric's Import page](https://esotericsoftware.com/spine-import)). Import the build folder where it was written. If you moved or renamed it, or the parts
show as `MISSING`, select `Images` in the tree and set its `Path` to `out/rig/images`
([Esoteric's walkthrough](https://esotericsoftware.com/blog/Importing-skeleton-data)). Spine
data imports only into the editor version that wrote it, so 4.3 data wants a 4.3 editor.

This import needs **rig-c 2.51.1 or later**. Earlier versions wrote the bones inside some mesh
vertices in an order the editor's importer refuses (`Index -2 out of bounds`), though every runtime
read them; [rig-c/core#1407](https://github.com/rig-c/core/issues/1407) fixed it, measured by an
editor round trip of this very example.

Licence: the editor needs its own licence, Esoteric's
[Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license); the
free trial can't save a project or export ([purchase page](https://esotericsoftware.com/spine-purchase)).

### In a game engine, through an official Spine runtime

For a game. `out/check/build/` is a Spine export as a runtime sees it: `skeleton.json`,
`skeleton.atlas`, `skeleton.png`; `wave-build/` is the same with `wave` added, one page per
part. Load them the way Esoteric's
[Loading skeleton data](https://esotericsoftware.com/spine-loading-skeleton-data) page shows,
the atlas first and then the JSON, in the [official runtime](https://esotericsoftware.com/spine-runtimes)
for your engine (Unity, Unreal, Godot, Phaser, PixiJS and others). Use a **4.3** runtime:
Spine data is locked to the generation that wrote it, and Esoteric says a runtime of another
version will not be able to read it.

Licence: the Spine Runtimes License, as rig-c's [NOTICE](https://github.com/rig-c/core/blob/main/NOTICE.md)
restates it. Integrating a Spine Runtime into a product is permitted *under Section 2 of
the Spine Editor License Agreement*, or otherwise *on the condition that each user of the
product obtains their own Spine Editor license* and the product carries the Runtimes licence
and copyright notice. The licence itself is at
[esotericsoftware.com/spine-runtimes-license](https://esotericsoftware.com/spine-runtimes-license).

## Make your own character

The tools need four things from you:

- **a painting**: one PNG of one character — front-facing, full body, taller than wide, on a
  plain background, arms held away from the body;
- **See-through layers**, twice: the whole figure, and a crop around the head;
- **the joints**: where the 18 body joints are, in painting pixels;
- **a `config.json`**, started with a few lines and filled in by the tools, as above.

Pick a route for the painting and the layers. The joints are the same on every route and
come [after](#the-joints).

| | Route A: NVIDIA GPU | Route B: Apple Silicon Mac | Route C: no GPU |
| --- | --- | --- | --- |
| **You'll need** | a card with 12–16 GB of memory, ~23 GB of disk, Python | an M1–M4 Mac, ~23 GB of disk, Python | a browser and a free Hugging Face account |
| **Per character** | seconds for the painting, a few minutes per See-through run | we don't know yet | two web runs, 2–3 minutes each, at 1–2 runs a day |
| **Tried by** | the project itself | nobody yet | written from See-through's own pages |

### Route A: your own NVIDIA GPU

**You'll need:** Windows or Linux; an NVIDIA card with 12–16 GB of memory (8 GB can work
with the low-memory options in [Troubleshooting](#troubleshooting)); about 23 GB of free
disk for the models, plus ComfyUI and PyTorch; Python 3.10 or later (ComfyUI likes 3.13);
git. Each requirement's exact wording and source is in
[docs/REFERENCE.md](docs/REFERENCE.md#requirements-and-their-sources).

You install ComfyUI, one set of custom nodes and four model files; then two `rig-parts`
commands drive ComfyUI for you. (Any other way of running See-through works too.) The
project's own runs this way took 18–20 seconds per painting and about 3 minutes per
See-through run, on a card that record doesn't name — an order of magnitude, not a promise.

**1. Install ComfyUI**, following its own [manual install](https://github.com/Comfy-Org/ComfyUI#manual-install-windows-linux):

```sh
git clone https://github.com/Comfy-Org/ComfyUI
cd ComfyUI
python -m venv venv
source venv/bin/activate          # on Windows: venv\Scripts\activate
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
pip install -r requirements.txt
python main.py
```

You should see an address at the end, `http://127.0.0.1:8188` by default; opening it shows
ComfyUI's node editor.

**2. Install the See-through nodes.** With ComfyUI stopped (Ctrl+C):

```sh
cd custom_nodes
git clone https://github.com/jtydhr88/ComfyUI-See-through.git
cd ComfyUI-See-through
pip install -r requirements.txt
cd ../..
python main.py
```

You should see a startup line beginning `[ComfyUI-See-through] Loaded 7 nodes`.

**3. Put the models in place.** `rig-parts` checks these names against your ComfyUI before
it sends anything, so a missing or misnamed file is refused by name. Sizes and licences are
in [docs/REFERENCE.md](docs/REFERENCE.md#the-model-files-exactly).

| File | Folder under `ComfyUI/` | Where to get it |
| --- | --- | --- |
| `novaAnimeXL_ilV80.safetensors` (or any SDXL checkpoint you name in the config) | `models/checkpoints/` | [Nova Anime XL "IL v8.0"](https://civitai.com/models/376130) by Crody, on Civitai |
| `controlnet-openpose-sdxl-1.0.safetensors` | `models/controlnet/` | an OpenPose ControlNet for SDXL, saved under this name — for example [xinsir's](https://huggingface.co/xinsir/controlnet-openpose-sdxl-1.0) `diffusion_pytorch_model.safetensors` |
| `4x-AnimeSharp.pth` | `models/upscale_models/` | [Kim2091/AnimeSharp](https://huggingface.co/Kim2091/AnimeSharp) (non-commercial licence; only enlarges the painting) |
| See-through's two models | none | the wrapper downloads them from [Hugging Face](https://huggingface.co/layerdifforg/seethroughv0.0.2_layerdiff3d) on its first run |

**4. Make the painting.** Do [step 1 of Try it first](#1-install-the-packages) and work in
that `my-rig` folder. Copy the example `config.json` and `pose_a.json` from
[docs/PAINTING-RECIPE.md](docs/PAINTING-RECIPE.md) — a checkpoint, a prompt in parts, and a
stick figure that holds the arms away from the body — then:

```sh
bunx rig-parts comfy paint --config config.json --out inputs --host http://127.0.0.1:8188
```

You should get `inputs/painting_74101.png` at 1664 x 2432, with the full prompts in a
`_meta.json` beside it. `--seeds 4` makes four to choose from. Rename the one you keep to
`inputs/painting.png`.

**5. Run See-through, twice.** Follow [Try it first](#try-it-first--no-gpu-about-3-minutes)
from step 3 with your painting, skipping step 2. In step 3, *add* the `seethrough` and
`assemble` fields to your existing `config.json` rather than replacing it, so the
`generation` block stays as the record of how the painting was made. Where steps 3 and 4
say the layers are already made, run these instead:

```sh
bunx rig-parts comfy seethrough --image work/st_input_full.png --out inputs/layers/full --host http://127.0.0.1:8188
bunx rig-parts comfy seethrough --image work/st_input_head.png --out inputs/layers/head --host http://127.0.0.1:8188
```

Each `--out` folder gets `layers.json`, `meta.json`, a `parts/` folder of PNGs and
`previews/`. The defaults are resolution 1024, 30 steps, seed 42.

### Route B: an Apple Silicon Mac

**You'll need:** an Apple Silicon Mac (M1 to M4) on macOS 14 or later; Python 3.10 or
later; the Xcode command-line tools; git; the same ~23 GB of models as Route A.

We haven't run this route ourselves yet — it follows ComfyUI's and Apple's own
instructions, so we can't tell you how long a run takes or how much memory it needs. If
See-through won't run on your Mac, use [Route C](#route-c-no-gpu-at-all) for the layers
and keep this route for the painting.

**1. Check your Python.** `python3 --version` must say 3.10 or later. The one that comes
with the Xcode tools can be older (3.9.6 on the Mac we checked); if yours is, install a
newer one from [python.org](https://www.python.org/downloads/macos/) and use its versioned
name, such as `python3.13`, in the `venv` line below.

**2. Install the Xcode tools and ComfyUI**, with the PyTorch build
[Apple's page](https://developer.apple.com/metal/pytorch/) points to:

```sh
xcode-select --install
git clone https://github.com/Comfy-Org/ComfyUI
cd ComfyUI
python3 -m venv venv
source venv/bin/activate
pip install --pre torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/nightly/cpu
python -c "import torch; print(torch.backends.mps.is_available())"
pip install -r requirements.txt
python main.py
```

The `python -c` line should print `True` — PyTorch can see the Mac's GPU — and ComfyUI
should name its address, `http://127.0.0.1:8188` by default.

**3. Then Route A's steps 2 to 5**: the nodes, the same models in the same folders,
`comfy paint`, `comfy seethrough` twice — **without** `--offload` or `--nf4`, which both
assume an NVIDIA card. (ComfyUI's [desktop app for macOS](https://docs.comfy.org/installation/desktop/macos)
exists too; this guide doesn't walk through it.)

### Route C: no GPU at all

**You'll need:** a web browser, a free Hugging Face account, and patience: the demo allows
about 1–2 runs a day, and a character needs two.

**The painting.** Any image generator will do, as long as the result is one character,
front-facing, full body, taller than wide, on a plain background, arms away from the body.
Save it as `inputs/painting.png` in the `my-rig` folder of
[step 1 of Try it first](#1-install-the-packages).

**The layers.** See-through's authors run two free web demos — a
[Hugging Face Space](https://huggingface.co/spaces/24yearsold/see-through-demo) (1–2 runs
a day once you register, 2–3 minutes each) and a
[ModelScope demo](https://modelscope.cn/studios/ljsabc/See-Through) for users in mainland
China. Each gives you a layered `.psd`, which `rig-parts` reads as it is.

1. Do steps 1 and 3 of [Try it first](#try-it-first--no-gpu-about-3-minutes) with your
   painting (skip step 2). Step 3 writes `work/st_input_full.png`, your painting centred on
   a white square. **Upload that square, not the painting** — the Space centre-crops
   anything that isn't square, which would cut off the head and the feet.
2. Download the PSD as `inputs/full.psd`. Read it with `bunx rig-parts layers inputs/full.psd`.
3. Continue to step 4 for the head box; upload `work/st_input_head.png` and save the result
   as `inputs/head.psd`.
4. Everywhere the steps write `inputs/layers/full` and `inputs/layers/head`, write
   `inputs/full.psd` and `inputs/head.psd`.

A PSD carries no per-layer depth, so one optional feature — turning the head along with the
figure — isn't available on this route; the rest works the same. We haven't run the PSD
path end to end ourselves yet.

### The joints

`rig-parts propose` places the arms and legs on the joints you give it. Without them it
guesses the torso from the clothes and draws no legs.

**On the CPU**: [`scripts/keypoints.py`](scripts/keypoints.py) finds the 18 joints with a
pose model (RTMPose), as in [step 6](#6-find-the-joints): about 300 MB of models the first
time, then a few seconds per painting. On the example painting its joints were within 4–52
pixels of a hand-placed set, and the rig built green on them unchanged.

**By hand**: read the 18 positions off the painting in an image editor and write them into
a small JSON file. The format, a diagram of where each joint goes, and a complete example
are in [docs/KEYPOINTS.md](docs/KEYPOINTS.md).

## Troubleshooting

**Try it first**

- *`bun: command not found`* — install Bun from [bun.sh](https://bun.sh) and open a new terminal.
- *`bunx rig-parts` downloads something or prints another version* — run it from `my-rig`,
  where step 1 installed the packages.
- *A command ends with `FAIL` lines* — nothing was written. Each line says what it found and
  what it needed, and ends with a `rig-parts guide …` command that prints the explanation.
- *`take.ts: … has no …; nothing written`* — the step before didn't finish. Run it again
  and read its last lines.
- *`propose` can't read `keypoints.json`* — its `width` and `height` must be the painting's
  size, and every position must lie inside the painting.
- *`rig-pose` refuses the map* — it names the bone or joint it can't find. A rig from a
  different painting can have different bone names; read them in `out/rig/rig.json`.
- *The page is blank* — open the browser's console; a wrong `?model=` path shows there as a
  failed request for `skeleton.model.json`. `serve.ts` must run in `my-rig`, the folder that
  holds `node_modules`.
- *Port 3000 is taken* — `bun ../getting-started/scripts/serve.ts --port 3001`, and use that
  port in the address.

**ComfyUI and See-through (Routes A and B)**

- *`Torch not compiled with CUDA enabled`* — `pip uninstall torch`, then run the CUDA install
  line again.
- *`rig-parts` says a node class, input or model is not on the box* — the custom nodes
  didn't load, or a model file is missing or misnamed. Restart ComfyUI, read its
  `[ComfyUI-See-through]` lines, and check the file names against the table in Route A.
- *Out of GPU memory during See-through* — the wrapper's README says, in order: a lower
  `resolution`, then group offload (`--offload` here, about 2–3x slower). `--nf4` turns on
  its 4-bit mode, which needs the `bitsandbytes` package.
- *The command waits and prints nothing new* — `rig-parts` waits for ComfyUI's queue to be
  empty before it sends a job, so it never cuts in front of someone else's. `--wait`
  (seconds, default 1800) bounds how long.
- *On a Mac, an error that names `cuda` with `--offload`* — the wrapper's offload is written
  for NVIDIA. Leave `--offload` off.
- *On a Mac, `--nf4` fails, or `pip install -r requirements.txt` fails on `bitsandbytes`* —
  the 4-bit mode needs that package, and we don't know whether it installs on macOS. If it's
  the only package that fails, leave `--nf4` off and carry on.
- *The `python -c` check prints `False`* — PyTorch can't see the Mac's GPU. Check the
  macOS, Python and Xcode requirements on [Apple's page](https://developer.apple.com/metal/pytorch/).

**The web demo (Route C)**

- *The Space says you're out of quota, or asks you to log in* — the daily limit. Sign in to
  Hugging Face, or come back tomorrow.
- *`rig-parts layers` refuses the PSD* — it names the reason (not 8-bit RGB, a hidden layer,
  a layer at less than full opacity, a layer with no pixels). Re-export without changing the
  layers, or edit in an image editor that keeps the layer names.

**The joint script**

- *`no person found`* — the detector didn't see a figure. Place the joints by hand.
- *`N people found`* — it kept the most confident one. Check that it's your character.
- *Many lines about `Removing initializer`* — warnings from the model file, not errors.

## Where to go next

- **Look at the skeleton.** `bunx rigc inspect --candidate out/check/build --show art,bones --hide-bone '*_ctl' --max 1200 --out out/inspect.png`
  draws the bones over the setup pose;
  `bunx rigc render --candidate out/check/build --animation idle --out out/render` writes
  the idle's 41 frames and a contact sheet.
- **One command for all of it.** The [trailer](https://github.com/rig-c/trailer) repository
  rebuilds the rig-c trailer, a seated character on a swing, with one script.
- **The packages' own guides**: [`@rig-c/parts` AUTHORING.md](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md)
  (every config field, what each refusal means, expressions and physics),
  [`rig-c`](https://github.com/rig-c/core#readme) (the compiler and its check),
  [`@rig-c/pose`](https://github.com/rig-c/pose#readme) (map and pose formats, keypoints from
  video), [`@rig-c/play`](https://github.com/rig-c/play#readme) (the player's API and cost).
- [docs/REFERENCE.md](docs/REFERENCE.md): tested-with versions, every measured time and
  size, each requirement's source, and what hasn't been measured yet.

## Credits and licences

This guide and its scripts are MIT ([LICENSE](LICENSE)).

The example inputs in *Try it first* belong to [rig-c/exam](https://github.com/rig-c/exam)
and are licensed CC BY-NC 4.0, not MIT: free to use with credit, not for commercial use.
Step 2 copies the exam's `LICENSE` and `NOTICE.md` beside them, and what you build from
them carries that licence. The exam's notice asks for this credit for the painting:

> *Painted with Nova Anime XL IL v8.0 by Crody (https://civitai.com/models/376130).*

`rig-c` writes skeleton data in the Spine 4.3 format; using it in a product requires a
Spine Editor licence, as the parts README's *Licence posture* says. See-through's code and
models are not part of any rig-c package; their terms are collected in the parts
[NOTICE.md](https://github.com/rig-c/parts/blob/main/NOTICE.md). The model files in Route A
each carry their own licence, linked from [docs/REFERENCE.md](docs/REFERENCE.md#the-model-files-exactly).

## Make your own character

The tools need four things from you:

- **a painting**: one PNG of one character — front-facing, full body, taller than wide, on a
  plain background, arms held away from the body;
- **See-through layers**, twice: the whole figure, and a crop around the head;
- **the joints**: where the 18 body joints are, in painting pixels;
- **a `config.json`**, started with a few lines and filled in by the tools, as above.

Pick a route for the painting and the layers. The joints are the same on every route and
come [after](#the-joints).

[Route requirements and measured comparison](../REFERENCE.md#route-comparison).

### Route A: your own NVIDIA GPU

**You'll need:** Windows or Linux; an NVIDIA card with 12–16 GB of memory (8 GB can work
with the low-memory options in [Troubleshooting](troubleshooting.md#troubleshooting)); about 23 GB of free
disk for the models, plus ComfyUI and PyTorch; Python 3.10 or later (ComfyUI likes 3.13);
git. Each requirement's exact wording and source is in
[docs/REFERENCE.md](../REFERENCE.md#requirements-and-their-sources).

You install ComfyUI, one set of custom nodes and four model files; then two `rig-parts`
commands drive ComfyUI for you. (Any other way of running See-through works too.) [Route A measurements and unmeasured steps](../REFERENCE.md#route-a-measured-2026-10-29).

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
in [docs/REFERENCE.md](../REFERENCE.md#the-model-files-exactly).

| File | Folder under `ComfyUI/` | Where to get it |
| --- | --- | --- |
| `novaAnimeXL_ilV80.safetensors` (or any SDXL checkpoint you name in the config) | `models/checkpoints/` | [Nova Anime XL "IL v8.0"](https://civitai.com/models/376130) by Crody, on Civitai |
| `controlnet-openpose-sdxl-1.0.safetensors` | `models/controlnet/` | an OpenPose ControlNet for SDXL, saved under this name — for example [xinsir's](https://huggingface.co/xinsir/controlnet-openpose-sdxl-1.0) `diffusion_pytorch_model.safetensors` |
| `4x-AnimeSharp.pth` | `models/upscale_models/` | [Kim2091/AnimeSharp](https://huggingface.co/Kim2091/AnimeSharp) (non-commercial licence; only enlarges the painting) |
| See-through's two models | none | the wrapper downloads them from [Hugging Face](https://huggingface.co/layerdifforg/seethroughv0.0.2_layerdiff3d) on its first run |

[Model sizes and provenance](../REFERENCE.md#the-model-files-exactly).

**4. Make the painting.** Do [step 1 of Try it first](../../README.md#1-install-the-packages) and work in
that `my-rig` folder. Copy the example `config.json` and `pose_a.json` from
[docs/PAINTING-RECIPE.md](../PAINTING-RECIPE.md) — a checkpoint, a prompt in parts, and a
stick figure that holds the arms away from the body — then:

```sh
bunx rig-parts comfy paint --config config.json --out inputs --host http://127.0.0.1:8188
```

You should see `box: every node, input and model of the painting graph is on its
/object_info`, then `seed 74101: GPU job started`, and after a wait a line ending
`-> inputs/painting_74101.png (1664x2432)`.
You get `inputs/painting_74101.png` at 1664 x 2432 — with this recipe, a full-figure
character on white with her arms held out from her sides — the full prompts in a
`_meta.json` beside it, and the stick figure the ControlNet was given as
`control_pose-….png`. `--seeds 4` makes four to choose from. Rename the one you keep to
`inputs/painting.png`.

**5. Run See-through, twice.** Follow [Try it first](../../README.md#try-it-first--no-gpu-about-3-minutes)
from step 3 with your painting, skipping step 2. In step 3, *add* the `seethrough` and
`assemble` fields to your existing `config.json` rather than replacing it, so the
`generation` block stays as the record of how the painting was made. Where steps 3 and 4
say the layers are already made, run these instead:

```sh
bunx rig-parts comfy seethrough --config config.json --image work/st_input_full.png --out inputs/layers/full --host http://127.0.0.1:8188
bunx rig-parts comfy seethrough --config config.json --image work/st_input_head.png --out inputs/layers/head --host http://127.0.0.1:8188
```

Each run prints `queue empty`, `GPU job started`, then `GPU job finished in … s` and a line
like `29 layer(s) on a 1024x1024 canvas, read back green by the layer reader`, naming the
layers. Each `--out` folder gets `layers.json`, `meta.json`, a `parts/`
folder of PNGs and `previews/`; `meta.json` records the run's own time and what the card's
free memory did. Both commands read `seethrough.resolution`, `steps`, `seed` and
`offload` from `config.json`: here 1024, 30, 42 and false. Explicit CLI flags override
those values. Keep `offload` false in the shared config; on NVIDIA only, add
`--offload` to a command if needed (see Troubleshooting).

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
assume an NVIDIA card. Keep `seethrough.offload` false in `config.json` too.
(ComfyUI's [desktop app for macOS](https://docs.comfy.org/installation/desktop/macos)
exists too; this guide doesn't walk through it.)

[Route B downloads, stated sizes and measurement limits](../REFERENCE.md#route-b-downloads).

### Route C: no GPU at all

**You'll need:** a web browser, a free Hugging Face account, and patience: the demo runs
on Hugging Face's shared GPUs, which give a free account 5 minutes of GPU a day (2 minutes
signed out), each run is budgeted at up to 2 minutes, and a character needs two runs. So
expect one character per day or two. (Read from the demo's and Hugging Face's own pages on
2026-10-29; we have not run it ourselves.)

**The painting.** Any image generator will do, as long as the result is one character,
front-facing, full body, taller than wide, on a plain background, arms away from the body.
Save it as `inputs/painting.png` in the `my-rig` folder of
[step 1 of Try it first](../../README.md#1-install-the-packages).

**The layers.** See-through's authors run two free web demos — a
[Hugging Face Space](https://huggingface.co/spaces/24yearsold/see-through-demo) and a
[ModelScope demo](https://modelscope.cn/studios/ljsabc/See-Through) for users in mainland
China. Each gives you a layered `.psd`, which `rig-parts` reads as it is.

The Space's page has an image box, a **Resolution** slider from 768 to 1280 (768 is what it
recommends for the free tier: higher "may timeout or exhaust your daily quota"), a
**Seed** slider, a **Split arms, eyes and ears** box, and a **Download layered PSD** link
that appears when a run is done.

1. Do steps 1 and 3 of [Try it first](../../README.md#try-it-first--no-gpu-about-3-minutes) with your
   painting (skip step 2). Step 3 writes `work/st_input_full.png`, your painting centred on
   a white square. **Upload that square, not the painting.** The Space's page says a
   non-square image is centre-cropped and its upload box says it is padded (both read
   2026-10-29); the square makes the question moot, and a crop would cut off the head and
   the feet.
2. Tick **Split arms, eyes and ears**: Route A's ComfyUI nodes run with that split on, and
   the example's layers are split that way (`handwear-r`, `handwear-l`, …), so your PSD
   then matches what the rest of this guide reads. Set
   **Resolution** to 1024 to match the `seethrough.resolution` in your `config.json` — or
   leave it at 768 and write 768 there. Submit and wait.
3. Download the PSD as `inputs/full.psd`. Read it with `bunx rig-parts layers inputs/full.psd`.
4. Continue to step 4 for the head box; upload `work/st_input_head.png` with the same
   settings and save the result as `inputs/head.psd`.
5. Everywhere the steps write `inputs/layers/full` and `inputs/layers/head`, write
   `inputs/full.psd` and `inputs/head.psd`.

The ModelScope demo's own page, read the same day, states no limit and no login; See-through's
README says it is "completely free now, and supports slightly higher resolution than the
HuggingFace demo".

A PSD carries no per-layer depth, so one optional feature — turning the head along with the
figure — isn't available on this route; the rest works the same. We haven't run the PSD
path end to end ourselves yet, and the layer names a PSD comes back with have not been
checked against what `rig-parts` reads from Route A's `layers.json`.

### The joints

`rig-parts propose` places the arms and legs on the joints you give it. Without them it
guesses the torso from the clothes and draws no legs.

**On the CPU**: [`scripts/keypoints.py`](../../scripts/keypoints.py) finds the 18 joints with a
pose model (RTMPose), as in [step 6](../../README.md#6-find-the-joints). No GPU, no account. [Joint-script measurements](../REFERENCE.md#the-joint-script-scriptskeypointspy).

**By hand**: read the 18 positions off the painting in an image editor and write them into
a small JSON file. The format, a picture of where each of the 18 joints goes, and a
complete example are in [docs/KEYPOINTS.md](../KEYPOINTS.md).

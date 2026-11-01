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
  `seethrough.resolution` in `config.json`, then group offload (NVIDIA only: `--offload`
  on that command, about 2–3x slower; See-through's own
  README puts it at about 1.5x, read 2026-10-29). `--offload` needs `diffusers` 0.37 or
  later, which the project's box does not have, so it was not measured. `--nf4` turns on
  its 4-bit mode, which needs the `bitsandbytes` package.
- *The command waits and prints nothing new* — `rig-parts` waits for ComfyUI's queue to be
  empty before it sends a job, so it never cuts in front of someone else's. `--wait`
  (seconds, default 1800) bounds how long.
- *On a Mac, an error that names `cuda` with `--offload`* — the wrapper's offload is written
  for NVIDIA. Leave `--offload` off and keep `seethrough.offload` false in `config.json`.
- *`SEETHROUGH_HEAD_RUN_HOLLOW`* — change `seethrough.seed` in `config.json` and
  re-run the head See-through command with `--config config.json` and a fresh `--out`
  directory, then use that directory for `--head` in the later steps. A `--seed` flag
  overrides the config's seed; remove it when you want the config to control the run.
- *On a Mac, `--nf4` fails, or `pip install -r requirements.txt` fails on `bitsandbytes`* —
  the 4-bit mode needs that package, and we don't know whether it installs on macOS. If it's
  the only package that fails, leave `--nf4` off and carry on.
- *The `python -c` check prints `False`* — PyTorch can't see the Mac's GPU. Check the
  macOS, Python and Xcode requirements on [Apple's page](https://developer.apple.com/metal/pytorch/).

**The web demo (Route C)**

- *The Space says you're out of quota, or asks you to log in* — the daily limit: 2 minutes
  of GPU a day signed out, 5 with a free account, and it resets 24 hours after your first
  run. Sign in to Hugging Face, or come back tomorrow.
- *The run times out on the Space* — lower **Resolution** to 768; each run has at most 2
  minutes of GPU. Then write `768` into `seethrough.resolution` in `config.json`.
- *`rig-parts layers` refuses the PSD* — it names the reason (not 8-bit RGB, a hidden layer,
  a layer at less than full opacity, a layer with no pixels). Re-export without changing the
  layers, or edit in an image editor that keeps the layer names.

**The joint script**

- *`no person found`* — the detector didn't see a figure. Place the joints by hand.
- *`N people found`* — it kept the most confident one. Check that it's your character.
- *Many lines about `Removing initializer`* — warnings from the model file, not errors.

# Rebuild the README demo

`walkthrough.webp` is a 720 × 600, 7.75-second looping WebP. WebP works as a
Markdown image and stays below 2 MB without requiring a video player. Its stages
show the guide's painting, five of its original See-through full-run layers fanned
apart, the built rig's bones and mesh triangles, and the real `@rig-c/play` page
playing the idle's blink, then `hello` over `idle`. The last stage includes the
page's breeze. It selects these through the guide's animation menu: 16 captures
of idle from 2.083 s, then 41 of hello from 1.583 s, sampled at 12 Hz. The hello's
own eye-narrowing keys take precedence over idle, so the separate idle view keeps
the real blink visible without changing either animation. The introduction lasts
0.75 s for the painting, 1.25 s for the layers and 1 s for the rig.

Complete **Try it first** in the root README through step 10, using the published
packages and the pinned example archive. Keep that `my-rig` directory, including
its `node_modules`. No drawing, repaired pixels, replacement joints or extra motion
keys are inputs to this exporter.

Use a dedicated scratch directory outside the checkout and consumer. The commands
below install export tools there, without changing the guide's dependencies.
`uv` supplies Python and Pillow; the two JavaScript scripts run with Bun.

```sh
export DEMO_SCRATCH="$HOME/.cache/rig-demo-export"
export TMPDIR="$DEMO_SCRATCH/tmp"
export XDG_CACHE_HOME="$DEMO_SCRATCH/cache"
export BUN_INSTALL_CACHE_DIR="$DEMO_SCRATCH/bun-cache"
export UV_CACHE_DIR="$DEMO_SCRATCH/uv-cache"
export UV_PYTHON_INSTALL_DIR="$DEMO_SCRATCH/python"
export PLAYWRIGHT_BROWSERS_PATH="$DEMO_SCRATCH/browsers"
export PLAYWRIGHT_SKIP_BROWSER_GC=1
mkdir -p "$TMPDIR" "$XDG_CACHE_HOME" "$BUN_INSTALL_CACHE_DIR" "$UV_CACHE_DIR" "$UV_PYTHON_INSTALL_DIR" "$PLAYWRIGHT_BROWSERS_PATH" "$DEMO_SCRATCH/browser-tools"
cd "$DEMO_SCRATCH/browser-tools"
bun add --exact playwright@1.58.2
bun node_modules/playwright/cli.js install chromium
cd /path/to/getting-started
bun docs/demo/regenerate.ts --consumer /path/to/my-rig --scratch "$DEMO_SCRATCH" --check
bun docs/demo/regenerate.ts --consumer /path/to/my-rig --scratch "$DEMO_SCRATCH"
```

On Linux, Chromium's required system libraries must be installed before running
the exporter. If Playwright reports missing libraries, install the dependencies
required by your distribution before continuing.
Keep `PLAYWRIGHT_SKIP_BROWSER_GC=1` so installs do not remove other cached browser
revisions, especially when sharing a browser cache.

The preflight reads the actual layer manifest, animation data and every model page
path. The full run serves the unchanged `scripts/play.html`, loads its model via
the real browser loader and requires WebGL, changing poses/pixels and no browser
errors. Only the clock is controlled: the guide's RAF callback advances at 24 Hz,
and screenshots sample it at 12 Hz. Bone lines and mesh edges are derived from
`player.bone()` and `player.posedFrame()`, not approximated by hand. Labels, image
layout and layer transforms provide presentation. Pillow prepares deterministic
thumbnails: LANCZOS downscaling, and each layer's opaque-alpha bounding box plus
eight pixels of padding for its presentation crop. Original files and all rig
inputs remain unchanged. This export does not repair the guide's separately documented
elbow warning ([issue 18](https://github.com/rig-c/getting-started/issues/18)).

The script captures and encodes twice in fresh pages, records both raw screenshot
digests and requires matching **final WebP bytes**, then writes the media and
`provenance.json` beside it. Raw PNG hashes can differ due to browser rasterization;
the lossy encoding can map those differences to identical WebP bytes. This is
reported explicitly and never used to waive the final-byte check. Pillow
11.3.0 reads the encoded file back to check its dimensions, duration, infinite loop
and byte limit. The receipt identifies the browser, encoder, package versions,
README digest, source assets and compiled-model hashes. Identical bytes are checked
within that environment; different browser, font or libwebp versions may change
pixels or encoding. Keep the recorded environment when comparing rebuilds.

Raw PNGs and the two trial WebPs are scratch files. Remove that dedicated scratch
directory after reviewing the output and preserving its digests. Commit only the
final WebP, the scripts, this note and the provenance receipt.

Changing the root README changes its **whole-file** guide SHA. Per
[the CI contract](../CI.md), it requires a fresh walkthrough and an automated
REFERENCE record proposal even when no guide command changed. Do not copy that
proposal over the historical measurements by hand. The walkthrough's literal
clone uses public helpers; separately running this checkout's exporter validates
unpublished exporter changes, while a later published-guide run validates what a
reader can fetch.

The scripts are MIT. The demo's character imagery is derived from `rig-c/exam`
inputs and remains **CC BY-NC 4.0**, not MIT. The painting's required credit is:
*Painted with Nova Anime XL IL v8.0 by Crody (https://civitai.com/models/376130).* See
[the guide credits](../../README.md#credits-and-licences) and the example archive's
`LICENSE` and `NOTICE.md`.

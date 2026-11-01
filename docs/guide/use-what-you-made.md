## Use what you made

Four places the rig can go from here. Each reads files the steps above already wrote;
the original three are measured in [docs/REFERENCE.md](../REFERENCE.md#use-what-you-made).

### On a web page, with `@rig-c/play`

For your own site, with no Spine runtime. The page from step 10 is already this: it loads
`skeleton.model.json`, the document a build writes next to the Spine files, and the part
images beside it. Copy `wave-build/` (that document plus 28 part PNGs, 1.3 MB; it holds
both `idle` and `wave`) next to a page, and start from the play README's
[minimal page](https://github.com/rig-c/play#a-minimal-page): about twenty lines that load
the player from a CDN, fit the rig to a box and play it. Point its `modelUrl` at
`wave-build/skeleton.model.json`. [`scripts/play.html`](../../scripts/play.html) is the same with
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
and you have step 9's wave inside a Pixi canvas:

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
[example check](../../scripts/check-adapters.ts) installs the published packages and runs this
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

For Spine runtime terms, see the core [NOTICE](https://github.com/rig-c/core/blob/main/NOTICE.md).

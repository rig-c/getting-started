# Turn the head with depth

### 9d. Turn the head with depth

**Depth-driven rigging** uses per-part depth from See-through to move drawings at
different depths differently as the head turns. This step uses the runs' scalar
`depth_median` values: the existing face-surface model bends the face and carries
its features, while the back hair moves the other way according to its depth.
It does not sample depth images. **The body does not turn.** Skip this step on the
[PSD route](make-your-own-character.md#route-c-no-gpu-at-all), which carries no measured depth.

Step 7 did not request depth, so its proposal has no `turn` block. Ask for one now
and copy only that block; the bones, cloth and hello stay as you made them. The
next line drops `upperarm-r` from it: step 7 made that layer the arm's `upperarm_r`.

```sh
bunx rig-parts propose --parts work/rig --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out work/turn --keypoints keypoints.json
bun ../getting-started/scripts/take.ts work/turn/proposal.json config.json turn
bun -e 'const f = "config.json", c = await Bun.file(f).json(); delete c.turn.depths["upperarm-r"]; await Bun.write(f, JSON.stringify(c, null, 2) + "\n")'
bun -e 'const f = "hello.anim.json", m = await Bun.file(f).json(), c = await Bun.file("config.json").json(), d = c.turn.depths; const depth = { eye_r: d.eyewhite_r, eye_l: d.eyewhite_l, brow_r: d.brow_r, brow_l: d.brow_l, mouth: d.mouth }; m.animations.turn = { duration: 4, tracks: [{ group: "features", property: "translatex", keys: [0, -12, 0, 12, 0].map((degrees, t) => ({ t, derive: { kind: "yaw", degrees, depth } })) }] }; await Bun.write(f, JSON.stringify(m, null, 2) + "\n")'
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop --lead-in 1
bunx rigc render --candidate out/check/build --animation turn --viewport -448,-32,896,1280 --max 1280 --extremes --out out/turn-render
```

The new `turn` animation goes from rest to −12°, back to rest, to +12°, then rest
again, in four seconds. `hello.anim.json` now holds both `hello` and `turn`; the
config already names that file. The facial features use the face riders' proposed
depths. These scalar depths set the head's front/back relationship; the package's
face-surface model supplies the bend, rather than reconstructing a 3D head.
The settings and their limits are in the parts
[AUTHORING guide](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md).

The render uses one pixel per rig pixel. Open
`out/turn-render/turn/extremes.png` for setup, the sampled extremes and their
absolute difference. In step 10, select **turn** from the animation menu to play it.

![The example at rest, at minus and plus 12 degrees, then their absolute difference; native head crops.](../demo/head-turn.png)

These frames use the guide's [hand-placed joints](../KEYPOINTS.md).
The [measurement receipt](../receipts/issue-42.json) records the versions, depths
and gate readings. The build and check retain the existing elbow seam warning and
four skirt-settling warnings; this run adds no new WARN. Two short hair marks are
already in the static shirt art and become exposed beside the moving side-lock
tips, especially at −12°. Those are **ghosts**, not clean boundaries; this step
retains and reports them rather than repairing the drawing.

Next: return to [10. Play it in your browser](../../README.md#10-play-it-in-your-browser).

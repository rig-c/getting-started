# Motion and cloth physics

### 9b. Say hello

Step 9 turned joint positions into a motion. A motion can also be written as keys on the
bones and handed to the build, which checks it with the rig.
[`scripts/hello.ts`](../../scripts/hello.ts) writes a hello of under five seconds that way, reading the bones
from the rig step 8 built; the config names the file in `motion.animations_from`, and the
build runs again.

```sh
bun ../getting-started/scripts/hello.ts out/rig/rig.json
echo '{"animations_from": "hello.anim.json"}' > work/hello-from.json
bun ../getting-started/scripts/take.ts work/hello-from.json config.json motion.animations_from=animations_from
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop
```

About a minute and a half. You should see `hello.ts: 4 beats (hm?, heh, wave, settle), 4.75 s
at 24 fps, 16 tracks of 115 keys; sleeve_r0 at most 4.0 deg; settle: right ankle 8.3 px in
(10 % of the way to parallel, 15.96 -> 15.19 deg), hip 1.5 px` on the detected joints, then from the build
`animations beside the idle`, ending `hello.anim.json as written: hello`,
`ANIMATIONS_DO_NOT_FOLD: PASS — 2 animation(s) read by rigc render --folds at 12 fps (idle,
hello)`, `FEET_STAY_LEVEL: PASS`, `check: PASS`, and `build: PASS`. The internal elbow
reading in `SEAM_OVER_MOTION` remains a warning: where the forearm turns
at the elbow, a sliver of it shows past the sleeve's cuff. `out/check/build/` now holds `idle`
and `hello`.

The wave here is the forearm's, with the upper arm kept within 4 degrees of rest. On this
painting the upper arm and its puff sleeve are one image under a sleeveless top, so
swinging it out opens a gap at the armhole, which step 9 now avoids by holding it still. Then she re-plants her
weight as the arm comes down: her splayed right leg (the picture's left) slides its foot
10 % of the way in toward parallel with the other, the knee bending the way it is painted, her hip
follows 1.5 px, and both go back by the end of the loop. The feet are the two parts step 7's
correction made; each keeps its shoe level while the leg turns, and the hello never keys
them. The skirt keeps the tops of both thighs covered as she settles. The comment at the top of `hello.ts`
and [the reference](../REFERENCE.md#step-9b-the-body-root-reach) say why the settle is smaller;
[#18](https://github.com/rig-c/getting-started/issues/18) remains the separate elbow reading.

### 9c. Let the hair and the skirt answer

So far the hair and the skirt move only where a key moves them. The parts package has a
recipe that hands them to physics instead: a `cloth` block in the config names a recipe per
See-through layer tag, `propose --cloth` drafts chains with a physics constraint on each
link, and the build carries them. Then what moves under them, her breath, her head and the
hello's hip, moves them, and no key does.

```sh
bun ../getting-started/scripts/hello.ts out/rig/rig.json --no-skirt-keys
cat > work/cloth.json <<'EOF'
{
  "cloth": {
    "bottomwear": { "chains": 3, "links": 3, "wind": [1, 6], "gravity": [2, 12], "translate": 0.2,
                    "swing": { "scales": [0.3, 0.25, 0.3] } },
    "front hair": { "chains": 1, "links": 3, "wind": [1, 6], "gravity": [2, 12], "translate": 0.2,
                    "strength": { "trunk": 100, "branch": 100, "edge": 100 } }
  }
}
EOF
bun ../getting-started/scripts/take.ts work/cloth.json config.json cloth
bunx rig-parts propose --parts work/rig --source inputs/painting.png --out work --keypoints keypoints.json --cloth config.json --write-config config.cloth.json
mv config.cloth.json config.json
bun -e 'const f = "config.json", c = await Bun.file(f).json(); c.motion.tracks.find((t) => t.bone === "bun").amp = 1; await Bun.write(f, JSON.stringify(c, null, 2) + "\n")'
bunx rig-parts build --config config.json --source inputs/painting.png --full inputs/layers/full --head inputs/layers/head --out out --loop --lead-in 1
```

About two and a half minutes. The first line writes the hello again without its three skirt
keys (`hello.ts` then prints `14 tracks of 115 keys` and `skirt0_0 follows the thigh, the rest
left to physics`): step 9b's settle turns the skirt's top links by hand to follow her hip and
her right thigh, and from here physics does the hip's part. The thigh's stays a key, on
`skirt0_0`, the recipe's first link over the right thigh, which carries no physics of its
own. `bottomwear` is the skirt's layer; `front hair` is the hair around the face, the
fringe and the two locks that hang beside her cheeks, all one layer.
`propose` prints what the recipe drafted: `3 tree(s) on one shared swing, skirt_swing` for the
skirt, one tree of three links on each side lock (`lockt0_` and `lock1t0_`), and the fringe's
three short chains on physics too. Then a line beginning `wrote config.cloth.json:
config.json's text with` names what it replaced — the old hair and skirt chains removed and
the new ones inserted, `meshes.hair_front`, `meshes.bottomwear`, their idle tracks removed,
`constraints` — and ends `every other byte as read`: everything else in your config,
`motion.animations_from` included, is as it was, and `mv` makes the result your config. It holds 30 constraints: 27
physics constraints, one on every link, and 3 that turn each skirt tree's first link with
the swing hung from the hip.

The `swing.scales` line gives each skirt tree a quarter of the earlier shared swing.
The skirt keeps the tops of her thighs covered as she breathes and settles
([the figures](../REFERENCE.md#step-9b-the-body-root-reach)). The physics and its forces remain.

Two lines are corrections to the draft. The `strength` line makes the side locks as stiff as
the fringe's middle: at the recipe's default the locks trail her head's turn in the hello
far enough to pull off her cheek by more than this guide allows (the figures are in
[docs/REFERENCE.md](../REFERENCE.md#step-9c-the-hair-and-the-skirt)). The `bun -e` line raises one number. The
recipe took the keys off the hair around the face, which leaves the back hair's bun the
head's only keyed child, so `check` reads neck, head and bun as one chain, and wants each to
swing at least as far as the one above. The draft gives the bun 0.8 degrees under the head's
0.9; without the line the build stops at `CHECK_CHAIN_LAG`.

From the build you should see `loop physics: 27 physics constraint(s) left out of the loop's
frames, reported, not judged`, `WARN chain` lines from `CLOTH_SETTLES` for the skirt,
`check: PASS`, warnings from the internal seams and `CLOTH_SETTLES`, a `lead-in:` line ending `max |d| 1, 0 px over
40 — the jump at the wrap`, and `build: PASS`. Physics starts at rest when an animation
starts, and the skirt hangs into place within 2 seconds. Then it rests, because the idle
never moves her hip; `CLOTH_SETTLES` says so, and it is a warning, not a failure. The hello's
settle moves the skirt again. `--lead-in 1` plays the idle once before
`out/idle.gif` is cut from it, so the loop starts after the skirt has settled.

Next: continue to [9d. Turn the head with depth](depth-turn.md#9d-turn-the-head-with-depth).

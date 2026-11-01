# A painting recipe for `comfy paint`

`bunx rig-parts comfy paint` makes the painting through ComfyUI from a `generation` block
in `config.json` and a stick figure the ControlNet is given. This is the shape of one the
project used: a checkpoint, a sampler, the prompt in parts, and a skeleton that holds the
arms away from the body. Copy both files into `my-rig`, change the prompt to your
character, and run the command in [Route A, step 4](guide/make-your-own-character.md#route-a-your-own-nvidia-gpu).

`config.json`:

```json
{
  "key": "dancer",
  "generation": {
    "checkpoint": "novaAnimeXL_ilV80.safetensors",
    "loras": [],
    "trigger": "",
    "identity": "1girl, solo, young adult woman, black hair, (high bun:1.2), short side bangs, bright brown eyes, cheerful expression",
    "costume": "(cropped windbreaker jacket ending above the waist:1.3), fitted long sleeves, (black pleated mini skirt:1.1), white crew socks, black sneakers, fully clothed",
    "pose": "full body, head to toe, entire body in frame, front view, facing viewer, standing, (arms spread away from body:1.3), (a-pose:1.2), hands open, gap between arms and torso, legs slightly apart, feet visible",
    "style": "anime illustration, detailed, soft shading, (white background:1.3), simple background, plain background",
    "negative_extra": "2girls, multiple girls, holding, bag, weapon, scenery, from behind, closed eyes",
    "negative_pose": "cropped, out of frame, cut off feet, close-up, upper body, from side, sitting, crossed arms, hands in pockets, hands behind back, arms touching body, hands on hips, floor, cast shadow",
    "sampler": { "steps": 30, "cfg": 5.5, "sampler": "euler_ancestral", "scheduler": "normal" },
    "latent": [832, 1216],
    "seed": 74101,
    "control": { "skeleton": "pose_a.json", "strength": 0.9, "end_percent": 0.8 }
  }
}
```

`pose_a.json`, beside it — the skeleton the ControlNet is given, in the 832 x 1216
latent's pixels:

```json
{
  "width": 832, "height": 1216,
  "points": {
    "nose": [416, 236], "r_eye": [402, 222], "l_eye": [430, 222], "r_ear": [388, 230], "l_ear": [444, 230],
    "neck": [416, 318], "r_shoulder": [350, 334], "l_shoulder": [482, 334],
    "r_elbow": [290, 470], "l_elbow": [542, 470], "r_wrist": [238, 596], "l_wrist": [594, 596],
    "r_hip": [378, 620], "l_hip": [454, 620], "r_knee": [366, 836], "l_knee": [466, 836],
    "r_ankle": [358, 1060], "l_ankle": [474, 1060]
  }
}
```

Then:

```sh
bunx rig-parts comfy paint --config config.json --out inputs --host http://127.0.0.1:8188
```

What you get: `inputs/painting_74101.png` at 1664 x 2432 (twice the latent — the painting
is enlarged with the upscaler), `painting_74101_meta.json` beside it with the full prompts,
and the control image it drew. `--seeds 4` makes four paintings from consecutive seeds, to
choose from. Rename the one you keep to `inputs/painting.png`.

The other fields `generation` takes are in
[AUTHORING §3](https://github.com/rig-c/parts/blob/main/docs/AUTHORING.md#3-configjson-field-by-field).
When you go on to See-through, *add* the `seethrough` and `assemble` fields to this file
rather than writing a new one over it, so the `generation` block stays as the record of how
the painting was made.

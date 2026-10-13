# The joints, by hand

`rig-parts propose --keypoints` reads a small JSON file that says where the character's 18
body joints are on the painting. [`scripts/keypoints.py`](../scripts/keypoints.py) writes
it for you; this page is for writing it yourself, and it holds a complete example for the
painting used in the README's *Try it first*.

## Where each joint goes

Open the painting in an image editor that shows the pointer's pixel position and read off
each joint, with x to the right and y down from the top-left corner. `r_` and `l_` are the
**character's** right and left: on a figure facing you, `r_shoulder` is on the left of the
picture.

```
              r_eye  l_eye
       r_ear     nose      l_ear
                 neck
     r_shoulder        l_shoulder
    r_elbow                l_elbow
  r_wrist       r_hip  l_hip     l_wrist
                r_knee l_knee
               r_ankle l_ankle
```

The neck is the midpoint of the two shoulders.

## The file

`width` and `height` are the painting's size in pixels. A joint you can see is `observed`;
one hidden under clothes or hair is `occluded`, with your best estimate; one you cannot
place at all is `missing`, with no `at`. Every `at` must lie inside the painting.

This is a hand-placed set for the example painting (1664 x 2432). Save it as
`keypoints.json` in `my-rig` to use it in place of the script's output:

```json
{
  "spec": "spine-parts-keypoints/1",
  "space": { "units": "painting-px", "origin": "top-left", "y": "down" },
  "width": 1664, "height": 2432,
  "source": "placed by hand",
  "people": [
    { "id": "a", "joints": {
        "nose":       { "state": "observed", "at": [894, 344] },
        "neck":       { "state": "observed", "at": [880, 490] },
        "r_shoulder": { "state": "occluded", "at": [690, 560] },
        "r_elbow":    { "state": "observed", "at": [664, 847] },
        "r_wrist":    { "state": "observed", "at": [573, 1120] },
        "l_shoulder": { "state": "occluded", "at": [1060, 550] },
        "l_elbow":    { "state": "observed", "at": [1100, 831] },
        "l_wrist":    { "state": "observed", "at": [1223, 1097] },
        "r_hip":      { "state": "occluded", "at": [780, 1030] },
        "r_knee":     { "state": "observed", "at": [650, 1650] },
        "r_ankle":    { "state": "observed", "at": [455, 2110] },
        "l_hip":      { "state": "occluded", "at": [970, 1030] },
        "l_knee":     { "state": "observed", "at": [940, 1655] },
        "l_ankle":    { "state": "observed", "at": [850, 2110] },
        "r_eye":      { "state": "observed", "at": [825, 275] },
        "l_eye":      { "state": "observed", "at": [944, 294] },
        "r_ear":      { "state": "missing" },
        "l_ear":      { "state": "missing" } } }
  ]
}
```

With this set, the example rig comes out with 42 bones — a chain per leg — where the
script's joints give 40 and one chain down the middle of both legs. Both build green, and
the README's wave runs on both. [REFERENCE.md](REFERENCE.md#the-leg-chain-moves-with-the-joints)
says why.

## What the script writes

`scripts/keypoints.py` runs RTMPose (whole-body, "balanced") through
[rtmlib](https://github.com/Tau-J/rtmlib) and onnxruntime on the CPU, keeps the most
confident person, and writes the same file. Joints the model scores below 0.3 are written
`occluded`, with the model's position as an estimate; joints it puts outside the picture
are written `missing`. The neck is the midpoint of the shoulders, scored the lower of the
two, since the model has no neck point. With several people in the picture it keeps the one
with the highest mean body score and says so. Its times and downloads are in
[REFERENCE.md](REFERENCE.md#the-joint-script-scriptskeypointspy).

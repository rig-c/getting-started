"""Find the body joints on one painting and write them as spine-parts-keypoints/1.

    python keypoints.py painting.png --out keypoints.json [--min-score 0.3]

Runs RTMPose whole-body ("balanced": YOLOX-m to find the person, RTMW-x to place
the points) through rtmlib on onnxruntime, on the CPU. The first run downloads
the two models into ~/.cache/rtmlib (about 330 MB once unpacked); later runs
read them from there.

What it writes is the file `rig-parts propose --keypoints` reads:

- the 18 body-18 joints (nose, neck, shoulders, elbows, wrists, hips, knees,
  ankles, eyes, ears), named for the subject's sides: r_shoulder is on the
  image's left of a figure that faces you;
- positions in painting pixels, origin top-left, y down;
- "neck" is the midpoint of the two shoulders, scored the lower of the two
  (the model has no neck point; this is OpenPose's definition);
- a joint scored below --min-score is written "occluded" with its position as
  the model's estimate; a joint the model put outside the image is written
  "missing", since the file only holds points inside the painting;
- with several people in the picture, the one with the highest mean body
  score is kept, and the script says so.

The score is RTMPose's own and can go above 1; it is not a probability.

Needs: Python 3.9+, rtmlib, onnxruntime, opencv-python-headless, numpy.
"""
import argparse
import json
import sys
import time

COCO17 = ['nose', 'l_eye', 'r_eye', 'l_ear', 'r_ear',
          'l_shoulder', 'r_shoulder', 'l_elbow', 'r_elbow', 'l_wrist', 'r_wrist',
          'l_hip', 'r_hip', 'l_knee', 'r_knee', 'l_ankle', 'r_ankle']
BODY18 = ['nose', 'neck',
          'r_shoulder', 'r_elbow', 'r_wrist',
          'l_shoulder', 'l_elbow', 'l_wrist',
          'r_hip', 'r_knee', 'r_ankle',
          'l_hip', 'l_knee', 'l_ankle',
          'r_eye', 'l_eye', 'r_ear', 'l_ear']


def main() -> int:
    ap = argparse.ArgumentParser(description='Body-18 keypoints for one painting (spine-parts-keypoints/1).')
    ap.add_argument('image', help='the painting (PNG or JPEG)')
    ap.add_argument('--out', required=True, help='where to write keypoints.json')
    ap.add_argument('--min-score', type=float, default=0.3,
                    help='below this RTMPose score a joint is written "occluded" (default 0.3)')
    args = ap.parse_args()

    import cv2
    import numpy as np
    from rtmlib import Wholebody

    img = cv2.imread(args.image, cv2.IMREAD_COLOR)
    if img is None:
        print(f'keypoints.py: cannot read {args.image} as an image', file=sys.stderr)
        return 1
    h, w = img.shape[:2]

    t0 = time.perf_counter()
    model = Wholebody(mode='balanced', backend='onnxruntime', device='cpu')
    t1 = time.perf_counter()
    kp, sc = model(img)
    t2 = time.perf_counter()

    if len(kp) == 0:
        print(f'keypoints.py: no person found in {args.image}; place the joints by hand', file=sys.stderr)
        return 1
    k = int(np.argmax([s[:17].mean() for s in sc]))
    if len(kp) > 1:
        print(f'keypoints.py: {len(kp)} people found; kept the one with the highest mean body score '
              f'({float(sc[k][:17].mean()):.3f})')
    pts, scores = kp[k], sc[k]

    def joint(x: float, y: float, s: float) -> dict:
        if not (0 <= x <= w and 0 <= y <= h):
            return {'state': 'missing'}
        return {'state': 'observed' if s >= args.min_score else 'occluded',
                'at': [round(float(x), 1), round(float(y), 1)],
                'score': round(float(s), 3)}

    found = {}
    for i, name in enumerate(COCO17):
        found[name] = joint(pts[i][0], pts[i][1], scores[i])
    ls, rs = COCO17.index('l_shoulder'), COCO17.index('r_shoulder')
    found['neck'] = joint((pts[ls][0] + pts[rs][0]) / 2, (pts[ls][1] + pts[rs][1]) / 2,
                          min(scores[ls], scores[rs]))

    doc = {
        'spec': 'spine-parts-keypoints/1',
        'space': {'units': 'painting-px', 'origin': 'top-left', 'y': 'down'},
        'width': w,
        'height': h,
        'source': f'RTMPose whole-body "balanced" (rtmlib, onnxruntime, CPU) on {args.image}; '
                  f'body-18 names, neck = midpoint of the shoulders; occluded below score {args.min_score}',
        'people': [{'id': 'a', 'joints': {n: found[n] for n in BODY18}}],
    }
    with open(args.out, 'w') as f:
        json.dump(doc, f, indent=1)
        f.write('\n')

    states = [found[n]['state'] for n in BODY18]
    print(f'keypoints.py: {args.image} {w}x{h}: '
          f'{states.count("observed")} observed, {states.count("occluded")} occluded, '
          f'{states.count("missing")} missing -> {args.out}')
    print(f'keypoints.py: models loaded in {t1 - t0:.1f} s, one image in {t2 - t1:.1f} s')
    return 0


if __name__ == '__main__':
    sys.exit(main())

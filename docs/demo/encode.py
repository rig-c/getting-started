"""Encode and read back actual browser captures; never paint or retouch a frame."""
import sys
import json
from pathlib import Path
from PIL import Image, features

if sys.argv[1] == '--prepare':
    source, out = Path(sys.argv[2]), Path(sys.argv[3])
    out.mkdir(parents=True, exist_ok=True)
    painting = Image.open(source / 'inputs/painting.png').convert('RGBA')
    painting.thumbnail((380, 490), Image.Resampling.LANCZOS)
    painting.save(out / 'painting.png')
    layers = json.loads((source / 'inputs/layers/full/layers.json').read_text())
    names = ['back hair', 'bottomwear', 'topwear', 'face', 'front hair']
    for i, name in enumerate(names):
        assert any(layer['name'] == name for layer in layers['layers'])
        image = Image.open(source / f'inputs/layers/full/parts/{name}.png').convert('RGBA')
        # Presentation crops around opaque art, with padding; original pixels
        # and source files are untouched. This is never a part/rig repair.
        box = image.getchannel('A').point(lambda a: 255 if a >= 250 else 0).getbbox()
        assert box, f'No opaque art for {name}'
        box = (max(0, box[0]-8), max(0, box[1]-8), min(image.width, box[2]+8), min(image.height, box[3]+8))
        image = image.crop(box)
        image.thumbnail((122, 294), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (122, 294))
        canvas.alpha_composite(image, ((122-image.width)//2, (294-image.height)//2))
        canvas.save(out / f'layer-{i}.png')
    print(f'PRESENTATION_PREPARE Pillow=11.3.0 libwebp={features.version("webp")} original_files_unchanged=true')
    sys.exit(0)

frames = sorted(Path(sys.argv[1]).glob('[0-9][0-9][0-9].png'))
assert len(frames) == 93, f'Expected 93 captures, found {len(frames)}'
images = [Image.open(f).convert('RGB') for f in frames]
assert all(im.size == (720, 600) for im in images)
durations = [round((i + 1) * 1000 / 12) - round(i * 1000 / 12) for i in range(len(images))]
images[0].save(sys.argv[2], format='WEBP', save_all=True, append_images=images[1:],
               duration=durations, loop=0, quality=72, method=6, minimize_size=False)
with Image.open(sys.argv[2]) as result:
    assert result.size == (720, 600) and result.info['loop'] == 0
    duration = 0
    for i in range(result.n_frames):
        result.seek(i)
        result.load()
        duration += result.info['duration']
    assert duration == 7750, duration
size = Path(sys.argv[2]).stat().st_size
assert size < 2_000_000, size
print(f'WEBP_READER bytes={size} duration_ms={duration} width=720 loop=0 libwebp={features.version("webp")}')
Path(sys.argv[2] + '.json').write_text(json.dumps({'Pillow': '11.3.0', 'libwebp': features.version('webp'),
    'quality': 72, 'method': 6, 'loop': 0, 'bytes': size, 'duration_ms': duration}) + '\n')

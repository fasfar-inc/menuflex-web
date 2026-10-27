"""
Encodes rendered PNG frames into the two WebP sets the site streams:
  hi -> desktop / high-DPI (render resolution)
  lo -> phones and small stages (half resolution)

    python encode_frames.py ./frames [--shift DX,DY] [--shadow 0.5] [--offset N]

--shift  moves every frame by DX,DY mockup-frame pixels (corrects a lens-shift
         error in renders made before the camera fix; a lens shift is a pure
         image translation).
--shadow scales the opacity of the table shadow.
--offset adds N to frame numbers (phase B frames continue after the opening).
"""

import argparse
import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "scene-01", "opening")


def process(im, shift, shadow):
    a = np.asarray(im).astype(np.float32)
    if shadow != 1.0:
        # shadow-catcher pixels: partly transparent and near black
        sh = (a[..., 3] < 250) & (a[..., :3].max(-1) < 40)
        a[..., 3] = np.where(sh, a[..., 3] * shadow, a[..., 3])
    out = Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")
    if shift != (0.0, 0.0):
        k = im.width / 1272.0
        out = out.transform(out.size, Image.AFFINE, (1, 0, -shift[0] * k, 0, 1, -shift[1] * k), resample=Image.BICUBIC)
    return out


def main(src, shift, shadow, offset=0):
    files = sorted(glob.glob(os.path.join(src, "*.png")))
    for name in ("hi", "lo"):
        os.makedirs(os.path.join(OUT, name), exist_ok=True)
    total = {"hi": 0, "lo": 0}
    for f in files:
        im = process(Image.open(f).convert("RGBA"), shift, shadow)
        base = f"{int(os.path.splitext(os.path.basename(f))[0]) + offset:04d}.webp"
        hi = os.path.join(OUT, "hi", base)
        im.save(hi, "WEBP", quality=80, method=6, alpha_quality=70)
        lo = os.path.join(OUT, "lo", base)
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(lo, "WEBP", quality=78, method=6, alpha_quality=70)
        total["hi"] += os.path.getsize(hi)
        total["lo"] += os.path.getsize(lo)
    print(len(files), "frames", {k: f"{v / 1e6:.1f} MB" for k, v in total.items()}, im.size)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--shift", default="0,0")
    ap.add_argument("--shadow", type=float, default=1.0)
    ap.add_argument("--offset", type=int, default=0)
    a = ap.parse_args()
    main(a.src, tuple(float(v) for v in a.shift.split(",")), a.shadow, a.offset)

"""
Encodes rendered PNG frames into the two WebP sets the site streams:
  hi -> desktop / high-DPI (render resolution)
  lo -> phones and small stages (half resolution)

    python encode_frames.py ./frames
"""

import glob
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "scene-01", "opening")


def main(src):
    files = sorted(glob.glob(os.path.join(src, "*.png")))
    for name in ("hi", "lo"):
        os.makedirs(os.path.join(OUT, name), exist_ok=True)
    total = {"hi": 0, "lo": 0}
    for f in files:
        im = Image.open(f).convert("RGBA")
        base = os.path.splitext(os.path.basename(f))[0] + ".webp"
        hi = os.path.join(OUT, "hi", base)
        im.save(hi, "WEBP", quality=80, method=6, alpha_quality=70)
        lo = os.path.join(OUT, "lo", base)
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(lo, "WEBP", quality=78, method=6, alpha_quality=70)
        total["hi"] += os.path.getsize(hi)
        total["lo"] += os.path.getsize(lo)
    print(len(files), "frames", {k: f"{v / 1e6:.1f} MB" for k, v in total.items()}, im.size)


if __name__ == "__main__":
    main(sys.argv[1])

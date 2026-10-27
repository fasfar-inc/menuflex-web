"""
Cuts the lifted right-hand page out of the blank-page render of the final pose:

    python cut_page.py /tmp/frames_blank/0047.png

The website lays this image exactly over the page in the last rendered frame,
then lifts it off the book. PAGE must match `render_menu.py --layout` and
PRINT_PAGE in src/components/menu/sequence/openingFrames.ts.
"""

import os
import sys

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "scene-01", "opening", "page-lift.webp")
VIEW_X = 400                       # rendered region starts here in the mockup frame
PAGE = (1176.0, 282.5, 1600.5, 669.75)  # x0, y0, x1, y1 in mockup-frame pixels


def main(src):
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    k = im.shape[1] / 1272.0
    x0, y0, x1, y1 = (PAGE[0] - VIEW_X) * k, PAGE[1] * k, (PAGE[2] - VIEW_X) * k, PAGE[3] * k
    w, h = int(round(x1 - x0)), int(round(y1 - y0))
    m = np.float32([[(x1 - x0) / w, 0, x0], [0, (y1 - y0) / h, y0]])
    crop = cv2.warpAffine(im, m, (w, h), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    cv2.imwrite(OUT, crop, [cv2.IMWRITE_WEBP_QUALITY, 88])
    print(OUT, w, h)


if __name__ == "__main__":
    main(sys.argv[1])

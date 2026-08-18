#!/usr/bin/env python3
"""Recreate the Portuguese flag as a fabric-sample mosaic.

  - 30 cols x 20 rows grid (3:2 aspect, matches the flag).
  - Left 2/5 (12 cols) = GREEN field.
  - Right 3/5 (18 cols) = RED field.
  - Each region randomly tiled with samples of matching hue.
  - Repeats allowed (heavy in-region randomness avoids identical neighbours).
  - Tile size 80px → output 2400x1600.
"""
import colorsys
import random
from pathlib import Path
from PIL import Image

random.seed(11)

OUT = Path("data/logo/mosaic/portuguese-flag.png")
SAMPLE_ROOTS = [
    Path("data/chance-samples"),
    Path("data/all-samples/MARA"),
    Path("data/all-samples/PROSOFT"),
    Path("data/all-samples/MEDIFLEX"),
    Path("data/all-samples/OCEAN"),
    Path("data/all-samples/JAZZ"),
    Path("data/all-samples/STRAW"),
    Path("data/all-samples/PEEL"),
]

TILE = 80
COLS = 30
ROWS = 20
W, H = COLS * TILE, ROWS * TILE
GREEN_COLS = 12       # left 2/5
RED_COLS = COLS - GREEN_COLS  # right 3/5


def measure(path: Path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    crop = img.crop((int(w * 0.38), int(h * 0.38), int(w * 0.62), int(h * 0.62))).resize((12, 12))
    px = [
        (r, g, b)
        for r, g, b in crop.getdata()
        if not (r > 235 and g > 235 and b > 235)
        and not (r < 8 and g < 8 and b < 8)
    ]
    if not px:
        px = list(crop.getdata())
    rs = sum(p[0] for p in px) / len(px)
    gs = sum(p[1] for p in px) / len(px)
    bs = sum(p[2] for p in px) / len(px)
    h_, s_, v_ = colorsys.rgb_to_hsv(rs / 255, gs / 255, bs / 255)
    return h_ * 360, s_, v_


def collect_samples():
    paths = []
    for root in SAMPLE_ROOTS:
        if root.exists():
            paths.extend(sorted(root.glob("*.jpg")))
            paths.extend(sorted(root.glob("*.jpeg")))
    return paths


def tile_from(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((TILE, TILE), Image.LANCZOS)


def main():
    samples = collect_samples()
    print(f"Total samples available: {len(samples)}")

    greens, reds = [], []
    for p in samples:
        try:
            hue, sat, val = measure(p)
        except Exception:
            continue
        # Saturation gate so neutrals aren't mistaken for colors.
        if sat < 0.20:
            continue
        if 75 <= hue <= 165:
            greens.append(p)
        elif (hue >= 340 or hue < 20) and val > 0.20:
            reds.append(p)
    print(f"greens: {len(greens)}, reds: {len(reds)}")

    if not greens or not reds:
        raise SystemExit("Not enough green or red samples to build the flag.")

    canvas = Image.new("RGB", (W, H), (255, 255, 255))

    # GREEN region
    for gy in range(ROWS):
        # Shuffle each row independently to avoid columnar repetition.
        row_pool = greens * ((GREEN_COLS // len(greens)) + 1)
        random.shuffle(row_pool)
        row_pool = row_pool[:GREEN_COLS]
        for gx, p in enumerate(row_pool):
            canvas.paste(tile_from(p), (gx * TILE, gy * TILE))

    # RED region
    for gy in range(ROWS):
        row_pool = reds * ((RED_COLS // len(reds)) + 1)
        random.shuffle(row_pool)
        row_pool = row_pool[:RED_COLS]
        for i, p in enumerate(row_pool):
            gx = GREEN_COLS + i
            canvas.paste(tile_from(p), (gx * TILE, gy * TILE))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(f"saved {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()

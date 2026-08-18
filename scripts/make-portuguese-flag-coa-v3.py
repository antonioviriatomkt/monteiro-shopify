#!/usr/bin/env python3
"""Portuguese flag mosaic — yellow-only coat of arms, higher resolution.

Changes vs v2:
  - Sample size −20% (tile 60 → 48 px).
  - Grid 40×27 → 60×40 (cell count 2.2× higher).
  - The coat-of-arms area is selected by a spatial elliptical mask and
    rendered ENTIRELY with yellow samples — no blue / white / inner red.
  - Outside the ellipse: left 40% width = green, right 60% = red.

Output: data/logo/mosaic/portuguese-flag-coa-v3.png
"""
import colorsys
import random
from pathlib import Path
from PIL import Image

random.seed(31)

OUT = Path("data/logo/mosaic/portuguese-flag-coa-v3.png")
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

TILE = 48
COLS = 60
ROWS = 40
W, H = COLS * TILE, ROWS * TILE

# Coat-of-arms ellipse, in grid cells (40% x, 50% y centre of the flag).
COA_CX, COA_CY = 24, 20
COA_RX, COA_RY = 12, 12


def collect_samples():
    paths = []
    for root in SAMPLE_ROOTS:
        if root.exists():
            paths.extend(sorted(root.glob("*.jpg")))
            paths.extend(sorted(root.glob("*.jpeg")))
    return paths


def measure(path: Path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    crop = img.crop(
        (int(w * 0.35), int(h * 0.35), int(w * 0.65), int(h * 0.65))
    ).resize((20, 20))
    px = [
        (r, g, b)
        for r, g, b in crop.getdata()
        if not (r > 240 and g > 240 and b > 240) and not (r < 6 and g < 6 and b < 6)
    ]
    if not px:
        px = list(crop.getdata())
    n = len(px)
    rs = sum(p[0] for p in px) / n
    gs = sum(p[1] for p in px) / n
    bs = sum(p[2] for p in px) / n
    return rs, gs, bs


def classify_sample(rgb):
    r, g, b = rgb
    h_, s_, v_ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue = h_ * 360
    if 75 <= hue <= 165 and s_ > 0.18:
        return "green"
    if (hue >= 335 or hue < 18) and v_ > 0.18 and s_ > 0.30:
        return "red"
    if 30 <= hue <= 65 and s_ > 0.25 and v_ > 0.40:
        return "yellow"
    return None  # unused buckets


def in_coa(gx, gy):
    return ((gx - COA_CX) / COA_RX) ** 2 + ((gy - COA_CY) / COA_RY) ** 2 <= 1.0


def tile_from(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((TILE, TILE), Image.LANCZOS)


class RoundRobin:
    def __init__(self, items, rng):
        self.items = list(items)
        self.idx = 0
        self.rng = rng
        self.rng.shuffle(self.items)

    def next(self):
        if not self.items:
            return None
        if self.idx >= len(self.items):
            self.rng.shuffle(self.items)
            self.idx = 0
        item = self.items[self.idx]
        self.idx += 1
        return item


def main():
    samples = collect_samples()
    print(f"measuring {len(samples)} samples...")
    pools = {"green": [], "red": [], "yellow": []}
    for p in samples:
        try:
            rgb = measure(p)
            bucket = classify_sample(rgb)
            if bucket:
                pools[bucket].append(p)
        except Exception:
            pass
    print(
        f"pools: green={len(pools['green'])}, red={len(pools['red'])}, "
        f"yellow={len(pools['yellow'])}"
    )

    rng = random.Random(31)
    queues = {b: RoundRobin(p, rng) for b, p in pools.items()}

    tile_cache = {}
    def get_tile(p):
        if p not in tile_cache:
            tile_cache[p] = tile_from(p)
        return tile_cache[p]

    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    green_split_x = int(COLS * 0.40)  # left 40% = green field
    n_coa = n_green = n_red = 0
    for gy in range(ROWS):
        for gx in range(COLS):
            if in_coa(gx, gy):
                bucket = "yellow"
                n_coa += 1
            elif gx < green_split_x:
                bucket = "green"
                n_green += 1
            else:
                bucket = "red"
                n_red += 1
            path = queues[bucket].next()
            canvas.paste(get_tile(path), (gx * TILE, gy * TILE))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(f"\nsaved {OUT} ({W}x{H})")
    print(f"cells: green={n_green}, red={n_red}, coat-of-arms(yellow)={n_coa}")


if __name__ == "__main__":
    main()

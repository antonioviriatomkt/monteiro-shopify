#!/usr/bin/env python3
"""Portuguese flag mosaic, coat of arms included, bucket-random style.

Strategy:
  - Look at the reference flag color at each cell, classify it into a color
    bucket (green / red / yellow / white / blue / dark).
  - Each fabric sample is pre-classified into the same buckets.
  - For each cell, pick a sample at random from its bucket using a round-robin
    shuffled queue, so the same sample is never reused until all in the bucket
    have appeared.

Output:
  data/logo/mosaic/portuguese-flag-coa-v2.png
  data/logo/mosaic/portuguese-flag-coa-v2-clean.png   (high-texture filtered)
"""
import colorsys
import random
from pathlib import Path
from PIL import Image

random.seed(23)

REFERENCE = Path("data/logo/reference/portugal-flag.png")
OUT_FULL = Path("data/logo/mosaic/portuguese-flag-coa-v2.png")
OUT_CLEAN = Path("data/logo/mosaic/portuguese-flag-coa-v2-clean.png")

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

TILE = 60
COLS = 40
ROWS = 27
W, H = COLS * TILE, ROWS * TILE
TEXTURE_STD_THRESHOLD = 22.0  # tighter so the clean version really differs


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
    ).resize((24, 24))
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
    lums = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px]
    mean_lum = sum(lums) / n
    var = sum((l - mean_lum) ** 2 for l in lums) / n
    return (rs, gs, bs), var ** 0.5


def classify(rgb):
    r, g, b = rgb
    h_, s_, v_ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue = h_ * 360
    if s_ < 0.15 and v_ > 0.70:
        return "white"
    if v_ < 0.20:
        return "dark"
    if s_ < 0.18:
        return "neutral"
    if 75 <= hue <= 165 and s_ > 0.18:
        return "green"
    if (hue >= 335 or hue < 18) and v_ > 0.18 and s_ > 0.30:
        return "red"
    if 30 <= hue <= 65 and s_ > 0.25 and v_ > 0.40:
        return "yellow"
    if 195 <= hue <= 260 and s_ > 0.20:
        return "blue"
    return "neutral"


def tile_from(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((TILE, TILE), Image.LANCZOS)


class RoundRobin:
    """Cycle through a shuffled list; reshuffle after each pass."""
    def __init__(self, items, rng):
        self.items = list(items)
        self.rng = rng
        self.idx = 0
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


def build(target_grid, pools, out_path: Path, label: str):
    rng = random.Random(23)
    queues = {bucket: RoundRobin(paths, rng) for bucket, paths in pools.items()}
    fallback_order = ["neutral", "red", "green", "yellow", "white", "dark", "blue"]

    tile_cache = {}
    def get_tile(p):
        if p not in tile_cache:
            tile_cache[p] = tile_from(p)
        return tile_cache[p]

    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    for gy in range(ROWS):
        for gx in range(COLS):
            ref_rgb = target_grid.getpixel((gx, gy))
            bucket = classify(ref_rgb)
            queue = queues.get(bucket)
            if not queue or not queue.items:
                # Fallback if this bucket is empty in our pool
                for alt in fallback_order:
                    if queues[alt].items:
                        queue = queues[alt]
                        break
            path = queue.next()
            canvas.paste(get_tile(path), (gx * TILE, gy * TILE))
    canvas.save(out_path)
    counts = {b: len(p) for b, p in pools.items()}
    print(f"  [{label}] saved {out_path}  ({W}x{H})  bucket counts: {counts}")


def main():
    samples = collect_samples()
    print(f"measuring {len(samples)} samples...")
    measured = []
    for p in samples:
        try:
            rgb, std = measure(p)
            measured.append((p, rgb, std, classify(rgb)))
        except Exception:
            pass
    print(f"measured: {len(measured)}")

    def split_pools(items):
        pools = {b: [] for b in ["green", "red", "yellow", "blue", "white", "dark", "neutral"]}
        for p, _, _, bucket in items:
            pools[bucket].append(p)
        return pools

    full_items = measured
    clean_items = [m for m in measured if m[2] <= TEXTURE_STD_THRESHOLD]

    ref = Image.open(REFERENCE).convert("RGB")
    target_grid = ref.resize((COLS, ROWS), Image.LANCZOS)

    OUT_FULL.parent.mkdir(parents=True, exist_ok=True)
    print(f"\nFull pool: {len(full_items)}")
    build(target_grid, split_pools(full_items), OUT_FULL, "full")
    print(f"\nClean pool (std≤{TEXTURE_STD_THRESHOLD}): {len(clean_items)}")
    build(target_grid, split_pools(clean_items), OUT_CLEAN, "clean")


if __name__ == "__main__":
    main()

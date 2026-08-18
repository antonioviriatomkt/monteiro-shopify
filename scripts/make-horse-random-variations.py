#!/usr/bin/env python3
"""Recreate horse-mosaic-random.png style with the filtered 228 samples.
Generates 10 variations (different shuffles), each saved as a separate PNG.

Style:
  - Silhouette filled with samples placed randomly.
  - Each variation uses each sample at most once.
  - Outside silhouette = transparent.
"""
import random
from pathlib import Path
from PIL import Image

SRC_LOGO = Path("data/logo/horse-only.png")
SRC_SAMPLES = Path("data/chance-samples")
OUT_DIR = Path("data/logo/mosaic/random-variations")

TILE = 80
GRID_COLS = 24
GRID_ROWS = 28
W, H = TILE * GRID_COLS, TILE * GRID_ROWS

VARIATIONS = 10


def load_inside_cells():
    logo = Image.open(SRC_LOGO).convert("L")
    logo = logo.resize((GRID_COLS, GRID_ROWS), Image.LANCZOS)
    inside = []
    for y in range(GRID_ROWS):
        for x in range(GRID_COLS):
            if logo.getpixel((x, y)) < 150:
                inside.append((x, y))
    return inside


def tile_from(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((TILE, TILE), Image.LANCZOS)


def build_one(inside, samples, seed: int):
    rng = random.Random(seed)
    if len(samples) >= len(inside):
        chosen = rng.sample(samples, len(inside))
    else:
        # Fall back to with-replacement if not enough samples.
        chosen = rng.choices(samples, k=len(inside))
    rng.shuffle(chosen)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for (gx, gy), path in zip(inside, chosen):
        canvas.paste(tile_from(path).convert("RGBA"), (gx * TILE, gy * TILE))
    return canvas


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    samples = sorted(SRC_SAMPLES.glob("*.jpg"))
    inside = load_inside_cells()
    print(f"samples: {len(samples)}, silhouette cells: {len(inside)}")
    for i in range(1, VARIATIONS + 1):
        canvas = build_one(inside, samples, seed=i * 17 + 3)
        out = OUT_DIR / f"horse-random-{i:02d}.png"
        canvas.save(out)
        print(f"  saved {out}")
    print(f"\nDone: {VARIATIONS} variations in {OUT_DIR}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Portuguese flag mosaic with coat of arms.

For each grid cell:
  1. Sample the average color of the reference flag at that cell's region.
  2. Find the fabric sample whose average color is closest in RGB.
  3. Paste the sample as a tile.

Produces:
  data/logo/mosaic/portuguese-flag-coa.png         (all 442 samples eligible)
  data/logo/mosaic/portuguese-flag-coa-clean.png   (high-texture swatches removed)
"""
from pathlib import Path
from PIL import Image

REFERENCE = Path("data/logo/reference/portugal-flag.png")
OUT_FULL = Path("data/logo/mosaic/portuguese-flag-coa.png")
OUT_CLEAN = Path("data/logo/mosaic/portuguese-flag-coa-clean.png")

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

TILE = 50
COLS = 60
ROWS = 40
W, H = COLS * TILE, ROWS * TILE

# Samples with grayscale std-dev above this are "textured" (stripes, weave) and
# get dropped from the clean version. Tuned empirically.
TEXTURE_STD_THRESHOLD = 28.0


def collect_samples():
    paths = []
    for root in SAMPLE_ROOTS:
        if root.exists():
            paths.extend(sorted(root.glob("*.jpg")))
            paths.extend(sorted(root.glob("*.jpeg")))
    return paths


def measure(path: Path):
    """Return (avg_rgb, lum_std) using tight center crop with border bleed removed."""
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


def tile_from(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((TILE, TILE), Image.LANCZOS)


def build(target_grid, sample_pool, out_path: Path, label: str):
    # Cache prepared tiles (avoids re-cropping when a sample repeats)
    tile_cache = {}

    def get_tile(p):
        if p not in tile_cache:
            tile_cache[p] = tile_from(p)
        return tile_cache[p]

    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    for gy in range(ROWS):
        for gx in range(COLS):
            tr, tg, tb = target_grid.getpixel((gx, gy))
            best_path = None
            best_d = float("inf")
            for path, (sr, sg, sb) in sample_pool:
                d = (sr - tr) ** 2 + (sg - tg) ** 2 + (sb - tb) ** 2
                if d < best_d:
                    best_d = d
                    best_path = path
            canvas.paste(get_tile(best_path), (gx * TILE, gy * TILE))
    canvas.save(out_path)
    print(f"  [{label}] saved {out_path}  ({W}x{H}), pool size {len(sample_pool)}")


def main():
    samples = collect_samples()
    print(f"measuring {len(samples)} samples...")
    measured = []
    for p in samples:
        try:
            rgb, std = measure(p)
            measured.append((p, rgb, std))
        except Exception:
            pass
    print(f"got {len(measured)} measured.")

    # Texture stats
    stds = [s for _, _, s in measured]
    print(
        f"texture std: min={min(stds):.1f} mean={sum(stds)/len(stds):.1f} "
        f"max={max(stds):.1f}  threshold={TEXTURE_STD_THRESHOLD}"
    )

    # Resize reference so each pixel = one cell, averaging color over cell's area.
    ref = Image.open(REFERENCE).convert("RGB")
    target_grid = ref.resize((COLS, ROWS), Image.LANCZOS)

    full_pool = [(p, rgb) for p, rgb, _ in measured]
    clean_pool = [(p, rgb) for p, rgb, std in measured if std <= TEXTURE_STD_THRESHOLD]
    print(
        f"full pool: {len(full_pool)}, clean pool (std≤{TEXTURE_STD_THRESHOLD}): {len(clean_pool)}"
    )

    OUT_FULL.parent.mkdir(parents=True, exist_ok=True)
    build(target_grid, full_pool, OUT_FULL, "full")
    build(target_grid, clean_pool, OUT_CLEAN, "clean")


if __name__ == "__main__":
    main()

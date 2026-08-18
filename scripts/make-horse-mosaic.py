#!/usr/bin/env python3
"""Horse logo as fabric mosaic.

Rules:
  - Every sample used at most ONCE.
  - Silhouette cells use the darkest samples; overflow ring uses lighter samples.
  - Overflow ring extends ~15% beyond the silhouette; outside the ring is empty.
  - Within each region, samples are sorted by hue and placed by x position
    so hues form a smooth left-to-right band (no random color mixing).

Output: data/logo/mosaic/horse-mosaic-gradient.png  (transparent background)
"""
import colorsys
from pathlib import Path
from PIL import Image, ImageFilter

SRC_LOGO = Path("data/logo/horse-only.png")
SRC_SAMPLES = Path("data/chance-samples")
OUT = Path("data/logo/mosaic/horse-mosaic-gradient.png")

TILE = 100
GRID_COLS = 15
GRID_ROWS = 18
W, H = TILE * GRID_COLS, TILE * GRID_ROWS

# Overflow ring thickness in grid cells (≈10% of vertical extent of grid).
OVERFLOW_CELLS = 1


def measure(img_path: Path):
    """Return (darkness_metric, hue, saturation) of the tight center of the sample.

    Uses HSV Value (= max RGB channel) for perceived darkness — saturated colors
    rank as 'light' rather than 'dark' since they read as vibrant accents, not depth.
    """
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    cx0, cy0 = int(w * 0.375), int(h * 0.375)
    cx1, cy1 = int(w * 0.625), int(h * 0.625)
    crop = img.crop((cx0, cy0, cx1, cy1)).resize((20, 20))
    px = list(crop.getdata())
    filt = [
        (r, g, b)
        for r, g, b in px
        if not (r > 235 and g > 235 and b > 235)
        and not (r < 8 and g < 8 and b < 8)
    ]
    if not filt:
        filt = px
    rs = sum(p[0] for p in filt) / len(filt)
    gs = sum(p[1] for p in filt) / len(filt)
    bs = sum(p[2] for p in filt) / len(filt)
    # HSV Value: dark = low max-channel. Pure red (255,0,0) → 255 (treated as light).
    darkness = max(rs, gs, bs)
    h_, s_, v_ = colorsys.rgb_to_hsv(rs / 255, gs / 255, bs / 255)
    return darkness, h_, s_


def tile_from(sample_path: Path, size: int = TILE) -> Image.Image:
    img = Image.open(sample_path).convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    return img.resize((size, size), Image.LANCZOS)


def build_masks():
    """Return (silhouette_cells, overflow_cells) as lists of (gx, gy)."""
    logo = Image.open(SRC_LOGO).convert("L")
    # Upscale rendering for accurate threshold + dilation, then downsample.
    upscale = 8
    big = logo.resize((GRID_COLS * upscale, GRID_ROWS * upscale), Image.LANCZOS)
    binary = big.point(lambda v: 255 if v < 150 else 0)

    # Dilate by OVERFLOW_CELLS grid cells.
    dilated = binary.filter(ImageFilter.MaxFilter(size=OVERFLOW_CELLS * 2 * upscale + 1))

    sil_small = binary.resize((GRID_COLS, GRID_ROWS), Image.LANCZOS)
    over_small = dilated.resize((GRID_COLS, GRID_ROWS), Image.LANCZOS)

    silhouette = set()
    overflow = set()
    for y in range(GRID_ROWS):
        for x in range(GRID_COLS):
            sv = sil_small.getpixel((x, y))
            ov = over_small.getpixel((x, y))
            if sv > 100:
                silhouette.add((x, y))
            elif ov > 100:
                overflow.add((x, y))
    return silhouette, overflow


def hue_sort_key(measured):
    """Stable hue ordering that pushes near-neutral samples to one end."""
    lum, h_, s_ = measured
    # Neutrals (low saturation) → before all hued samples (use negative bucket).
    if s_ < 0.12:
        return (-1, lum)
    return (h_, lum)


def main():
    samples = sorted(SRC_SAMPLES.glob("*.jpg"))
    if not samples:
        raise SystemExit("No samples found.")
    print(f"measuring {len(samples)} samples...")
    measured = [(p, *measure(p)) for p in samples]

    silhouette, overflow = build_masks()
    n_sil = len(silhouette)
    n_light_avail = max(0, len(measured) - n_sil)

    # If overflow cells exceed available light samples, keep only the cells
    # CLOSEST to the silhouette boundary — outer cells stay empty.
    def dist_to_silhouette(cell):
        cx, cy = cell
        return min((cx - sx) ** 2 + (cy - sy) ** 2 for (sx, sy) in silhouette)

    overflow_sorted = sorted(overflow, key=dist_to_silhouette)
    overflow_used = set(overflow_sorted[:n_light_avail])
    n_over = len(overflow_used)
    print(
        f"silhouette cells: {n_sil}, overflow cells: {n_over} "
        f"(trimmed from {len(overflow)} to fit {n_light_avail} light samples)"
    )

    # Sort by luminance, darkest first.
    by_lum = sorted(measured, key=lambda m: m[1])
    dark_pool = by_lum[:n_sil]
    light_pool = by_lum[n_sil : n_sil + n_over]

    # SILHOUETTE: sort by darkness only (no hue). Deepest interior cells
    # get the darkest samples; edge cells get the least-dark of the dark pool.
    dark_pool_sorted = sorted(dark_pool, key=lambda m: m[1])  # darkest first

    # Depth = min distance from each silhouette cell to any non-silhouette cell.
    non_sil = {
        (x, y) for x in range(GRID_COLS) for y in range(GRID_ROWS)
    } - silhouette
    def depth(cell):
        cx, cy = cell
        return min((cx - nx) ** 2 + (cy - ny) ** 2 for (nx, ny) in non_sil)
    sil_cells = sorted(silhouette, key=lambda c: -depth(c))  # deepest first

    # OVERFLOW HALO: keep hue ordering, place left-to-right by x.
    light_pool_sorted = sorted(
        light_pool, key=lambda m: hue_sort_key((m[1], m[2], m[3]))
    )
    over_cells = sorted(overflow_used, key=lambda c: (c[0], c[1]))

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for (gx, gy), m in zip(sil_cells, dark_pool_sorted):
        canvas.paste(tile_from(m[0]).convert("RGBA"), (gx * TILE, gy * TILE))
    for (gx, gy), m in zip(over_cells, light_pool_sorted):
        canvas.paste(tile_from(m[0]).convert("RGBA"), (gx * TILE, gy * TILE))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    used = n_sil + n_over
    print(f"saved {OUT} ({W}x{H}); used {used}/{len(samples)} samples uniquely")


if __name__ == "__main__":
    main()

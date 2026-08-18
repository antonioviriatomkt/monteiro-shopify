#!/usr/bin/env python3
"""Low-res Portuguese flag mosaic — chunky but still recognisable.

  Grid 15×10 (vs 60×40 in v3 — ~10× fewer cells).
  Tile 200 px → output 3000×2000.
  Yellow circular coat of arms centred at the green/red boundary.
"""
import colorsys
import random
from pathlib import Path
from PIL import Image

random.seed(41)

OUT = Path("data/logo/mosaic/portuguese-flag-lowres-4x5.png")
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

TILE = 200
COLS = 15
ROWS = 19                      # 4 extra rows above the original 10 + 5 below
W = COLS * TILE                # 3000
INTERNAL_H = ROWS * TILE       # 3800
FINAL_H = int(W * 5 / 4)       # 3750 — exact 4:5 after centre crop
CROP_TOP = (INTERNAL_H - FINAL_H) // 2   # 25 px trimmed top + bottom

# Square coat of arms (5x5) kept at the original 15x10 flag's centre.
# In the new 19-row layout that flag region occupies rows 4..13, so the
# COA centre shifts from row 5 → row 9.
COA_CX, COA_CY = 6, 9
COA_R = 2

# Target tones from the actual Portuguese flag — used to filter each bucket
# down to the samples closest in colour so each region reads cohesively.
PT_GREEN = (0, 102, 51)
PT_RED = (218, 41, 28)
PT_YELLOW = (255, 200, 0)

# How many samples to keep per bucket (closest to target).
TOP_N_PER_BUCKET = 14

# Drop samples whose internal contrast is above this — kills dramatic
# fabric drapes, chair / prop shots, and busy patterns. Computed over the
# whole image (max across luminance + R/G/B std-dev).
TEXTURE_STD_MAX = 22.0


def collect_samples():
    paths = []
    for root in SAMPLE_ROOTS:
        if root.exists():
            paths.extend(sorted(root.glob("*.jpg")))
            paths.extend(sorted(root.glob("*.jpeg")))
    return paths


def measure(path: Path):
    """Return (rgb_center, texture_score).

    - rgb_center: average colour of the tight centre (used for matching).
    - texture_score: max(luminance_std, R_std, G_std, B_std) over the WHOLE
      image — catches drape/prop shots whose secondary colours live at the
      edges or whose folds shift only one channel (e.g. pink↔green).
    """
    img = Image.open(path).convert("RGB")
    w, h = img.size

    # Centre crop for colour matching.
    center = img.crop(
        (int(w * 0.35), int(h * 0.35), int(w * 0.65), int(h * 0.65))
    ).resize((20, 20))
    cpx = [
        (r, g, b)
        for r, g, b in center.getdata()
        if not (r > 240 and g > 240 and b > 240) and not (r < 6 and g < 6 and b < 6)
    ]
    if not cpx:
        cpx = list(center.getdata())
    cn = len(cpx)
    rgb = (
        sum(p[0] for p in cpx) / cn,
        sum(p[1] for p in cpx) / cn,
        sum(p[2] for p in cpx) / cn,
    )

    # Whole-image sample for texture analysis (40x40 downscale).
    full = img.resize((40, 40)).getdata()
    fpx = [
        (r, g, b)
        for r, g, b in full
        if not (r > 240 and g > 240 and b > 240) and not (r < 6 and g < 6 and b < 6)
    ]
    if not fpx:
        fpx = list(full)
    fn = len(fpx)
    rs = [p[0] for p in fpx]
    gs = [p[1] for p in fpx]
    bs = [p[2] for p in fpx]
    lums = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in fpx]
    def std(xs):
        m = sum(xs) / len(xs)
        return (sum((x - m) ** 2 for x in xs) / len(xs)) ** 0.5
    texture = max(std(lums), std(rs), std(gs), std(bs))
    return rgb, texture


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
    return None


def in_coa(gx, gy):
    return abs(gx - COA_CX) <= COA_R and abs(gy - COA_CY) <= COA_R


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
    measured = {"green": [], "red": [], "yellow": []}
    dropped_textured = 0
    for p in samples:
        try:
            rgb, std = measure(p)
            if std > TEXTURE_STD_MAX:
                dropped_textured += 1
                continue
            bucket = classify_sample(rgb)
            if bucket:
                measured[bucket].append((p, rgb))
        except Exception:
            pass
    print(f"dropped {dropped_textured} samples with texture std > {TEXTURE_STD_MAX}")

    targets = {"green": PT_GREEN, "red": PT_RED, "yellow": PT_YELLOW}
    pools = {}
    for bucket, items in measured.items():
        items.sort(
            key=lambda pr: sum(
                (a - b) ** 2 for a, b in zip(pr[1], targets[bucket])
            )
        )
        pools[bucket] = [p for p, _ in items[:TOP_N_PER_BUCKET]]
        kept = pools[bucket]
        print(
            f"  {bucket}: {len(items)} candidates → kept closest {len(kept)} to "
            f"{targets[bucket]}"
        )

    rng = random.Random(41)
    queues = {b: RoundRobin(p, rng) for b, p in pools.items()}

    canvas = Image.new("RGB", (W, INTERNAL_H), (255, 255, 255))
    green_split_x = int(COLS * 0.40)
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
            canvas.paste(tile_from(path), (gx * TILE, gy * TILE))

    # Centre-crop the 3000x3800 build to exactly 3000x3750 (4:5).
    final = canvas.crop((0, CROP_TOP, W, CROP_TOP + FINAL_H))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT)
    print(
        f"saved {OUT} ({W}x{FINAL_H} = 4:5)  "
        f"cells: green={n_green}, red={n_red}, coa={n_coa}"
    )


if __name__ == "__main__":
    main()

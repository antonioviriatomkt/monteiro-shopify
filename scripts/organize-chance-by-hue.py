#!/usr/bin/env python3
"""Organize CHANCE sample images into 7 hue-based folders.

Strategy:
- Sample center 40% of each image (avoids white border).
- Filter near-white / near-black pixels (background bleed).
- Compute median R,G,B → HSV.
- Bucket by hue (6 hue ranges + neutrals bucket = 7 folders).
"""
import colorsys
import shutil
import sys
from pathlib import Path
from statistics import median
from PIL import Image

SRC = Path("data/chance-samples")
DST = Path("data/chance-samples/by-hue")

BUCKETS = [
    "1-neutrals",
    "2-reds-pinks",
    "3-oranges-yellows",
    "4-greens",
    "5-teals",
    "6-blues",
    "7-purples",
]


def classify(r: int, g: int, b: int) -> str:
    # 0..1 RGB
    rf, gf, bf = r / 255, g / 255, b / 255
    h, s, v = colorsys.rgb_to_hsv(rf, gf, bf)
    # Neutrals: low saturation OR very low value
    if s < 0.15 or v < 0.10:
        return "1-neutrals"
    hue = h * 360.0
    if hue >= 320 or hue < 25:
        return "2-reds-pinks"
    if hue < 70:
        return "3-oranges-yellows"
    if hue < 160:
        return "4-greens"
    if hue < 200:
        return "5-teals"
    if hue < 260:
        return "6-blues"
    return "7-purples"


def sample_color(img_path: Path):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    # crop center 40%
    cx0, cy0 = int(w * 0.30), int(h * 0.30)
    cx1, cy1 = int(w * 0.70), int(h * 0.70)
    crop = img.crop((cx0, cy0, cx1, cy1))
    # downscale to keep cost low
    crop = crop.resize((40, 40))
    pixels = list(crop.getdata())
    # Filter near-white (>240,240,240) and near-black (<15,15,15)
    filtered = [
        (r, g, b)
        for (r, g, b) in pixels
        if not (r > 240 and g > 240 and b > 240) and not (r < 15 and g < 15 and b < 15)
    ]
    if not filtered:
        filtered = pixels
    rs = [p[0] for p in filtered]
    gs = [p[1] for p in filtered]
    bs = [p[2] for p in filtered]
    return int(median(rs)), int(median(gs)), int(median(bs))


def main():
    if not SRC.exists():
        print(f"source folder not found: {SRC}", file=sys.stderr)
        sys.exit(1)

    for b in BUCKETS:
        (DST / b).mkdir(parents=True, exist_ok=True)

    files = sorted(SRC.glob("*.jpg")) + sorted(SRC.glob("*.JPG"))
    counts = {b: 0 for b in BUCKETS}
    rows = []

    for i, f in enumerate(files, 1):
        try:
            r, g, b = sample_color(f)
        except Exception as e:
            print(f"skip {f.name}: {e}", file=sys.stderr)
            continue
        bucket = classify(r, g, b)
        shutil.copy2(f, DST / bucket / f.name)
        counts[bucket] += 1
        rows.append((f.name, bucket, r, g, b))
        if i % 30 == 0 or i == len(files):
            print(f"processed {i}/{len(files)}")

    # Manifest CSV
    manifest = DST / "_classification.csv"
    with manifest.open("w") as out:
        out.write("filename,bucket,r,g,b\n")
        for name, bucket, r, g, b in rows:
            out.write(f"{name},{bucket},{r},{g},{b}\n")

    print("\n=== bucket counts ===")
    for b in BUCKETS:
        print(f"  {b:25s} {counts[b]}")
    print(f"\nTotal classified: {sum(counts.values())} / {len(files)}")
    print(f"Output: {DST}/")
    print(f"Manifest: {manifest}")


if __name__ == "__main__":
    main()

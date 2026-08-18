# CHANCE 2.0 — colours per grade

**Source:** Ivana (verbal, 2026-07-13). **Provisional — verify against the CHANCE 2.0 catalogue (DC 073.01)** before building.
**Key correction:** each grade has its **own curated colour range** — it is NOT "all 236 across every grade". Only **Classic** carries the full 236. This is what the per-grade Colour variant option must reflect.

| Grade | # colours | Notes |
|---|---|---|
| Classic | **236** | all in stock service; full list not yet provided — **needed for build** |
| Crib 5 (Portus) | **22** | list below |
| Crib 7 / B1 (Prosoft) | **9** | list below |
| Outdoor (Ocean) | **~39** | 40 listed but "Pure" appears twice — **confirm duplicate** |
| Mediflex (Mediflex) | **37** | 3 colour renames (see below) |
| Bioblend (new, from Peel) | **8** | = the 8 Peel colours, rendered in the Chance texture |

> Old→grade source mapping (Portus→Crib 5, Prosoft→Crib 7/B1, Ocean→Outdoor, Mediflex→Mediflex) is implied but **cross-check each old product's colours against the grade list before firing the 301s**.

---

## Bioblend (8)
New collection **based on Peel** — same chestnut-peel process (chestnut peels); what changes is the **texture** and possibly the **specs** (confirm in the CHANCE 2.0 catalogue). Colours = the **8 Peel colours**, rendered in the Chance texture. **Peel collection stays separate → NO redirect.**

**The 8 colours** (Peel range, from the Peel datasheet DC 024 / mf-knowledge `products/collections/peel.md`): **Offwhite · Salt · Beaver · Cream · Blush · Sage · Cielo · Black.** Confirm these carry over as the Bioblend palette (may be re-curated with the Chance texture).

> **Cross-check vs the old collections (mf-knowledge):** the CHANCE 2.0 grades carry **curated** palettes, generally smaller than the predecessor collections — Prosoft **24 shades → Crib 7|B1 9**; Portus **34 → Crib 5 22**; Mediflex **36 → 37** (Ivana adds "Bohemian"; "Cube"="Cub"). Ivana's per-grade lists are authoritative for CHANCE 2.0; the old lists are the source ranges. **Still no hex/swatch anywhere in the OKF** — only colour names; the swatch source remains an open decision (the old per-collection datasheet PDFs on Dropbox may hold colour cards).

## Crib 5 (22)
ALMOND · Baltic · Black · BOSQUE · Camel · Carmin · DEEP CS · Expresso · FORTRESS · Greenery · Lava · Luggage · Marron Avantg · Negro · PAPAYA · Pesto · PEWTER · Platinum · Pure White · Saphir · Spice · Stone

## Crib 7 / B1 (9)
Black · CYPRESS · Lead · NAVY · Pearl · REDWOOD · Stadion Platin · STONE · TAUPE

## Outdoor (~39 — confirm "Pure" duplicate)
Alluring · Bahamas · Blue · Cameo · Celery · Celestial · Cityscape · Daphne · Deep · Fir · Gingerbread · Green · Happy · Harbour · Havana · Latte · Loyal · Middleton · Mothwing · Navy · Peach · Pure · Pure *(⚠ listed twice — duplicate?)* · Radiant · Reef · Reflection · Rockwood · Rose · Ruby · Santorini · Sienna · Stopsign · Tallow · Teal · Tiffany · Toasted · Trout · Tyre · Zen · Zinc

## Mediflex (37 — 3 renames)
Anderson · Arpad · Artic · Aurora · Bohemian · Boris · Brisa · Carnelian · Cider · Cinnabar · Cube · Dahlia · **Desert → DUNE** · Ecru · Egret · Ether · Evergreen · Fog · Golden · Grenadine · Igor · James · Lime · Lucas · Lyons · Middleton · Mood · **Ocean → LAGOON** · Pristine · Reflex · Rice · Salt · **Shale → OASIS** · Victoria · Viridis · Visionary · Whisper

**Renames (old → new):** Desert → DUNE · Ocean → LAGOON · Shale → OASIS. Use the new name as the variant/swatch label; keep the old name only if existing SKUs/inventory reference it.

---

## Build implications
- The earlier "shared 236-colour metaobject linked to every grade" simplifies: build a master **CHANCE colours metaobject** as the **union** of all colours (Classic's 236 should cover most; add any performance-grade colour not already in it), then **link only that grade's subset** to each grade product's Colour option. Same-named colours across grades (e.g. Middleton, Navy, Stone, Black) may render differently per substrate — confirm whether they share a hex/swatch or need per-grade entries.
- SEO approach is unchanged: **colour = a variant** (canonicals to the grade page), never its own URL — no thin per-colour pages; equity stays on the 6 grade pages.
- Counts are all well under Shopify's limits (2,048 variants/product; 236 < the 250 theme-render threshold), so standard variant/swatch rendering works for every grade including Classic.

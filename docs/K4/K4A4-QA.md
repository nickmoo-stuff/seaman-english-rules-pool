# K4A.4 — 0.17.58/build 1588

Baseline: `d7d3bff2c0ccf6b408442c41a29f69d16e2599db`. Branch: `stage4-k4-five-circles-of-hell`.

## Implemented

- Hedgehog scale entrance interpolates from zero to normal over 4.8 seconds. The shared rule did not previously transition scale reliably; the new specific rule does. Dialogue timing and speaker motion remain unchanged.
- Chapter 5 uses the existing chapter heading hierarchy: locked, non-interactive, “In development!”, no opponent records.
- Lucy uses 40% of the previous Theatre width and responsive height fit. TMECI uses 125% of each previous appearance width, including the separate Lucy-ending layout. Bottom anchors and proportions remain. Responsive fitting caps enlarged artwork within short screens.
- FYWAP, Socks and Sandals, TMECI and Lucy cue descriptions describe their appearance rather than AI abilities.
- Version/build and both cache namespaces advanced. Native billing, saves, authoritative dialogue and approved artwork bytes unchanged.

## Approved artwork replacement

The uploaded `edited-SAS.zip` contains `edited-SAS.png` (1043×1508 RGBA). Its bytes are copied unchanged as `03_Socks_And_Sandals_approved.png`; SHA-256 `5c57d1b1e95bb1c781a9b90ce531de5df960a28356e68aeeea51000838ec3834`. Alpha spans 0–255. The obsolete RGB image is removed; generated scene/catalogue references, asset manifest and both offline inventories use the replacement. Existing dimensions, scene anchors and bobbing remain unchanged. No missing artwork blockers remain.

## Automated results

Evidence: `qa/k4a4/`.

- `k4a4.cjs` PASS: chapter heading/non-interaction/no opponents, four exact cue descriptions, all relevant scene widths, actual browser scale-transition interpolation/duration, character bounds at 1366×900, 390×844 and 740×360, no page errors. Screenshots inspected include short-landscape Lucy ending.
- `k4a2.cjs` PASS: speaker-only bobbing, FYWAP effects, rainbow dialogue, rewards/concealment/persistence and Lucy effects/audio parameters. Chapter 5 assertion updated for its requested chapter-level structure.
- `k4.cjs` PASS: ten Theatre handoffs, engine wins, progression/rewards/save persistence, effects and entitlement expiry.
- `campaign-regression.cjs` PASS: Chapters 1–3 fixtures, Pool School, save/cosmetic/supporter preservation.
- `unlock-all-pirates.cjs` PASS: all 26 current opponents, no fabricated progress/history, first-time sequences, future catalogue fixture, reload, release/native rejection. Native ownership replies are fixtures.
- `k4-consistency.py` PASS: all JavaScript syntax, asset hashes/cache inventory, deterministic catalogue, version/build, save schema and unchanged purchases-disabled native code.
- `k4-offline.cjs` PASS: offline reload and all K4 media served from cache, including the replacement cutout.
- `k4a4-artwork.py` PASS: all five alpha cutouts, exact Socks hash, unchanged other cutouts and obsolete-file removal.
- `k4a4-cutouts.cjs` PASS: all five loaded Theatre images have visible and transparent pixels, finish their entrances and render over the intended backgrounds.
- `artwork.json`: approved Hedgehog/FYWAP/TMECI bytes match the baseline and contain alpha-zero pixels. Socks and Sandals matches the exact supplied PNG and has genuine alpha transparency.

Tests use Chromium over HTTP. Physical Android/iOS and Windows Chrome direct-file gameplay were not performed. No deployment, Android build or purchase activation has occurred. The consolidated source ZIP is generated from the final clean commit and verified by the packaging tool.

## Desktop/mobile QA

1. Check Socks and Sandals over the fiery background; no baked rectangle. Check the existing three approved cutouts.
2. Watch Hedgehog’s slow entrance. Check tiny Lucy and enlarged TMECI in introductions, victories and Lucy’s ending, on desktop/portrait/short landscape; dialogue must remain unobstructed.
3. Check Chapter 5 is a locked heading, read the four cue descriptions, and exercise Unlock All Pirates on a save with unseen introductions. Existing progress must remain unchanged.

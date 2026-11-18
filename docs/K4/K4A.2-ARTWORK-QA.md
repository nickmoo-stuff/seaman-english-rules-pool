# K4A.2 final artwork refresh — 0.17.56/build 1586

Baseline: `3a54fffd02555a2c98b75730b5f2d8823622e671` (0.17.55/build 1585). Branch: `stage4-k4-five-circles-of-hell`. This is an artwork-only K4A.2 follow-up, with no new milestone, deployment, Android build, native patch or purchase activation.

## Exact replacements

| Supplied original in threePNGs.zip | Active web asset | Dimensions | Alpha range |
|---|---|---|---|
| edited-vile-blue.png | 01_Vile_Blue_Hedgehog_approved.png | 1254 × 1254 | 0–255 |
| edited-filthy-youth.png | 02_Filthy_Youth_With_Phone_approved.png | 1024 × 1536 | 0–254 |
| edited-most-evil-creature.png | 04_Most_Evil_Creature_Imaginable_approved.png | 1024 × 1536 | 0–255 |

All three are RGBA PNGs, copied byte-for-byte with no re-encoding, redraw, colour conversion, alpha normalization or resizing. Youth's supplied maximum alpha of 254 is preserved exactly. Archive and individual file hashes, provenance, dimensions and alpha ranges are recorded in asset-manifest.json.

The older corresponding PNGs are removed from the active `www/assets/k4` directory. Approved files use new URLs in the roster/portrait and all Theatre appearances, including TMECI in Lucy's outro. Both worker inventories and cache versions are updated, so old cached URLs cannot be reused for these characters. The historical source files remain recoverable through Git history.

Character sizing/position/anchor fields, animation mechanisms, dialogue and staging are unchanged. The renderer preserves each supplied image's natural aspect ratio; the new Hedgehog source has a square canvas. No padding or stretching was introduced to imitate the old canvas. Gameplay/AI/physics/rewards/supporter/native sources remain unchanged; game.js differs only in version/build constants. No changes were made to Socks, Lucy or the other approved assets.

## Focused verification

All five performed suites passed. Outputs and screenshots: `qa/K4A.2-artwork/`.

1. `tests/k4-artwork.py <original threePNGs.zip>` checks exact source bytes, SHA-256, real alpha/fringes, obsolete asset removal and both cache inventories. It compares every web file against the baseline, allowing only the three replacements/references, version metadata and documentation. It also verifies the unchanged catalogue generator and native Java.
2. `tests/k4-artwork.cjs` loads the six affected intro/victory scenes and Lucy's outro, verifies approved image URLs, decoded transparency and background compositing, checks desktop/short-landscape containment and usable Next, and verifies no save changes, runtime errors or missing media.
3. `tests/k4-consistency.py` checks JavaScript syntax, version/build/cache consistency, generated catalogue reproducibility, integrity hashes and unchanged save schema/native billing.
4. `tests/k4.cjs` checks exact dialogue, all ten Theatre handoffs, real-engine fixture wins, first-win rewards/completion trophy, replay/reload preservation and effects.
5. `tests/k4-offline.cjs` checks offline reload and cached scene artwork, shared dependencies, animation and soundtrack.

Visual screenshots were inspected over the fiery backgrounds: all three approved cutouts display without their obsolete rectangular backgrounds. Browser checks used Chromium over HTTP; actual Windows Chrome direct-file navigation remains unverified here because the managed browser blocks file URLs. No hardware or Android build tests are claimed.

## Short desktop QA checklist

1. Extract the fresh GitHub ZIP and open `www/index.html` directly. Confirm **0.17.56/build 1586**, existing save progress and developer supporter access.
2. View Hedgehog, Youth and TMECI intros/victories. Check the corrected REBOOK trainers, clean transparent edges and fiery scenery showing around each cutout. Resize the window and confirm the existing sizing/positioning, speaking animation and phone effects remain appropriate.
3. Check TMECI's appearance in Lucy's outro, then replay/reload and confirm that dialogue, progress, trophies and the remaining K4A.2 behaviour are retained. When using HTTP/PWA testing, check offline after one complete online load.

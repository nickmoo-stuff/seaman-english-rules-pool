# K4B — Spinball Wizard — 0.17.59/build 1589

Baseline: approved K4A.4 `63f1b4dbe1f084eb84db1318c15bc0d1735f4c1b`. Branch: `stage4-k4b-spinball-wizard`. Authoritative request and dialogue are preserved in `K4B-APPROVED-BRIEF.md`.

## Implementation

- Optional Level 5 Chapter 4 supporter boss, separate from the five main circles. Existing Chapter 3/supporter gate applies; no Lucy victory is required. Temporary web developer supporter access works; catalogue-wide Unlock All Pirates includes all 27 available opponents. Release/native cheat rejection is retained.
- Uses the exact approved `09_spinball_wizard_2s.webp` and Lair background. The supplied WebP was already byte-identical to this asset. No redraw, re-encoding, new still or animation conversion: 16 unique transparent frames, 125 ms each, two seconds per infinite loop. Normal Theatre/typewriter/speaker motion remains. Speaker names are expanded to Spinball Wizard throughout; the final `*nods*` is stored as a silent stage direction and enacted with a short nod/bounce, with no spoken text or speaking wobble.
- Uses the existing Level 5 AI with a separate show-off personality. Every actual AI strike, including breaks and fallback shots, applies meaningful physical contact from an eight-shot cycle: follow, right, draw, left and four combinations. Only his own strikes advance the cycle; human turns do not skip spin types. Silent forecasts use the same contact as execution. The planner prefers validated cushion flourishes periodically and increases combination-shot preference. Existing legal-target and early-black/scratch validation remains; no physics rules or live coefficients are changed. Human shot contact is independent, and Wizard AI shots retain any selected human spin.
- A focused forecast test exposed residual backspin being stopped early by the silent K4 planner. Its stopping condition now matches the existing live engine's residual-spin condition. This corrects forecasts, not physical gameplay. Existing K4 AI fixtures pass.
- Elaborate cosmetic staff: purple pulsating glow, cyan moving spiral, crystal/rune decorations and translucent orbs revolving around the handle. The shaft/tip remain aligned. Gameplay and the live Cosmetics preview use the same renderer. No physics/power/accuracy/spin modifiers.
- Uses the existing Mysterious Cave (`larper`) table during the match, without granting or changing that cosmetic's ownership conditions. Victory awards The Dizzy Wizzy and the staff through existing durable win evidence. Locked trophy details stay hidden. Main Chapter 4 completion still tests only the five original story opponents. Interrupted Wizard victory Theatre can resume through the existing pending-victory mechanism.
- Version/build and both offline cache namespaces advanced. All K4A.4 artwork bytes, main dialogue, save schema and native billing sources are preserved. Purchases remain disabled.

## Performed checks

Logs and animation evidence are in `qa/k4b/`.

1. `k4b.cjs` PASS: fresh/unpaid/development supporter gates without Lucy win; visible Challenge click; exact authored scripts/full names; actual WebP screenshot changes; silent nod; Cave/staff assignment; eight real planner/engine spin fixtures with legal contact, pot or subsequent cushion, cue survival and final-position agreement; human spin preservation; real legal cushion flourish and opening-break spin; engine-resolved human black win; independent trophy/cue, save reload and rematch; shared catalogue/gameplay renderer; no page errors or failed requests.
2. `k4b-assets.py` PASS: all artwork byte-identical to approved K4A.4; exact animated WebP timing, frames, looping and alpha. No replacement of approved cutouts.
3. `theatre-responsive.cjs` PASS with Wizard scene prefix: both scenes and every dialogue beat at 1366×768, 1920×1080, 390×844, 740×360 and 855×384; portraits decoded, Next reachable, no short-screen clipping or preview save changes.
4. `k4-entitlement.cjs` PASS on a release projection: native bridge fixtures for verified owner, not owned, pending, unavailable and checking, including Wizard access; expiry/requery/revocation, retained progress and no payments.
5. `unlock-all-pirates.cjs` PASS: 27 current playable opponents including Wizard; no invented defeats/selection/seen flags; real first-time sequences; reload/J; future catalogue fixtures; release/native rejection.
6. `k4.cjs` PASS: original verbatim dialogue/art, five-circle progression, ten real Theatre handoffs, engine-resolved wins, rewards/save persistence, effects and entitlement expiry. Optional access expectation now correctly permits Wizard.
7. `k4-ai.cjs` PASS: Socks/TMECI/Lucy real forecasts and strikes, Lucy chained pots and unchanged Cyclops tuning.
8. `k4a2.cjs` PASS: existing bobbing/speaker behaviour, FYWAP effects/dialogue, TMECI rainbow, main rewards and Chapter 5, Lucy darkness/pockets/cannon.
9. `k4a4.cjs` PASS: prior layout/art-size/cosmetic-description corrections and 4.8-second entrance.
10. `campaign-regression.cjs` PASS: Pool School, Chapters 1–3 engine fixtures and save/cosmetic/supporter preservation.
11. `spin-physics.cjs` PASS: twelve exact zero-spin baseline cases plus follow/draw, mirrored side impulses, combinations/strength/decay, integration rates and pot/foul rules.
12. `k4-mobile.cjs` PASS: existing mobile touch-confirm/real-shot controls/effects at 390×844, 855×384 and 740×360.
13. `k4-offline.cjs` PASS: offline reload and all K4 scene/code/animation/audio dependencies served from cache.
14. `k4-consistency.py` PASS: all JavaScript syntax, version/build/dependencies, approved asset hashes/cache inventory, deterministic catalogue generation, unchanged save schema and purchases-disabled native sources.

The initial new browser test needed its roster visibility setup corrected and animated-image comparison changed from canvas drawing (which used the default frame) to actual screenshots. The initial spin regression invocation used an inactive default server; it passed with the correct HTTP URL. No product issues were hidden by relaxing physics assertions; the backspin forecast mismatch was fixed and the eight-position comparison passes.

## Limits

Chromium automation uses HTTP, deterministic gameplay fixtures and native ownership mocks. Actual Windows Chrome `file://`, iOS Safari hardware, physical Android performance and Google Play purchases/restoration have not been tested. No Android wrapper edits/build, signing, deployment, merge or purchase activation occurred. Human assessment of difficulty, humour, animation and staff appearance remains part of desktop/mobile QA. The source candidate is a development build, not a live-site deployment.

## Manual desktop/mobile QA

1. Extract the ZIP, open `www/index.html` in desktop Chrome and check 0.17.59/build 1589. Import a copy of an existing save if necessary. Confirm Chapter 5 remains a locked chapter heading.
2. With Chapter 3 complete, grant temporary development supporter access in Settings → K. Challenge Wizard before defeating Lucy. Without ownership/test access, confirm he is locked. Unlock All Pirates should also expose him without marking him defeated or introduced.
3. Watch the entire introduction: full speaker name, exact dialogue, rotating transparent artwork on his Lair and a silent final nod. Check desktop, portrait and short landscape; Next/Begin match must stay reachable.
4. Play on the Cave table. Observe different meaningful spin on his turns, including combinations; try your own spin and placement/power controls. Judge the Level 5 show-off difficulty and legal play.
5. Inspect the pulsing purple/cyan staff in his match and, after winning, Cosmetics. Win normally; read victory dialogue and check The Dizzy Wizzy/staff persist after reload. A rematch should work. His win must not finish Five Circles of Hell or unlock the Cave cosmetic.
6. Recheck Lucy/TMECI sizes, Hedgehog entrance, Socks transparency, FYWAP effects and ordinary campaign/multiplayer play. Reopen after offline caching and check the Wizard animation still plays.

# v1.0.1 / build 1597 browser maintenance candidate

Branch `maintenance-v1.0.1`, based on published browser v1.0.0 merge `a3ce560`.
Approved maintenance game source: development commit `9b74c5fa0208bda44d1a0ec8bf6e68d859ec303f`, `www` tree, retaining the latest approved About credits from `3ebb59d`. Full findings/device QA: [development report](https://github.com/nickmoo-stuff/seamen-pool-development/blob/maintenance-v1.0.1/docs/v1.0.1/REPORT.md).

The new immutable `releases/v1.0.1-b1597-qa2/` contains all 102 maintenance source files, using the existing explicit browser audio/advisory/metadata projection and one verified root worker. The copied root `www` and both published previous release directories remain unchanged. No v1.0.0 immutable asset/hash is edited. The active launcher/worker consistently select v1.0.1/build 1597; 93 offline SHA-256 entries, release checksums and cache fingerprint are regenerated. Installed identity, scope/start URL, save origin and all storage keys remain unchanged. Previous-cache recovery prefers the newest available complete cached game.

P1–P6 cover bounded native ownership continuity and late roster/profile replies; scoped return-to-opponent scrolling; human power independent of AI execution; compact expandable opponent presentation; touch cancellation/vertical-takeover/rotation rollback and deliberate shooting; and the complete chronological log through Game menu. The public web still has no native billing bridge/purchase authority and does not trust editable ownership flags. No Android-native changes or new paid entitlements are introduced.

## QA Round 2

Same v1.0.1/build1597. Aim/power are now matching 2×2 grids. Portrait Play Shot spans the controls, optional slider/lock share one row, and opponent follows all controls. Landscape opponent occupies the central header slot; angle readout shares the helm heading. Expanded opponent/spin presets overlay the table without moving essential controls. The obsolete static gold ornament and inline detailed log are removed; Game menu retains the full paused/copyable log. The status panel sizes to its text without a tiny internal scrollbar. Billing, saves, rules and P1–P6 behaviour remain preserved.

The QA2 asset ID is distinct from QA1 despite identical app version/build. Both QA1 and published previous release directories remain immutable so a same-version update cannot silently reuse the older verified cache.

## Verification

- **7 PWA scenario groups PASS / 0 FAIL:** fresh install and all resource URLs; offline root restart and an actual local shot; real v1.0.0 worker/cache upgrade with active frame retained until explicit Restart; QA1-to-QA2 same-version asset update with saves retained; corrupt, missing and interrupted installation rejection with old offline/save recovery and complete retry; fresh bad-hash rejection without an unverified fallback.
- **7 mobile/media groups PASS / 0 FAIL:** Chromium iPhone/iPad UA, touch, portrait/landscape and synthetic safe-area profiles; gesture-restricted audio/retry, media promise race and Home Screen metadata. This is **not actual iOS Safari hardware**.
- **2 static/integrity groups PASS / 0 FAIL:** exact pinned maintenance projection and frozen public v1.0.0/native/source trees; all offline hashes, release checksums, installed identity and JavaScript syntax; QA1 immutable release remains byte-identical.
- **7 QA2 layout/touch profiles PASS / 0 FAIL:** 375×667 through 834×1194 portrait; 640×320 through 855×384 landscape, synthetic safe areas, exact row order, full-width Play Shot, slider preference/lock, expansion, log/back/resume, spin, rotation and real deliberate shot.
- Raw logs/results: `qa/v1.0.1/`. The development candidate separately passed 59 suites, failed none and has one policy-blocked `file://` NOT TESTED. Real Android/Safari hardware, signing/AAB and live Play ownership are not simulated passes.

Run `python tests/approved-build.py`. Regeneration uses `python tools/prepare-maintenance-browser.py` and requires the pinned development commit in sibling `seamen-pool-development` (build-time only, no runtime Git dependency). Local upgrade simulator: `python tests/maintenance-pwa-server.py`, then `node tests/maintenance-pwa.cjs`. Public projection touch/media run: `TEST_URL=http://127.0.0.1:8053/pool/releases/v1.0.1-b1597-qa2/ node tests/ios-profile.cjs`. Stop the fault-injection suite before running unrelated browser suites on this same server.

## Approval and real-device checks

1. Review this PR and the development source candidate. Do not merge until approved. Existing Pages origin/root and homepage link remain; no DNS/configuration change is required.
2. On real iPhone/iPad Safari and Android WebView, exercise compact/expanded panels, power, helm/spin, scrolling, cancelled gestures, orientation/toolbar resizing and deliberate shots. Very short portrait heights under 600 CSS pixels use a safe scrolling fallback.
3. After a separately approved deployment, update an existing v1.0.0 PWA/profile without clearing data. Confirm saved name/progress/trophies/cosmetics/settings and offline restart. Also check a fresh private window. Main soundtrack music is streamed; offline soundtrack availability is not guaranteed.
4. Web purchase controls remain unavailable. Test genuine existing Google Play ownership only in the Android candidate, not via editable web saves or a new transaction.

No merge, Pages deployment, Android build/upload, transaction or billing activation was performed. GitHub API/PR creation and live-site inspection may remain unavailable under the environment network policy; branch review can still be opened through GitHub's compare view.

Test-harness correction: the initial legacy iOS-profile slider assertion landed coincidentally on its starting value (70%) after dragging from the range centre with the revised geometry. A longer in-bounds touch drag now verifies actual range response; no slider/game implementation change was needed. The initial raw result is retained. Physical iOS Safari remains unverified.

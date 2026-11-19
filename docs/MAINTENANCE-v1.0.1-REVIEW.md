# v1.0.1 / build 1596 browser maintenance candidate

Branch `maintenance-v1.0.1`, based on published browser v1.0.0 merge `a3ce560`.
Approved maintenance game source: development commit `cbb552b3d1bcf2aa4d2848cda03e63dd58c0ee6f`, `www` tree. Full findings/device QA: [development report](https://github.com/nickmoo-stuff/seamen-pool-development/blob/maintenance-v1.0.1/docs/v1.0.1/REPORT.md).

The new immutable `releases/v1.0.1-b1596/` contains all 102 maintenance source files, using the existing explicit browser audio/advisory/metadata projection and one verified root worker. The copied root `www` and both published previous release directories remain unchanged. No v1.0.0 immutable asset/hash is edited. The active launcher/worker consistently select v1.0.1/build 1596; 93 offline SHA-256 entries, release checksums and cache fingerprint are regenerated. Installed identity, scope/start URL, save origin and all storage keys remain unchanged. Previous-cache recovery prefers the newest available complete cached game.

P1–P6 cover bounded native ownership continuity and late roster/profile replies; scoped return-to-opponent scrolling; human power independent of AI execution; compact expandable opponent presentation; touch cancellation/vertical-takeover/rotation rollback and deliberate shooting; and a collapsed chronological log. The public web still has no native billing bridge/purchase authority and does not trust editable ownership flags. No Android-native changes or new paid entitlements are introduced.

## Verification

- **7 PWA scenario groups PASS / 0 FAIL:** fresh install and all resource URLs; offline root restart and an actual local shot; real v1.0.0 worker/cache upgrade with active frame retained until explicit Restart; corrupt, missing and interrupted installation rejection with old offline/save recovery and complete retry; fresh bad-hash rejection without an unverified fallback.
- **7 mobile/media groups PASS / 0 FAIL:** Chromium iPhone/iPad UA, touch, portrait/landscape and synthetic safe-area profiles; gesture-restricted audio/retry, media promise race and Home Screen metadata. This is **not actual iOS Safari hardware**.
- **2 static/integrity groups PASS / 0 FAIL:** exact pinned maintenance projection and frozen public v1.0.0/native/source trees; all offline hashes, release checksums, installed identity and JavaScript syntax.
- Raw logs/results: `qa/v1.0.1/`. The development candidate separately passed 58 suites, failed none and has one policy-blocked `file://` NOT TESTED. Real Android/Safari hardware, signing/AAB and live Play ownership are not simulated passes.

Run `python tests/approved-build.py`. Regeneration uses `python tools/prepare-maintenance-browser.py` and requires the pinned development commit in sibling `seamen-pool-development` (build-time only, no runtime Git dependency). Local upgrade simulator: `python tests/maintenance-pwa-server.py`, then `node tests/maintenance-pwa.cjs`. Public projection touch/media run: `TEST_URL=http://127.0.0.1:8043/pool/releases/v1.0.1-b1596/ node tests/ios-profile.cjs`. Stop the fault-injection suite before running unrelated browser suites on this same server.

## Approval and real-device checks

1. Review this PR and the development source candidate. Do not merge until approved. Existing Pages origin/root and homepage link remain; no DNS/configuration change is required.
2. On real iPhone/iPad Safari and Android WebView, exercise compact/expanded panels, power, helm/spin, scrolling, cancelled gestures, orientation/toolbar resizing and deliberate shots. Very short portrait heights under 600 CSS pixels use a safe scrolling fallback.
3. After a separately approved deployment, update an existing v1.0.0 PWA/profile without clearing data. Confirm saved name/progress/trophies/cosmetics/settings and offline restart. Also check a fresh private window. Main soundtrack music is streamed; offline soundtrack availability is not guaranteed.
4. Web purchase controls remain unavailable. Test genuine existing Google Play ownership only in the Android candidate, not via editable web saves or a new transaction.

No merge, Pages deployment, Android build/upload, transaction or billing activation was performed. GitHub API/PR creation and live-site inspection may remain unavailable under the environment network policy; branch review can still be opened through GitHub's compare view.

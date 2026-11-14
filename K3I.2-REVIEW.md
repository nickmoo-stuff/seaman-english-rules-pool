# K3I.2 — Browser game review candidate

Source: approved **v0.17.52/build 1582**, development commit `aa7023364d48bf5d2c673b9aa9426f0089821ea0` (`stage3i-k3i1-lesson3-hotfix`).
Destination baseline: browser `main` commit `53db353` (v0.17.0/build 1530).
Review branch: `stage3i-k3i2-browser-release`. No merge, deployment or Play change has occurred.

## Complete game and browser-only changes

The **entire approved www tree (86 source files, all images/scenes/audio)** is under `releases/v0.17.52-b1582/`. The original public root boots that complete version, not a partial overlay. Old root code/assets are intentionally retained only for in-flight v0.17.0 clients and offline recovery. The main entry and installed manifest continue to use the same origin/scope/start URL/id; a versioned game URL does not change localStorage origin. Homepage browser-play links stay unchanged.

`tools/prepare-browser.py` copies the exact approved commit, enables release mode, and applies the explicit browser projection in `tools/browser_projection.py`:

- Game rules/physics, Chapters 1–3, all lessons including the **exact approved Lesson 3 correction**, trophies, cosmetics, saves and billing/entitlement guards are unchanged.
- Browser entry registers the root worker and references the root manifest, preserving installed PWA identity. Adds en-GB language, viewport-fit=cover and Apple Home Screen metadata while retaining approved icons/safe-area CSS.
- Media startup stays in the initial trusted click stack instead of a timer. Rejected playback stays non-blocking and gets a retry on the next pointer/key interaction; stale playback promises cannot pause or overwrite a newer track. These are browser-only compatibility adaptations; Android development/Alpha sources were not edited.
- Existing advisory detector/capability checks/native-container bypass are retained, with explicit Snapchat/TikTok/Bytedance indicators added to the existing Messenger/Facebook/Instagram/LINE/WebView markers. Normal mobile browsers are not treated as unsupported. The warning now gives optional normal-browser advice and recommends exporting a save before switching browser storage contexts.
- Fixed a verified presentation defect: mobile landscape CSS previously hid the warning through its general header-paragraph rule. The same warning paragraph now occupies a compact, scrollable header row. No modal, forced navigation, automatic reload or progress mutation is attached to it.

Purchases remain disabled. Browser play needs no Capacitor, billing bridge or Google account. Saved/imported local supporter flags do not confer current ownership. The complete audio library is shipped and referenced locally; soundtrack remains online-only for PWA caching as in the approved game.

## Coherent PWA installation/update/recovery

- The root worker imports a generated build inventory. Installation verifies **SHA-256 for all 77 offline entries** (runtime/CSS/HTML/manifest/icons, every portrait and scene; music is excluded). Runtime files are served from that complete build cache, rather than fetched independently from a changing deployment. Missing runtime resources fail explicitly, never with another build's HTML/JavaScript.
- Cache name contains the game version/build and bundle/worker fingerprint. A failed integrity check cannot activate a partial build. Failed new caches are removed; older cache/data are retained.
- Root bootstrap waits for a verified current-worker handshake before navigating to the immutable game directory, so an old network-first worker cannot serve mismatched new scripts. A fully installed waiting worker can be activated through the build handshake; this fixed the retry-after-interrupted-install case found during testing.
- Loaded old frames are not reloaded. The existing controller-change notice offers **Restart game**; an explicit restart or next session enters the complete new version. Old URLs/cache/assets stay valid for older loaded frames. If an update is incomplete, the bootstrap offers reconnect/retry or the cached previous game, without clearing progress.
- Root manifest `id`, `scope`, `start_url` remain unchanged. `.nojekyll` ensures the approved static bytes/hashes are served without a Jekyll transformation. No live Pages/DNS configuration was changed.

The verified offline install stores roughly 41 MiB of game resources (excluding about 48 MiB of soundtrack). Initial install needs network/storage space; slow or quota-limited devices may need retry. Old caches are intentionally retained during handover, not purged indiscriminately. Future releases must use a **new immutable build directory**, retain older live-client paths until safe cleanup is planned, and regenerate the full inventory. Do not edit a published versioned directory in place or deploy only selected files.

## Performed verification

- `python tests/approved-build.py`: all 86 approved source files match the source commit after only the explicit browser projection; complete inventory, literal assets/relative links, SHA256SUMS, every PWA hash and original installed identity/scope verified. No Android/native source modification or omitted game asset.
- JavaScript syntax checks: 12 generated release/worker scripts passed; inline bootstrap exercised by the browser suites. Custom changes pass whitespace checks; two inherited trailing-whitespace lines in imported about.js/game.js are retained to preserve approved source formatting.
- `node tests/browser-pwa.cjs`: actual **v0.17.0 source and worker** served at `/pool/`, with caches, a valid equipped cue, saved audio setting, statistics, progression/trophies and old portable save. Confirms old offline startup; update-ready notification; old active frame survives unchanged until explicit restart; upgrade to release v0.17.52; statistics/earned items/selection/settings retained; legitimate missing-evidence reconciliation may add achievements; old exported save imports; no Capacitor dependency or local supporter grant; root offline restart and a real local shot. A deliberately truncated supporter.js (HTTP 200 with wrong bytes) rejects the new build; old cache/game/save recover offline, then the complete deployment retries successfully. Same worker/root/subpath as a project Pages deployment; no production site used.
- Approved development test harness pointed at this **actual browser release**: `lesson-three-hotfix.cjs` passes both 390×844 and 855×384 with all Lesson 3 success/failure cases, real mobile placement, immediate red-pot completion without black, tick/trophy persistence and career isolation. `pool-school.cjs` passes all five lessons/normal multiplayer tracking. `helm-responsive.cjs` passes mouse/touch portrait/landscape. `mobile-table-first.cjs` passes Pixel-sized 855×384 DPR 2.625, 844×390, 740×360, 960×540 and 844×340: panels, power/shot/fine aim, spin, touch cancellation, orientation and persistence. These are Chromium engine tests, not Android/iOS device tests.
- `node tests/browser-advisory.cjs`: **20 UA/capability fixtures** in Chromium. Safari iPhone/iPad desktop UA, Chrome, Firefox and modern Edge/iOS variants produce no advisory; Messenger/Facebook/Instagram/LINE/Snapchat/TikTok/Bytedance and Android WebView indicators do; missing-pointer capability warns; supported native WebView bypass is retained. Messenger-like portrait/landscape play shows a visible non-modal warning, usable real placement/shot, unchanged data from detection, and normal saved shot statistics after reload. These are UA fixtures, not executions inside the actual named browser apps; an app that completely masks its UA may not be identifiable.
- `node tests/ios-profile.cjs`: **Chromium simulations only** for iPhone portrait/landscape and iPad desktop-UA portrait/landscape. Real touch aiming/placement arrows/confirmation, power buttons/vertical slider, double-tap/drag/preset spin, no accidental shot, saved state after reload and no horizontal/gesture-induced scrolling pass. Chromium CDP synthetic notch/home-indicator insets verify control bounds and landscape height containment. A rejected-play fixture confirms no pre-gesture media call, trusted initial gesture, playsInline, non-blocking rejection and next-interaction retry. An asynchronous race fixture verifies that a stale play rejection cannot stop newer playback. Simulated standalone mode hides unsupported install UI and verifies Apple metadata/icon. This does **not** establish Safari audio/AHS behaviour.
- Local review screenshots captured after these changes and visually inspected: [browser landscape](review/browser-landscape.png), [Messenger-like advisory landscape](review/messenger-advisory-landscape.png). Captures use Chromium viewport/UA simulation, not iOS hardware.

The companion homepage branch has its own `K3I.2-REVIEW.md`, four viewport tests and screenshots. Its browser-play/support/privacy links and complete FAQ are preserved.

## Explicitly unverified / tooling limits

**No actual iPhone/iPad Safari PASS is claimed.** No iOS device or installed WebKit was available. Installing the Playwright WebKit engine failed because the environment denied the official download domains with HTTP 403 “Domain forbidden”; no policy bypass was attempted. Chromium iOS profiles/UA fixtures are not Safari.

Still requiring real iPhone/iPad Safari checks before confidence in that audience: touch and scroll/viewport behaviour with actual Safari chrome/keyboard/notches and rotation; audible playback after user interaction, mute/volume/interrupt/resume; Share → Add to Home Screen and launch; persistence across browser/Home Screen lifecycles and iOS storage/eviction policies; offline reload and a worker update/recovery on Safari. Saved data in an in-app browser and Safari can be separate; export/import before switching. No native iOS/App Store app is represented as available.

No real Firefox/Edge execution, Safari installation menu, acoustic output or live-host deployment has been tested here. External EPA/music/store links remain as approved, rather than claimed as newly live-network verified. Live HTTPS Pages delivery remains a publication-stage check.

Cloning/read access works, but GitHub rejected review-branch pushes to both destination repositories with **HTTP 403 (permission denied)**. GitHub API access is also Forbidden. No remote review branch or PR is claimed: the completed local branch is supplied as a verified Git bundle, alongside screenshots, until the connection has write access to these repositories. No credentials were requested or exported. No Play Console/signing/pricing/purchase/supporter-product settings changed; development `aa70233` and both destination main branches remain intact.

## Final publication checklist — explicit approval required

1. Review both branches and screenshots. Perform the focused real iPhone/iPad checks above; retain the distinction between simulations and hardware results.
2. After approval, merge/publish the **browser game first**, as one complete tree including root bootstrap/worker, immutable release directory, inventory and `.nojekyll`. Do not remove old client files/caches or change the origin/manifest identity.
3. Verify actual HTTPS entry/version, all worker hashes/resources, existing-player update/restart and saved cue/progress/settings, Home Screen/offline startup, visible non-blocking in-app advisory and disabled browser purchases. Confirm Pages has finished building before moving on.
4. Then merge/publish the **homepage**, retaining its existing browser URL/CNAME, support/privacy/FAQ links and the explicit unconfirmed Alpha-rollout wording. Change that qualification only after actual Google Play confirmation.

No merge or deployment is authorised by this preparation. No hosted preview has been published.

### Local reproduction

Run `python -m http.server 8020 --directory .` for the browser/advisory/iOS-profile scripts. For `tests/browser-pwa.cjs`, also run `python tests/upgrade-server.py` (local-only port 8022); it switches between the actual baseline and candidate with an injected bad file. The approved development harness can target `TEST_URL=http://127.0.0.1:8020/releases/v0.17.52-b1582/` for lesson/layout suites. The companion homepage server uses port 8021. No local test server is a deployment.

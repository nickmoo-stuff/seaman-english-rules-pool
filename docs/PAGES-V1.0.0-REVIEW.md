# Browser v1.0.0/build 1595 deployment correction

Baseline: `f7a53ba73880c1a12997ff3320b88be6044a2fd5` in `nickmoo-stuff/seaman-english-rules-pool`.
Branch: `fix-pages-v1.0.0-build1595`. Review only; no merge or deployment.

## Reproduced root cause

The browser has an atomic, SHA-256-verified release system, separate from the Android `www` entry point. The copied Android package did not update that system:

1. Root `index.html` still selected `v0.17.52-b1582` and displayed version 0.17.52/build 1582.
2. Root `service-worker.js` still imported `releases/v0.17.52-b1582/pwa-manifest.js`. The new files were in `www`, not an active versioned browser directory.
3. The loading-dots change in `525be95` modified root `index.html`, but the old inventory still recorded its pre-edit digest for **both** `index.html` and `./`. The worker correctly rejected installation. This does not depend on an old user cache: the committed deployment fails in an empty Chromium context too.

The static regression reproduces these exact two mismatches from the committed bytes. The browser regression reproduces the visible failure with the real old worker and an empty context.

## Correction and boundaries

- Adds `releases/v1.0.0-b1595/` from exactly the committed `f7a53ba:www` source, not a newer development tree. Every approved artwork, audio, dialogue and gameplay file is included. No unfinished v1.0.1 changes.
- Reuses the existing explicit browser projection: release mode, trusted-gesture audio/retry, existing in-app advisory adaptations, safe-area/Apple metadata, root manifest and worker registration. No gameplay or paid-ownership rules changed.
- Root launcher/worker now consistently select v1.0.0/build 1595. Regenerated build-specific cache fingerprint, complete offline asset hashes and release `SHA256SUMS.txt`; integrity checks are retained. Failed installation cannot fall through to an unverified online link.
- Uses one root worker. Versioned worker compatibility files delegate to it; the Android worker is not installed at a nested scope.
- Fixes the waiting-worker activation race found during testing by retaining the worker reference across the asynchronous handshake.
- Previous-cache recovery navigates to the cached release's actual index, preserving relative script and image paths. The former root-only search could miss the versioned old game.
- Existing old frames and their assets remain untouched. An explicit reload/Restart of an older versioned document routes through the current verified launcher. No forced reload of a running match.
- `www`, all native patches, previous release files, localStorage keys, save schemas and installed PWA identity/scope/start URL remain unchanged. No cache purge, save deletion, account change or new entitlement authority. Browser purchase/restore capability stays unavailable without the native bridge; editable saved entitlement flags do not unlock paid content.
- Music remains supplied but streamed online, matching the established policy. Offline gameplay works; soundtrack availability offline is not guaranteed. The new verified cache needs approximately 67 MiB plus retained previous caches; storage/quota failures remain explicit and recoverable.

## Configuration inspection and external limits

The repository's root is the existing Pages launcher; `.nojekyll` is retained so asset bytes are not transformed. There is no checked-in Pages workflow or `CNAME` in this game repository. The separate `seamengames` checkout has `CNAME=seamengames.com` and its browser-play link targets `https://nickmoo-stuff.github.io/seaman-english-rules-pool/`. No other repository or DNS configuration was edited. Saves are origin-bound: this fix retains the established game origin and paths, rather than moving games/saves onto the homepage origin.

The environment initially denied direct HTTPS to the live site and GitHub Pages origin, and the GitHub Pages settings API. Repository contents prove the mismatch, but do not prove the current dashboard setting or live response. Live Pages branch/source, actual deployment and real Safari/iOS/Android hardware checks must not be described as PASS unless separately performed.

## Final automated results

**18 check groups PASS / 0 FAIL.** Eight browser installation/update/failure groups; two committed-source/inventory groups; seven viewport/touch/media/PWA metadata groups; one JavaScript syntax group (14 files). Raw logs and machine-readable counts are in `qa/pages-v1/`. These are local Chromium/HTTP simulations, not real Safari or Android hardware, native Play transactions or a live deployment.

## Reproduce verification locally

```sh
python tools/prepare-v1-browser.py
python tests/v1-pages-static.py
# Leave this server running in another terminal:
python tests/v1-pages-server.py
node tests/v1-pages.cjs
TEST_URL=http://127.0.0.1:8023/pool/releases/v1.0.0-b1595/ node tests/ios-profile.cjs
```

The server exposes historical/current deployments on the same local origin and `/pool/` prefix, with corrupt, missing and truncated HTTP responses. Its test-only `upgrade.html` alias permits exercising the new launcher while an old cache still owns the normal root URL; no such alias is added to deployment. Old cached launchers may initially enter the old complete game while an update installs; the existing Restart notice then takes the player to the new build. An active match is not restarted automatically.

If the launcher, any cached asset or worker changes before merge, rerun the generator **and** static/browser checks. Never edit a published immutable release or copy only Android `www` to the public root. Historical source-package checksums at repository root are not used by the browser update mechanism; the authoritative active inventory is the new release's `pwa-manifest.js` and its release checksum list.

## Post-approval QA

1. Review/merge the PR only after approval. Confirm Pages still builds the existing root from `main` (or its already configured equivalent); no DNS/origin change is needed.
2. Open the existing Play in browser link in a fresh private window. Confirm v1.0.0/build 1595, no update-failure message, artwork/audio loading and Local Multiplayer shot controls.
3. In an existing profile, confirm progress/trophies/cosmetics/settings and saved Story name remain. If the old game is still open, finish the frame and use **Restart game** when offered. Do not clear browser storage.
4. Reopen the installed PWA offline; play a local shot. Reconnect for soundtrack streaming and future updates. Check portrait and short landscape on a real phone, plus iPhone/iPad Safari/Home Screen where available.
5. Confirm browser purchase controls remain unavailable and no paid content was unlocked by the update. Android release and existing Play ownership are outside this web-only correction.

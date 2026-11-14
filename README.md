# Seamen English Rules Pool — browser release review

K3I.2 prepares the complete approved **v0.17.52/build 1582** game in `releases/v0.17.52-b1582/`, in release mode, with purchases disabled and no Android dependency. The public entry URL and installed PWA identity stay unchanged. Root legacy code/assets remain solely for existing v0.17.0 frames and cached recovery during the handover.

See [review evidence, screenshots, Safari limitations and publication checklist](K3I.2-REVIEW.md). This local review branch is **not merged or deployed**. GitHub denied its push with HTTP 403; a verified Git bundle is supplied in the handover. Publish the game first and the companion Seamen Games homepage second, only after explicit approval.

Local preview: `python -m http.server 8020 --directory .` and open `http://127.0.0.1:8020/`. This is a static site; no runtime build step, framework or Capacitor wrapper is needed.

Maintenance: `python tools/prepare-browser.py` uses the approved sibling `seamen-pool-development` checkout (override with `SEAMEN_APPROVED_SOURCE`), performs the explicit browser projection and regenerates integrity inventories. `python tests/approved-build.py` checks parity and assets. Other browser tests use installed Playwright/Chromium. See the review for test-server commands/limits. Future published builds must use a new immutable directory; do not mutate this build in place.

# K3G.1 — Disabled purchase and entitlement foundation

Proposed source candidate **0.17.50/build 1580** follows Nick's reported local
Android billing release 0.17.49/build 1579. It is not an APK/AAB or a new Play
release. Branch `stage3g-k3g1-supporter-foundation` starts at `c4f5054` (K3F.1 patch,
with the approved `f1507c9` web baseline). The separate Capacitor 8.5.2 wrapper
remains on Nick's Windows PC and was not accessed or reconstructed.

## Authorised safe scope

Nick confirmed there is **no trusted backend/domain** and explicitly requested the
disabled purchase foundation plus backend contract. Accordingly, the shipped
Java bridge cannot launch payment or return verified paid ownership. Product
activation, production settings, Play uploads, real payments and merges are not
part of this work. Existing supporter developer-test flags are not receipts.

## Changes

- New central `www/supporter.js` session interface: verified owner, not owned,
  pending, checking and verification unavailable. It coalesces duplicate checks,
  fences stale results, expires verified sessions and never reads/writes a local
  paid-ownership flag. No purchase token enters localStorage or portable saves.
- `hasEntitlement` connects existing catalogues/gates to this session. The old
  development pass still works for explicit web QA, but native paid gates and
  purchased menu wording ignore locally editable flags and promo/test grants.
- **Required 7A wording:** confirmed non-owner button keeps “Support the game and
  extras” with “Unlock lots of bonuses forever – find out more!”. The future
  verified-owner UI replaces both lines with “Supporter Pack purchased and
  active” / “Thank you!”, disables clicks and applies a grey disabled style.
  Pending, checking and unavailable states have distinct truthful subtitles and
  are never labelled confirmed owners/non-owners by fallback.
- The information screen describes current bonus opponents and exclusive
  challenge cosmetics, planned (not implemented) Chapter 4 and beyond, one permanent
  non-subscription purchase and no additional chapter purchases for those future
  chapters. Regional price comes from Google-formatted ProductDetails only.
  Purchase controls are clearly disabled; native restore/check is functional.
  Web/PWA and missing-bridge cases remain usable with unavailable feedback.
- Uncertain verification preserves stored cosmetic selections/progress. An
  unverified paid cosmetic may render as a temporary free fallback rather than
  granting access or overwriting its saved selection. Explicit web DEV revocation
  retains the previous test behaviour. Earned campaign cosmetics remain intact.
  Final review extended selection preservation to confirmed non-owners too:
  locked paid choices stay saved while rendering a free fallback; only an explicit
  selection/revocation changes them. The supporter UI, School and campaign/save
  suites passed again against that final guard.
- `SeamenBillingPlugin.java` is a genuine Capacitor-compatible Google Billing
  9.1.0 bridge. It queries current `INAPP` records and the configured product/Buy
  option, emits recheck events, bounds calls and fences stale connection callbacks.
  `purchase()` rejects `PURCHASES_DISABLED`; both capability gates are false.
  It does not consume or acknowledge unverified purchases, expose/log tokens or
  include credentials. Purchased records requiring a server remain unavailable.
- The guarded PowerShell installer patches only existing Activity registration,
  a new plugin source and literal native candidate versions. It registers before
  Capacitor bridge creation, preserves existing Activity/package/signing code,
  checks K3F.1 and 8.5.2, backs up, supports WhatIf, refuses conflicts, preserves
  encoding/newlines, repeats idempotently and attempts scoped rollback. It does
  not duplicate/change the installed K3F.1 dependency/permission.
- Shared web/native candidate identifiers and offline cache revisions are updated
  consistently. No scene definitions, physics/layout files, career schema,
  Chapter 4 or later content or new paid-storage migration was introduced.

## Security boundary and backend blockers

Read the [backend contract](native-patches/K3G.1/BACKEND-CONTRACT.md). It specifies
server identity/attestation and replay handling, Play Developer API verification,
acknowledgement **after** verification and before a grant, idempotent retries
within the three-day period, ledger/revocation reconciliation, signed short-lived
native-validated responses and same-account restore.

Still required: trusted backend hosting/domain, credential/secret management,
app/account/token binding design, Play Integrity policy and keys, server receipt
verification/acknowledgement jobs, signed response verification in native code,
refund/revocation handling, the later native payment-launch implementation and
licence-testing validation. The existing product remains Draft; Alpha review and
test eligibility are additional external prerequisites. **No live purchase UI or
permanent paid grant may be enabled until these are implemented and tested.**

Client-side response-shape checks are not cryptographic purchase verification.
Future verified-owner screenshots and tests use controlled fixtures only. No
production-grade purchase security, successful Play purchase, acknowledgement or
verified restore is claimed. The actual bridge has no verified-owner return path.

## Automated verification

**PASS:** all **19 existing browser suites**, 21 invocations (spin UI and campaign
in both layouts), with zero failures in the final run. The two new supporter
suites also passed: **21 distinct JavaScript suites total**. Native installer
fixtures and the Java signature check passed. All **31 JavaScript files** passed
syntax checks; the three new Python files passed parsing and patch whitespace
checks passed. No gameplay assertions were weakened to obtain these results.

The first supporter UI run exposed missing grey styling on the existing disabled
menu button, which was corrected and retested. A saved-selection fixture initially
seeded an unearned campaign cue; it was corrected to a supporter cue with the
matching challenge record, and preservation/fallback assertions then passed.
Inspection of the actual Capacitor global found that listener registration can
return a synchronous handle; this was corrected and the final suite explicitly
tests that native global shape, disconnect handling and missing-plugin fallback.

- `tests/supporter-service.cjs`: mocked future-contract success/acknowledged owner,
  pending, cancelled/failed/interrupted/already-owned rechecks, duplicate prevention,
  fresh-service restore, offline failures, invalid/unacknowledged/expired evidence,
  kill switch, timeout, web fallback and stale asynchronous response fencing.
- `tests/supporter-ui.cjs`: five states at 1366×768, 390×844 and 855×384; exact menu
  copy, grey non-clickable purchased state, disabled payment controls, mock regional
  price, information text/navigation, native local-flag rejection, non-destructive
  unknown state, disconnect without retry loops and separate web development QA.
  Its mock Capacitor global uses the real 8.5.2 `Plugins`/synchronous listener-handle
  shape; inspection caught and fixed the initial Promise-only listener assumption.
- `tests/billing-bridge-patch.py`: WhatIf, scoped edits, exact backups, existing
  custom onCreate preserved, version coordination, UTF-8 BOM/CRLF, idempotence,
  six incompatible/conflicting fixtures refused without writes and forced-write
  rollback. Executed with PowerShell 7.5.4 on Linux, not Windows PowerShell 5.1.
  The unchanged K3F.1 installer/verifier fixture suite also passed again.
- `tests/billing-java-check.py`: signature compilation against the actual Google
  Billing 9.1.0 AAR (same Google SHA-256 checked in K3F.1) and an Android API jar,
  using Eclipse ECJ and **Capacitor API stubs** checked against 8.5.2 sources.
  Confirms query signatures and absence of payment/consume/ack/token/grant paths.
  **This is not a Gradle/Android application build.**
- Existing regression coverage includes Chapter 1–3/save/supporter compatibility,
  all five School lessons/trophy isolation, neutral/spun physics, mouse/touch Cue
  Helm, placement/power/fine aim, portrait/landscape layouts, Theatre catalogue and
  transitions, offline shell and dynamic story reminders. Existing test edits are
  candidate version/cache assertions and the new offline module, not weakened
  gameplay assertions. Final results/counts are recorded below.

The 19 existing suites were: `story-reminder`, `story-reminder-layout`, `layout`,
`layout-preservation`, `mobile-table-first`, `layout-correction`, `helm-responsive`,
`placement-controls`, `spin-ui`, `spin-physics`, `spin-offline`, `pool-school`,
`lesson-one-completion`, `pool-school-layout`, `campaign-regression`, `theatre`,
`theatre-readiness`, `theatre-responsive` and `theatre-offline`. In particular, the
real-time Lesson 1 clearance passed, and all **19 original scenes / 271 dialogue
beats** passed across five viewports. Physics, layout, Theatre runtime and dialogue
files compare byte-for-byte with `f1507c9`.

[Screenshots](qa/k3g1/README.md) explicitly label mock ownership and mock prices.

## Produced source packages

Both archives were generated, read back, checked against every source entry and
their embedded SHA256SUMS, and regenerated byte-identically:

- `SeamenPool-v0.17.50-build1580-web-candidate.zip` — complete `www` source/assets
  plus copy instructions, 92,339,276 bytes;
  SHA-256 `8b3fbb192a29bab69daf64bfba418e35d0a0c93e47c64dbd373dbfcb55eb56f3`.
- `SeamenPool-v0.17.50-build1580-Capacitor8.5.2-bridge-patch.zip` — guarded installer,
  plugin source, installation/QA guide and backend contract, 14,137 bytes;
  SHA-256 `4313b5e5a7db48fa1cf410950fbc356c083b0b66a60958a9357ee38958fe742f`.

The bridge archive is also in `downloads/` on the branch. The complete web archive
is delivered as a separate workspace artefact, avoiding a duplicate 92 MB binary
in Git; the branch ZIP additionally provides all source files. Neither archive
contains credentials, keystores, purchase tokens, an Android project or APK/AAB.

Useful commands (with `www` served on the test port):

```sh
node tests/supporter-service.cjs
TEST_URL=http://127.0.0.1:8008/ node tests/supporter-ui.cjs
PWSH=/path/to/pwsh python tests/billing-bridge-patch.py
ECJ_JAR=/path/ecj.jar ANDROID_API_JAR=/path/android.jar BILLING_AAR=/path/billing-9.1.0.aar python tests/billing-java-check.py
python tools/package-k3g1.py --out /path/to/output
```

## Installation, Android QA and later Console tests

The [native patch README](native-patches/K3G.1/README.md) contains numbered Windows
installation and rollback instructions, Android Studio build/device checks, and
separate Google Play licence-testing prerequisites/steps. Extract the web source
candidate, copy `www` into the real wrapper, run the existing SYNC batch, apply the
matching bridge patch after a dry run, then Gradle Sync/build. The installer
coordinates literal native versions to 0.17.50/1580 without changing identity or
signing. No binary/version upload is claimed by producing source ZIPs.

## Limits

No user's wrapper, configured Android SDK/signing environment, actual Play client,
real backend or licence-test device is available here. Full Android compilation,
merged/packaged manifests, actual plugin runtime on a device, real Google regional
price/product responses, Play purchase/acknowledgement/restore and Play Console
acceptance are **untested**. Windows file locking/ACLs and the custom SYNC script
also remain local checks. Native checks use isolated fixtures/API stubs, never a
claimed copy/build of Nick's project. Browser tests use controlled results and do
not certify a complete naturally played AI campaign or physical Android/iOS UI.
The baseline development build mode is retained for QA. Release hardening and
real licence testing are required before any later payment-enabled build.

No deployment, Play/product activation, real-money purchase, production-setting
change, main/approved-branch merge or environment publication was performed.

## Post-QA wording correction — d5c8e60

At Nick's request, the current source uses the exact revised opening and planned
content paragraphs describing future supporter chapters starting with Chapter 4
and continuing beyond, with no fixed upper chapter number. The heading “Planned
for future releases” is unchanged. The shipped web README and supporter UI
assertions are updated too. A scan of all player-facing source text found no old
fixed range; syntax and patch formatting checks passed. Gameplay, billing code,
layout, native patch and version/build remain unchanged. No browser suite was
rerun for this text-only correction.

At the wording-only step no ZIP was regenerated; the checksums above describe
the original candidate archives. The wording is now bundled with the restore
feedback fix in one [consolidated web correction package](K3G.1-restore-QA.md).
No new native patch or version/build change is needed.

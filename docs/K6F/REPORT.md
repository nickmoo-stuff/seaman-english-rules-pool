# K6F — final release preparation

**Supplied candidate: 0.17.63/build 1593. First public target: 1.0.0/build 1594.** Both codes remain subject to Play verification; 1594 is provisional. Source branch `stage6-k6f-final-release-preparation`, based directly on approved K6E `c2f1eaa`. The actual project is **not promoted** and both supplied native purchase gates remain **OFF**.

Follow [the concise Phase A–D release steps and exact Windows commands](RELEASE-STEPS.md). No new native patch or Android environment is required: K6E is unchanged and already installed according to the user's baseline. The single ZIP retains complete release-mode www, existing native tools/sources, new promotion tool/fingerprints, test evidence, AAB instructions and external release holds. No signing keys, credentials, APK/AAB or public build are included.

## Implemented

- Main-menu supporter shimmer now cycles every **2 seconds**, with a continuous repeated gradient and more saturated palette. Hover immediately interpolates to a brighter border, rainbow glow and 12% brightness increase over **180 ms**, then returns on pointer leave. A clear 3px keyboard-focus outline is present. Reduced motion uses a static full-width colourful gradient with no transitions; unsupported clipping/system colours retain readable fallbacks. Purchased/disabled entries do not animate. Existing wording, spacing, position, price and entitlement logic are unchanged; other buttons/styles remain untouched.
- Candidate metadata consistently **0.17.63/1593** in all six version-bearing web files. Source branch retains development mode for browser QA; the delivered www is release-mode with developer protections, exactly as K6E packaging. Cache names drop the obsolete internal alpha1 suffix and change only version/build metadata; caching logic is unchanged.
- Guarded Windows promotion changes the **same approved code in place**, not a fork: six version-bearing files in each of project www and synced Android public assets, plus literal Gradle versionName/versionCode (13 files total). Full web/source/art fingerprints, supported native preflight and both-gates-OFF checks precede writes. Explicit promotion approval AND manual versionCode confirmation are required. Default public result is **1.0.0/1594**; a confirmed higher code is supported without changing public versionName.
- Comments/formatting, UTF-8 BOM and LF/CRLF, signing/application ID, unrelated Gradle content and all gameplay/native code are preserved. Operations are idempotent, checksum current files, keep timestamped backups and recover from partial-write failures. Source rollback is provided but must not be used to force an installed-app downgrade; after release use 1.0.1 with a higher code.
- Read-only **VerifyPublic** refuses the candidate version, production-OFF/debug-ON or unapproved source states. It verifies the selected public version and approved release web/native source. It does **not** activate billing or claim to inspect an unavailable AAB. The existing K6E deliberate production enablement command is retained unchanged, separate from version promotion and only after approval. The AAB must be rebuilt after metadata/policy changes.

## Automated results

**59 PASS / 0 FAIL / 1 NOT TESTED — 60 distinct suites.** Full run followed by seven final affected checks. `qa/K6F/results.json` is the final aggregate; original results, focused results and `RETEST-NOTES.md` retain the history. The two initial failures were obsolete hardcoded alpha1 cache expectations; corrected tests pass real cached-asset/offline reload/control checks, without changing stable caching/gameplay logic.

- **38 promotion PowerShell assertions PASS:** explicit approvals, read-only/dry-run behaviour, 13-file scope, LF/BOM-CRLF, exact rollback and idempotence, preserved commented Gradle versions, altered/mixed/development/native-ON/custom/linked/locked/tampered-backup refusals, partial-write recovery and alternative confirmed code **1595** while retaining public **1.0.0**. Positive promotions/production source states occurred only in disposable fixtures.
- The **actual complete 100-file web tree** was promoted in a disposable fixture and run in Chromium: public v1.0.0/build1594 display and metadata, release protections, save export version/persistence and public offline cache/reload PASS. No second gameplay body is maintained; the manifest stores fingerprints only.
- Visual tests PASS at desktop, portrait and short landscape: 2-second animation, 180ms hover/reset, unchanged geometry/wording, keyboard outline, static colourful reduced motion, disabled animation OFF. Palette contrast checks pass. Rendered menu screenshots were inspected.
- Full approved regression PASS: EPA/break/foul/turn/win rules, aiming/spin, all 27 AI profiles, Dave's Pool School, Chapters 1–4/Wizard, Vaper purposeful spin, boss music lifecycle, every Theatre scene/dialogue beat, cosmetics/trophies, portrait/landscape, multiplayer, save compatibility, offline operation, supporter ownership/purchase/restore states, native production/debug separation and release safeguards.
- K6E's **54 native-management operation assertions**, retained K6C.2 **41** gate assertions, native core **13** fixture cases, policy truth tables and real cached Billing 9.1.0/API 36 signature compilation with Capacitor stubs pass. The actual existing Groovy release guard runs through its task-DSL fixture and passes its scenarios; this is not an AGP build.
- Preservation audit proves approved game.js differs only in version/build constants; index.html differs only in version/build metadata; all native files, ownership/billing code, artwork, soundtrack, dialogue, AI, physics, progression, trophies and save schemas remain byte-identical to K6E. Existing unrelated stylesheet content is preserved. All JavaScript syntax and version/asset checks pass.

## Billing audit — working implementation retained

| Requirement | Local result / limit |
|---|---|
| Independent native debug/production permission; both default OFF; debug never grants release | PASS source/policy fixtures. Production enablement still requires explicit approval, supported source and rebuilt non-debuggable application. |
| Product/option/permanent one-time purchase; regional price/currency | PASS unchanged `seamen_pool_supporter` / `supporter-buy` and Play-supplied offer/price implementation. No subscription/consume API. Prior real licence-test UK price is user-reported. |
| PURCHASED + acknowledged inventory required; pending/cancel/failed/already-owned | PASS unchanged production-core and bridge state fixtures. Button clicks, local flags, imports and developer cheats cannot establish genuine native ownership. |
| Startup/resume/restore/account change; acknowledged purchase retry | PASS existing query/acknowledgement/requery/coalescing/retry implementation and fixtures. No forced manual restore for a healthy already-owned session. |
| Refund/revocation/offline/service errors | PASS fixture removal when Play reports no ownership; unknown remains unknown. Real propagation/refunds/interrupted acknowledgement NOT TESTED. |
| No contradictory availability messages; accessible supporter screen | PASS retained K6E native-capability-driven availability/price/owner/pending/error UI across layouts; no new wording changes. |
| Working production Google Play release purchase path | SOURCE READY, actual signed Play-installed release transaction NOT TESTED. Debug licence success does not prove this route. |

The approved model remains on-device Play inventory, not server verification. Play cache/propagation may delay revocation; the five-minute in-memory confirmation is not a revocation deadline. Background/network/force-stop restrictions can delay acknowledgement retries and cause automatic refund. Hooked/rooted/repackaged clients can spoof local checks; there is no server token/Integrity/notification service or server-delivered DRM. No backend or unrelated billing infrastructure was added.

## Android release/signing readiness — honest boundaries

| Check | Status |
|---|---|
| Expected app ID/native registration/permissions guards, supported Capacitor 8.5.2/Billing 9.1.0 source | PASS source/preflight fixtures; actual merged/packaged manifest NOT TESTED here. |
| Candidate web/native default policy, promotion metadata consistency and developer/import isolation | PASS source and fixtures; actual external wrapper execution NOT TESTED. |
| Existing signing config, upload certificate vs Play app-signing certificate, non-debuggable signed AAB | NOT TESTED: wrapper/keystore/Android build unavailable. Keys/signing/app ID were not changed. |
| Actual Gradle/AGP build, AAB generation/acceptance and Play-installed production-enabled path | NOT TESTED. Existing native guard/task logic is tested with fixtures, not an Android build. |
| Play versionCode availability/product/country/track/production access/declarations | NOT TESTED: account/Console unavailable; no settings or uploads performed. |
| file:// browser origin | NOT TESTED: managed Chromium blocks it. This is the single automated suite marked NOT TESTED; external areas above are not counted as PASS. |

Before K6F, the user confirmed Pixel licence-test purchase/price/native ownership, purchased state after restart, ownership after debug OFF and K6E native update, Vaper/Cyclops without cheats and progression independence. Those are preserved baseline observations, **not fresh K6F production transactions**. Full fresh-install/second-device/revocation/production verification must not be claimed unless actually performed later.

## Version history and remaining holds

Read-only pre-K6F git history showed highest tracked build **1592**, with no prior **1593/1594** game build. K6F assigns candidate 1593; public 1594 remains a proposal. `qa/K6F/local-version-history.json` records that scan, not a Console reservation. If Console already uses 1594 for a different artefact, select its next valid higher unused code via `-ReleaseBuild`; public versionName remains **1.0.0**. Once this exact AAB is accepted on a testing track, reuse/promote that artefact across tracks rather than uploading a different bundle with the same code.

No local coding blocker remains. External holds are final candidate review, actual wrapper/signing/AAB checks, confirmed versionCode/product/track eligibility, Play-installed production-path/ownership verification and explicit production/public-rollout approval. Preserve the current installation/save/purchase: if Play's app-signing certificate differs from the installed debug APK, use a suitable separate test device rather than uninstalling or replacing keys. Follow the short [Phase A–D procedure](RELEASE-STEPS.md). Optional enhancements and noncritical expanded testing are deferred; the first post-release patch is 1.0.1 with a higher code (1595 or higher, depending on the actual first-public code).

No actual project promotion, production activation, transaction, build, upload, merge, deployment or publication occurred.

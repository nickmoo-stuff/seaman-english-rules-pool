# K3I.1 final Alpha hotfix — v0.17.52/build 1582

Baseline: `2318accbc7db8af25cb6b5c1985f5a6be1382f5e` on approved `stage3i-k3i1-alpha`.
Hotfix branch: `stage3i-k3i1-lesson3-hotfix`.

## Root cause and correction

The old Lesson 3 corrective rack put the white on an already ideal line to the red. Completion required a movement distance flag but accepted any subsequent legal shot, rather than the requested confirmed placement and legal red pot. That made unchanged-position confirmation confusing and allowed a legal miss to qualify once the movement flag was set.

The opening in-off demonstration and normal EPA evaluator are unchanged. The corrective white now starts on the centre line at T+340, behind the yellow at T+260, with the red at T+100. All balls are legally separated. A white placement above the yellow (for example T+180) gives an easy red pot. Dave gives the requested explicit move/CONFIRM/red-pot instruction.

Lesson 3 now records the opening in-off, the actual legal confirmed coordinates, displacement from the awkward origin and the cue position at shot start. Only a matching confirmed placement followed by an engine-accepted red pot passes. A generic legal-shot flag alone is insufficient. Cue-in-hand and illegal/early-black outcomes are rejected using normal rule results, without changing the EPA evaluator.

A successful red pot immediately saves the tick and stops the lesson with the usual expanded completion feedback. The black stays on the table; no frame win is invented or required. Shooting stays disabled until explicit restart. Failed attempts reoffer only the corrective placement rack and retain the already demonstrated in-off. Existing ticks/trophy are never removed by a failed replay.

## Checks performed for this hotfix

- **Actual staged release, tests/lesson-three-hotfix.cjs:** passed at mobile 390×844 and Pixel-sized 855×384 landscape. Uses the production engine/rule evaluator, real touch placement/nudge controls and confirmation; no fabricated success/foul outcomes. Verifies opening in-off, legally separated awkward rack with the yellow blocking the red, legal moved placement, movement without confirmation unable to shoot, unchanged-origin confirmation unable to complete, legal red contact/cushion without a pot, yellow pot, illegal yellow-first red combination, repeated in-off and early-black foul. Each rejected shot returns to a usable corrective placement. The final red pot is played through the real Play Shot button and completes without potting the black or ending/winning a frame. Further shooting is blocked. Menu/reload persistence, all existing lesson ticks, Dave's Star Pupil retention and full career/campaign-field isolation pass. Lessons 1/2/4 rack/group/instruction snapshots match baseline behaviour; Lesson 5 code is untouched.
- **Actual release, tests/pool-school.cjs:** the complete five-lesson engine-driven regression passes, including success/failure conditions, placement, replay, ticks, trophy/future-lesson stability, career isolation and normal multiplayer tracking. The Lesson 3 test now uses the redesigned corrective arrangement and instruction.
- **Actual release, tests/alpha-release.cjs:** five saves first exported through approved v0.17.51 game code survive update and portable import into v0.17.52 with unchanged storage, schema, career, trophies and selections. Local/native purchase flags do not grant ownership; release developer controls remain unavailable. Portrait/landscape Chapter 1 Theatre and local placement/shot smoke flows pass without page errors or missing requested assets.
- **Actual release, tests/spin-offline.cjs:** new build 1582 worker/cache, offline reload, story reminder, normal local frame, landscape and spin controls pass.
- **tests/alpha-installer.py, staged deliverable installer:** PowerShell 7.5.4 on Linux fixture tests pass for dry-run, backups, BOM/CRLF, scoped edits, byte-preserved signing/identity/unrelated configuration, old K3G integration upgrade, complete-H1 upgrade from installed **0.17.51/1581** changing only Gradle version metadata, repeat-run idempotence, 14 pre-write conflict refusals and rollback after forced write failure. Also supports the earlier 0.17.50/1580 foundation. Actual Windows/Android wrapper execution of this new installer remains manual.
- **tools/package-alpha.py / tests/alpha-consistency.py:** full tracked www inventory and all literal asset/HTML/CSS references/icons checked. All other web files/assets, the approved landscape correction and all four native Java sources match baseline byte-for-byte. game.js changes outside the lesson block are limited to version/build plus the scoped Lesson 3 shot-start snapshot/stop guard and confirmation listener; unrelated game/rules/save code is checked against baseline. Release mode, menu/meta versions, both worker cache identifiers, Chapter 4-and-beyond wording and disabled native payment gate are checked. Six negative fixtures reject missing assets, stale/mismatched versions, development packaging, enabled purchase gate and bad release metadata.
- JavaScript syntax checks pass for all nine source and staged-release root scripts, with clean whitespace/diff checks. Final ZIP CRC/entry and SHA-256 content checks are performed by the existing packaging workflow; embedded SHA256SUMS covers every other delivered file. One complete final ZIP is generated, not intermediate full archives.

## Version, native integration and scope

v0.17.52/build 1582 was not found in prior repository release metadata/history/tags and is suitable as the next local candidate. Play Console availability remains **unconfirmed** and must be checked separately before any authorised upload. A hypothetical higher number in an older negative installer fixture is not a released version-code allocation.

All K3H.1 Java sources, billing dependency assumptions, permissions/retry-service setup and native `PURCHASES_ENABLED=false` are preserved. The web purchase button stays disabled. No new bridge, pricing change, Chapter 4 content, save-schema change, signing key or replacement wrapper is introduced. The complete release-mode www and assets, guarded installer, security notes, installation guide and integrity manifest are included in `SeamenPool-v0.17.52-build1582-Alpha.zip`.

## Device QA and remaining checks

The user reports the previous **v0.17.51/build 1581** was built and installed successfully on Pixel 8 Pro, with correct versions, retained saves/progress/ticks, normal gameplay, portrait/landscape controls, supporter information/restore feedback, disabled purchases and Dave's Star Pupil award. Those are user-reported passes, not Android testing performed in this cloud workspace.

The external Capacitor wrapper/signing/build environment remains on Windows. No actual Android build/install or new v0.17.52 device test has been performed here. Only the focused Lesson 3 replay/placement/completion/persistence checks in WINDOWS-INSTALL.md are requested after updating; a complete repeat of prior Android QA is not required. Existing earned ticks should remain during replay failures; do not reset the user's save to test failure feedback.

Real Play transactions, acknowledgement, OS retry/boot behaviour and same-account reinstall/second-device restoration remain deferred and untested here; they are not blockers for this purchases-disabled Alpha. Device-only ownership confirmation retains the security limitations documented in SECURITY.md.

No merge, deployment, Play upload, product activation, Console change or signing-key generation/distribution was performed. K3I.2 website preparation/publication is not part of this hotfix and has not started; await the user's Lesson 3 device PASS before the next milestone, with separate approval required before publishing either website.

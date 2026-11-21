QA Round 2: responsive controls and opponent placement; detailed log available through Game menu. Same v1.0.1/build 1597; native policy unchanged. See docs/v1.0.1/QA-ROUND-2.md.
Maintenance candidate: P1–P6 fixes; see docs/v1.0.1/REPORT.md in the source package.
SEAMEN ENGLISH RULES POOL — V1.0.1
===================================

A pirate-themed, portrait-first English pool game for desktop/mobile browsers and installable as a PWA.

APP IDENTITY
------------
Full name: Seamen English Rules Pool
Short name: Seamen Pool
Package/application ID: com.seamenpool.game
Game version: 1.0.1
Internal build number: 1597
Build mode: controlled by the BUILD_MODE constant in game.js ('development' or 'release').

CURRENT RELEASE-FOUNDATION STATUS
---------------------------------
• K6G: Story player names now save immediately in the existing career record. Rename through main-menu Settings. Gameplay/native billing is unchanged; see docs/K6G/REPORT.md.
• Career, achievements, statistics, campaign progression and cosmetics are persistent.
• Portable JSON save export/import is supported.
• K3H.1: supporter ownership queries Google Play on-device; native purchase launching remains disabled. This is not server-side verification.
• Supporter benefits cover bonus opponents, exclusive cosmetics, Chapter 4 and future chapters beyond. Development test access is separate from paid ownership.
• Privacy and data information is available from the title screen.
• Development and release modes share one codebase; release mode removes developer UI/shortcuts.
• PWA uses network-first core files with offline fallback. The existing soundtrack remains network-only; the supplied Lucy encounter track is cached with Chapter 4.

V0.15.7b — FIRST NATIVE ANDROID FIX
----------------------------------
- The unsupported/embedded-browser warning now explicitly bypasses a confirmed Capacitor native container.
- Android WebView's normal `wv` user-agent marker no longer causes a false unsupported-browser warning inside the packaged app.
- Ordinary embedded social/in-app browsers remain covered by the existing warning.
- No gameplay, physics, AI, audio or layout changes.

V0.15.6 — CREDITS, LICENSING AND ATTRIBUTION FOUNDATION
--------------------------------------------------------
• Audited the shipped source archive for runtime dependencies and external links.
• About / credits now contains a clear independent-rules-reference statement and a licensing/attribution section.
• The shipped HTML loads only local dialogue.js, about.js and game.js; no third-party JavaScript framework/library is bundled in this archive.
• Current external player-facing links are the English Pool Association rules page and soundtrack pages on Spotify, Apple Music, Amazon Music and YouTube Music.
• No gameplay, physics, AI, progression, entitlement or save behaviour changed.

PRE-STORE ASSET / LICENSING CHECKLIST
-------------------------------------
This is an audit checklist, not a claim that every release right has already been verified.

[ ] Keep source/provenance records for the two app icons and any future store artwork.
[ ] Verify commercial-use rights/provenance for every generated or externally-created visual asset before store submission.
[ ] Verify commercial-use rights/provenance for every soundtrack master and sound asset before bundling/distribution.
[ ] Keep any attribution text required by the tools/services used to create final assets.
[ ] Review character names/artwork for third-party trademark/copyright resemblance before public store submission; the development-only 'Darth Vaper' special opponent deserves an explicit review if ever exposed or shipped as public content.
[ ] Keep the English Pool Association reference descriptive and independent; do not imply endorsement or official affiliation.
[ ] Re-run this audit when native wrappers, SDKs, analytics, payments, ads or other third-party libraries are introduced, because those may add notices/licences/data disclosures.

PACKAGING NOTE
--------------
The K6G source candidate includes all tracked www assets, including portraits, scenes and soundtrack files. No external wrapper or signing material is bundled. Retain matching provenance/licensing records. The delivered K6G candidate www uses BUILD_MODE='release'; the development source branch remains available for browser QA. Do not deploy or activate purchases without separate approval. Native production packaging must retain release-mode web protections and the independent native debug/production permission gates.

ABOUT / CREDITS
---------------
The player-facing About / credits screen remains the editable public credit surface. about.js intentionally keeps this text separate from the gameplay engine.


V0.15.6 — NATIVE PACKAGING READINESS
-------------------------------------
• Selected Capacitor 8 stable as the planned native wrapper.
• Added shared native-container detection without adding a runtime dependency to the existing PWA.
• Native containers suppress browser-only install prompting and service-worker registration/update UI.
• Audited relative assets, storage, safe areas, lifecycle handling and external-link assumptions.
• Added NATIVE-PACKAGING-READINESS.txt with the handoff checklist for the first Android project.
• No gameplay/rules/physics/AI/progression changes.

K4A.1 — DEVELOPER SUPPORTER ACCESS
---------------------------------
Direct desktop opening of index.html is supported as a development workflow.
Settings -> K -> developer grant uses current-tab memory and shows feedback beside
the buttons. Chapter 3 completion is still required. Release/native ownership
security is unchanged. See docs/K4/K4A.1-QA.md in the source package for checks
performed and the managed environment's unverified direct-file navigation check.

K4A.2 — DESKTOP QA CORRECTIONS
------------------------------
See docs/K4/K4A.2-QA.md in the source ZIP for Theatre/trophy/effect corrections,
performed automated checks and the numbered direct-file desktop QA checklist.

K4A.2 FINAL ARTWORK REFRESH
---------------------------
The three newly approved transparent PNGs are shipped byte-for-byte under new
approved asset URLs. All other K4A.2 behaviour and Theatre settings are retained.
See docs/K4/K4A.2-ARTWORK-QA.md in the source ZIP for hashes, checks and desktop QA.

CATALOGUE-WIDE DEVELOPER UNLOCK
------------------------------
Unlock all pirates and J now enable current-tab access to all available opponents
across all chapters. No defeats, selection/intro flags or rewards are fabricated.
See docs/K4/UNLOCK-ALL-QA.md in the source package for checks and desktop QA.

K4B OPTIONAL SUPPORTER BOSS
Spinball Wizard is a Level 5 Chapter 4 bonus encounter. Chapter 3 access and supporter ownership (or temporary web developer access) are required; Lucy need not be defeated. His exact approved two-second transparent animation and scripted dialogue are included. The final nod is silent.
His real spin cycles through follow/draw, left/right and combinations; his elaborate staff is cosmetic only. Winning awards The Dizzy Wizzy and the staff, independently of Five Circles of Hell. The existing Cave table's unlock conditions are unchanged.

K6A BILLING DEVELOPMENT CANDIDATE
Use native-patches/K6A/README.md and docs/K6A/REPORT.md in the full source ZIP.
Capacitor 8.5.2 / Billing Library 9.1.0; no new runtime dependency.
Regional price/currency are from Google Play. Purchase/restore outcomes are readable
and paid ownership is separate from saves/progression. The supplied debug purchase
gate is OFF, and release native purchases are always disabled. Real Play/device
transactions, the external wrapper build and Console configuration are unverified.

SEAMEN ENGLISH RULES POOL — V0.15.7aa
===================================

A pirate-themed, portrait-first English pool game for desktop/mobile browsers and installable as a PWA.

APP IDENTITY
------------
Full name: Seamen English Rules Pool
Short name: Seamen Pool
Package/application ID: com.seamenpool.game
Game version: 0.15.7aa
Internal build number: 1509
Build mode: controlled by the BUILD_MODE constant in game.js ('development' or 'release').

CURRENT RELEASE-FOUNDATION STATUS
---------------------------------
• Career, achievements, statistics, campaign progression and cosmetics are persistent.
• Portable JSON save export/import is supported.
• Supporter entitlements are separate from career saves and cosmetic-only.
• Privacy and data information is available from the title screen.
• Development and release modes share one codebase; release mode removes developer UI/shortcuts.
• PWA uses network-first core files with offline fallback. Large soundtrack files are not deliberately cached.

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
The source archive references assets/portraits/*.webp and assets/music/*.m4a paths, but those asset files are not contained in this compact ZIP. Existing hosted deployments may provide them separately. A native/store package must include or deliberately fetch every required release asset and must carry the matching provenance/licensing record.

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

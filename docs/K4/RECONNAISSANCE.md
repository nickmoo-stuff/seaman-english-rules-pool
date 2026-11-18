> Historical K4A reconnaissance. The user subsequently supplied approved artwork; see RELEASE-READINESS.md for current implementation and remaining limitations.

# K4 reconnaissance — 15 November 2026

Status: K4A complete; K4B blocked by missing approved masters. No functional changes.

Baseline: aa7023364d48bf5d2c673b9aa9426f0089821ea0, approved v0.17.52/build 1582.
Branch: stage4-k4-five-circles-of-hell. AGENTS.md read; authoritative dialogue takes precedence over writing conventions.

## Asset blocker

Specification sections 7 and 8 explicitly prohibit guessing masters and require pausing for missing approved art. The supplied ZIP contains exactly the specification, dialogue, checklist and Lucy MP3. None of the approved images or Spinball animation is included. No matching approved K4 assets were found in the game asset catalogue. asset-manifest.json records the missing masters and the two earlier, unconfirmed Lucy files found outside the repository; unconfirmed-lucy-candidates.jpg is an identification sheet only. Neither is the user-edited Adobe Express master established by the specification. No old montage, substitute cat or generated art has been integrated.

To resume: supply the five approved transparent character masters, three approved landscape backgrounds and approved Spinball Wizard animation/prototype, with an explicit filename-to-role mapping. Include the Adobe Express Lucy cutout. No credentials or billing configuration are needed.

The definitive MP3 remains staged in /workspace/k4-handover; its size/hash is recorded in the manifest. It has not been added to the game's cache or music catalogue before an encounter exists.

## Architecture and implementation plan

- Campaign: www/game.js CHAPTERS/PIRATES, chapterState, unlockRuleMet, recordCareerFrame and victory-evidence reconciliation. Add five stable sequential story IDs, separate optional supporter slot and idempotent first-win rewards. Do not add Chapter 5 or Golden Cue rewards.
- Access: hasEntitlement uses the existing billing session. chapterIsUnlocked currently accepts a durable unlocked flag: Chapter 4 needs an explicit current-entitlement check before accepting saved progression, including challenge/start paths. Preserve completion/rewards when ownership cannot be queried; do not fabricate ownership. Purchases stay disabled.
- Theatre: www/dialogue.js scene catalogue and www/game.js showScene/renderSceneStage/advanceScene/closeScene; www/theatre.js readiness helpers. Reuse black readiness transitions, bobbing and fades. Parse authored lines explicitly, excluding editorial prompts; retain the raw source as a byte-for-byte reference. Lucy victory is the sole chapter ending, with only Most Evil Creature joining Lucy and Blackball.
- AI: AI_PROFILES supports levels 1–7, but level 6 is Cyclops (100% break/fallback power and weaker accuracy than level 5), not a generic stronger tier. Use opponent-specific profile/personality overrides for Lucy without changing Cyclops. Existing candidate scoring, cushion escape/planning and spin hooks support the requested personalities. Forced power/spin must apply once immediately before the real shot, including breaks and fallback shots; no arbitrary misses or simulated victories.
- Cosmetics: COSMETICS, cosmeticIsUnlocked, cue rendering and campaign equipment mappings. Add shared preview/match cue definitions and visual-only table styling; preserve geometry. First wins award five named trophies/cues and Lucy table exactly once.
- Audio: playMusic uses two fading decks with queued gesture retries; startMatchMusic selects random tracks. Add encounter-scoped Lucy music lifecycle, preventing transition restarts and overlapping decks; restart on rematch, restore ordinary soundtrack on exit. Existing volume/mute/resume must remain authoritative.
- Effects: pointer-events:none overlays scoped to encounter; motion preference handling and cleanup on exit. One cannon event on cue strike, never ball collision. Do not invent Theatre sound effects.
- Saves/offline: preserve existing schema and reconcile new stable IDs without rewriting old wins, trophies or equipped selections. Update www/sw.js asset list/cache only when approved assets are integrated. Keep source version unchanged until a functional candidate is ready; specification gives no new version allocation.

## Verification performed

PASS: baseline/version/clean starting worktree and repository writing guidance inspected.
PASS: supplied document copies compared byte-for-byte with extracted originals.
PASS: JavaScript syntax checks for game.js, dialogue.js, theatre.js, supporter.js and spin-physics.js.
PASS: pure supporter-service regression suite (see command results in handover).
N/T: K4 gameplay, browser/Android visual QA, audio continuity, rewards, entitlement gates and offline caching — no K4 functionality integrated because approved art is missing.
No release ZIP or Android build has been created. No merge, push, deploy or purchase activation.

## Numbered QA plan after assets arrive

1. Fresh and migrated saves: retain Chapters 0–3, selections, trophies and settings; enforce Chapter 4 progression plus active supporter access.
2. Check every intro, challenge and victory line against the authoritative script; exclude editorial prompts and duplicate Lucy outro.
3. Play each opponent's real EPA frame, loss/retry and replay; verify power/spin personalities and first-win-only rewards.
4. Verify all effects, catalogue/match cue parity, Lucy music continuity/rematch/exit and one cannon per strike.
5. Test desktop, touch portrait/landscape, reduced motion, offline reload and slow asset readiness; verify no control interception.
6. Verify safe ownership restoration paths, locked Chapter 5, no Golden Cue, unchanged Chapters 0–3 and purchases-disabled behaviour.

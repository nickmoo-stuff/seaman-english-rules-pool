# Seamen English Rules Pool — K5A: Whole-Game Regression

## Baseline

Use the approved Chapter 4 content-freeze baseline:

- Version: 0.17.59
- Build: 1589
- Commit: bd79490
- Branch: stage4-k4b-spinball-wizard

Chapter 4's main story and Spinball Wizard have passed manual desktop QA. Treat all approved Chapters 0–4 content as frozen.

## Objective

Perform a comprehensive automated regression of the complete game, covering Chapters 0–4, multiplayer, controls, progression, cosmetics, trophies, responsive layouts and save persistence.

This is a **stability milestone**, not a feature-development milestone.

## 1. Core gameplay and EPA rules

Verify:

- Legal breaks and fouls.
- Ball assignment and legal target selection.
- Black-ball win/loss conditions.
- Free shots and applicable EPA foul consequences.
- Turn switching and match completion.
- AI shot legality.
- Aiming, power and fine-tuning.
- Cue Helm topspin, backspin, left/right spin and combinations.
- Normal cue-ball physics, cushions and pockets.
- No regressions to shot simulation or AI calculations.

Preserve existing approved gameplay behaviour. Do not rebalance opponents without identifying a genuine defect.

## 2. Chapters and progression

Test the complete story sequence:

- Chapter 0: Dave's Pool School, five optional lessons, completion ticks and trophy.
- Chapter 1: Tavern opponents through Captain Blackball.
- Chapter 2: Uncharted Waters through Mr Wiggles.
- Chapter 3: Dark Mysterious Island through Captain Blockbeard.
- Chapter 4: The Five Circles of Hell through Lucy Fir.
- Chapter 4 optional supporter boss: Spinball Wizard.
- Chapter 5: Locked “In development!” chapter placeholder.

Verify that story unlocks, chapter transitions, reminders and opponent availability remain correct.

Chapter 0 must remain optional. Spinball Wizard must remain independent of the five-circle story completion.

## 3. AI personalities

Verify that all opponents retain their intended AI behaviours, including the distinctive Chapter 4 personalities:

- Vile Blue Hedgehog: 66% power and topspin.
- Filthy Youth with a Phone: Level 3 standard behaviour.
- Socks and Sandals: Backspin and cushion-shot preference.
- TMECI: Skilled sidespin.
- Lucy Fir: Level 6 positional planning and chaining without spin.
- Spinball Wizard: Level 5 chaotic show-off, applying varied physical spin on every shot.

Check existing opponents' personalities against their current approved implementations.

Do not replace character-specific behaviour with generic AI.

## 4. Theatre and story presentation

Verify:

- All Chapter 1–4 Theatre scenes.
- Dialogue order and speaker labels.
- Typewriter timing and speaker-specific bobbing.
- Character artwork, transparency and positioning.
- Special entrance animations.
- Background loading and opaque-black transitions.
- Correct scene continuation after victories.
- No premature story spoilers.
- Lucy's soundtrack continuity and visual/audio effects.
- Spinball Wizard's animated artwork and silent nod.

Do not rewrite approved dialogue or redesign artwork.

## 5. Cosmetics and trophies

Verify:

- Cue and table unlock conditions.
- Cosmetics catalogue descriptions.
- In-game and catalogue cue rendering consistency.
- Animated cue effects.
- All chapter and opponent trophies.
- Chapter 4's “Five Circles of Hell” trophy.
- Spinball Wizard's “The Dizzy Wizzy” trophy.
- Correct locked/unlocked states.
- Persistence after reload.
- No rewards awarded merely by using opponent-unlock shortcuts.

## 6. Multiplayer and game modes

Verify:

- Local multiplayer setup and gameplay.
- Correct navigation back to the main menu.
- Player names and turn handling.
- Match reset and rematch behaviour.
- Online multiplayer remains hidden/unavailable as previously approved.
- No unintended story progression from multiplayer matches.

## 7. Portrait and landscape layouts

Test:

- Desktop portrait/landscape toggle.
- Settings orientation preference.
- Persistence after reload and resize.
- Responsive menus, rosters, Theatre scenes and cosmetics.
- Mobile/device-mode behaviour.
- Play Shot, vertical power control and horizontal fine aim in landscape.
- Minimisable/optional side panels.
- No overlapping or inaccessible controls.

Preserve the approved K3C landscape interface.

## 8. Developer shortcuts

Verify:

- I — Chapter 3 arrival shortcut.
- T ×6 — instant-win shortcut.
- Developer supporter-access grant.
- Unlock All Pirates dynamically discovers every implemented opponent across Chapters 1–4, including Spinball Wizard.
- Shortcuts do not incorrectly award trophies or mark unplayed opponents defeated.
- Development-only functionality does not leak into normal production access.

## 9. Save data and offline operation

Verify:

- Fresh-save progression.
- Existing-save compatibility.
- Story, cosmetics, trophies and settings persistence.
- Supporter entitlement separation from developer access.
- Offline asset references and cache completeness.
- No missing files, broken paths or stale references.
- Direct desktop index.html operation using file:// where supported.

Do not reset, migrate destructively or overwrite player saves.

## 10. Automated verification

Run the relevant existing automated test suites.

Add focused regression coverage where meaningful, particularly for interactions between chapters and systems.

For each genuine failure:

1. Identify the cause.
2. Apply the smallest safe correction.
3. Re-run affected tests.
4. Re-run the complete regression suite.

Do not make unrelated cosmetic changes or introduce new features.

## 11. Delivery

Provide:

- PASS/FAIL/NOT TESTED summary, with test counts.
- Description of any corrections.
- Updated version/build if code changes require it.
- Commit and branch.
- Fresh version/build-labelled desktop source ZIP.
- Any remaining risks requiring manual testing.

Keep Chapter 4 content frozen.

**Do not merge, deploy, publish or enable native purchases.**

Google Play purchase and restoration integration is a separate upcoming milestone.
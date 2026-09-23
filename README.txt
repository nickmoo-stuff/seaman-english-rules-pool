Seamen English Rules Pool V0.4.7

Changes from V0.2.9:
- Break-points help is now strictly contextual: visible only before a break shot is taken. It hides while the break is in motion, after a legal break, during an illegal-break decision/re-rack choice, and during normal play.
- Added end-of-frame winner celebration overlay naming the winning player.
- Winner overlay includes Play again! and Return to menu.
- Play again starts a fresh prototype frame.
- Return to menu currently shows "Function not available in this prototype." with a large Got it! button, ready to be replaced by a real menu later.

Rules target: EPA International Eightball v2d (2026).

V0.3.8: hardened first-contact trace; numbered per-shot bug log; optional projected object-ball angle guide; developer cue-ball pickup.


V0.3.8
- Fixes final-group-ball transition bug: shot legality is evaluated against the ball/group that was ON at the start of the shot, so potting the last group ball cannot retroactively make that same shot require first contact with black.
- Adds synthesized cue-strike, ball collision, cushion, pot and victory sounds (no external audio assets required).
- Adds Who's playing? startup form and propagates entered names throughout the HUD, turn overlays, logs and victory flow.
- Adds Show game log button to the victory overlay, including the winning shot trace.

V0.3.8: Mobile controls: holdable ±5° and ±0.1° aim buttons, holdable ±45%/±5% power buttons, non-selectable adjustment buttons, chunky page scrollbar, table moved above rules HUD, player group moved to its own line, and rules HUD expanded/wrapped to a stable three-line display.

V0.3.8: break-help visibility fix; mobile HUD line separation; single-row square-ish aim buttons; deeper ker-ching pot sound; conservative embedded/unsupported-browser warning.

V0.3.8: result-aware pot audio, descending foul-pot cue, rising legal-pot streak chime; Clear play log button hidden from developer UI while log internals remain.

V0.3.8
- Frame-ending victory wording updated to use '[winner] beat off [loser]!' in the result explanation.

V0.4.2: begins the 0.4 game-structure/AI phase. Adds an opening 'Who’s playing?' menu with 2 players locally (same device) and Pirates o’ the tavern (AI opponents). Local mode retains the V0.3.8 game flow; pirate mode is intentionally a non-playing scaffold for the next AI builds. Return to menu now returns to the real opening menu.

V0.4.2: Mobile cue-ball placement: tap/drag anywhere on the table while ball-in-hand is active, then use a large Confirm Cue Ball Position button before aiming.

V0.4.2 mobile refinement: added large holdable cue-ball nudge controls during ball-in-hand placement; retained tap/drag and confirm flow; renamed developer angle-guide control.

V0.4.2: Pirates o' the Tavern now starts a human-vs-AI prototype against Deckhand Dave. The first AI framework can take turns, use ball in hand, identify the current legal/on ball type, choose a basic legal target, aim and shoot. AI decisions are recorded in the developer play log. Difficulties 2-5 remain locked placeholders.

V0.4.6: Deckhand Dave gains basic direct-pot planning. He checks legal targets against all six pockets, requires a clear target-to-pocket path and cue-to-contact path, chooses a simple candidate, then applies deliberate Difficulty 1 aiming error. If no direct pot is available he falls back to a basic legal hit. AI trace now records planned pocket, calculated aim, difficulty error, played aim and power.

V0.4.6: Added five-pirate sequential unlock framework. Difficulty 1 starts unlocked; beating a pirate unlocks the next. Progress is stored locally in the browser. Added developer unlock-all control. Higher difficulty AI behaviour remains a later phase.

V0.4.6: Five AI difficulty profiles now play differently. Higher pirates have progressively smaller aim/power error, consider cleaner direct pots more consistently, and choose clearer legal fallback hits. Developer AI trace records profile, aim error and power error.

V0.4.6 changes: G toggles developer angle guide; result button renamed Rematch!; smarter level 4/5 ball-in-hand placement; shot-quality scoring (cut/route/in-off risk); richer AI trace; corrected BLACK loss-of-turn wording.

V0.4.7: Captain Blackball now adds simple one-ball-ahead positional scoring to direct-pot selection, preferring pots estimated to leave the cue ball nearer another legal target. Added AI QA trace comparing each AI plan's intended target with the actual first-contact ball, making physics/execution mismatches immediately visible. Existing difficulty 1-4 behaviour retained.

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


V0.5.0: Advanced AI safety-play framework. Difficulty 4, 5 and developer-perfect AI can choose an intentional defensive legal hit when no worthwhile direct pot is available. Diagnostic trace records estimated opponent direct-pot opportunities before/after the safety. AI uses the same physics and rules as human players.


V0.6.3
- Darth Vaper now has a three-cushion escape solver as a last resort after direct, one-cushion and two-cushion legal routes fail.
- Three-cushion routes use the same table geometry and shared physics as human shots; Vaper receives no physics advantage.
- Developer trace reports all three cushions, bounce points, route score and planned legal target.
- Mick remains capped at one-cushion escapes; Captain Blackball remains capped at two-cushion escapes.
- Existing H test-scenario unlock shortcut retained.


V0.6.3 additions
- Captain-level endgame clearance scoring when 1-3 group balls remain.
- Final-colour shots explicitly value predicted position on the black.
- Safety candidates are rejected if straight-ray validation predicts the wrong first contact.
- Fallback plans log a first-contact legality check/warning for QA.
- Combination/cannon planner retained unchanged apart from version labelling.

V0.6.4: Captain/Vaper hard-veto any shot rejected by legality/cue-ball physics forecasting, try alternate attacks before safety/escapes, and apply stricter final-black cue-ball robustness checks. PLAY SHOT moved above Aim Angle.

V0.6.5: Cue-ball forecast hardening. Captain/Vaper validate attack plans at both 60 Hz and 120 Hz dry-run timing and probe tiny aim/power variations on all attacks, not just the final black, to catch rare pocket-mouth false-negative in-offs.


V0.7.1: AI personality framework. Difficulty still controls execution accuracy; personality now biases legal shot selection via aggression, safety preference, flair and positional priority. Physics, rules and shot execution are unchanged. AI PLAN logs now show personality values and the influence on selected plans.

V0.7.1: AI deadlock guard. If all normal pot/safety/cushion/final-validation routes are exhausted, the AI now always commits an emergency physical shot instead of leaving the turn frozen. It first searches for any legal straight first contact; if none exists, it plays a least-bad contact attempt which may legitimately foul. AI PLAN diagnostics explicitly identify emergency fallback use and its reason. Normal personality and shot-selection behaviour is unchanged.


V0.7.3: AI anti-freeze reliability patch. Adds an independent turn watchdog, catches planner exceptions, preserves the v0.7.1 emergency legal-contact fallback, and guarantees a physical fallback attempt if normal planning fails. Diagnostic logs now distinguish planner failure from watchdog intervention. Normal AI personality, rules and physics are unchanged.

V0.7.3: Black-ball risk and frame diagnostics. Difficulty 4+ AI now dry-runs attacking plans for foreseeable premature black pots and rejects them before play when colours remain. Frame logs now distinguish legal black wins from illegal black losses and state the reason/winner for faster QA.


V0.7.4: Final-colour black-position hardening. Difficulty 5+ now compares all viable final-colour pot routes by whether their cue-ball forecast leaves a direct black. When at least one route creates a black, routes that leave no direct black receive a strong penalty; Blackball weights this most heavily while Vaper retains slightly more flair freedom. AI logs now state the number of final-colour candidate routes, how many produce a direct black, and whether black position determined the selection.

V0.7.5: Darth Vaper discipline + Perfect-shot calibration. Vaper now physics-tests the best direct routes before flair selection; a reliable simple pot receives SIMPLE POT LOCK and cannot be displaced by a cannon/combination merely for style. Difficulty 7 attack robustness now requires the intended direct/combination pot to be reproduced across the silent physics forecasts and small angle/power probes, not just legal first contact and cue-ball safety.

V0.7.6: Perfect Escape / Deadlock Solver. Darth Vaper now gets an additional physics-validated escape search after normal safety and one/two/three-cushion routes are exhausted. It first searches dense legal-contact windows around valid targets, then performs a wider table search whose candidates may naturally use banks/caroms. A route is accepted only when the silent real-physics copy confirms a legal first contact, cue-ball survival, and no premature black loss. The old emergency foul-tolerant deadlock guard remains as the absolute final safety net so an AI turn can never freeze.

V0.7.7: Final-colour attack override. Darth Vaper no longer abandons a sound final-colour direct pot solely because the extra harsh robustness perturbation probes fail. If the intended shot itself is reproduced successfully at both 60 Hz and 120 Hz dry-run physics, makes the correct first contact, pots the intended final colour and keeps the cue ball safe, the attack is protected from the later safety hard-veto. Premature-black-loss checks remain absolute. New ENDGAME OVERRIDE diagnostics identify when this protection is used.

Seamen English Rules Pool V0.3.6

Changes from V0.2.9:
- Break-points help is now strictly contextual: visible only before a break shot is taken. It hides while the break is in motion, after a legal break, during an illegal-break decision/re-rack choice, and during normal play.
- Added end-of-frame winner celebration overlay naming the winning player.
- Winner overlay includes Play again! and Return to menu.
- Play again starts a fresh prototype frame.
- Return to menu currently shows "Function not available in this prototype." with a large Got it! button, ready to be replaced by a real menu later.

Rules target: EPA International Eightball v2d (2026).

V0.3.6: hardened first-contact trace; numbered per-shot bug log; optional projected object-ball angle guide; developer cue-ball pickup.


V0.3.6
- Fixes final-group-ball transition bug: shot legality is evaluated against the ball/group that was ON at the start of the shot, so potting the last group ball cannot retroactively make that same shot require first contact with black.
- Adds synthesized cue-strike, ball collision, cushion, pot and victory sounds (no external audio assets required).
- Adds Who's playing? startup form and propagates entered names throughout the HUD, turn overlays, logs and victory flow.
- Adds Show game log button to the victory overlay, including the winning shot trace.

V0.3.6: Mobile controls: holdable ±5° and ±0.1° aim buttons, holdable ±45%/±5% power buttons, non-selectable adjustment buttons, chunky page scrollbar, table moved above rules HUD, player group moved to its own line, and rules HUD expanded/wrapped to a stable three-line display.

V0.3.6: break-help visibility fix; mobile HUD line separation; single-row square-ish aim buttons; deeper ker-ching pot sound; conservative embedded/unsupported-browser warning.

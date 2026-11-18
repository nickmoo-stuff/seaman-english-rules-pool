# K3A.2 — 0.17.40 / build 1570

Chapter 0 is optional. Each of its five lessons is selectable and replayable.
Lessons 1–4 use the normal shot, collision/pocket physics and EPA International
rule evaluator. Lesson 5 uses the existing owned-item catalogue/equip handlers.

## Current completion behaviour

- Meet Your Cue has two reds and no yellow. Clear the reds and legally pot the
  black to complete. Guidance teaches Helm, fine aiming, power and simulation
  arrows; hidden input-method checklists do **not** veto a legal clearance.
- Pick Your Colours requires claiming YELLOW with a legal pot, then legally
  potting the black to win. Claiming yellow alone or winning on red earns no
  new tick. The existing layout is retained; the 168.8°/50% hint is verified.
- Don't Pot the White requires an actual in-off followed by moving/confirming
  the white and making a legal corrective shot. EPA International rules award
  cue ball in hand, not two visits. The corrective layout is a teaching stage.
- The Black Ball requires the final colour before a separate legal black pot.
- Look the Part requires equipping an owned cue/table; house equipment counts.
  Locked cards and leaving the catalogue do not earn completion.

Practice returns control to the pupil after ordinary misses or fouls. A foul
still requires placement/confirmation. Normal match turns are unchanged.

A frame-ending black stops the practice frame on its actual result. A successful
finish saves its tick, expands a completion message, disables further shots and
leaves the balls exactly where they finished. It does not return to the menu or
supply a new rack. An illegal black also leaves the ended frame in place without
awarding a new tick. Only an explicit Restart lesson/Replay starts a fresh rack.
Existing earned ticks are never revoked by a failed replay.

Training has no AI, career statistics, campaign victories or cosmetic rewards.
The existing permanent achievement pipeline awards Dave's Star Pupil for the
original five IDs, independently of any future lesson catalogue additions.
The local-player Back fix and removal of the online menu entry are retained.

## Presentation

Lesson cards stack text above a contained full-width button. Floating guidance
lives outside the fixed-height match layout and starts expanded. Hide minimises
it, Read expands it and × dismisses it. Every teaching-message trigger reopens it, including repeated text and text
shown after both reds have been potted, even if previously dismissed. The tip
scroll position resets to the beginning of the new guidance. Table/control interaction still minimises it while
playing. The Game menu can reopen guidance, restart or return to lessons.
Training-table width is capped on short landscape screens to retain controls.
Both service-worker caches are revised to fetch the corrected application files.

## Automated verification

Serve from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory www
```

With Node.js, Playwright and Chromium installed:

```sh
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
node tests/pool-school.cjs
node tests/lesson-one-completion.cjs
node tests/pool-school-layout.cjs
node tests/campaign-regression.cjs
```

- The engine suite covers all five lessons, legal/illegal shots, in-off and
  placement, owned/locked cosmetics, replay, ticks/trophy and save isolation.
  It now explicitly checks legal lesson-1 completion without an input quota,
  frozen finished balls, completion/menu ticks and explicit restart behaviour.
  Shots use actual engine physics, with the existing AI dry-run choosing pot
  angles; no shot outcomes or completion flags are fabricated.
- The lesson-one completion suite clicks PLAY SHOT and waits for real-time
  physics on 390×844 and 1280×900 viewports. It checks reopened first-pot/black
  guidance, a terminal completed table, no automatic re-rack, menu/reloaded
  ticks and unchanged career counts. Angle/power selection uses existing game
  controls/setters and the existing AI planner to reproduce a legal clearance.
- The layout suite checks 320×568, 390×844, 480×800, 800×600 and 1366×768 for
  contained cards, usable controls, Read/Hide/close/reopen, newly expanded text,
  actual UI shots and restart/exit after unsuccessful attempts.
- The campaign suite checks an existing-career fixture, Chapters 1–3, separate
  supporter ownership across reload, and representative match starts and
  engine-resolved shots for Dave, Sandy and Barley. Story presentation is
  bypassed for these representative match checks.

Not exhaustively tested: full campaign playthroughs, every shot combination,
physical touch devices, audio quality, native wrappers and offline upgrades
from an already installed older PWA.

## Manual retest for the completion blocker

1. Enter Meet Your Cue. Hide or dismiss the instructions, then pot the first
   red: updated teaching text should expand automatically.
2. Clear the second red and legally pot the black. Completion text should
   expand, the table should stop with the balls still potted, and no new rack
   or “no completion tick” message should appear.
3. Return to lessons and reload: the tick and Replay button should remain.
   Replay/Restart lesson should be the action that creates a fresh rack.

## Final wording and lesson-2 adjustments

Lesson 2 now states its yellow-claim → legal-black pass requirement explicitly.
The engine suite checks the 168.8°/50% shot, no tick for claiming yellow alone,
no tick for a red-group win, and a tick for the legal yellow-group black finish.
Existing completed ticks remain permanent; replaying with red does not revoke
an earlier tick. The campaign regression now uses the revised yellow finish.

Lesson 3 explains “cue ball in hand”, “not two visits (or two turns)” and valid
placement without touching another ball. Lesson 4 says “without the white going
in as well”. Lesson 5 uses the requested back-to-title/table-design wording.
The menu says additional lessons “may” be added later. Copy assertions cover
these sentences alongside tick/trophy regression checks.

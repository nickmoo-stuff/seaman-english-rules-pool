# K3C.3 follow-up — Cue Helm drag and double-tap recognition

Candidate **0.17.46 / build 1576**, branch `stage3c-k3c1-landscape`.
Parent: `152df8b`. Existing layout, square shot button and visible placement
arrows are preserved. No merge, deployment or Intro Theatre changes.

## Fix

The old aiming recogniser discarded the movement that first crossed its drag
threshold. A short swipe coalesced into one browser move event could therefore
finish without changing the aim. The new browser regression test reproduced this
failure against the previous implementation before the fix.

The initial intentional horizontal movement now applies immediately. Subsequent
movement keeps the existing stabilisation/release guard, and releasing the
pointer stops steering. Simulation/Reversed direction and sensitivity remain.

The rail captures its pointer from the start; the centre ball captures its own
pointer in both modes so its release reaches the double-tap recogniser. After an
intentional aiming drag is recognised, capture transfers to the rail as before.
Landscape Helm gestures no longer hand vertical movement to page scrolling.
Portrait rail scrolling behaviour is preserved.

Double-taps allow up to 500 ms between releases (previously 340), with each tap
limited to 400 ms (previously 260). This accepts ordinary deliberate taps while
retaining movement/long-press rejection. Spin dragging/presets, arrow controls,
keyboard shortcuts and game-state eligibility remain in place. No gesture fires
a shot. Ball physics, shot calculations, EPA rules, AI and saves are unchanged.

Application labels, metadata, current README identity and both offline caches
consistently use 0.17.46/build 1576.

## Verification

Serve `www` on port 8005 and set `TEST_URL=http://127.0.0.1:8005/`.
Performed checks:

- **PASS** `tests/helm-responsive.cjs`: real mouse/touch input in portrait and
  landscape; single-move short ball/rail drags, stopped movement after release,
  deliberate double-taps, spin drag/preset, return to aiming, long-press rejection
  and no accidental shot. Includes the previously failing short-drag condition.
- **PASS** `tests/spin-ui.cjs`, in both layouts: original arrow appearance and
  behaviour, rapid taps/drags, presets/diagonals/clamping, keyboard shortcuts,
  fine/power adjustments, Simulation/Reversed aiming and resets.
- **PASS** `tests/placement-controls.cjs`: visible arrows, actual white movement,
  confirmation, ball-in-hand placement, lesson-overlay clearance and restored
  approved K3C.3 table dimensions at three short mobile sizes.
- **PASS** `tests/spin-physics.cjs`: 12 exact neutral-spin comparisons, spun
  follow/draw/side/diagonal behaviour and engine-resolved pot/foul/black outcomes.
- **PASS** `tests/layout.cjs`: desktop/mobile state, rotation, coordinates,
  persistence, held-press cancellation and accidental-shot protection.
- **PASS** `tests/layout-preservation.cjs`: desktop/mobile portrait and desktop
  landscape table/control geometry and appearance match the approved baseline.
- **PASS** `tests/spin-offline.cjs`: current-cache build 1576 startup, local frame,
  layout and spin controls.
- **PASS** JavaScript syntax checks for `www/*.js` and `tests/*.cjs`, and
  `git diff --check`.

The first corrected test run checked preset visibility before its existing
transition had rendered. It now waits for the real visible preset panel before
interacting, without setting spin mode or simulating success.

Physical Android/iOS hardware remains untested. Full campaign and lesson outcome
suites were not rerun for this input-only fix; their engine/progression code is
unchanged. Earlier reports retain that coverage.

## Manual QA

1. Confirm the white, then make short and longer drags on the centre ball and
   rail. Check both directions and Simulation/Reversed aiming.
2. Double-tap the ball, drag its spin contact point and select presets. Double-tap
   again and check aiming resumes; the left/right buttons must still work.
3. Rotate and repeat on the phone. Check placement arrows, fine aiming and power
   remain usable, and that cancelled gestures cannot play a shot.

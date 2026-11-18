# K3C.3 follow-up — Visible cue-ball placement arrows

Candidate: **0.17.45 / build 1575**, branch `stage3c-k3c1-landscape`.
Parent: `809e4be` (K3C.3). No merge, deployment or Intro Theatre changes.

The mobile landscape precision arrows had been moved into optional Details.
They now occupy a permanent 44-pixel action row beneath the table whenever the
white needs placing. All four original arrow buttons remain directly visible,
even with every information panel minimised. The original confirmation button
stays directly visible beside the power controls.

This row exists only during placement. Confirmation hides it and returns its
space to the table, preserving the approved K3C.3 normal-aiming dimensions and
square shot button. Original handlers, baulk/position validation and disabled
shot states are reused. Desktop and portrait arrangements are unchanged.
Lesson guidance is bounded above the action row so it cannot obscure the arrows.

Version/build labels, metadata and both offline caches use 0.17.45/build 1575.

## Verification performed

Serve `www` on port 8005, then:

```sh
export TEST_URL=http://127.0.0.1:8005/
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
git diff --check
node tests/placement-controls.cjs
node tests/layout.cjs
node tests/layout-preservation.cjs
node tests/spin-offline.cjs
```

All passed. Coverage includes:

- 855×384, 740×360 and 844×340 emulated phones: four visible 44×44 arrows,
  confirmation, fine aiming, Helm, power and square shot control hit-testing.
- All four arrows move the white through actual UI input at a legal baulk
  position. Confirmation enables shots and removes the row. Ball-in-hand
  placement restores it. Details and all optional panels may remain minimised.
- Confirmed table dimensions match the committed K3C.3 measurements. A mobile
  Pool School placement overlay does not block the arrows or confirmation.
- Existing desktop/mobile layout, state/rotation, projection, held-press safety,
  Settings/persistence tests, plus exact desktop/portrait geometry comparisons.
- Current build/cache offline startup, local frame and spin controls.

An initial test assumed the rack's default cue coordinates would return exactly
following opposite nudges. Existing baulk clamping adjusts that boundary point;
no engine change was needed. The test now places the white at a valid interior
baulk point with a real table tap before checking all four nudges.

Physical Android, system insets and OS scaling remain untested. The full physics,
campaign and lesson outcome suites were not rerun for this placement-only fix;
those calculations are unchanged. See the K3C.3 report for previous coverage.

[Opening placement screenshot](qa/k3c3-placement.png) — Chromium emulation,
740×360, with Details closed and arrows/confirmation directly accessible.

## Manual checks

1. Start a frame on the phone in landscape: four arrows and CONFIRM must be visible.
2. Minimise every information panel; tap each arrow and check legal white movement.
3. Confirm the position: arrows disappear, table grows back and PLAY SHOT enables.
4. Check ball-in-hand placement after a foul and placement during Pool School.
5. Rotate and recheck desktop/portrait; normal K3C.3 gameplay should look unchanged.

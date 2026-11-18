# K3C.2 — Mobile landscape correction

Candidate: **0.17.43 / build 1573** on `stage3c-k3c1-landscape`.
Parent: K3C.1 `8d137ae`. Main, production and approved Stage 3A/3B branches are unchanged.

## Changes and review

- Device classification now refreshes when input capabilities change. Mobile UA,
  iPad desktop-UA evidence and the native-container bridge remain supported.
  A touch-only, coarse-pointer/no-hover Device Toolbar profile is recognised even
  when its UA stays desktop. Ordinary desktop resizing/F12 does not change device
  classification or the saved manual layout. A desktop with a mouse/trackpad
  retains manual selection. Classification never uses viewport width alone.
- Mobile orientation still follows reported screen orientation, with legacy/CSS
  fallbacks. No orientation lock is requested. An unchanged portrait orientation
  survives a soft-keyboard-sized viewport.
- Mobile landscape has a non-scrolling shot pane: responsive vertical slider,
  percentage, four original power buttons in two columns, and separate PLAY SHOT.
  The readout shares the slider column so opening spin presets cannot displace
  the negative adjustments behind PLAY SHOT. Essential targets are at least
  44 CSS pixels, allowing subpixel rounding in geometry assertions.
- Compact player rows show names, groups, remaining counts and current turn.
  Full status text remains in the live DOM; unusually long names have ellipsis
  and full-name titles. Desktop status presentation is retained.
- Last Turn moves to the left. During cue placement it is available in Match
  details alongside the existing precision placement buttons and instructions;
  the confirmation button stays directly visible. Dialogue, detailed messages,
  help and developer controls are subordinate to the essential status rows.
  Mandatory break choices use a bounded central prompt on mobile.
- Optional Pool School guidance keeps its Read/Hide/close actions and automatic
  expansion on phase changes. Its mobile landscape overlay clears the status,
  aiming and shot controls. The spin guide's explanatory note moves to Match
  details on phones; presets stay with the Helm and remain touch-sized.
- First Voyage was still launched by shared `newFrame` logic whenever the legacy
  `seamenTutorialSeen` flag was absent/not `1` in Dave's first campaign match.
  The automatic/contextual triggers, modal, Settings/rules replay entries and
  developer reset entry are removed. Legacy flags remain inert and supported by
  save import/export. There is no replacement redirect or forced Pool School.
- Live DOM controls are moved rather than copied. Original portrait anchors,
  pointer cancellation, layout persistence and intrinsic 1780×980 physics/world
  dimensions are preserved. Repeated status updates avoid moving already placed
  controls, preserving held input/capture. Spin physics, collision arithmetic,
  shot values, EPA rules, AI and progression logic are unchanged.
- Application constants, visible labels, HTML metadata, README and both worker
  cache identifiers consistently use v0.17.43/build 1573. Both workers cache the
  layout and spin modules. No native Android project exists in this checkout.

## Automated verification

Requirements: Node.js, Playwright, Chromium (`/usr/bin/chromium`), Python 3 and
Git history containing the approved physics baseline. Serve the existing checkout:

```sh
python3 -m http.server 8003 --bind 127.0.0.1 --directory www
```

In another terminal (run long browser suites sequentially on modest machines):

```sh
export TEST_URL=http://127.0.0.1:8003/
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
git diff --check
node tests/layout.cjs
node tests/layout-correction.cjs
node tests/spin-physics.cjs
node tests/spin-offline.cjs
node tests/spin-ui.cjs
TEST_LAYOUT=landscape node tests/spin-ui.cjs
node tests/pool-school.cjs
node tests/campaign-regression.cjs
TEST_LAYOUT=landscape node tests/campaign-regression.cjs
node tests/lesson-one-completion.cjs
node tests/pool-school-layout.cjs
```

Results: **PASS** syntax/diff checks and all nine browser suites (spin UI and
campaign regression each exercised in both layouts).

Coverage:

- Desktop 1920×1080, 1366×768, 600×760 and 500×700: header/Settings keyboard and
  pointer controls, saved/new-session preference, F12-like resizing and scale,
  ready/live ball and game state, held-arrow cancellation and no accidental shot
  after an interrupted press. Original canvas ratio and touch coordinate mapping.
- Android UA/touch emulation at **855×384 (Pixel 8 Pro UA, custom viewport, DPR 2.625)**, **844×390**,
  **740×360**, **960×540** and **844×340**. Each essential control is checked for
  bounds, clipping by ancestors, hit-testing and touch dimensions, including
  open spin presets and groups/long player names. All four power buttons are
  tapped and values checked. Extra padding models reduced safe-area space at
  740×360; this is a CSS geometry test, not a native inset test.
- Actual emulated-touch placement and precision nudge/confirmation; rotations,
  hidden header/Settings selectors, full break-choice prompt, secondary details,
  a real-time lesson-1 pot with phase expansion/hide and usable controls afterward.
- Live CDP Device Toolbar touch emulation without UA replacement switches to
  automatic mode and back to saved desktop preference when disabled. iPad-UA,
  fine-pointer touch desktop and native-bridge classification are checked.
- Missing/`0`/`1` legacy tutorial flags: Dave starts directly at cue placement;
  old flags remain unchanged, no First Voyage modal/menu exists, no forced school
  or redirect, and reload remains free of the removed tutorial.
- Twelve exact neutral-spin comparisons against the approved pre-spin baseline;
  follow/draw, side/diagonal spin, decay/power/integration and real pot/foul/black
  outcomes. Mouse/touch spin gestures, presets, Simulation/Reversed aiming,
  keyboard/fine/power input and shot/frame/scenario/lesson resets in both layouts.
- All five Pool School success/failure conditions, completion persistence, fixed
  lesson-1 end state, trophy permanence/future lessons, career isolation, menus,
  Local multiplayer and normal career tracking.
- Existing career, Chapters 1–3, cosmetics and supporter records across reload;
  representative chapter matches resolve actual engine shots in both layouts.
- Fresh-cache offline startup, current build and layout/spin files, local play,
  landscape layout and spin controls. No browser script errors in passing suites.

An initial portrait campaign run exceeded its 15-second real-time wait while
several Chromium suites ran concurrently. An isolated rerun passed without a
code/test timeout change. Layout failures found during development were fixed
and the correction checks rerun.

Screenshots from `layout-correction.cjs` default to `/tmp/seamen-k3c2`; override
with `TEST_ARTIFACT_DIR`. Representative candidate images are in `qa/k3c2/`.

## Limits and manual QA

All mobile checks here are Chromium emulation/browser integration. **No physical
Pixel 8 Pro, Android WebView/Capacitor APK, native status/navigation bars, real
safe-area/notch, OS font/display scaling or iOS hardware rotation was tested.**
Emulation cannot certify these; test on the Android device before approval.
No build, deployment, merge or environment publication is performed.

1. On desktop, switch Portrait/Landscape from header and Settings, resize/open F12,
   reload, and confirm the selected layout persists with the same live frame.
2. Enable Device Toolbar, rotate the emulated phone and verify both desktop
   selectors disappear; disable emulation and confirm manual selection returns.
3. On the physical Pixel 8 Pro, play in landscape with normal system bars, then
   try larger display/text settings. Confirm all power buttons, vertical slider,
   percentage, PLAY SHOT, Helm, fine aim and player status fit without scrolling.
4. Place/confirm the white, open Match details for precision nudges/Last Turn,
   play a shot, change spin presets and rotate during play. Check correct values,
   intact balls/groups/turn and no stuck input or unintended shot.
5. Start a fresh Dave match: First Voyage must not appear. Optionally replay Pool
   School, confirm guidance Read/Hide and updated-phase expansion, and verify
   existing ticks/trophy and campaign/supporter data remain intact after reload.

# K3C.1 — Responsive landscape and desktop layout choice

Candidate: **0.17.42 / build 1572**, branch `stage3c-k3c1-landscape`.
Parent baseline: approved **4518e17** (Stage 3B). Stage 3A, Stage 3B, main and the
production repository are not modified. Chapter 4 and unrelated work are excluded.

## Implementation

- Desktop defaults to Portrait. The header's Portrait/Landscape segmented control
  and the matching Settings preference share `gameplayLayoutPreference`, saved
  inside the existing `seamenAudioSettings` record. Audio changes retain it.
  Old saves without the field default to Portrait; invalid imported values are
  rejected by the existing portable-save validation. No second preference key.
- Detection uses mobile UA/UA-data platform evidence, iPad desktop-UA touch
  evidence, the existing native-container bridge and conservative input-capability
  fallbacks. Width is never a device-classification signal. Touch Windows/Mac/
  Linux desktop windows retain the manual layout choice.
- Mobile hides the desktop controls and follows `screen.orientation`, then the
  legacy orientation angle, with a CSS orientation fallback only if platform APIs
  are unavailable. No physical rotation/lock API is called. A shorter viewport
  (keyboard/browser chrome) does not override a reported physical orientation.
- `layout.js` moves live existing DOM nodes into landscape slots and restores
  their original anchor positions in Portrait. No duplicated game controls,
  listeners or parallel copies of status data. `layout.css` scopes the new grid.
- The table is central, player/group/frame/current-message data are on the left,
  and the full last-turn information and vertical power control are on the right.
  The bottom strip contains the existing Cue Helm and horizontal fine aiming.
  Long information remains readable through keyboard/touch-scrollable panes.
- Landscape power is always available, high at the top, with matching positive
  buttons above negative buttons. The original range and all four original
  adjustment buttons are reused. The optional portrait slider preference remains
  unchanged and is labelled accordingly. PLAY SHOT stays reachable separately.
- At very narrow desktop widths, information panes reflow below the table while
  keeping the selected Landscape preference. Short screens prioritise actions;
  full placement instructions remain below the placement buttons. Spin presets
  expand into real space; information panes may require local scrolling. The active page uses dynamic viewport height to avoid mobile browser-chrome
  overflow. Page scrolling and controls over the table are avoided.
- Tutorial guidance and offline/update notices use the information panes during
  landscape matches and return to their original positions elsewhere. Existing
  read/hide/restart actions and global notices remain functional.

## State, input and physics review

The 1780×980 canvas buffer/world dimensions are unchanged. A ResizeObserver fits
its CSS box proportionally into the available central cell. `canvasPoint` already
uses the live canvas bounds, so CSS pixels map back to the same physics world.
Canvas aspect ratio is retained during intermediate resizing as well as at rest.
Turn-announcement text scales with the fitted table rather than the whole window.

Layout changes do not call new-frame, scenario, shot, spin-reset or progression
functions. Ball positions/velocities, player, groups, frame, power, angle, selected
spin, Helm mode and saved career are preserved. Active gestures/hold-repeat timers
are cancelled safely; an interrupted button press cannot become an accidental
PLAY SHOT on release. Fresh input remains available immediately.

No spin-physics file, collision arithmetic, friction, pocket geometry, EPA rules,
AI difficulty/personality or shot execution logic is changed. Stage 3B controls
retain their behaviour in both layouts, including Simulation/Reversed swipes.

Both worker caches include `layout.js` and `layout.css`. App constants, visible
version, HTML metadata, current README identity and Game menu metadata use build
1572. The pre-existing stale Game menu build label is now driven by app constants.
The manifest already specifies `orientation: any`. There is no Android/Capacitor
project or AndroidManifest/Gradle orientation restriction in this checkout.

## Repeatable checks

Use the existing checkout. Requirements: Python 3, Node.js, installed Playwright
and Chromium at `/usr/bin/chromium` (already provided in this cloud environment).
The exact physics comparison needs the approved e9af41e Git object, so run it in
a normal clone rather than a history-free ZIP.

Serve in one terminal from the repository root:

```sh
python3 -m http.server 8002 --bind 127.0.0.1 --directory www
```

Run in another:

```sh
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
node tests/layout.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/spin-physics.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/spin-offline.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/spin-ui.cjs
TEST_URL=http://127.0.0.1:8002/ TEST_LAYOUT=landscape node tests/spin-ui.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/pool-school.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/campaign-regression.cjs
TEST_URL=http://127.0.0.1:8002/ TEST_LAYOUT=landscape node tests/campaign-regression.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/lesson-one-completion.cjs
TEST_URL=http://127.0.0.1:8002/ node tests/pool-school-layout.cjs
```

The baseline physics browser context deliberately omits the current layout
controller while executing the approved old game source; it does not depend on
settings variables that did not exist in the baseline.

Coverage/results:

- **PASS** syntax and diff checks; all eight suites (spin UI and campaign/save checks in both layouts).
- **PASS** desktop 1920×1080, 1366×768, 600×760 and 500×700: Portrait default,
  header/Settings synchronisation, keyboard selection, saved/new-session
  preference, audio-save coexistence, resizing/F12-like widths and zoom retention.
- **PASS** Android-emulated 960×540, 844×390, 740×360 and portrait rotations:
  desktop controls hidden, physical-orientation selection, state preservation,
  actual touch placement coordinates, vertical power and usable fine controls.
  Also checks touch Windows desktop and iPad desktop-UA classification. An
  additional native-bridge smoke check confirms automatic mode detection and
  that no orientation-lock request is made (not a hardware/native package test).
- **PASS** live velocity and ready-state preservation, original intrinsic canvas
  dimensions/aspect, table/control region bounds, held-arrow cancellation and
  interrupted PLAY SHOT protection. Representative screenshots captured at the
  desktop and mobile test sizes and visually inspected.
- **PASS** Stage 3B gesture/keyboard/preset/power/fine-aim tests using mouse and
  emulated touchscreen streams in Portrait and Landscape, including spin reset,
  retained selection, Simulation/Reversed and frame/scenario/lesson resets.
- **PASS** 12 exact neutral-spin physics comparisons, follow/draw/sidespin/
  diagonal/decay/power/integration checks and spun pot/foul/black rule outcomes.
- **PASS** fresh-cache offline startup with the new script/style, local play,
  landscape selection, contained notice and spin controls.
- **PASS** Pool School/trophy/statistics isolation, existing saves/supporter
  data, representative Dave/Sandy/Barley match checks, real-time lesson-1
  completion/reload, and the previous five-size portrait layout checks.

## Limits and manual desktop/mobile QA

Device classification and orientation use browser-reported capabilities, not
physical hardware tests. Real Android WebView/Capacitor, iOS rotation lock,
notches, hardware keyboards and native safe-area handling need device QA.
No native package was built; its external Android configuration is unavailable.
Full campaign playthroughs and upgrades of an old installed PWA were not repeated.
Very small panes can scroll internally; the table and primary shot control remain
separate. Existing Stage 3B guide/spin approximation limits remain unchanged.

1. On desktop, start in Portrait. Switch from the header and Settings; check both
   selections agree. Close/reopen the browser and confirm the saved choice.
2. Resize the desktop window, open F12 and try browser zoom. The chosen layout
   must stay selected; switch back to Portrait and check familiar controls.
3. In Landscape, inspect player/last-turn panes, table proportions, horizontal
   fine aim and vertical power. Try every power/fine/Helm arrow and PLAY SHOT.
4. Double-tap into spin mode, use all presets and a diagonal drag, return to aim,
   and shoot. Check spin applies once and resets without changing the rule flow.
5. Switch layouts mid-match and while selecting spin or placing the white.
   Confirm state stays intact and input remains accurate without accidental shots.
6. On a phone/tablet, rotate both ways (also try rotation lock). No desktop toggle
   should appear. Check short-screen scrolling, safe areas and touch targets.
7. Replay a lesson and a campaign match; check saves, ticks, trophies, cosmetics,
   supporter ownership, sound and Game menu behaviour.

# K3C.3 — Mobile landscape: table first

Candidate **0.17.44 / build 1574**, branch `stage3c-k3c1-landscape`.
Parent: approved desktop K3C.2, `7d0d5a6`. No merge, deployment, environment
publication, Intro Theatre restoration or change to approved Stage 3A/3B branches.

## Implementation and review

- The compact mobile landscape header retains Seamen branding, sound, Settings
  and Game menu. It also keeps the current player and group visible. The group
  has a reserved position so a long player name cannot push the colour out.
- The table occupies the central row between optional information and power.
  Reduced header height, a 72-pixel aiming strip and smaller gaps recover height.
  The canvas remains 1780×980 internally and is fitted proportionally using its
  real rendered bounds. Cloth, balls, guides and touch projection share the same
  unchanged world coordinates. Neither stretching nor physics resizing is used.
- The original PLAY SHOT node moves to a **72×72** bottom-right dock immediately
  beneath the vertical power controls. Disabled states and existing listeners
  remain attached. No substitute shot button, shortcut or extra activation tap.
- All four power adjustments, vertical range, fine-aim buttons, Helm arrows and
  contact-point interaction stay visible without scrolling. Spin presets use
  otherwise free header space when spin is active, keeping the table and the
  aiming strip the same size in both Helm modes. Presets are touch-sized.
- Players, Last turn and Details have separate 44-pixel toggle buttons with
  Read/Hide accessible labels and `aria-expanded`/`aria-controls`. Player and
  Last Turn panels start expanded; Details starts collapsed. User choices are
  independent and persist inside the existing audio/settings save record.
  Audio changes, reloads, new browser sessions and portable saves retain them.
  Old saves receive these defaults; invalid imported panel values are rejected.
- If any optional panel is open, a 172-pixel information rail is reserved. With
  all three closed it becomes a 52-pixel control rail. Essential turn/colour
  information remains in the header. Long optional panel content can scroll
  locally; it never overlays the Helm, fine aiming, power or shot button.
- Cue-ball confirmation remains directly visible beneath power while placement
  is required. Optional precision nudges and full instructions live in Details.
  Lesson guidance and compulsory break-choice prompts are bounded to the central
  table region, leaving essential controls accessible.
- Safe-area environment insets have extra spacing around the interface, including
  the shot dock. Dynamic viewport height remains in use. Shorter viewports and
  synthetic extra inset space are tested; physical native insets are not certified.
- Desktop and portrait use the existing DOM anchors and arrangement. Automated
  geometry/style comparisons against K3C.2 match at desktop Portrait/Landscape,
  large desktop Landscape and mobile Portrait. Desktop manual choice, Settings
  synchronisation and persistence remain covered by the existing tests.
- Layout/panel changes preserve frame state. Changing panel geometry cancels
  active gestures/presses, and an interrupted shot release cannot fire. A fresh
  deliberate tap still executes an actual engine shot. Rotation is tested with
  both a ready frame and live moving-ball/shot state paused for exact comparison.
- No spin-physics, collision, shot, EPA-rule, AI or progression calculations change.
  First Voyage remains removed. Pool School, Chapters 1–3 and supporter saves are
  covered by regression tests. Version labels, metadata, current README identity
  and both offline worker cache identifiers consistently use 0.17.44/build 1574.

## Measured table comparison

The same emulated device, DPR, local frame and normal viewport scale are used
before and after rotation. These are rendered **canvas bounds in CSS pixels**,
including table rails; the unchanged cloth proportions give the same relative
increase in playable width. Values are rounded to one decimal place. Raw values
are in `qa/k3c3/table-dimensions.json`.

| Landscape viewport | Portrait table | Landscape: all panels expanded | All panels minimised | Width gain: expanded / minimised |
| --- | --- | --- | --- | --- |
| 855×384, Pixel 8 Pro UA, DPR 2.625 | 360.0×198.2 | 450.4×248.0 | 450.4×248.0 | 25.1% / 25.1% |
| 844×390, DPR 1 | 366.0×201.5 | 461.3×254.0 | 461.3×254.0 | 26.1% / 26.1% |
| 740×360, DPR 1 | 336.0×185.0 | 396.0×218.0 | 406.8×224.0 | 17.9% / 21.1% |
| 960×540, DPR 1 | 516.0×284.1 | 616.0×339.1 | 733.8×404.0 | 19.4% / 42.2% |
| 844×340, reduced browser space | 316.0×174.0 | 370.5×204.0 | 370.5×204.0 | 17.3% / 17.3% |

**Landscape is measurably larger in every tested profile, including with all
information panels expanded.** Opening spin presets does not shrink these sizes.
The Pixel 8 Pro UA profile gains about 56.6% in table area over portrait.

Height limits table growth on most short phones. Once the table fills the
available height, minimising information cannot enlarge it further without
changing proportions or covering permanent controls. Individual panels share one
rail; closing the last expanded panel recovers its width. At 960×540 this produces
another 19.1% width increase over the fully expanded landscape arrangement.

## Automated verification

Use the existing checkout, Node.js, Playwright, Python 3 and Chromium at
`/usr/bin/chromium`. Git history must include K3C.2 and the approved pre-spin
baseline for the comparison suites. Serve the game:

```sh
python3 -m http.server 8004 --bind 127.0.0.1 --directory www
```

Run browser suites sequentially on modest machines:

```sh
export TEST_URL=http://127.0.0.1:8004/
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
git diff --check
node tests/layout.cjs
node tests/layout-correction.cjs
node tests/mobile-table-first.cjs
node tests/layout-preservation.cjs
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

Coverage/results: **PASS** JavaScript syntax/diff checks and all eleven browser
suites; spin UI and campaign regression are each exercised in both layouts.

- Required mobile sizes, Pixel 8 Pro UA/DPR profile, reduced-height browser space,
  all-expanded/individual-minimised/all-minimised panel combinations, both Helm
  modes, table proportions, original canvas dimensions and coordinate projection.
- Essential controls: viewport and ancestor-clipping bounds, hit-testing, minimum
  touch dimensions, no mutual overlap, bottom-right square geometry and padding.
  Each fine/power adjustment is exercised. Placement/confirmation and real shots
  work. Disabled shots, held presses across layout changes and cancellation are
  checked. Extra padding models unavailable inset space on the 740×360 screen.
- Independent panel persistence across audio saves, reload, a new browser context
  and valid/invalid portable saves. Current frame is preserved on panel changes.
- Ready/live frame state during rotation, spin/power selection, touch coordinates,
  automatic phone orientation, hidden desktop selectors and desktop F12/resize/
  zoom/preference behaviour. Device Toolbar activation/deactivation without a
  mobile UA is covered, along with iPad and native-bridge classification.
- Exact K3C.2 geometry/style preservation in desktop/mobile portrait and desktop
  landscape. Twelve exact neutral-spin engine comparisons plus follow/draw,
  side/diagonal spin, decay, integration rates, real pot/foul/black outcomes and AI.
- Stage 3B mouse/touch gestures, keyboard input, presets, both aiming preferences,
  power/fine controls and shot/frame/scenario/lesson resets in both layouts.
- All five Pool School success/failure conditions, persistent ticks, completed
  lesson freeze, trophy stability, career isolation and Local multiplayer fixes.
  Real-time lesson-1 and lesson-2 pots and mobile landscape phase guidance.
- Existing career, Chapters 1–3, cosmetics/supporter records, reload preservation,
  representative chapter matches with actual engine shots, and current-cache
  offline startup/local/spin behaviour. Missing/false/true legacy flags cannot
  launch First Voyage or force Pool School.

Initial touch runs intermittently missed double-tap recognition while several
Chromium tests ran together. The original touch sequence passed an isolated
diagnostic run. The shared test helper now dispatches two real CDP touch streams
with a controlled 60-ms gap instead of two locator actionability waits. Game
input timing and handlers are unchanged. Final touch suites are rerun; no success
is simulated by setting spin mode directly.

## Limits and known issues

No reproducible gameplay regression remains in the passing automated checks.
Nonessential panel contents may need local scrolling when expanded, especially
long dialogue; essential controls never do. Table growth remains constrained by
screen proportions, the permanent controls and safe-area space, as above.

**Physical Pixel 8 Pro/Android testing is still required.** The profile here is a
Pixel 8 Pro user-agent with a custom CSS viewport/DPR, not physical hardware or a
stock device certification. Native WebView/Capacitor APK, actual OS bars, real
safe-area values, OS display/font scaling and iOS hardware rotation were untested.
This Chromium does not expose `Emulation.setSafeAreaInsets`; padding/short-height
checks model lost space rather than asserting native inset behaviour.

Screenshots and raw measurements are in `qa/k3c3/`. Test-generated images default
to `/tmp/seamen-k3c3`, configurable with `TEST_ARTIFACT_DIR`.

## Manual QA

1. On the Pixel 8 Pro, compare portrait and landscape at the same system display
   setting. Verify the landscape table is visibly larger and remains proportional.
2. Open all three information panels, close each separately, then close all.
   Check turn/colour remain visible, long information is readable and controls stay
   accessible. Reload and confirm each panel choice is remembered.
3. In both Helm modes, swipe/hold the arrows, drag spin, try every preset, all four
   fine increments, all power adjustments and the vertical slider. Confirm the
   table stays the same size when spin opens.
4. Use the square bottom-right PLAY SHOT button with system navigation visible.
   Check placement/confirmation, disabled states, fresh shots and rotation/panel
   changes during a held press. Repeat with larger OS display/text settings.
5. Replay optional Pool School, then a campaign/local frame; check saved ticks,
   trophy, chapters and supporter cosmetics. First Voyage must remain absent.
6. On desktop, verify the passed Portrait/Landscape header/Settings behaviour,
   persistence after F12/resizing/reload, and unchanged portrait presentation.

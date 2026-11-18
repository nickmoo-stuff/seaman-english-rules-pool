# K3B.1 — Cue-ball spin and Cue Helm

Candidate: **0.17.41 / build 1571**. Branch: `stage3b-k3b1-spin`.
Starts directly from the approved **e9af41e** Stage 3A commit. The approved branch,
main and the live repository are not changed. Stage 3C is not included.

## Implementation and review notes

`www/spin-physics.js` provides the bounded, time-based spin model. The selected
cue-tip point is clamped to 85% of the graphic's radius. Screen-up contact means
topspin; screen-down means draw. Horizontal contact selects left/right sidespin.
Diagonal points combine both, with strength proportional to contact displacement
and shot speed.

- Centre contact does not enter the spin path: baseline drag, restitution,
  collision arithmetic, pocket tests and rule evaluation remain unchanged.
- A finite follow/draw surface-speed reservoir decays on the approach, then
  transfers motion through cloth after object-ball contact. Reverse velocity
  can develop through zero without being erased by the baseline stopping cutoff.
- Sidespin supplies a bounded tangential cushion impulse, loses half its remaining
  strength per cushion and decays over time. Speed gain at a cushion is capped.
  Ball contacts attenuate residual spin. Potted balls discard physical spin.
- No swerve, jump shots, masse, ball elevation or object-ball throw is modelled.
  This is a calibrated planar approximation, not a full rigid-body billiards model.
  Human assessment of spin strength and feel remains necessary.

The existing Cue Helm rail and arrow buttons are retained. A CSS-rendered white
ball replaces the decorative centre symbol. Normal swipes still aim; two short,
stationary taps on the ball toggle spin mode. In spin mode only ball dragging
sets spin. The same arrow/fine-aim/power controls remain available. Enter/Space
also toggles spin accessibly; focused spin-ball arrow keys move its marker.

Presets unfold with a short CSS grid transition, respect reduced-motion settings,
are inert/hidden while collapsed, and retain the selected contact point when
returning to aiming. Selection resets immediately on a shot and when starting
frames, scenarios, lessons, custom games or returning to menus. It is never saved.
A pending rail drag is cancelled at reset so it cannot steer a new shot/frame.

Touch testing found and corrected implicit pointer-capture hand-off from the
child ball to the original aiming rail. Dragging cannot masquerade as tapping.
Pointer-driven focus jumps between taps are suppressed; Tab still focuses the
ball and existing A/D/W/S/E development shortcuts work there. Repeated mode
switches after focusing the power slider are included in the control test.
Touch-action suppression is scoped to the ball. The existing blanket viewport
zoom restriction is removed so unrelated zoom accessibility is not disabled.

The baseline retained Simulation/Reversed preference names but disabled their
selector and forced Simulation on load. Both choices are now exposed in the
existing Game menu, saved and restored. Reversed affects swipes; arrow and fine
button directions retain their original increments.

AI deliberately uses centre shots and its existing neutral dry-run predictor;
difficulty/personality code is unchanged. First-contact and object-ball guide
geometry remains valid because spin acts after contact or at cushions. The guide
has no new cue-ball follow/draw forecast; spin-mode guidance states this limit.
Running a full spin forecast each render frame was avoided to keep input smooth
and prevent an approximate path from being presented as a guaranteed trajectory.

Both service-worker caches include the new spin script. Application constants,
visible version, HTML application/build metadata and current README identity
are updated. No Gradle/Capacitor Android project exists in this checkout, so
there is no native Android build metadata/package build to update or validate.

## Repeatable automated checks

Use the existing checkout; no worktree is needed. Requires Node.js, Playwright,
Chromium at `/usr/bin/chromium`, and Python 3 (already supplied in this cloud
machine). The physics baseline comparison requires the e9af41e Git object,
available in a normal repository clone; a ZIP alone has no Git history.

From the repository root, start the server in a separate terminal:

```sh
python3 -m http.server 8001 --bind 127.0.0.1 --directory www
```

Then run:

```sh
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
node tests/spin-physics.cjs
node tests/spin-ui.cjs
node tests/spin-offline.cjs
TEST_URL=http://127.0.0.1:8001/ node tests/pool-school.cjs
TEST_URL=http://127.0.0.1:8001/ node tests/campaign-regression.cjs
TEST_URL=http://127.0.0.1:8001/ node tests/lesson-one-completion.cjs
TEST_URL=http://127.0.0.1:8001/ node tests/pool-school-layout.cjs
```

Observed results:

- **PASS** syntax checks and whitespace/diff checks.
- **PASS** 12 exact zero-spin comparisons against approved e9af41e physics:
  collision, cushion, pocket and break fixtures at three powers. The test routes
  the approved game source into a separate browser context and compares settled
  positions, velocities, pots, first contact, cushion/break results and stopping.
- **PASS** follow/draw versus centre, mirrored side-cushion response, diagonal
  combinations, strength/decay, different powers and 60/120/240 Hz integration.
  Actual spun pots, in-offs, wrong first contact, early-black loss and legal-black
  win go through the normal rule evaluator. AI shots ignore human spin selection.
- **PASS** mouse and Android-compatible emulated touch input, including real CDP
  touchscreen drags, double/single taps, normal/spin drag separation, presets,
  diagonal/clamped points, unchanged arrow styling/dimensions, all four fine-aim
  and all four power buttons in both modes, optional slider, keyboard access,
  Simulation/Reversed direction and preference reload, neutral shot/frame/
  scenario/lesson resets, and placement guards. No page errors.
- **PASS** fresh-cache offline startup loads build 1571, the new spin module,
  a local multiplayer frame and spin controls. This does not prove an upgrade
  from every previously installed PWA version or validate optional media offline.
- **PASS** all five Pool School engine scenarios, completion/trophy persistence,
  owned/locked cosmetics, failed attempts and career/campaign isolation.
- **PASS** existing-save/supporter preservation and representative Dave, Sandy
  and Barley starts/shots (story presentation bypassed for these match checks).
- **PASS** real-time lesson-1 completion/reload on phone and desktop viewports.
- **PASS** existing layout checks at 320×568, 390×844, 480×800, 800×600 and
  1366×768. Spin-mode desktop/mobile screenshots were also inspected.

## Human QA still required

Physical Android hardware/WebView, full campaign playthroughs, audio quality,
old installed-PWA upgrades and subjective physics balance are not covered by
these tests. Full spin-aware cue-ball forecasting is not implemented. There are
no new AI spin tactics and no native packaging changes.

1. Start local multiplayer. Try normal swipes, single taps, arrows, fine aiming
   and power. Double-tap the centre ball; check header text and unfolding presets.
2. Drag a diagonal contact point. Double-tap back to aim and confirm it stays
   selected. Use the normal aiming/power buttons in both modes and play a shot;
   check it resets to Centre and normal aiming immediately.
3. On comparable straight pots compare Centre, Topspin and Backspin. Try Left/
   Right on comparable cushion shots and a diagonal combination; assess strength
   at gentle and firm powers for convincing follow/draw and rebound behaviour.
4. Test in-off placement, a new frame and a turn change. Spin must not leak into
   another shot. Check Simulation/Reversed swipes and pinch/keyboard access.
5. Replay Pool School, start a campaign match and reload a saved career. Confirm
   ticks, trophy, supporter ownership and normal match statistics behave as before.

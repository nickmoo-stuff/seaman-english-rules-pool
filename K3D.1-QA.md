# K3D.1 — Intro Theatre restoration and story-flow regression

Candidate: **0.17.47 / build 1577**.
Branch: `stage3d-k3d1-theatre-restoration`, created directly from the approved
K3C.3 commit **33d1f67** (0.17.46/build 1576). No main/production merge,
deployment, environment publication, Chapter 4 work or approved-branch edits.

## Root cause and investigation

The original catalogue, dialogue and artwork were still present. K3A.1's
`pirateMode` handler explicitly bypassed Chapter 1's opening check in favour of
immediate roster entry, leaving `chapter_1_intro` defined but unreachable through
normal fresh-save navigation. This was separate from First Voyage's removal.
Dave's and other ordinary opponents' pre-match portrait/quote introductions were
still present; they have not been replaced with invented Theatre content.

The scene engine also revealed scenes immediately, without awaiting image decode.
Internal/final transitions depended on timer/frame waits rather than destination
asset readiness. Some story callers left the pool view visible/active underneath,
allowing gameplay-only viewport constraints and hidden input to persist. Rapid
entry/exit calls had no central lifecycle guard. Chapter 3 victory flags were
written before their Theatre completed, which could make interrupted content
appear already watched after a reload.

During implementation, regression tests caught stale chapter-state references in
completion callbacks. Those callbacks now update the current chapter state after
the scene has finished, rather than a snapshot captured before asynchronous work.

## Changes and preserved content

- Restore the conditional fresh-campaign opening and keep completion persistent.
  Honour both existing chapter flags and legacy Blackball flags. Existing match
  records/victories establish that a campaign/encounter has already begun when an
  old intro flag was absent; such saves are not rewound or reset. Inferred opening
  state is not written as fabricated completion credit.
- Use the existing chapter and opponent entry points for all original content:

| Entry | Existing presentation and gating |
| --- | --- |
| Fresh Chapter 1 | `chapter_1_intro`, then the tavern roster |
| Dave, Simon, Holly, Mick, Cyclops | Original portrait/quote pre-match cards |
| Blackball | `blackball_intro` / `blackball_ending`, legacy/chapter seen flags honoured |
| Chapter 2 | `chapter_2_intro`; original island opponent pre-match cards |
| After Papa Surf | `chapter_2_boss_reveal`, preserving Mr Wiggles' identity gate |
| After Mr Wiggles | `chapter_2_ending` and existing Chapter 3 progression |
| Chapter 3 entry | `chapter_3_arrival` continues directly into Barley's challenge |
| Chapter 3 main opponents | Existing Barley, Legolass, Aragoon, Souronion and Blockbeard challenge/victory scenes |
| Supporter Theatre | Existing Vaper control-room and Pokey Man sequences |
| Other supporter introductions | Existing Izzy, Gimlet and Bam Bam portrait/quote cards; no new scene scripts invented |

- All **19 original scene definitions, 271 dialogue beats, asset references, animation
  directives and timing metadata** compare exactly with the approved catalogue.
  No approved artwork, dialogue or physics file is modified.
- Add `theatre.js` for decoded artwork readiness, opaque covers, original-duration
  fades, destination-image/font readiness and confirmed rendered frames. Keep the
  source opaque while fading black in; change screens only under full black;
  uncover only after the destination is ready. There is no fixed loading delay.
- Bound failed/unresponsive requests with a 15-second network/decoder deadline.
  Missing optional artwork is omitted with a small continuation message; original
  dialogue and exits remain usable. Later entries retry transient failures.
  Missing ordinary portrait art also cannot trap the pre-match card.
- Central loading/ready/transition/closing states prevent duplicate instances,
  repeated callbacks and advances during transitions. Clear scene timers, layers
  and listeners at exit; reduced-motion/invisible departures do not leave unused
  character layers waiting for a transition event that cannot fire.
- Suspend/hide gameplay during Theatre and pre-match presentations, cancel held
  gestures using the existing Stage 3C cancellation path and suppress hidden
  gameplay shortcuts. Theatre owns keyboard focus; Tab stays on its Next button.
  Safe previews restore the same match, spin, pause state and saved layout.
- The Theatre remains the original responsive overlay at document root. It never
  inherits pool-table side panes, Helm/power controls or the dedicated gameplay
  grid. Menus and portrait/desktop gameplay retain their existing arrangement.
  A height-only responsive correction prevents character cropping in short
  windows, keeps artwork proportional and lets long dialogue scroll while Next
  stays reachable. It is independent of gameplay layout and orientation.
- Correct the boss-reveal exit to return to the island roster, matching its
  existing finish-button label rather than dropping the player at the title.
  Story-to-roster handoffs also hide the title behind the roster, matching normal
  roster entry instead of leaving two menu screens visible together.
- Record Chapter 3 victory scenes as seen only after completion. A small pending
  chapter field allows earned interrupted victory scenes to resume after reload.
  Existing earned boss-ending/reveal recovery is retained and reconciled with
  legacy flags. No opponent/chapter is unlocked simply by viewing a scene.
- First Voyage remains absent. Pool School stays optional; lessons, ticks and
  Dave's Star Pupil are covered by regression tests.
- Development-only diagnostics record eligibility, already-completed evidence,
  progression/duplicate blocks, asset waiting/readiness, launch and completion.
  Preview controls are absent from release builds. Normal players see no debug UI.
- Both worker caches include `theatre.js`; the primary worker treats it as mutable
  code. Visited artwork remains available offline; uncached artwork uses the same
  graceful continuation path. Existing app-icon metadata avoids favicon 404s.
  Version labels, app constants, HTML metadata, README and both cache identities
  consistently use 0.17.47/build 1577.

## Verification performed

Requirements: existing checkout, Node.js, Playwright, Chromium at
`/usr/bin/chromium`, Python 3 and Git history for approved comparison baselines.
Serve from the repository root:

```sh
python3 -m http.server 8006 --bind 127.0.0.1 --directory www
```

Run browser suites sequentially on modest machines:

```sh
export TEST_URL=http://127.0.0.1:8006/
for file in www/*.js tests/*.cjs; do node --check "$file" || exit; done
git diff --check
node tests/theatre.cjs
node tests/theatre-readiness.cjs
node tests/theatre-responsive.cjs
node tests/theatre-offline.cjs
node tests/layout.cjs
node tests/layout-preservation.cjs
node tests/mobile-table-first.cjs
node tests/layout-correction.cjs
node tests/helm-responsive.cjs
node tests/placement-controls.cjs
node tests/spin-ui.cjs
TEST_LAYOUT=landscape node tests/spin-ui.cjs
node tests/spin-physics.cjs
node tests/spin-offline.cjs
node tests/pool-school.cjs
node tests/lesson-one-completion.cjs
node tests/pool-school-layout.cjs
node tests/campaign-regression.cjs
TEST_LAYOUT=landscape node tests/campaign-regression.cjs
```

**PASS:** syntax/diff checks and all **17 browser suites**, including spin UI and
campaign regression in both layouts.

New coverage:

- Fresh opening through Chapters 1–3 using actual menu/challenge entry points;
  all existing main-opponent introductions, victory/ending triggers, supporter
  Theatre/cards, locked-character checks and seen/repeat behaviour.
- Existing mid-Chapter 1/2/3 saves with missing intro flags, completed intro flags,
  supporter state, Pool School progress/trophy, reload/portable-save framework
  compatibility, and interrupted earned victory recovery without repeat.
- Controlled Chapter 1/2/3 defeat/results/rematch branches without victory scenes
  or unlocks. Campaign wins/losses in story-flow fixtures use the existing
  development win path or engine result function; these are not natural AI games.
- All 19 scenes and **every dialogue beat** at 1366×768, 1920×1080, 390×844,
  740×360 and 855×384: decoded images, reachable/hit-testable Next, short-screen
  artwork bounds, no gameplay grid and no save mutation by previews.
- Held controls and keyboard input during a live-match preview, exact restored
  match/spin/save/layout state, focus isolation, duplicate navigation and resize.
- Delayed entry/destination assets with opaque covers, normal/reduced-motion
  handoffs, failed artwork, transient-failure retry and an actual unresponsive
  request reaching its failure deadline. No permanent black screen.
- Cached Theatre runtime/artwork offline after reload and uncached-art fallback;
  no page errors or save changes. Release-build preview/diagnostic guards.
- Full catalogue equality with 33d1f67 and no console/resource errors on the
  healthy complete story-flow run. Deliberately failed/offline media requests are
  expected only in failure-path tests, with no uncaught page errors.

Existing coverage remains green: Stage 3C table measurements/panel preferences,
normal/spin Helm input, placement arrows, square shot control, actual EPA/physics
outcomes, 12 exact neutral-spin comparisons, lesson completion/trophy/isolation,
real-time pots, Local multiplayer, Chapters 1–3/save/supporter preservation.

Pool School-only fixtures now explicitly establish that the opening story was
seen; the restored fresh-story behaviour is tested separately. The campaign
save fixture explicitly identifies completed Chapter 1 storytelling instead of
seeding a completed chapter with an unfinished ending. One heavily concurrent
real-time lesson run could not find its robust black-pot plan; an isolated rerun
passed unchanged. No physics or planner logic was altered to make that test pass.

## Safe development preview shortcuts

After entering the tavern/title screen in this development build, use the browser
console. These previews do **not** award victories, mark story completion, unlock
opponents or change saves:

```js
SeamenTheatreQA.preview('chapter_1_intro')
SeamenTheatreQA.preview('chapter_2_intro')
SeamenTheatreQA.preview('chapter_2_boss_reveal')
SeamenTheatreQA.preview('chapter_2_ending')
SeamenTheatreQA.preview('chapter_3_arrival')
SeamenTheatreQA.preview('chapter_3_legolass_challenge')
SeamenTheatreQA.preview('supporter_vaper_intro')
SeamenTheatreQA.preview('supporter_pokey_intro')
```

Only one preview/scene can run at a time. `SeamenTheatreQA.dismissPreview()` exits
an active ready preview without writing progress; it refuses to dismiss required
campaign scenes. `SeamenTheatreQA.decisions` shows the bounded development trace.
These functions are not exposed with `BUILD_MODE='release'`. Automated fixtures
reach real later-story triggers in disposable browser contexts, without requiring
a tester to delete or modify their real save.

## Limits and manual QA

Physical Android/WebView/Capacitor, iOS, OS navigation bars/safe-area values and
real device display/font scaling were not tested. Automated progression uses
controlled results, accelerated dialogue and reduced motion where practical;
it does not certify a complete naturally played AI campaign, every audio cue or
all animation timing on physical hardware. Original timing metadata is preserved
and the non-reduced opacity handoff is separately checked.

Screenshots are in `qa/k3d1/`. Scene assets not previously cached can remain
unavailable offline; dialogue and exits still work. Music remains network-only,
as before. The tested missing-asset path does not claim to reconstruct absent art.

1. In a fresh browser profile, choose story mode: watch the opening, finish it and
   check the roster appears. Re-entry must not replay the opening.
2. Challenge Dave, read his original introduction and start the match. Confirm
   white placement, aiming and spin still work.
3. Check Simon/Holly/Mick introductions and Blackball's first showdown/ending.
4. Check Chapter 2 voyage, island introductions, Papa Surf → boss reveal and the
   boss ending. Locked identities must remain concealed until earned.
5. Check Chapter 3 arrival → Barley continuity, later challenge/victory scenes and
   the existing ending; no Chapter 4 gameplay should appear.
6. With supporter access, check Vaper and Pokey Man Theatre sequences and the
   existing other supporter portrait/quote introductions.
7. Watch scene/background and Theatre-to-match/roster handoffs: black must remain
   opaque until ready, with no old-screen flash or partially loaded artwork.
8. On Android, rotate during Theatre and use a short viewport/larger display
   setting. Portraits/dialogue/Next must remain usable without gameplay side panes.
9. Confirm First Voyage never launches for a new or returning player.
10. Replay optional Pool School; check all five ticks and Star Pupil survive reload.
11. Recheck approved landscape controls, panel choices, placement arrows, square
    PLAY SHOT, desktop preference and portrait gameplay.
12. Load existing campaign saves and verify normal progress resumes without
    resets, duplicate completed scenes, new unlocks or lost supporter ownership.

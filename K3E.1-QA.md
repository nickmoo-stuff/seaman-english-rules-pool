# K3E.1 — Dynamic story progress reminder

Candidate: **0.17.48 / build 1578**.
Branch: `stage3e-k3e1-story-reminder`, created directly from the FULL PASS
K3D.1 baseline `ace31283369d27fb91ca2362f9ca38500f1dfe37`.

## Implementation

- Minor UI addendum, same version/build: the static heading **Current story mode
  progress:** stays immediately above the dynamic message in their shared compact
  container, before Play. Its font weight is 600 versus the message's 400. Only
  the paragraph is replaced on progress changes, so every milestone retains the
  heading. Progression logic and the approved messages are unchanged.
- One compact, informational paragraph immediately above the existing story Play
  button, using the existing brown/gold menu palette. The approved seven messages
  are retained verbatim in one frozen catalogue.
- One central `resolveStoryReminder()` reads existing chapter flags, main-opponent
  victories and match records. It does not write, migrate or add fields to saves.
- Refresh through existing career rendering (including saves/results) and every
  `showTitleScreen()` call. Startup/import reload uses the existing save loader.
- The reminder belongs to the title screen, never the opponent roster or gameplay.
  It has polite, atomic status semantics and describes the existing Play button;
  it adds no focus stop, settings, popup or animation.
- On overflowing short screens, align the menu card's contents to the start so
  its heading/reminder remain scrollable. The card itself retains its existing
  viewport centring, width, maximum height and scrolling. Visual review caught
  the previous centred-overflow behaviour putting the reminder above the reachable
  scroll area; the strengthened test now checks vertical reachability too.
- Update version/build identifiers and both offline-shell cache versions. Existing
  offline suites now assert build 1578; offline startup also checks the reminder.
- No gameplay, Theatre content/layout, navigation handlers, progression rules,
  save schema, entitlement logic or Chapter 4 content was introduced or altered.

## State resolution, highest priority first

| Evidence | Approved message selected |
| --- | --- |
| Integrated, available Chapter 4 complete | Chapter 5 availability reminder |
| Integrated, available Chapter 4 started | Fiery realm reminder |
| Chapter 3 complete | Progress to Chapter 4 |
| Chapter 3 started, or Chapter 2 complete | Golden Cue investigation |
| Chapter 2 started | Strange land |
| Chapter 1 complete / Blackball defeated | Begin Chapter 2 |
| Otherwise | Get your bearings |

Completion follows established durable evidence: `completed`, `endingSeen`, or
the chapter's main boss victory (defeated key or a recorded win). Chapter 1 uses
Blackball's existing legacy key `5`; the later bosses use their stable IDs.
Entry uses `introSeen`, `bossIntroSeen`, or a recorded main-opponent win/loss.
An unlock alone is not entry. Only each chapter's declared main opponents count;
supporter ownership, cosmetics, School and bonus-pair results do not advance it.

Chapter 4 is absent from the shipped `CHAPTERS` catalogue, so its ongoing and
completed messages cannot be selected in current gameplay, even if an unrecognised
future chapter object exists in a save. Future integration must supply real
playable, non-foundation/non-post-release main content and its authoritative
unlock rule, including any entitlement requirement. Controlled tests supply a
separate catalogue/roster with such a rule; they do not modify the shipped game.
The Chapter 4 objective after Chapter 3 is informational and grants no access.

## Automated verification

**PASS (original candidate):** all **19 distinct suites**, with spin UI and campaign regression each
run in both portrait and landscape (21 main-run invocations). All 28 JavaScript
files passed syntax checks, and patch formatting passed.

The initial real-time Lesson 1 run could not find a robust black-pot plan; the
initial landscape campaign run timed out waiting for its fixed-angle yellow pot.
Both tests passed unchanged in subsequent isolated reruns. Lesson 1 then cleared
legally at 390×844 and 1280×900, froze its completed table, retained its tick across
reload and left career totals unchanged. The campaign rerun verified its actual
pot, preserved saves/cosmetics/supporter data and resolved representative engine
shots in all three chapters. These timing-sensitive tests are not claimed to have
passed on their first attempt. No physics, planner or test assertions were changed
to make them pass. The reminder's two focused suites were also rerun successfully
after their final additional future-unlock and vertical-reachability assertions.

Source comparison also confirms `game.js` is byte-identical to `ace3128` after
removing only the reminder definitions, its two rendering calls and the new
version/build values. `layout.js`, `layout.css`, `spin-physics.js`, `theatre.js`
and `dialogue.js` are unchanged.

The static-heading addendum passed both focused reminder suites, syntax and patch
checks, with refreshed screenshots. The responsive test additionally checks the
exact heading, stronger font weight, shared container and visible placement above
every message at every tested size. The other 17 suites were not repeated for this
HTML/CSS-only addition; `game.js` is unchanged from the first K3E.1 candidate.

Focused suites:

- `tests/story-reminder.cjs`: 24 current/legacy state fixtures, all seven exact
  messages, precedence, optional-pair independence, pure-reader save isolation,
  future catalogue/availability/entitlement fixtures, real menu/result callbacks
  with controlled victories, reload persistence and five missing-flag save loads.
- `tests/story-reminder-layout.cjs`: all seven messages on 1366×768, 1920×1080,
  320×568, 390×844, 740×360 and 855×384, plus doubled reminder text at 390×844.
  Checks wrapping, contrast of at least 4.5:1, horizontal overflow, vertical
  reachability, overlap, status/description semantics, keyboard order and working
  local/story navigation. Captures desktop, phone and short-landscape screenshots.

Reproduce with an HTTP server serving `www` (for example, port 8007), installed
Playwright and `/usr/bin/chromium`:

```sh
TEST_URL=http://127.0.0.1:8007/ node tests/story-reminder.cjs
TEST_URL=http://127.0.0.1:8007/ node tests/story-reminder-layout.cjs
```

The existing regression suites are listed in the final results below. All
`www/*.js` and `tests/*.cjs` files also receive `node --check`; `git diff --check`
checks patch formatting. `tests/touch-input.cjs` is a helper used by the browser
suites, rather than a standalone test.

| Suite (`tests/<name>.cjs`) | Coverage |
| --- | --- |
| `story-reminder` | State mapping, lifecycle updates, legacy reloads, isolated future fixtures |
| `story-reminder-layout` | Six viewport sizes, doubled reminder text, accessibility/navigation checks |
| `layout` | Desktop choice, mobile orientation, persistence and canvas coordinates |
| `layout-preservation` | Approved table/control geometry and styles |
| `mobile-table-first` | Approved mobile table sizes, expanded/collapsed panels |
| `layout-correction` | Pixel 8 Pro and short screens, essential controls, School, native classification, First Voyage absent |
| `helm-responsive` | Mouse/touch gestures, double-tap and spin |
| `placement-controls` | Reachable placement arrows and confirmation |
| `spin-ui` (portrait and landscape) | Mouse/touch aiming, presets, fine aim/power and resets |
| `spin-physics` | Neutral equivalence and actual spun shot outcomes |
| `spin-offline` | Cached build 1578, reminder, local frame and spin/layout controls |
| `pool-school` | Five lessons, engine successes/failures, persistence, trophy and career isolation |
| `lesson-one-completion` | Real-time clearance, expanded guidance, frozen completion, persistent tick |
| `pool-school-layout` | School menu/overlay containment and navigation on five sizes |
| `campaign-regression` (portrait and landscape) | Chapters 1–3 saves, School, entitlement preservation and real match setup/rules |
| `theatre` | Original catalogue, story triggers, save recovery, gating and defeat/rematch paths |
| `theatre-readiness` | Delays, missing assets/retry, bounded failure, opaque fades, game/input restoration and release guard |
| `theatre-responsive` | All 19 scenes / 271 dialogue beats at five viewport sizes |
| `theatre-offline` | Cached/uncached artwork, usable exits and unchanged save |

[Menu screenshots](qa/k3e1/README.md) are committed with the candidate.

## Limits

Campaign milestones use controlled results in disposable browser contexts, not a
complete naturally played AI campaign. Chromium emulation does not certify
physical Android/WebView/iOS safe areas, device font scaling or a screen reader's
spoken output. The doubled-text check enlarges the reminder, not the whole
browser's zoom. Chapters 4–5 are not implemented or playable; only their reminder
mapping is exercised through isolated future-content fixtures.

## Manual QA

1. Fresh save: confirm the exact “Get your bearings” message immediately above
   Play, and confirm normal story/Local multiplayer navigation.
2. Defeat Blackball and return: check the Chapter 2 prompt. Begin Chapter 2 and
   return: check the strange-land message.
3. Defeat Mr Wiggles and enter Chapter 3: both states must show the Golden Cue
   investigation message.
4. Finish Chapter 3 while leaving Gimlet/Bam Bam unfinished: check the Chapter 4
   objective; confirm it grants no new chapter access.
5. Reload an existing save: verify the correct objective, campaign progress,
   trophies, School ticks and supporter ownership remain intact.
6. On desktop and a short Android landscape screen, check wrapping, scrolling,
   readable text and accessible menu buttons. Check it is absent from the roster,
   Theatre and gameplay; smoke-test placement, Cue Helm, spin and PLAY SHOT.

No merge, deployment or environment publication is part of this delivery.

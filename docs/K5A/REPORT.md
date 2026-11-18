# K5A — whole-game regression

16 November 2026. Approved content freeze: K4B `bd794909aed197ec85d3338e9af682856fdba6a9`, **0.17.59/build 1589**. K5A branch: `stage5-k5a-whole-game-regression`.

## Scope and outcome

K5A is a test/documentation milestone. The complete `www` and `native-patches` payloads are byte-identical to the approved baseline: 117 files, no additions or deletions. No gameplay, AI balance, dialogue, artwork, progression, saves, entitlements, version/build or native purchase settings were changed. The same version/build is retained because no game code correction was needed. The final source ZIP is newly generated from the K5A commit and includes the test evidence; it is not an Android build or website deployment.

**Final complete run: 45 PASS / 0 FAIL / 1 NOT TESTED across 46 suites.** Totals and individual results are recorded in `qa/K5A/results.json`. Counts refer to executable suites, not individual assertions or screen captures. The managed-browser direct-file check is reported separately as NOT TESTED, never PASS.

## Test maintenance and new coverage

The initial existing-suite sweep ran 39 suites: 34 PASS, 5 FAIL. Investigation found five obsolete test expectations rather than game defects:

- `k4-artwork.cjs` measured the Hedgehog while its approved 4.8-second entrance was still running, after a fixed 1.7-second wait. It now waits for the actual scale transition to finish before checking final artwork bounds.
- `spin-offline.cjs` targeted build 1582's cache and build number. It now selects the current version/build cache and checks that offline reload retains the online build.
- `theatre-offline.cjs` likewise asserted the obsolete build 1582. It now compares online/offline build identity while retaining cached-art and missing-art fallback tests.
- `supporter-restore.cjs` expected pre-Chapter-4 future-content copy. It now checks the approved “Chapter 4 and beyond” wording while retaining the ownership, visibility, duplicate-request, no-scroll and persistence assertions.
- `theatre.cjs` required the pre-Chapter-4 catalogue and absence of Chapter 4. It now compares the entire scene catalogue against frozen `bd79490`, including the approved Blockbeard ending, and checks Chapter 3 completion exposes the existing supporter-gated Chapter 4 without requiring Pool School.

Initial evidence is retained under `qa/K5A/initial/`, with test-maintenance/focused evidence under `qa/K5A/maintenance/`. Affected suites were rerun, followed by a clean complete expanded regression. Final top-level logs and `results.json` are authoritative for this candidate.

New K5A checks:

- `k5a-freeze.py`: git-blob identity for all 117 game/native files, no added/deleted payload files, and 151 literal media references resolve.
- `k5a-rules.cjs`: 15 explicit rule-event adjudicator cases plus eight real-engine fixtures. They cover legal/illegal breaks, re-rack choice, black respotting, break in-off/baulk, group assignment, mixed pots, target legality, no-contact/no-subsequent-action fouls, cue ball in hand, normal turn loss, and legal/early black outcomes. Rule-event cases are labelled as such; they are not represented as physically played shots. The active rules are the approved EPA International implementation: no automatic two visits or free-target exemption after a foul.
- `k5a-multiplayer.cjs`: actual menu/Back controls, hidden Online entry, two names, engine break and legal black win, rematch rack/names, normal career tracking and no story/cosmetic progression.
- `k5a-opponents.cjs`: all 27 playable opponents use their own profiles and legal targets, and the real engine makes the planned first contact on a shared deterministic table. Chapter 4 power/spin contracts are checked explicitly. Four observed in-offs (Simon, Sandy Mandy, Barley and Hedgehog) are adjudicated as fouls with cue ball in hand; this does not claim flawless AI or full-match wins. The approved lower-level behaviour is preserved.
- `k5a-dev.cjs`: actual I and six-T key events in development/release. I retains the approved Chapters 2/3 roster shortcut; selecting an unseen Barley then starts the Chapter 3 arrival. It grants no wins/rewards. Five T presses are inert; the sixth deliberately wins only the active opponent in development, without false perfect-play statistics. That explicit instant-win control intentionally records its current win; it is not an opponent-access shortcut. Release mode rejects both paths. Existing supporter-grant and dynamic Unlock All Pirates suites remain included.
- `k5a-saves.cjs`: schemas 1, 6 and 7 retain statistics, records, lesson ticks, trophy, selected cue, layout and Chapter 4 seen flags across reload. Old-version portable saves round-trip; malformed/ownership-field imports are rejected; a simulated quota failure rolls back without losing the previous data. Editable ownership is ignored in release mode.
- `k5a-file-origin.cjs`: actually attempts `file://` navigation. The only allowed NOT TESTED outcome is managed Chromium's explicit `ERR_BLOCKED_BY_ADMINISTRATOR`; other game/navigation failures remain failures.

## Coverage map

| Area | Performed automated evidence |
| --- | --- |
| EPA rules, physics, breaks, targets, black, fouls, turns | K5A rules/multiplayer, spin-physics, campaign-regression, Pool School and engine-resolved K4/K4B fixtures |
| Pool School | All five lesson success/failure paths, real shots, corrective placement, optionality, persistent ticks, Star Pupil, future-lesson stability and career isolation |
| Chapters 1–3 | Full opening/encounter/boss/victory/ending trigger sequence, rich/card supporter intros, first-time flags, spoiler gates, reload recovery, defeat/rematch and representative engine shots |
| Chapter 4 and Wizard | Five-circle ladder, ten Theatre handoffs/engine wins, independent Wizard win/trophy/staff, supporter gate, no Lucy prerequisite, reminders and locked Chapter 5 chapter heading |
| AI | All 27 real first-contact fixtures; original profiles frozen; Hedgehog 66%/topspin, Youth level 3, Socks backspin/cushions, TMECI sidespin, Lucy displayed level 6/custom positional profile/chaining/centre contact, Wizard eight real spin variants and physical opening break |
| Theatre | All 31 scenes, every dialogue beat, at 1366×768, 1920×1080, 390×844, 740×360 and 855×384; typewriter/readiness/opaque transitions, speaker motion, alpha compositing, entrances, Wizard exact 16-frame/two-second animation and silent nod |
| Audio/effects | Lucy soundtrack lifecycle/continuity, cannon count/envelope and darkness/pocket effects; media lifecycle tests use explicit mocks and do not prove audible hardware output |
| Cosmetics/trophies | Unlock and locked/spoiler states, descriptions, matching staff renderer, animated effects, main/optional trophy separation, persistence, no rewards from access-only shortcuts |
| Local multiplayer | Real names, Back/title, break, win, reset/rematch, normal career counts, no opponent/chapter unlocks; Online absent |
| Layout/controls | Desktop toggles/settings/preferences/resize, approved geometry preservation, portrait/mobile landscape targets, Cue Helm drag/double-tap/spin, placement arrows/Confirm, power, four fine-aim controls, Play Shot and optional panels |
| Saves/ownership | Fresh and schema 1/6/7 fixtures, portable import/export validation/rollback, chapter flags/settings/trophies/cosmetics; native ownership states, restore feedback and duplicate prevention via mocks; no purchase activation |
| Offline/assets | Current caches, reload, code/media/scene dependencies, missing-art fallback with readable exit, no stale literal paths; baseline hashes intact |
| Developer access | Supporter grant feedback, dynamic 27-opponent unlock, no fabricated defeat/seen/reward state from access-only unlocks, I/arrival path, six-T behaviour, release/native restrictions |

Chapter 0 remains optional. Spinball Wizard remains a bonus opponent outside the five main-circle completion requirement. Existing completion trophies and imported progress are retained. Some story trigger tests use explicit developer-win result fixtures to cover transitions; engine-win tests separately verify physical adjudication. These are not claims of 27 full matches or every possible shot geometry being played.

## Limits and remaining manual checks

- Actual Windows Chrome direct `file://` operation is blocked by managed Chromium policy here. The check returns NOT TESTED with the exact policy error. No policy/security settings were changed.
- Mobile tests are Chromium device/touch emulation, not physical Android/iPhone/iPad. Safari/WebKit-specific behaviour, safe-area hardware/navigation bars, performance and audible audio/autoplay still require hardware QA.
- Native billing/restore tests use controlled bridge replies. No Android SDK build, external Capacitor wrapper, signing, Google Play purchase or real restoration was exercised. Those remain outside this purchases-disabled stability milestone.
- Automated results cover fixtures and representative controls, not exhaustive long-running AI match balance or subjective presentation/audio assessment. No rebalance or content redesign was performed.
- Historical `alpha-release.cjs`/alpha packaging audits target earlier milestones and are excluded, as are native installer/compiler and old artwork-delta-only audits. The current save checks and frozen payload/native guards cover the relevant K5A preservation requirements. `touch-input.cjs` is a helper used by executing suites, not a standalone test.

## Reproduce

In the prepared development environment with Playwright, `/usr/bin/chromium`, Python and Pillow, run `python tools/run-k5a-qa.py`. It starts private localhost servers on 8030/8031, creates an isolated temporary release projection, and runs disposable browser profiles. It does not edit the game, user saves or native wrapper. Logs and final counts go to `qa/K5A/`. Specific suite filenames can be supplied for focused reruns. `python tools/package-k5a.py` creates and verifies the complete source ZIP from a clean committed branch.

## Short desktop/mobile QA

1. Extract the fresh K5A ZIP into a new folder. On Windows open `www/index.html` and confirm 0.17.59/build 1589. Import a copy of an existing exported save if that new file location has separate browser storage; keep the original save.
2. Check story progress, lesson ticks, trophies, equipped cosmetics and layout preferences; reload. Verify no unexpected entitlement or chapter unlock.
3. Play a normal local frame and rematch. Check names, cue-ball placement, aiming, power, all fine-aim controls and Cue Helm spin. Return to title.
4. On a short landscape phone, check Play Shot, power, Cue Helm and all four aim buttons remain visible and usable with optional panels expanded. Rotate and return to portrait.
5. Sample Chapters 1–4, Lucy and Wizard with appropriate test access. Check Theatre transitions, artwork/animation, soundtrack, first-time sequences and ordinary AI play. Access-only unlocks must not award trophies; Wizard remains optional.
6. After an online load, reopen offline and play. Check restoration feedback only if testing the existing wrapper; real Google Play transactions/restoration are a separate milestone.

No merge, website deployment, Android publication or native payment activation is authorised by this regression package.

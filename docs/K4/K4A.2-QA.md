# K4A.2 — Desktop QA corrections

Version **0.17.55/build 1585**, branch `stage4-k4-five-circles-of-hell`. Baseline `13eac760dbc31fd9dd9e7f9080d1e57475b92518` (0.17.54/build 1584). No deployment, release publication, Android build, purchase activation or native billing changes.

## Corrections delivered

1. All five opponents reuse `scene-character-talking` / `sceneSpeakerWiggle`, the established normal Theatre animation (0.34s, alternate), rather than Mr Wiggles' animation or a separate always-running bob. They move only during their own typewriter dialogue and stop on completion. Speaker switching leaves the opponent stationary while Blackball speaks. Reduced-motion handling remains.
2. Youth waves resolve to the actual phone in the contained source image, with resize tracking and observer cleanup. Magenta/cyan vapour rises vertically over 12 seconds and lingers; the existing two-second wave loop and vapour persist across dialogue beats.
3. The exact new Blackball line is last in Youth's introduction, immediately before match transition. The original script remains byte-preserved; the approved addition and speaker abbreviation are separate amendments in `K4A.2-APPROVED-AMENDMENTS.json`. No other spoken text changes.
4. All TMECI speech, including his challenge acceptance and Lucy-outro lines, uses `TMECI`. His encounter title also uses the short form to avoid the full-name prefix recreating the wrapping problem. Roster and Cosmetics retain his full name.
5. Only TMECI's text receives a static, light-coloured rainbow gradient. Existing text-node typing/timing and line wrapping remain unchanged; Blackball/Lucy retain ordinary text styling.
6. Lucy's trophy is concealed until victory using the existing story-spoiler filter. Her locked cue/table already use generic concealed metadata; tests check these. The original trophy and first-win award remain.
7. `Five Circles of Hell` is a separate persistent PLATINUM trophy using the existing chapter-completion achievement registry requiring the five main K4 wins, excluding Spinball Wizard. The existing achievement migration handles eligible older/imported saves; earned IDs remain idempotent on replay/reload.
8. Hedgehog's cue description now names only its blue finish, white stripes and floating gold rings. His actual forced 66% power/topspin remains unchanged.
9. Lucy pocket glow is drawn above the metallic collar, with stronger orange-red bloom, bright inner rim and a roughly 1.5-second pulse. Previously the metallic collar overpainted the earlier glow. Reduced motion uses a constant glow. Table/pocket geometry is unchanged.
10. A disabled roster-only `Chapter 5 — In development!` placeholder follows Chapter 4. It adds no chapter registry entry, opponent, scene, unlock rule or playable match.
11. One cannon buffer per strike now contains a bass impact, room-reflection taps and a 1.8-second fading tail. Peak normalization and bounded SFX/master gain prevent individual-buffer clipping; replacing a still-active cannon fades/stops its previous tail. Master mute/volume also update an active tail. Music controls remain separate. No unrelated effects were added.
12. Darkness is 25% opaque at rest, clears instantly at a strike and returns linearly over 1,000ms. Flames, strike timing and pointer-event safety remain.

## Verification

**All 12 performed suites passed.** Exact outputs: `qa/K4A.2/`; representative Chromium screenshots are under `screenshots/` there.

- `tests/k4a2.cjs`: all five speaking/finished/switched animations and natural typewriter completion; phone anchoring after resize, persistent waves and vertical/slow vapour; short/rainbow TMECI speech in all three scene appearances; locked Lucy trophy/cosmetic concealment; completion-trophy predicates and save/reload/import idempotence; cue wording; locked placeholder; exact opacity at 0/500/1000ms; unchanged geometry; normalized cannon duration/peak/tail energy, per-call event count, mute scheduling and overlap cleanup.
- `tests/k4.cjs`: full original dialogue plus exactly one approved addition; unchanged approved art; all ten Theatre handoffs; five real-engine fixture wins and the completion trophy; replay/persistence/access/effects regression.
- `tests/theatre-responsive.cjs`, filtered to K4: every dialogue beat in all ten scenes at 1366×768, 1920×1080, 390×844, 740×360 and 855×384, with decoded artwork, fitting characters and reachable Next.
- `tests/campaign-regression.cjs`, `tests/k4-ai.cjs`, `tests/k4-audio.cjs`, `tests/k4-mobile.cjs`, `tests/k4-offline.cjs`: existing campaign/Pool School saves and engine shots; opponent AI/spin/power; music lifecycle mocks; touch/landscape/reduced-motion controls; offline code/media.
- `tests/k4a1-dev-supporter.cjs`, `tests/k4-entitlement.cjs`: developer access, save preservation and release/native entitlement safeguards. Native responses are fixtures, not real transactions.
- `tests/k4-consistency.py`: all JavaScript syntax, versions/cache dependencies, canonical catalogue regeneration, approved source hashes, unchanged schema/native billing and whitespace checks.

Audio checks establish signal duration, levels, tail energy and graph/event behaviour. They do **not** establish subjective loudness on the user's speakers. Audible impact/reverb/mix remains manual QA. Actual Windows Chrome `file://` navigation remains unverified here because managed Chromium blocks it; storage-denial/protocol cases and real HTTP browser controls are tested separately. Physical Android/iOS and actual Google Play transactions were not tested or activated. No existing artwork was modified.

## Numbered desktop QA checklist

1. Extract the GitHub source ZIP and open `www/index.html` directly. Confirm 0.17.55/build 1585, existing progress and the K4A.1 developer grant/revoke feedback. Do not reset your save.
2. Watch all five opponents speak, finish typing, then switch to Blackball. Only the current speaking character should bob, using the familiar fast Theatre movement.
3. Check Youth waves originate at his phone and vapour rises slowly upwards. Confirm the new Blackball warning is the final intro line; resize the window while viewing the scene.
4. Check every TMECI line uses the short label and readable rainbow text, including his appearance in Lucy's outro. Other speech should retain its normal colours.
5. Inspect locked trophies/cosmetics before Lucy's defeat. After five main wins, confirm both Lucy's original trophy and `Five Circles of Hell`, then reload/replay/import and check no duplicates. Review Hedgehog's cue text and the disabled Chapter 5 placeholder.
6. During Lucy's actual match, inspect pulsing orange-red pocket rims and the stronger darkness. Each human/AI strike must clear the overlay instantly, with darkness returning over one second; controls and flames must continue working.
7. Listen for one distinct cannon impact and longer reverberation per human/AI shot. Check master mute/volume during its tail, music continuity, and normal gameplay sounds. Compare portrait/landscape and reduced-motion settings as practical.

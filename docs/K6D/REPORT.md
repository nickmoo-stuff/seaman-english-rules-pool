# K6D — boss music and Darth Vaper spin

Candidate **0.17.61/build 1591**, development branch `stage6-k6d-boss-music-vaper-spin`, based on K6B `928a82f` (approved 0.17.60/build 1590).

## Changes

Extended Lucy's existing encounter lifecycle, shared music decks, pending-play retry and resume handling to exactly Captain Blackball, Mr Wiggles, Captain Blockbeard, Lucy Fir and Darth Vaper. The existing `assets/k4/Lucy Fir challenge.mp3` is unchanged and reused directly. Actual introductions start the theme, gameplay/outro requests retain it, rematches restart it, and encounter exits restore menu music. Lucy-only visual effects still use her separate flag. Theatre QA previews do not start an encounter. The resumed Mr Wiggles reveal also explicitly restores menu music when it returns directly to the roster.

Vaper retains his original planner, difficulty, aim and power choices. A bounded follow-up compares centre, top, back, both sides and four combined contacts through the existing silent physics simulation. It rejects in-offs, wrong first contact, premature black and loss of the intended pot. A spin choice must improve the next-target distance/clearance and cushion proximity score by at least 45 table units, survive 60/120 Hz forecasts and adjacent angle probes. Otherwise centre remains selected. The selected contact travels with the AI plan into the existing real strike/spin engine; no artificial outcomes. Safety and emergency fallbacks remain centred. On an open table, follow-up scoring uses the colour that the intended pot would claim. The search adds bounded simulation work to Vaper turns; mobile responsiveness still needs device smoke testing.

No audio assets, dialogue, art, general physics, opponent profiles, save schemas, supporter service or native patch files changed. Billing remains OFF. No Android dependency or wrapper update is needed.

## Verification

Final regression: **51 PASS / 0 FAIL / 1 NOT TESTED** across 52 suites, after nine final serial focused reruns (**9/9 PASS**). Results are in `qa/K6D/results.json`; initial results and `qa/K6D/RETEST-NOTES.md` retain the corrected Theatre test-helper failure and transient campaign wait timeout. All 13 web/new-test JavaScript files passed Node syntax checks. Version/asset consistency, all 27 opponents, save compatibility, campaign, Pool School, EPA rules, multiplayer, responsive controls, offline caching, Theatre and native billing fixtures passed. The original AI selection algorithm is also compared byte-for-byte beneath the Vaper-only wrapper. Audio tests mock media playback: they prove lifecycle decisions, not audible gaplessness or hardware autoplay. Native API compilation/installer tests use the existing fixtures and SDK API jar; they are not an Android application build.

Linux managed Chromium cannot open the file-origin test (policy restriction); desktop `file://` must be checked manually. No physical Android, iOS Safari, real Google Play transactions or audible device tests were performed. No merge, deployment, Android publication or purchase activation occurred.

## Desktop and Android smoke checklist

1. Extract the source ZIP and open `www/index.html` in desktop Chrome. Confirm **0.17.61/build 1591**, existing progress, cosmetics and trophies.
2. On the existing Windows Capacitor wrapper, copy updated `www`, run the usual sync script and set native versionName/versionCode to 0.17.61/1591 before your local QA build. Retain signing settings and existing K6B billing installation; do not enable purchases or upload to Play.
3. On desktop and Pixel 8 Pro, start each of the five named bosses from its introduction. Listen for one looping track with no restart/gap into gameplay. Check a normal opponent and another optional boss retain their original music.
4. Finish each applicable victory Theatre, then leave the encounter. Check continuity through victory and clean return to menu music. Test loss/rematch and a fresh replay: each starts the theme afresh.
5. On Android, mute/unmute, background/resume and lock/unlock during a boss. If initially blocked, a user interaction should resume playback without overlapping tracks.
6. Watch several Vaper turns: spin should vary purposefully, including centre shots. Confirm legal contact and real cue-ball spin, unchanged player Cue Helm, ordinary opponents and Spinball Wizard.
7. Confirm chapter progression/saves survive reload and Supporter Pack purchasing remains disabled. Do not activate or test paid transactions for this milestone.

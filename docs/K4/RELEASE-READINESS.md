# K4 candidate — 0.17.53/build 1583

Branch: `stage4-k4-five-circles-of-hell`. Baseline: `aa7023364d48bf5d2c673b9aa9426f0089821ea0` (0.17.52/build 1582). No merge, deployment, website update, Android publication or purchase activation.

## Implemented

- Five sequential Chapter 4 story opponents after Chapter 3, gated by the current approved supporter service as well as story progression. A durable/imported chapter flag cannot bypass ownership; release/native code ignores web developer ownership flags. Expired ownership during an encounter is requeried through the existing coalescing restore API; the rack is retained, and play resumes only after confirmation.
- Ten Theatre scenes from the authoritative script. Spoken text is checked for exact content, completeness and source order; worksheet prompts are excluded. The anomalous `Blackball.` delimiter is parsed without changing the preserved original document. `Dialogue prompt: Bork! Bork!` supplies Socks' actual authored utterance; bracketed editorial prompts do not become dialogue. Stage directions remain staging. Lucy victory is the single chapter ending; only Most Evil Creature joins Lucy and Blackball. No Chapter 5 content or new Golden Cue award.
- Original approved image bytes, animation and MP3, with SHA-256 provenance manifest and contact sheet. Lucy's supplied photographic cutout is copied unchanged.
- Existing black-until-ready transitions, fades and bobbing; Hedgehog scale entrance; youth vapour/phone waves; 0.5-second match waves; visual rain; Lucy 15%-opaque darkness, shot flash/fade, motion-scoped flames and one cannon envelope per cue strike. All effects ignore pointer input and respect reduced motion.
- Scoped opponent AI power/spin, cushion preference with legal-first-contact/in-off checks, and Lucy's stronger execution/positional planning. Existing level 6 is Cyclops, so Lucy uses a separate profile and the Captain planning hooks plus bounded, shared-engine 60/120-Hz pot forecasts. A fixture demonstrates two consecutive actual pots; whole-frame difficulty balancing remains manual QA.
- Five first-win trophies and five cues, plus Lucy's table. Persistent win evidence drives unlocks; replay cannot duplicate trophy IDs. Cues share one Canvas renderer between match and catalogue, with spoiler concealment, floating rings, leaf/zigzag, rainbow glow and fiery spiral staff. The dark table/pocket finish changes no collision geometry.
- Lucy's looping soundtrack owns one music lifecycle through opening Theatre/match/victory, restarts on loss/rematch and replay, respects volume/mute and gesture retries, resumes paused playback in place, and cleans up/restores menu music on exit. Late asynchronous playback is fenced. Existing gameplay sounds remain.
- Save schema 7 and old storage keys remain; new chapter state is additive. Interrupted victory presentation recovers from durable wins. Supporter information now distinguishes available Chapter 4 from future chapters beyond. Both worker inventories include the new code/media and shared Blackball scene dependency.

## Remaining limitations / blockers

1. **Source artwork alpha:** Hedgehog, Socks and Most Evil Creature are RGB. Hedgehog has a black rectangle; Socks and Most Evil Creature have baked checkerboards. These are visible in the approved originals. The package explicitly says “No modifications to artwork”; no masking, replacement or regeneration was performed. Transparent masters would resolve this visual limitation.
2. **Spinball Wizard:** approved animation and lair are staged and shown in his unavailable optional profile, separate from the five required opponents. The specification supplies no approved AI, match mechanics or dialogue and prohibits inventing these. His match remains unavailable; no rewards were invented. Main-story completion does not require him.
3. **Physical devices/audio:** no Android Studio/SDK wrapper build, Pixel hardware installation, iOS Safari hardware session or audible listening test was performed. Chromium touch emulation is not hardware approval. Native K4 needs legitimate verified ownership; purchases remain disabled and no native entitlement bypass was introduced.
4. Version/build 0.17.53/1583 identify this source candidate. Play Console version-code availability has not been checked. The source package is development mode; it is not a production Android release.

## Automated evidence

Run `python tools/run-k4-qa.py` in the development checkout with servers for `www` on port 8000 and `/tmp/k4-release/www` on 8013. The runner refreshes that temporary release projection; no repository BUILD_MODE change is made. All 16 suites passed after fixes and targeted reruns; see results.json for final exit codes. Exact output and exit codes are in `qa/K4/automated/` and `results.json`. Mobile screenshots are in `qa/K4/screenshots/`.

The suite covers source/asset/cache/version consistency, JavaScript syntax, verbatim dialogue, fresh/imported saves and gates, all ten Theatre handoffs, five engine-resolved legal black-ball victories, trophy/reward persistence, AI shots and chaining, music lifecycle with explicit media mocks, native ownership states with explicit bridge mocks, offline media, portrait/short-landscape touch controls, every K4 dialogue beat at five desktop/mobile sizes, and existing campaign/Pool School/spin/Theatre/story/supporter regressions.

Engine tests use deterministic table fixtures; they do not claim five complete human-played frames. Audio mocks verify lifecycle decisions, not audible quality or real autoplay approval. Native fixtures verify app state handling, not Google Play transactions or restoration on an actual account. Real transactions remain untested and disabled.

## Specification checklist disposition

| Item | Automated evidence / remaining manual check |
|---|---|
| 01 | PASS baseline, branch, writing guidance, no deployment |
| 02–03 | PASS fresh/imported-save access and existing progress fixtures |
| 04 | PASS five-opponent order; optional match blocked pending specification |
| 05 | PASS all authored spoken lines exact and complete |
| 06 | PASS ten handoffs + existing delayed/missing-art readiness tests; N/T slow physical device |
| 07 | PASS actual 66%/topspin strike; entrance implemented, visual hardware QA pending |
| 08 | Effects implemented at 500-ms cadence; responsive/input tests PASS, subjective distraction QA pending |
| 09–11 | PASS real cushion/backspin, sidespin pot, two-pot Lucy chain and unchanged Cyclops |
| 12–14 | PASS 15% opacity, pointer-free overlays, touch shots and per-strike cannon counters; audible envelope N/T |
| 15–18 | PASS mocked lifecycle/mute/volume/gesture/resume; real audio/mobile restrictions N/T |
| 19 | Shared renderer and visuals implemented; subjective appearance review pending |
| 20 | PASS victory trophies/cues/table, reload and idempotent IDs |
| 21–23 | PASS outro cast, verbatim ending, no new Golden Cue or Chapter 5 |
| 24 | PASS Chromium desktop/touch portrait/landscape/reduced motion; native/iOS hardware N/T |
| 25 | PASS offline new code/media and shared scene dependency |
| 26 | PASS performed campaign/Pool School/spin/Theatre/story/supporter regression suites |
| 27 | PASS safe native/service fixtures, including session expiry/requery and revoked ownership; real Play purchase/restore N/T |
| 28 | Source ZIP, changelog, commit and evidence supplied; no publication |

## Numbered desktop/mobile QA checklist

1. Back up/export your save. In a separate browser profile, import a completed Chapter 3 save, enable the existing web-only developer supporter pass and confirm Chapter 4 appears. Revoke it and confirm Chapter 4 locks without losing progress. Native ownership checking must remain truthful and purchases disabled.
2. Play all five opponents in order. Read every intro/victory, check black transitions and artwork, lose/retry, and reload during a victory scene to confirm recovery. Inspect the three RGB artwork backgrounds noted above.
3. Check Hedgehog's 66%/topspin, youth waves/vapour, Socks' backspin/cushion preference, Most Evil Creature's sidespin/rain and Lucy's centred-spin positional play. Confirm EPA fouls and legal black wins behave normally.
4. Listen through Lucy intro → match → outro, then test loss/rematch, replay, mute/volume, background/resume and leaving. Listen for exactly one cannon per strike and no overlapping soundtrack.
5. On desktop and phone portrait/landscape (especially Pixel 8 Pro), test touch aiming, spin, power, cue-ball placement/confirmation, fine aim and PLAY SHOT with panels expanded. Effects must not intercept controls; reduced motion must suppress decorative movement.
6. Verify each first-win trophy/cue and Lucy's table in Cosmetics, equip them, compare preview/match appearance, replay and reload. Existing trophies/selections must remain; no new Golden Cue, Chapter 5 or Spinball story requirement may appear.
7. Test offline reload after one complete online load, then revisit Theatre and Lucy's track. Replay a Pool School lesson and normal local/Chapters 1–3 matches to spot regressions.

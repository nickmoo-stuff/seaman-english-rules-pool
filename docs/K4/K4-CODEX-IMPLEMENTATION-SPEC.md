# SEAMEN POOL — K4 CHAPTER 4 CODEX IMPLEMENTATION HANDOVER

Status: CREATIVE DESIGN APPROVED; implementation NOT started. Date: 15 November 2026.
Authority: `K4-APPROVED-DIALOGUE-VERBATIM.txt` (user-authored); later user corrections in this specification override older notes. Do not rewrite dialogue, including odd spellings, character labels, punctuation or humour. The original template contains leftover editorial prompts: treat them as NON-DIALOGUE, not lines to render. Where ambiguity affects code, report it rather than inventing narrative.

## 1. SAFETY / REPOSITORY / BASELINE
- Target development repo: nickmoo-stuff/seamen-pool-development. Approved baseline reported as v0.17.52/build 1582; verify HEAD and current version before branching. Read AGENTS.md and repo guidance first.
- Create separate K4 feature branch; do not merge, publish, deploy, or modify live browser or Android Alpha without explicit user approval.
- Keep Chapters 1–3, Chapter 0, current physics, EPA rules, landscape/portrait UI, settings and saves intact. Reuse Chapter 3 Theatre, bobbing, fades and opaque-black-until-ready transitions.
- Chapter 4 main story is supporter-paid, with entitlement/restore via existing approved billing infrastructure when available; never fabricate purchases or entitlement. Spinball Wizard is a separate optional supporter boss, not a sixth required story opponent. Do not make Chapter 4 free based on outdated November 14 spec.
- Chapter 4 takes place after Chapter 3 and ends with the Golden Cue shipped to The One True Guy; do not show Chapter 5 arrival.

## 2. AUTHORITATIVE SCRIPT AND STORY
- All dialogue and staging in `K4-APPROVED-DIALOGUE-VERBATIM.txt` are authoritative, subject to later clarifications here. Implement pre-match Theatre → match → victory Theatre → onward transition for five sequential story opponents.
- Opponent order: (1) Vile Blue Hedgehog, (2) Filthy Youth with a Phone, (3) Socks and Sandals, (4) The Most Evil Creature Imaginable, (5) Lucy Fir.
- The four early opponents share approved Fiery Pits of Hell Theatre background. Lucy uses her own approved dungeon Theatre background. Optional Spinball Wizard uses his approved spiral-staircase lair background.
- Lucy's post-match Theatre IS Chapter 4 ending; no duplicate outro. When The Most Evil Creature Imaginable enters during Lucy's outro, 'the other two' are Lucy and Captain Blackball already in the scene, not two additional entrants.
- Preserve Lucy's Vinted €3 sale, The One True Guy, Heaven, Evri ending, and the Golden Cue NOT being awarded.
- Do not use obsolete speculative dialogue, alternate names, invented descent scenes or a separate parcel-dispatch scene from earlier concept briefs.

## 3. THEATRE / VISUAL DIRECTION
- Standard Chapter 3 fade-ins and gentle bobbing for all characters; no bespoke character motion beyond exceptions below.
- Hedgehog alone zooms from zero scale into normal size as an entrance, then bobs.
- Youth: slow magenta and cyan vapour clouds emanate from face; phone soundwaves expand outward and fade, repeatedly. During match, distracting soundwaves appear at random table positions/directions about every 0.5 seconds, fade, and never intercept controls.
- Socks, Most Evil Creature and Lucy: ordinary fade-in and bobbing. Do not invent SFX for any Theatre scene.
- Most Evil Creature match: rapid decorative CSS raindrops splatter across table; no physics impact.
- Lucy match: black overlay about 85% TRANSPARENT (15% opaque); on each shot overlay instantly becomes 100% transparent then returns to 85% transparent over 0.5 seconds. CSS flames surge inward from screen sides while balls move, potentially visually over UI, but pointer-events:none. One cannonshot SFX per cue-ball strike, by either player, not per ball collision. No other NEW sound effects. Preserve existing game sounds unless specifically superseded.
- Preserve accessibility, reduced-motion handling where existing app supports it, portrait and landscape responsiveness, visibility of balls and controls.

## 4. AUDIO — LUCY FIR CHALLENGE
- Attached file: `Lucy Fir challenge.mp3`. Use as Lucy encounter's music; respect in-game music volume/mute controls.
- First encounter with intro Theatre: start at beginning of opening Theatre; loop continuously through intro, match and victory outro; DO NOT restart on scene transitions.
- Replay after opening Theatre already viewed: start track from 0:00 at start of match (intro skipped).
- Rematch after losing: restart at 0:00 when match starts.
- One playback instance only. Stop/restore ordinary soundtrack when leaving encounter; clean up listeners. Audio may require user gesture on mobile; integrate with existing audio lifecycle rather than forcing autoplay.
- No soundtrack claim is made about artistic contents; file is included as supplied.

## 5. AI / DIFFICULTY / GAMEPLAY
- All matches standard English 8-ball using existing engine and rules. AI levels refer to current difficulty system; inspect actual level mappings and report if unsupported.
- Hedgehog: level 3 base; all shots 66% power and topspin; this should naturally undermine competence. No arbitrary miss injection.
- Youth: level 3 standard AI; visual waves only.
- Socks and Sandals: level 4; always backspin; favour cushion shots without choosing illegal shots.
- Most Evil Creature: level 5; skilled left/right spin use, rainbow cue and visual rain.
- Lucy: level 6; centered/no spin; very good at chaining pots, using existing AI planning/tuning hooks. Do not cheat or violate rules.
- Standard save-safe story progression; first win advances, rematches remain available; losing uses normal retry. Lucy's threat of death is dialogue, not save deletion.

## 6. COSMETICS / TROPHIES / UNLOCKS
- Hedgehog: bright blue cue, two white stripes near tip, three separate floating gold circular rings around handle; first-win cue unlock; trophy '100m under, 1 down!'.
- Youth: bright pink cue, gold and white stripes; trophy 'Noise suppression'.
- Socks: dark brown stick cue, dark green leaf at tail, broad zigzag decoration (cosmetic only); trophy 'Don't judge a bork'.
- Most Evil Creature: rainbow cue with strong animated rainbow glow; trophy 'The most evil trophy imaginable'.
- Lucy: black spiralling fiery wizard-staff cue, orange glow; dungeon-like dark charred table with orange-red glowing pocket rims; trophy 'Hell is unleashed'.
- User-approved default: all five cues and named trophies unlock on FIRST victory, with Lucy's table also unlocking on first victory; never duplicate rewards on replay. Do not award Golden Cue.
- Cue catalogue previews and in-match cues MUST share same visual rendering definitions. Table changes must not alter collision geometry. Follow existing unlock persistence, cosmetic notifications and spoiler gates.
- Spinball Wizard: optional supporter boss using already approved animation and Theatre art; do not invent unapproved rewards or AI details.

## 7. ART ASSETS / IMPORTANT BLOCKER
- Approved art exists from Chapter 4 creative sessions: five separate character designs, three individual landscape Theatre backgrounds, and Spinball Wizard animation. However the local image directory contains MANY intermediate drafts with ambiguous filenames. DO NOT silently select random image files or the old concept montage as authoritative.
- Lucy's approved transparent character cutout was user-edited in Adobe Express; verify exact approved cutout against reference. Other cats in game retain original-photo requirement.
- Before asset integration, create contact sheet/manifest of candidate files and identify each approved master, including PNG alpha, image dimensions and source provenance; ask for precise confirmation ONLY where ambiguous. No new art generation or replacement without approval.
- Included MP3 and script ARE definitive. Art is intentionally not included in this package to prevent incorrect intermediate images being shipped.
- Spinball Wizard is separate; no story gating. Existing prototype ZIP may be consulted only after verifying it is approved asset.

## 8. DELIVERY PHASES
K4A — Repo reconnaissance: confirm version, branch, Theatre/AI/billing/cosmetics/audio/save architecture; flag mismatches; NO functional changes until plan is clear.
K4B — Approved asset mapping, manifest and staging (do not guess intermediate files).
K4C — Chapter registry, entitlement gate, roster, save/progression and optional supporter slot.
K4D — Theatre dialogue, fades, transitions, effects and Lucy audio continuity.
K4E — AI personalities, match effects, cue/table visuals, trophies and first-win rewards.
K4F — Regression, desktop QA, Android QA candidate, clean source ZIP with version/build, changelog and numbered results.
Do not treat each phase as a required user approval checkpoint: continue autonomously where safe; pause for missing approved art, billing decisions, or production release approval.

## 9. QA ACCEPTANCE CHECKLIST (mark PASS / FAIL / N/T, attach evidence)
01. Confirm approved baseline, branch and AGENTS.md instructions; no live deployment.
02. Fresh save: Ch1–3 unaffected, Ch4 entitlement and progression gating correct.
03. Existing migrated save: progress, trophies and cosmetics retained.
04. All five story opponents in correct order; Spinball Wizard excluded from required ladder.
05. All user-authored dialogue verbatim, no template prompts displayed.
06. Each pre-match, win Theatre and opaque-black transition loads cleanly on slow device.
07. Hedgehog zooms in then bobs; level 3 always 66% power/topspin.
08. Youth slow face vapour, phone waves and 0.5-second match waves; level 3.
09. Socks backspin and cushion preference; level 4.
10. Most Evil Creature left/right spin, rain and glow; level 5.
11. Lucy level 6, centered spin, strong chaining without cheating.
12. Lucy darkness is 85% transparent and clears/fades correctly on shots.
13. Flames render while balls move and never block controls.
14. Exactly one cannonshot per shot by either player, no additional new SFX.
15. First-time Lucy intro starts music at 0:00, uninterrupted through match/outro, loops.
16. Lucy replay skipping intro starts music at 0:00 on match start.
17. Lucy loss/rematch restarts music at 0:00; no overlapping audio.
18. Music respects mute/volume and mobile audio restrictions; cleans up on exit.
19. Each cue matches its catalogue preview; rings/glows/leaf/zigzag rendered correctly.
20. First wins award correct trophies/cues and Lucy table; replay no duplicate.
21. Lucy outro shows only Most Evil Creature entering, with Lucy and Blackball present.
22. Golden Cue NOT awarded; €3 Vinted / One True Guy / Evri ending preserved.
23. Chapter 5 remains locked/unimplemented; no premature Heaven reveal.
24. Portrait/landscape, touch and keyboard, reduced-motion support where present.
25. Offline/service worker caching and asset loading, no flashes or broken media.
26. Ch0–3 regression: rules, spin, Theatre, supporters, cosmetics, saves, settings.
27. Entitlement purchase/restore tests using safe test infrastructure only.
28. Deliver version/build-labelled ZIP, commit SHA, changelog, PASS/FAIL/N/T list; no publish.

## 10. OPEN TECHNICAL QUESTIONS (NOT NEW CREATIVE WORK)
- Which actual source images are the approved masters? Requires asset verification.
- What exact APIs support level 6, forced spin/power and AI shot planning? Inspect source.
- Which existing entitlement implementation can gate paid Chapter 4 without risking live billing? Inspect source.
- Are there any soundtrack licensing/asset packaging constraints? Confirm if needed.

## 11. OUTDATED DOCUMENT WARNING
`SEAMEN_CH4_CODEX_SPEC.md` dated 14 Nov is exploratory and contains contradictory material: Chapter 4 free access, unapproved character order, distinct backgrounds per circle, and speculative Long Furby guide/descent. THIS K4 handover plus the attached authored script supersedes those statements. Do not merge contradictory briefs.

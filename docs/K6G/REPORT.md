# K6G — Story Mode name correction

**Corrected pre-release: v1.0.0/build 1595**, based on K6F `ff5c1b9`. Branch `stage6-k6g-player-name-persistence`. The public version remains **1.0.0**. Build 1595 is deliberately higher than the previously proposed 1594 to avoid reusing that code if an AAB was already uploaded. Console availability is not accessible here: verify 1595 is unused and higher than the highest relevant uploaded code before another upload; if it is occupied, prepare a consistently higher web/native code.

## Reproduced cause

On the unmodified baseline, entered **Captain Rowan**, started a real Story Mode match, confirmed that name was used, then reloaded. The input reverted to **Player 1**. The persisted career had no name field. The value existed only in the input and runtime match map; there was no save/load path for it. The form also lacked a submit handler. Evidence is `qa/K6G/baseline-reproduction.log`. This independently reproduces the tester's reported loss in Chromium; no physical Android restart was performed here.

## Small correction

- Adds optional `storyPlayerName` to the existing `seamenCareer` record, without changing career schema 7, portable-save schema 2 or adding a parallel save system. Existing export/import includes it through the same career key.
- Existing naming form now has **Save and apply name**, immediate persistence/readback feedback and a prevented-default submit handler (Enter also saves). Naming alone writes only the name into the current career record, without invoking progression/trophy award logic. Storage errors are reported rather than pretending the name was saved.
- **Rename yourself** in main-menu Settings reuses that same input/form in a naming-only view. It does not enter Story Mode, run a scene or unlock anything. Back returns to Settings. In-game Settings keep their existing layout; the main-menu-only name section is hidden there.
- Startup restores the authoritative saved value and default input value. Older career `playerName`/`storyName` fields and explicit `seamenStoryPlayerName`, `seamenPiratePlayerName`, `seamenPlayerName` identity keys are recovered where valid. Canonical saved names win, including an intentionally saved default. Invalid/missing data falls back safely to the existing **Player 1**. Local Multiplayer inputs/runtime names are never used as migration authority.
- Existing type-a-name-and-select-an-opponent flow also commits a changed name before a delayed intro/match handoff. Pending/current Story names update appropriately; Local Multiplayer, school/test identities and historical results stay independent.
- HUD now inserts names as text nodes with the same line break/layout, so a persisted name containing angle brackets cannot become HTML. Existing authored dialogue is unchanged; dynamic turn/result/concession names use the correct runtime Story identity.

Names that the old game never wrote anywhere cannot be reconstructed after they have already been lost. This is not presented as recovering nonexistent data. Known old stored identity fields are recovered without resetting progress.

## Verification

**10 suites PASS / 0 FAIL.** The final targeted rerun also passed migration/Enter/storage failures and usable feedback at 390×844, 855×384 and 1366×768. Final measured counts and commands are in `qa/K6G/results.json` and the individual logs. The scope is deliberately focused: name acceptance/restart/migration/storage failure, campaign, save compatibility, local multiplayer, native ownership/release safeguards, purchase-state service and version/asset/syntax checks. Unrelated prior development stages were not rerun.

The name acceptance test closes/reopens an actual persistent Chromium disk profile: first-time naming/save -> reopen -> real EPA/physics red/black Story win on a compact fixture -> reopen -> rename through Settings -> reopen. It checks HUD/winner labels, retained earned progress, no name-only trophy/stat changes, separate Local names, portable career name and safe text rendering. Native purchased ownership replies are fixtures, not real Play verification. Migration/default/invalid/legacy cases, Enter behaviour and failed writes are covered.

No native/purchase/restore/entitlement service, rules/physics/AI/audio/artwork/dialogue changes. Existing native sources/tools, supporter UI wording/style, all assets and save schemas are preserved. The supplied www is release-mode; source branch developer mode is retained only for browser QA as before. Native repository defaults remain OFF, but this web-only correction must **not reset the user's already approved local native policy**. No new native patch is needed.

## Minimal installation and QA

1. Export the save as a precaution. Preserve the existing app ID, signing, installation and Google Play purchase. Copy only this corrected complete **www** through the normal workflow, run the existing sync script, and set Android **versionName 1.0.0 / versionCode 1595** through the usual version/build step. The existing K6E release guard checks matching web/Android metadata. Do not uninstall or recreate the project.
2. **Do not run the old K6F promotion tool** on this correction: the packet is already version 1.0.0 and its code/fingerprints differ from that old candidate. Do not reinstall native billing or change either local gate merely to apply a name fix. Retain the current separately approved native configuration. Production activation, if still outstanding, remains a separate approval under the existing K6E procedure.
3. Enter a custom Story name, press **Save and apply name**, fully close/reopen, and confirm the input/name persists. Complete a Story match normally, restart again, then open main-menu Settings -> **Rename yourself**, save, and restart once more. Confirm the new name and unchanged earned progression.
4. Check a Local Multiplayer match can use different names without changing Story identity. Check existing trophies/cosmetics/settings and purchased/active supporter status remain intact after update. No fresh purchase is necessary to test this correction.
5. Before a later AAB upload, inspect the signed artefact's version/code/signature/non-debuggable status and verify the chosen code is unused in Console. Never upload a different AAB with an already used code. No upload, publication, build, transaction or production activation occurred here.

Actual Windows wrapper, signing/AAB build, physical Android close/reopen and Play versionCode availability remain **NOT TESTED**. Persistent Chromium profile restart and mocked ownership are not reported as physical device or actual Google Play transactions. Native signing/policy and live ownership were not accessible to modify. There is no local coding blocker; remaining work is normal local build/device QA and Console validation.

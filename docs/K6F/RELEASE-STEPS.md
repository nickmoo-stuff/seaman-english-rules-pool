# K6F — shortest safe route to public v1.0.0

One candidate, one codebase, one release-preparation ZIP. **Supplied: 0.17.63/build 1593, release-mode www, both native purchase gates OFF.** Public target is **1.0.0/build 1594**, not 0.17.63. Promotion and production activation have NOT been performed. Builds 1593/1594 were not found in pre-K6F repository version history; Play Console availability remains your check.

Extract the ZIP and open PowerShell **in the extracted root**, containing `www`, `native-patches`, `release` and `docs`. Commands below use the existing project at `C:\Users\Nick\Documents\SeamenPoolAndroid`. No new project, Android Studio install, SDK setup, signing key or deployment process is required. No command uploads or initiates a purchase.

## Phase A — final local preparation

1. **Preserve the existing installation, save and purchase.** Use the usual save export as a precaution, never uninstall or clear data to force a signing/version change. Your K6E native integration is already installed and unchanged by K6F: **no new native patch is required**. Its existing management tools and sources remain included. If its installation needs checking/recovery, the idempotent Install command is in the appendix; do not rebuild the Capacitor environment.
2. Copy this package's complete `www` into the external project using the established process, run `SYNC-SEAMEN-TO-ANDROID.bat` as usual, set **0.17.63/1593** through the usual version/build step, and build/install the candidate with the existing compatible signing workflow. Do not copy tests/scripts/keys into web assets. Confirm existing Google Play ownership is active automatically, Vaper/Cyclops remain available as progression permits, saves are intact, and no critical regression appears. See the short smoke checklist below. The owned button deliberately stays grey and static; inspect the rainbow/hover on an unowned desktop browser.
3. Verify the prepared candidate sources (read-only):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\release\K6F\Promote-SEAMEN-Release.ps1" -Mode Verify -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

4. **After approving the candidate and checking Console's versionCode history**, promote the same approved code in place. This changes only the six version-bearing web files in both root `www` and synced Android public assets, plus literal Gradle versionName/versionCode. It does not activate billing or touch signing/save data. Both switches are explicit human assertions, not an automated Console check:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\release\K6F\Promote-SEAMEN-Release.ps1" -Mode Promote -ApproveReleasePromotion -VersionCodeConfirmedAvailable -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Default result: **1.0.0/build 1594**. If 1594 is already used by a DIFFERENT artefact, choose the next confirmed unused higher code and append, for example, `-ReleaseBuild 1595`. Use that same option on subsequent verification/rollback commands. Public versionName remains **1.0.0**. Do not guess that 1595 is free. Append `-WhatIf` for a no-write preview. Promotion is idempotent and refuses changed assets/code, mismatched copies/versions, developer web mode, unsafe/native-ON states and unsupported/custom Gradle version expressions. Backups are retained under `.seamen-release-backups\<unique-operation>`.

5. **Only after separate approval to activate production**, enable the already implemented native production permission. Debug remains OFF. This is the existing K6E command, not a new billing implementation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode EnableProduction -BuildVariant Release -ApproveProductionActivation -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

6. Verify the final public **source** configuration (read-only; it refuses candidate version or production-OFF/debug-ON source):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\release\K6F\Promote-SEAMEN-Release.ps1" -Mode VerifyPublic -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

7. **Rebuild after promotion and native-policy changes.** Keep your normal workflow, but do not recopy unpromoted candidate `www` afterwards or reset versions to 0.17.63/1593. If sync is repeated, it must copy the promoted project `www`. In Android Studio choose **Build → Generate Signed Bundle / APK → Android App Bundle**, use the **existing upload keystore/alias**, and select the existing **release** variant. Do not create a new key or enable release debugging. Standard output is `android\app\build\outputs\bundle\release\app-release.aab` (use Studio's actual output if customised). The existing release guard rejects debug-ON policy, unknown native sources, development web, mismatching web/Android versions or key files in web assets. After the normal build, rerun **VerifyPublic** to catch a deployment step that reset metadata/policy. Confirm the actual signed artefact is **1.0.0 / selected public code / non-debuggable**; source verification cannot inspect an AAB that is unavailable here. Keep this exact signed AAB and its SHA-256 for track testing/public submission:

```powershell
Get-FileHash "C:\Users\Nick\Documents\SeamenPoolAndroid\android\app\build\outputs\bundle\release\app-release.aab" -Algorithm SHA256
```

## Phase B — Google Play verification (manual, not executed)

8. In the existing Play application, check package `com.seamenpool.game`, app-signing/upload certificates, selected unused code, active permanent product `seamen_pool_supporter`, buy option `supporter-buy`, £1.79 UK price and appropriate countries. Confirm the test account is a **licence tester** separately from testing-track membership/opt-in. A track invitation alone does not make purchases non-charging. Upload the signed **v1.0.0** AAB to the appropriate internal/closed testing track and resolve actual Console validation failures. Follow any account-specific production-access/testing requirements shown by Console; internal testing alone is not a guarantee of production access.
9. Install the **Play-distributed** build and confirm its version, ownership and release purchase path. Do not assume the earlier debug licence purchase proves this route. **Compare signatures first:** an existing debug-signed installation may not accept Play's app-signing certificate. If they differ, preserve the current Pixel installation and use a suitable separate test device with the same purchasing account. Do not uninstall the normal game or replace keys. AAB upload signing and Play app signing can use different certificates; compare against the appropriate certificate in App Integrity.
10. Confirm existing supporter ownership restores automatically and progression is preserved. If an unowned licence-test account is available, use a controlled test payment only after checking the actual sheet account, test card and explicit no-real-charge indication. Cancel an unexpected ordinary charging path. Verify completion/acknowledged ownership, pending/cancel/error feedback as practical, and restoration. Never consume the permanent product or revoke the existing genuine purchase just to make it unowned. Fresh-install/second-device tests should use a safe test device and separately exported campaign save; Play restores ownership, not local campaign progress. Record unperformed checks honestly and resolve critical failures before public rollout.

## Phase C — public release (manual approval required)

11. Complete Console's applicable listing, country/product availability, privacy/data-safety/app-content/rating/account declarations and release requirements using the actual SDK/app behaviour. Confirm **v1.0.0**, selected code, production ON, debug OFF and the exact accepted/tested AAB. After approval, promote that existing tested artefact to production/public rollout through Console. **Do not re-upload the same code as a different bundle or rebuild unnecessarily:** a code used by this exact accepted test artefact can follow that artefact across tracks. A different replacement AAB needs a new valid higher code. No upload, publication or activation occurred in this delivery.

## Phase D — after launch

12. Defer optional cosmetics, additional features and noncritical expanded testing. The first subsequent patch is **1.0.1** with **1595 or higher**, always higher than the actual first-public code. If the public release used 1595, the patch must use 1596 or higher. Critical fixes get a new code and targeted retesting; do not fork gameplay or reinstall users' apps to downgrade.

## OFF and rollback

Switch both native launch permissions OFF with one command, then rebuild through the existing workflow. An already-installed APK does not change merely because its source was changed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode Off -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

To undo a source promotion **before a newer code is installed/released**, turn both gates OFF first and restore the recorded promotion backup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\release\K6F\Promote-SEAMEN-Release.ps1" -Mode Rollback -BackupPath "C:\Users\Nick\Documents\SeamenPoolAndroid\.seamen-release-backups\PASTE-PROMOTION-BACKUP-FOLDER" -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Use `-ReleaseBuild` if a non-default public code was selected. Rollback verifies checksums/current files, is idempotent, preserves backups and never changes native permissions. A partial write failure restores prior bytes; a killed process may leave a lock requiring review. **Do not install a lower code over a newer installed app or uninstall to force it.** After launch, use a higher-code patch instead. No gameplay/save rollback is part of this tool. Native K6E installation rollback remains documented in `docs/K6E/WINDOWS-INSTALL.md`; K6F does not need a new native installation.

## Short Pixel 8 Pro / desktop candidate smoke check

1. Candidate displays **0.17.63/build 1593**; existing ownership remains purchased/active after restart and both launch gates are OFF. Vaper/Cyclops availability still follows supporter + progression rules.
2. Confirm progress, trophies, lesson ticks, equipped cosmetics and a normal free frame survive update/restart. No save reset or manual ownership flag.
3. On an unowned desktop entry, rainbow cycle is about 2 seconds, hover brightens immediately over 180 ms, pointer leave resets, and keyboard focus is clear. Reduced motion is colourful/static. Wording and position are unchanged. Purchased/disabled entries remain grey/static.
4. Sample Pixel portrait/short landscape aiming, placement/Confirm, power, spin and Play Shot; sample a Theatre/boss-music transition. No unrelated gameplay retest expansion unless a problem appears.
5. After approved promotion/activation, verify **1.0.0 / selected code**, production-enabled non-debuggable Play build, existing ownership and the controlled licence-testing path as Phase B. Report hardware/Play results separately from simulated automated tests.

## Appendix — only if K6E installation is missing or needs verification

K6E is already installed according to the supplied baseline. This repeat-safe command is included for completeness, not a required new setup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode Install -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Use it only with both gates OFF. It preserves existing configuration and makes no changes when already installed. Do not rerun historical installers to enable billing. The candidate/package default is OFF; neither promotion nor `VerifyPublic` activates billing, signs, builds, installs, uploads or purchases anything.

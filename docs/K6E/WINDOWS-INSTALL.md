# K6E — Windows installation and deliberate activation

Candidate **0.17.62/build 1592**, based on approved K6D `108ede8`, with retained K6A/K6B/K6C.2 history. **1592 is proposed, not confirmed available in Play Console.** Nothing here uploads or activates a product. The supplied `www` is release-mode and both native purchase flags are OFF.

Extract the single full candidate ZIP. Open PowerShell **in its root**, where `www`, `native-patches` and `docs` are visible. The external wrapper remains `C:\Users\Nick\Documents\SeamenPoolAndroid`. Do not copy the entire source ZIP into Android assets; use only `www` through your established process.

## One-time native update (OFF)

If the older K6C.2 local test gate is still ON, first use that older tool's OFF command. Installation refuses active gates rather than silently changing an active test/production configuration. The user has reported switching it OFF; no real wrapper was inspected here.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode Install -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Append `-WhatIf` for read-only preflight. A repeat Install changes nothing. Keep the printed installation backup path.

This upgrades the recognised plugin, adds the independent OFF production policy and release-verification Gradle file, and appends one apply line to the **existing** `android/app/seamen-billing-foundation.gradle`. The other four existing billing Java sources remain unchanged. It preserves all unrelated foundation content, app Gradle settings, application ID, signing, SDK/dependencies, registration, permissions, manifest, web files and version fields. It does not install dependencies, create a project or build/install anything.

The guard runs automatically for release-named tasks through the existing billing hook. It refuses an enabled debug test source, unexpected native billing source, development-mode/missing web assets, mismatching web/Android defaultConfig version/build, or private-key filenames in public assets. Debug tasks are unaffected. This is a necessary verification hook, not a replacement deployment process or new billing dependency.

## Usual web/sync/build workflow

Copy this package's complete `www` using your existing workflow, run `SYNC-SEAMEN-TO-ANDROID.bat` as usual, and use the existing Android Studio/Gradle build process. Set versionName **0.17.62** and versionCode **1592** through that existing process. No new Studio/SDK setup is requested. Both gates remain OFF; Play ownership queries, acknowledgement and Restore still work.

Keep release-mode web code for native QA/release. The source branch retains the existing developer mode for browser QA, but the delivered candidate's `www/game.js` has `BUILD_MODE='release'`. Do not replace that with the branch's development file when preparing the native release. The release guard will refuse it. Do not bypass the guard; fix the copy/sync/version mismatch it reports.

Before any eventual upload, verify that 1592 is unused and acceptable in Console. If it is unavailable, revise the candidate's matching web/native version metadata before building; do not change only the Android code and bypass consistency verification.

## Optional authorised debug licence testing

For the upgraded wrapper, use K6E's tool. The historical K6C.2 utility is retained unchanged for the old native version and deliberately rejects the new plugin/hash inventory; it is not the updater for K6E.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode EnableDebug -BuildVariant Debug -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Production must be OFF first. Build the existing **debug** variant. `FLAG_DEBUGGABLE` is still required. `-BuildVariant Debug` expresses intent; it does not select Android Studio's variant. Release tasks will now refuse to build until the debug gate is OFF. This opt-in cannot grant release permission.

## Turn both permissions OFF

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode Off -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Rebuild/reinstall using your usual workflow. OFF changes source, not a previously installed APK. Repeat OFF is a no-op. The full wrapper's paid ownership still comes from Play, not either launch flag; turning purchases OFF does not revoke an existing purchase or delete progress.

## Future production activation — STOP until separately approved

**This command was NOT run on a real wrapper. It permits genuine payment launching in a properly configured non-debuggable build. Do not run it for ordinary candidate installation.** Obtain separate approval after the device/Console/security checklist. Debug testing must be OFF. The local `www/game.js` and synced `android/app/src/main/assets/public/game.js` must be identical release-mode code.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode EnableProduction -BuildVariant Release -ApproveProductionActivation -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Then use the existing release build/signing workflow. The independent production policy permits only non-debuggable applications; enabling production does not enable debug testing. The release build guard verifies source/web/version safety. The approval parameter is an explicit human action, not a server/account allowlist or proof of a non-charging account. This tool does not inspect or change Play Console, prices, track access or tester eligibility.

Use **Off** and rebuild to reverse production activation. No runtime JavaScript, saved setting, imported file or remote-config value can switch either native permission.

## Roll back the native update

First run **Off**. Then use the installation backup path printed by Install (not a later gate-operation backup):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\native-patches\K6E\Manage-SEAMEN-Billing.ps1" -Mode Rollback -BackupPath "C:\Users\Nick\Documents\SeamenPoolAndroid\.seamen-billing-k6e-backups\PASTE-INSTALL-BACKUP-FOLDER" -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

It checks the exact project, source fingerprints, checksums and expected current files; restores the prior plugin/foundation bytes; removes only newly added production-policy/guard files; and keeps all backups. Repeated rollback is a no-op. Changed/conflicting files or tampered backups stop before writes. If an I/O failure interrupts a multi-file change, scoped changes are rolled back and recovery errors identify the retained backup. A process killed without cleanup can leave the lock; review it rather than running an override.

Native rollback does not clear data or roll back web assets. Restore the previous approved complete `www` only if intentionally returning the entire game to that baseline, then sync/build normally. Do not uninstall to fix a signing mismatch; preserve/export the save and compare certificates first.

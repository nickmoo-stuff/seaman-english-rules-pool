# K6B — apply the K6A native patch, then deploy normally

**Game unchanged: 0.17.60/build 1590.** No Android setup, new project, dependency upgrade, deployment-script replacement, signing/application-ID change or purchase activation is needed. Use the already prepared K6A web bundle with your existing deployment process.

## One-time command

Extract the small K6B native patch ZIP and open PowerShell **in that extracted folder**, beside `Install-SEAMEN-BILLING-K6A.ps1`. Your Android project stays at `C:\Users\Nick\Documents\SeamenPoolAndroid`.

Safe preflight, no writes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\Install-SEAMEN-BILLING-K6A.ps1" -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid" -WhatIf
```

If preflight is clean, apply once:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\Install-SEAMEN-BILLING-K6A.ps1" -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Only substitute `-ProjectPath` if your existing wrapper has moved. The script name stays K6A because the Java integration is unchanged; K6B improves its native-only preflight and workflow compatibility.

**Apply once BEFORE your next normal deployment run.** Then run your established web-copy → Capacitor sync → version/build → APK generation/install process exactly as usual. The installer no longer requires matching web files or a web overlay beforehand and does not read/write your `www`. It does not alter your Gradle version fields; your existing deployment process continues to set 0.17.60/1590.

Ordinary builds and APK installs do not remove native source changes, so no per-build reinstall is needed. Standard Capacitor sync is expected to preserve hand-written app Java and the main manifest/registration. Your separate custom deployment script is not available here, so its additional regeneration steps cannot be certified. After the **first** normal sync/run, optionally use the same `-WhatIf` command once more: it should say **already installed; no files changed**. If it proposes reinstalls or rejects changed native files, stop and retain the message/file list. Investigate only the step overwriting them; do not blindly reapply on every build or replace your deployment system.

## What the preflight checks

- Existing installed Capacitor core/android **8.5.2**, Billing **9.1.0** dependency/hook and minimum SDK 24; it changes none of them.
- Exactly one existing SeamenBilling registration, not merely a commented-out call.
- No duplicate app-source Java/Kotlin classes for the five billing components.
- Existing native files match recognised K3H.1 or supplied K6A code; custom/conflicting files stop before any writes.
- Required BILLING permission, boot permission and protected retry service declarations, with duplicate/restricted/conflicting manifest entries rejected.
- Supplied debug purchase switch is OFF. All five Java files are identical to K6A. Non-debuggable/release builds retain their unconditional purchase rejection.

Writes are limited to scoped billing Java files and missing required retry declarations in the existing manifest. Backups and rollback remain as in K6A. Existing registration, signing, app ID, Gradle/version values, unrelated native files and web files are not overwritten. A repeat run changes nothing. Do not change purchase gates, activate a product or perform any licence-test/real transaction for K6B.

## Pixel 8 Pro — short manual QA

1. Run your normal deployment and confirm the APK updates the installed app without clearing data. Stop on a signing mismatch; preserve the save rather than uninstalling or replacing keys.
2. Confirm the normal build output/APK metadata and game display **versionName 0.17.60 / versionCode 1590**. The installer deliberately leaves these to your existing scripts.
3. Check existing story progress, lesson ticks, trophies, equipped cues/tables, statistics and settings remain intact.
4. Play part of one free frame; check aiming, power and Cue Helm topspin/backspin/side combinations. No need to replay every opponent.
5. Check portrait and short landscape: cue placement/Confirm, Cue Helm, four fine-aim buttons, power and Play Shot remain usable.
6. Preview one familiar Theatre scene: artwork/animation, music and effects should work as before. Sample Lucy/Wizard only if useful; no full desktop regression is requested.
7. Open Supporter information and tap **Restore Purchases**. Checking/result feedback should remain readable in both orientations. Owned/not-owned/pending/unavailable must reflect the returned ownership state; an unavailable product/service is not proof of no ownership.
8. The purchase control must stay disabled and no test or real purchase sheet should open. Do not enable billing to test its UI.
9. If developer controls are present, they must remain labelled test access or correctly reject native grants; they must never claim a real purchase. Imported saves must not grant paid ownership. Free Chapters 0–3 remain playable without paid access.
10. After an initial online load, check free offline play, close/reopen and saved progress/settings. Paid ownership may become unverified offline; progress and stored choices must not be erased.

## Evidence and genuine limits

Targeted PowerShell tests passed: LF/BOM-CRLF and paths with spaces, dry-run/backups/idempotence, ten existing compatibility/conflict refusals, forced-write rollback, native-only install with no web tree, retained signing/application-ID/version configuration, five duplicate/commented-registration conflicts, standalone folder install, enabled bundled gate rejection, and exact unchanged K6A Java/web payloads. See `qa/K6B/native-patch.log` in the source branch. This is seven reported fixture groups, not seven Pixel tests.

Existing K6A evidence already covers Billing 9.1.0/API 36 signature compilation and the recorded Capacitor 8.5.2 integration, purchase gates, developer/import isolation and free gameplay. Those implementations did not change and basic setup/full K5 desktop regression was not repeated.

The Windows wrapper, its deployment scripts, actual Gradle build/APK/merged manifest and Pixel are outside this environment. They have **not** been inspected or tested here. Your normal build must still confirm actual version metadata, dependency resolution, merged/packaged permissions and package/signing identity. No extra configuration is required unless preflight/build reports a real mismatch. If blocked, send the exact error first; no credentials/signing keys are needed.

No merge, website/Android deployment, Play Console change, upload, production publication or transaction was performed.

# K3F.1 — Android billing foundation patch

For the **existing local Capacitor 8.5.2 wrapper** at
`C:\Users\Nick\Documents\SeamenPoolAndroid`.

This is a native patch, not a generated/replacement Android project or a signed
release. The approved web game remains **0.17.48/build 1578**, commit `f1507c9`,
byte-for-byte unchanged. Per the clarified scope, this package does not advance
versions merely to distribute instructions. **0.17.49/build 1579 remains pending
actual native integration and verification**, not a release claimed by this ZIP.

## Integration selected

Use Google's maintained native library, pinned to
`com.android.billingclient:billing:9.1.0`, with no Capacitor purchase plugin,
Kotlin extension library, RevenueCat SDK, JavaScript bridge or payment API calls.
Google's Maven metadata reports 9.1.0 as stable. The official AAR contains:

- `com.android.vending.BILLING` permission;
- `com.google.android.play.billingclient.version` metadata, value `9.1.0`;
- native Billing Client classes and Google's billing activities/query declarations.

It requires minimum Android API 23. The published Capacitor 8.5.2 Android
template defaults to minimum API 24, compile/target API 36, AGP 8.13.0 and Java 21.
The installer checks installed/locked Capacitor core and Android versions and a
numeric minimum SDK before writing. Actual local Gradle compatibility still needs
your real build; the wrapper is not accessible from this cloud workspace.

Only the base Billing library is declared. Google's required transitive dependencies
resolve normally from `google()`; they are not blindly excluded or vendored.
No billing client is connected, product queried, purchase launched or entitlement
awarded. Existing supporter test behaviour in the approved game is unchanged.

## Exact local changes

1. Append this managed block to `android/app/build.gradle`, preserving all its
   existing content, signing, application ID, version and SDK settings:

   ```groovy
   // BEGIN SEAMEN K3F.1 BILLING FOUNDATION
   apply from: 'seamen-billing-foundation.gradle'
   // END SEAMEN K3F.1 BILLING FOUNDATION
   ```

2. Add `android/app/seamen-billing-foundation.gradle`, supplied in this package:

   ```groovy
   dependencies {
       implementation('com.android.billingclient:billing:9.1.0') {
           version { strictly('9.1.0') }
       }
   }
   ```

3. Add this direct child of `<manifest>` before `<application>` in
   `android/app/src/main/AndroidManifest.xml` (or retain an existing unrestricted
   declaration):

   ```xml
   <uses-permission android:name="com.android.vending.BILLING" />
   ```

The library contributes its own permission/metadata through Android manifest
merging. The explicit app declaration also documents this app capability. No
generated `capacitor.build.gradle`, package.json, lockfile, Capacitor config,
SYNC batch file, Java source, web file, save schema or entitlement is changed.

## Windows installation

No extra local files are needed to prepare this conservative standard-template
patch. If the checks refuse a customised wrapper, stop there and provide the
specific file named by the error for a tailored patch; do not force past checks.

1. Extract the patch ZIP to its own folder, open PowerShell there, close editors
   saving the Android files, and run your usual `SYNC-SEAMEN-TO-ANDROID.bat` in
   the existing project **before** applying the patch. There is no updated `www`
   to copy for this package; keep the passed game.
2. Preview without changing files:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-SEAMEN-BILLING.ps1 -ProjectPath 'C:\Users\Nick\Documents\SeamenPoolAndroid' -WhatIf
   ```

3. Apply by running the same command without `-WhatIf`. `Bypass` applies only to
   that PowerShell process; no machine execution-policy setting is changed.
   Existing files are backed up byte-for-byte under the local project's
   `.seamen-billing-backups/<timestamp-guid>/`. The installer prints its plan and
   backup location. It preserves UTF-8 BOM and CRLF/LF and supports repeat runs.
4. Open the **existing** Android Studio project and run Gradle Sync. Do not
   replace/recreate its `android` directory. If you run your sync batch again,
   rerun the idempotent installer afterwards in case that custom batch regenerates
   files. No new npm package or `npx cap add` is required.

Preflight refuses unknown Capacitor versions, Kotlin/custom structures it cannot
safely edit, SDKs below 23, conflicting billing hooks, purchase plugins, another
declared Billing dependency, altered managed files or restricted permissions.
Do not remove another integration or downgrade it simply to pass these checks.

## Android QA and Play Console verification

1. Review the three-file diff and backup. Confirm original application ID,
   signing, SDK levels, sync script and version values are unchanged. In Android
   Studio's Merged Manifest view, check the BILLING declaration's source.
2. From the existing project's `android` directory, build locally:

   ```powershell
   .\gradlew.bat :app:dependencyInsight --dependency com.android.billingclient:billing --configuration releaseRuntimeClasspath
   .\gradlew.bat :app:processReleaseMainManifest :app:assembleRelease
   ```

   The dependency report must select **9.1.0**. These commands do not configure
   signing. If the local wrapper requires a different release flavour/task, use
   that existing variant consistently. An unsigned release APK is sufficient for
   manifest inspection; an installable/signed build is needed for device QA.
3. Find the fresh **merged** manifest for that same variant (AGP commonly writes
   `app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml`).
   Use the actual output path and APK in the supplied verifier:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Test-SEAMEN-BILLING.ps1 -MergedManifestPath 'C:\Users\Nick\Documents\SeamenPoolAndroid\android\app\build\intermediates\merged_manifests\release\processReleaseManifest\AndroidManifest.xml' -ApkPath 'C:\Users\Nick\Documents\SeamenPoolAndroid\android\app\build\outputs\apk\release\app-release-unsigned.apk'
   ```

   If SDK discovery fails, add `-ApkAnalyzerPath` with your installed
   `cmdline-tools\latest\bin\apkanalyzer.bat`. Android Studio's SDK Manager can
   install Command-line Tools. The verifier decodes the APK using that SDK tool;
   it requires BILLING and 9.1.0 metadata in **both** outputs and matching package
   names. It prints the APK's SHA-256. It does not validate AABs or sign anything.
4. Install an appropriately signed build using your existing procedure. Confirm
   normal startup, existing saves/trophies/supporter state, Chapters 1–3, School,
   Theatre, story reminder, placement arrows, Cue Helm, spin, power and landscape
   controls. No product UI, prices or payment prompts should appear.
5. Once native integration is verified, prepare the real coordinated
   **0.17.49/build 1579** web/native candidate with a versionCode greater than the
   last uploaded build. This patch deliberately does not guess or overwrite local
   version/signing conventions. Do not upload a duplicate old versionCode merely
   to test these instructions. Use the existing signing/upload key for its AAB.
6. For your later authorised Play Console verification, inspect that AAB in the
   existing app's non-production draft/App Bundle Explorer: confirm package,
   version and BILLING permission, then check whether the one-time products
   prerequisite warning disappears after processing. Do not roll out a release,
   create products, enable purchases or change production settings as part of
   this patch. Play Console acceptance cannot be established from the web ZIP.

## Recovery and information needed if blocked

If installation fails while writing, it attempts to restore only its scoped
changes and reports any rollback failure plus the backup path. For manual rollback,
restore the backed-up `build.gradle` and `AndroidManifest.xml` to their original
locations. Delete the managed Gradle file only if this run created it and you
have not subsequently modified it. Do not blindly restore over later changes.

For a preflight/build issue, the useful files are `package.json`, relevant resolved
Capacitor entries from package-lock.json, `capacitor.config.*`,
`android/app/build.gradle` (or `.kts`), main manifest, `android/variables.gradle`,
root build/settings scripts and the Gradle wrapper version. Redact any inline
credentials. **No keystore, signing passwords or purchase credentials are needed.**
Actual verification needs the merged-manifest/dependency report and verifier
output for the built APK. The cloud work does not modify or claim access to
`C:\Users\Nick\Documents\SeamenPoolAndroid`.

See `VERIFICATION.json` for the checked official artefact and validation limits.

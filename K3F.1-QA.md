# K3F.1 — Google Play Billing foundation: local-wrapper patch

Branch: `stage3f-k3f1-billing-foundation`, created directly from the approved
K3E.1 commit **f1507c9**. No approved branch, main or production repository changed.

## Clarified scope and version

The repository has `www` and native-readiness notes, but no package.json,
Capacitor config or Android project. Nick confirmed his **Capacitor 8.5.2** wrapper
is local at `C:\Users\Nick\Documents\SeamenPoolAndroid`, outside GitHub, and asked
for a separate guarded patch rather than a reconstructed wrapper or an
instructions-only game version bump.

Accordingly, the complete web tree remains byte-identical to **0.17.48/build 1578**
at `f1507c9`. No **0.17.49/build 1579** application is claimed or emitted. That
coordinated release remains pending real wrapper integration/build verification.
The packaged filename explicitly identifies the unchanged baseline version.

## Native integration

Use the official maintained Google Billing Client **9.1.0**, declared strictly in
one app-scoped Gradle fragment. No purchase Capacitor plugin or Kotlin extension
dependency is necessary for permission/dependency infrastructure without a JS API.
The installer appends one managed `apply from` block and adds the explicit
`com.android.vending.BILLING` root manifest permission. Google's AAR also supplies
the permission, billing-version metadata, activities and query declarations through
normal Android manifest merging. No purchase products, prices, prompts, runtime
BillingClient connection or new entitlement state are introduced.

Official sources inspected:

- [Google Billing Maven metadata](https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/maven-metadata.xml)
- [Google Billing 9.1.0 POM](https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/9.1.0/billing-9.1.0.pom)
- [Google Billing 9.1.0 AAR](https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/9.1.0/billing-9.1.0.aar)
- [Google's SHA-256](https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/9.1.0/billing-9.1.0.aar.sha256)
- Published `@capacitor/android@8.5.2` and `@capacitor/cli@8.5.2` npm distributions.

The downloaded AAR matches Google's SHA-256:
`d28286d4e4c18725510980de01211d9b72501e7146d96817fa0c9999af9b0d22`.
Its actual manifest contains BILLING, version metadata `9.1.0` and minimum SDK 23;
its classes.jar contains `BillingClient.class`. Published Capacitor 8.5.2 defaults
to minimum SDK 24, compile/target SDK 36, AGP 8.13.0 and Java 21. This establishes
the declared minimum-SDK fit, not a claim that Nick's custom Gradle build ran.
Google's required transitive libraries are retained; no unrelated SDKs are added.

## Package and Windows workflow

[Patch instructions and six-step Android/Console checklist](native-patches/K3F.1/README.md)
describe the exact three-file edit, PowerShell `-WhatIf`, installation, build,
dependency resolution, merged-manifest/APK verification and manual recovery.

The ZIP includes the installer, verifier, Gradle fragment, instructions,
machine-readable verification limits and SHA256SUMS. Rebuild it reproducibly with
`python tools/package-billing-patch.py`. Its name is:

`downloads/SeamenPool-K3F1-BillingPatch-Capacitor8.5.2-baseline0.17.48-build1578.zip`

Run the existing SYNC batch **before** applying the patch; rerun the idempotent
installer if SYNC is used again. No npm install, wrapper generation, signing
change, SDK upgrade, purchase initialization or Play upload is performed by it.
The user supplies their real wrapper and build tools only on their own PC.

## Verification performed

- PowerShell **7.5.4 on Linux** executes `tests/billing-patch.py` against isolated
  fixtures and the published Capacitor 8.5.2 Android template. Tests passed:
  dry run without writes; three scoped file changes; exact backups; repeat-run
  idempotence; paths with spaces; UTF-8 BOM and CRLF preservation; package-lock
  fallback; empty dependency sections; preservation of an existing permission;
  11 conflicting/unsupported inputs refused without writes; rollback after a
  forced write error. The actual Windows wrapper was not copied or modified.
- Verifier fixtures pass valid XML and reject a missing permission, wrong library
  metadata, mismatching packages and a failing analyzer. The analyzer fixture and
  fixture APK are **not** evidence of a real Android package.
- The official AAR/hash checks described above were performed on the actual
  downloaded artefact, not mocked content.
- **PASS: seven browser suites**: `story-reminder`, `layout-preservation`,
  `spin-physics`, `pool-school`, `theatre`, `campaign-regression` and
  `spin-offline`. These cover the story reminder/legacy saves, approved portrait
  and landscape table/control geometry, neutral/spun physics, five lesson
  successes/failures and trophy/stat isolation, original Theatre catalogue and
  Chapters 1–3 flows, saved campaign/cosmetics/supporter data, and offline local
  gameplay. They ran against a fresh local HTTP server. An initial attempt could
  not reach the old preview server; all seven passed after the server was replaced,
  without any game or existing test changes. The remaining web suites were not
  repeated for this native-only patch with an unchanged web tree.
- Repository comparison: `git diff f1507c9 --exit-code -- www` is empty. Existing
  gameplay, Theatre, styles, scenes, catalogue, saves, trophies and reminder code
  are unchanged. All **28 JavaScript files** passed syntax checks, and patch
  whitespace checks passed.
- **PASS:** ZIP integrity, all five embedded file checksums and byte-reproducible
  output. There are no native build outputs or secrets in the ZIP. Its SHA-256 is
  `1ee5db8b76e8a715f2c47168bb95d8a0e67bf13b41fcad2446e3bec8cb1837d2`.

To reproduce native patch tests, install PowerShell and run:

```sh
PWSH=/path/to/pwsh python tests/billing-patch.py
```

`K3F_CAPACITOR_TEMPLATE=/path/to/extracted/official/android-template` additionally
exercises the published template. This is a test fixture, never a replacement
project delivered to the user.

## Unverified / local follow-up required

No Android SDK, javac/Gradle build toolchain, local wrapper or signing environment
is available here. **Actual Gradle resolution/compilation, the app's merged
manifest, packaged APK/AAB, physical Android behaviour and Play Console
acceptance are not verified.** No APK/AAB was built. The bundled verifier is for
the user to run after their build; inspecting the library AAR alone does not
establish the final app's contents.

Windows PowerShell 5.1 execution, Windows file locking/ACL behaviour and the
existing custom SYNC batch have not been exercised. Scripts use 5.1-compatible
syntax but were executed on Linux PowerShell 7.5.4. Unsupported native layouts
fail preflight and identify the file needed for a tailored patch. No keystore or
purchase credentials are needed to tailor it. The web checks do not constitute
a complete naturally played campaign or real-device QA.

Later Console validation needs a freshly built, appropriately versioned/signed
AAB in the existing app's non-production workflow. No Google Play deployment,
product configuration, production-setting change, purchase activation, merge or
environment publication was performed.

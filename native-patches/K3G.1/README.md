# K3G.1 — Disabled Supporter Pack billing bridge

**Candidate: 0.17.50/build 1580. Capacitor 8.5.2; Billing Client 9.1.0.**
The Windows wrapper is external to GitHub. This package patches that existing
project; it does not generate an Android project, supply signing material or
claim to be a built APK/AAB. K3F.1 must already be installed and verified.

## What is ready and what is blocked

- The Java plugin genuinely calls Google Play to query `INAPP` purchase records
  and ProductDetails for `seamen_pool_supporter`, selecting Buy purchase option
  `supporter-buy` for the displayed regional price. It never hardcodes £1.79.
- Play pending records report pending. A successful current-account query with
  no matching record reports not owned. Query/connection failures or a PURCHASED
  record requiring server verification report verification unavailable.
- `purchase()` **always rejects** `PURCHASES_DISABLED`. Both capability flags are
  false, no payment flow is launched, no purchase is consumed and no unverified
  purchase is acknowledged. No code path grants verified ownership in this native
  candidate. A local web flag cannot enable it.
- The web session/UI handles future verified, acknowledged server responses,
  but the verified-owner screens in automated screenshots/tests are **mock
  fixtures**, not Google Play verification. The legacy web development test pass
  remains separate; native paid gates do not accept it.
- There is no trusted backend/domain. Verification, identity/replay protection,
  signed responses, acknowledgement/retries and revocation processing still
  require implementation and security testing. See [BACKEND-CONTRACT.md](BACKEND-CONTRACT.md).

## Native bridge protocol

The plugin registers as `SeamenBilling`, accessible from the actual Capacitor
global `Capacitor.Plugins.SeamenBilling` (or an ESM `registerPlugin` adapter).

| Method/event | Behaviour now |
| --- | --- |
| `getCapabilities()` | Protocol 1; purchase/verification disabled |
| `getProduct()` | Google price for the specified product/Buy option, or unavailable |
| `checkOwnership()` | Google query; not_owned, pending or verification_unavailable |
| `purchase()` | Rejects `PURCHASES_DISABLED`; no billing dialog |
| `purchaseUpdated` event | Recheck notification only; never carries a paid grant/token |

Native calls have bounded timeouts; disconnected state is unknown. Resume and
purchase-update events request a fresh check; disconnect invalidates the web
session without an immediate retry loop. No purchase token is exposed to web
code, persisted in localStorage, included in portable saves or logged. Backend
token submission is deliberately absent until that integration is secure.

## Numbered Windows installation

1. Keep the existing project at
   `C:\Users\Nick\Documents\SeamenPoolAndroid`. Back up normally. Extract the web
   candidate ZIP separately and copy its `www` contents into the existing wrapper's
   `www` folder using your established workflow. Do not replace the native project.
2. Run the existing `SYNC-SEAMEN-TO-ANDROID.bat`. Extract this separate bridge ZIP
   to another folder and open PowerShell there. Preview:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-SEAMEN-BILLING-BRIDGE.ps1 -ProjectPath 'C:\Users\Nick\Documents\SeamenPoolAndroid' -WhatIf
   ```

3. Review the plan. Apply by omitting `-WhatIf`. This process-only execution-policy
   argument does not change machine policy. The installer checks resolved core
   and Android 8.5.2, K3F.1 dependency/hook/permission, supported MainActivity and
   literal approved/candidate version values. It refuses conflicts before writes.
4. It changes only: app Gradle **versionName/versionCode** to `0.17.50/1580`;
   one registration override in existing `MainActivity.java`; and the new
   `com/seamenpool/billing/SeamenBillingPlugin.java` source. It does not alter
   application ID, signing, manifest, K3F.1 dependency, package.json or sync script.
   The `load()` override registers the plugin **before** `super.load()` creates
   the Capacitor bridge. Existing `onCreate`/imports/package code is retained.
5. Backups are printed under `.seamen-billing-backups/<timestamp-guid>/`. UTF-8
   BOM and CRLF/LF are preserved; identical repeat runs do not rewrite files.
   After another custom SYNC run, rerun the installer in case files regenerated.
   It attempts scoped rollback on write failures and reports any recovery failure.
6. For manual rollback, restore changed Activity/Gradle files from that run's
   backup and remove the plugin only if the run created it and it has not since
   been modified. Restore the earlier matching `www` too if rolling back versions.
   Never overwrite later changes blindly. If preflight refuses a custom Kotlin
   Activity, existing `load()` override or dynamic version configuration, provide
   those source files for a tailored patch; do not bypass the checks. No keystore,
   password or Play credentials are needed for that review.

## Numbered Android Studio build and QA

1. Open the existing Android Studio project, Gradle Sync, then inspect the diff:
   matching web/native 0.17.50/1580; unchanged package/signing and Billing 9.1.0.
2. Build your usual debug/release variant. From `android`, useful checks are:

   ```powershell
   .\gradlew.bat :app:dependencyInsight --dependency com.android.billingclient:billing --configuration releaseRuntimeClasspath
   .\gradlew.bat :app:processReleaseMainManifest :app:assembleRelease
   ```

   Use the existing signing procedure/flavour. Inspect the fresh merged manifest
   and APK with the K3F.1 verifier: BILLING and 9.1.0 metadata must remain present.
   The K3G.1 installer never duplicates that dependency or permission.
3. Install a matching native build. Opening the supporter page must not trigger
   payment. The regional price may be unavailable while the product remains Draft
   or the app/account is not eligible. Restore/check must either report a genuine
   Play not-owned/pending result or clearly say verification unavailable. Missing
   plugin/unsupported service/web mode must keep the game usable and payments disabled.
4. Check offline/resume/interruption. Unknown verification must not say purchased,
   silently erase progress or overwrite saved cosmetic choices. Local legacy flags
   and SUPPORTER-DEV must not grant native paid access or the thank-you menu state.
5. Check current campaign saves, trophies, supporter challenge records and selected
   cosmetics, Chapters 1–3, Theatre, Pool School, Cue Helm/spin, placement arrows,
   fine aim, power, portrait/landscape and desktop manual layout. No Chapter 4–6
   content or mandatory main-campaign purchase has been added.
6. Do not expect a verified-purchased screen or an acknowledged new purchase in
   this candidate. There is no backend; that path is deliberately blocked. No
   real-money purchase is required or authorised.

## Google Play test prerequisites — later, not enabled here

1. Keep the product **Draft** and the current Alpha review/production settings
   unchanged for this task. Do not upload or roll out this source ZIP as if it
   were an Android binary. Build/signing/Console actions remain local and separately
   controlled by the user.
2. After the backend contract and native verification/payment implementation are
   completed and reviewed, arrange the appropriate eligible product/track status,
   licence tester and Play-installed signed build with matching package/signature.
   Price and products may not resolve until those prerequisites are satisfied.
3. Then run Google's test instruments for completed, pending, cancelled, declined,
   already-owned, offline and interrupted payments; test acknowledgement deadline
   and retries, reinstall, same-account second device, different account,
   refund/revocation and replay handling. Never substitute UI mocks for these tests.
4. Enable purchase UI only after those tests and trusted verification succeed.
   Product activation, real payments and production deployment are outside K3G.1.

The QA report in the source branch records exactly which automated checks ran.
PowerShell was exercised on Linux, not Windows 5.1; Java signature compilation
uses the real Billing library but Capacitor stubs, not the user's unavailable
Android wrapper. No Android/Play purchase verification is claimed.

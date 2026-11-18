# K6A Android update — Capacitor 8.5.2 / Billing Library 9.1.0

This is a guarded update for the existing external Windows wrapper, not a replacement Android project. The complete game is in the release ZIP's root `www`. Keep your existing Capacitor config, Gradle, application ID, signing files, SDK settings and saves.

## What is supplied

Five Java sources in `com.seamenpool.billing`: SeamenBillingPlugin, SupporterBillingCore, PlayBillingClient, BillingRetryJob and PurchaseTestPolicy. The first four build on approved K3H.1; retry remains unchanged. Use the existing official `com.android.billingclient:billing:9.1.0` dependency/hook and existing plugin registration, with Capacitor core/android 8.5.2 and minimum SDK 24. No extra billing library, subscription, consumable currency, web gateway or consumption API is introduced.

The configured one-time product is **seamen_pool_supporter**, purchase option **supporter-buy**, explicitly non-rental. Price/ISO currency/micros come from the selected Play offer, never a hardcoded charge. Tokens stay native-only. A purchase-flow result is followed by current inventory confirmation and acknowledgement/requery. Pending and uncertain outcomes do not grant access. Restore/startup/resume/reconnect/purchase notifications query existing ownership without charging.

**Both testing and production purchase launching are OFF in the supplied patch.** PurchaseTestPolicy's native constant `TEST_PURCHASES_ENABLED=false` is not controlled by JS, storage or imported saves. Even if a future approved native test edit sets it true, `ApplicationInfo.FLAG_DEBUGGABLE` must also be true: release/non-debuggable builds always reject. No production-enabling switch is provided. The positive debug-policy truth table and purchase flow are tested using fakes, not a Play transaction.

## Windows installation — K6B workflow correction

Use [the minimal K6B guide](../../docs/K6B/README.md). The native installer no longer requires a web overlay or matching `www` files, so apply it once **before** your next normal deployment run. Then retain your existing web-copy/sync/version/build/install workflow. No new deployment script or setup is supplied. Ordinary builds do not need the installer repeated; only custom regeneration of native files would require investigation. The same installer with `-WhatIf` provides a read-only check after the first sync.

From the extracted standalone native patch folder (or this folder in the source tree):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\Install-SEAMEN-BILLING-K6A.ps1" -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid" -WhatIf
```

Remove `-WhatIf` to apply. It retains native version/dependency/registration/hash/manifest guards, adds duplicate-class/registration and supplied-gate-OFF checks, backs up changes and is idempotent. It does not edit signing, application ID, Gradle versions/dependencies, web files or any purchase-enable constant. All Java sources stay byte-identical to K6A; purchases stay disabled. Your existing process sets versionName 0.17.60/versionCode 1590.

If a custom configuration is rejected or the normal workflow overwrites these files, stop and retain the exact error/file list. Do not bypass guards, clear data or replace keys. To roll back, restore scoped changed files from the selected `.seamen-billing-backups` directory and remove PurchaseTestPolicy.java if it was newly added. No web rollback is needed for this native-only patch.

## Separate future licence-testing prerequisite

No Play Console state, eligible licence-test account, actual application ID/signing/distribution or product availability was accessible here. Do not activate a product, upload an AAB, flip the test constant or make a real-money purchase as part of this delivery. After separate approval and eligible non-charging licence-test configuration, a reviewed native edit may enable **debug-only** testing. Debug/sideload eligibility must be confirmed for the actual Play package/account; a debuggable APK is not a Play production release. Exercise completed/pending/cancelled/failed/already-owned, acknowledgement after interruption, refund/revocation, reinstall and a second device using the same Google Play account. Release mode stays disabled and requires a future separately approved production integration decision.

See the root `docs/K6A/AUDIT.md`, `SECURITY.md`, `BACKEND-DESIGN.md` and `REPORT.md` for evidence and limits. This client-only model does not claim server-level verification.

# K6C.2 — temporary debug-only billing test gate

For the **existing** Windows Capacitor 8.5.2 / Billing 9.1.0 wrapper, already carrying the K6A/K6B native integration. Approved game remains **0.17.61/build 1591**, baseline `108ede8`. No game/version change, new Android dependency, installer replacement or deployment process is supplied.

The repository's native gate remains **OFF**. These commands change only the recognised **installed wrapper's** `PurchaseTestPolicy.java` constant. The native `FLAG_DEBUGGABLE` requirement and release rejection remain byte-for-byte unchanged. The configuration is explicitly named `authorised-debug-licence-test` in each backup's operation record.

## Two commands

Extract the small ZIP and open PowerShell in the extracted folder, beside `Set-SEAMEN-BillingTestGate.ps1` and `approved-native-hashes.json`.

**Enable the authorised debug test configuration:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\Set-SEAMEN-BillingTestGate.ps1" -Mode EnableDebug -BuildVariant Debug -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

**Restore the gate to OFF:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\Set-SEAMEN-BillingTestGate.ps1" -Mode Off -ProjectPath "C:\Users\Nick\Documents\SeamenPoolAndroid"
```

Either operation may be repeated: an already-correct state makes no changes and creates no additional backup. Append `-WhatIf` for read-only preflight. There is no default activation mode. Enabling without explicit `-BuildVariant Debug`, or requesting `-BuildVariant Release`, is rejected.

Use your normal web-copy/sync/build process afterwards, selecting its **existing debug build variant** for testing. The command does not select Android Studio's actual variant: `-BuildVariant Debug` declares your intent, while the unchanged native guard independently checks the resulting application's debuggable flag. A normal non-debuggable release build cannot launch a purchase, including while this local source opt-in is ON. Do not change release debugging settings to bypass the guard.

**Rebuild after both ON and OFF.** Switching a source constant does not alter an already built/installed APK. After testing, turn OFF, rebuild the usual purchases-disabled candidate and verify the disabled purchase control. Keep test APKs separate from normal distributable output. While ON, any debuggable build from this local wrapper has opted into testing; the tool does not identify a licence-test Google account or prevent a charge on a non-test account.

## Automatic safeguards

Preflight checks Capacitor 8.5.2, minimum SDK 24, the existing Billing 9.1.0 hook, exact `com.seamenpool.game` applicationId, no debug suffix/product flavours, recognised native sources, single plugin registration, no duplicate billing classes, required permissions and protected retry service. Explicit release/main-manifest debugging, unknown Gradle debugging expressions, source links/reparse points, custom Java changes, unexpected encoding and conflicting operation locks are rejected before any source write. Standard explicit debug debugging is accepted. Custom wrapper configurations stop for review rather than being rewritten.

All five native Java files must match the approved K6A/K6B content (normalising LF/CRLF and UTF-8 BOM only). The policy accepts only the exact approved OFF version or its single-constant ON variant. UTF-16 is rejected. Neither `FLAG_DEBUGGABLE` nor any entitlement/purchase logic can be edited through this tool. Unknown installed variants cannot be overwritten, including by OFF; preserve the reported file and backups for review.

The source change is one atomic replacement, retaining UTF-8 BOM and line endings. Each actual transition keeps the prior bytes and an operation record under:

```text
C:\Users\Nick\Documents\SeamenPoolAndroid\.seamen-billing-test-backups\<unique-operation>\
```

`PurchaseTestPolicy.java` is the preflight backup; `atomic-before.java`, when present, is the atomic replacement backup. `operation.json` records mode, hashes and the debug-only configuration name without tokens or credentials. Existing backups are not overwritten or removed. The operation lock is released on normal completion/error. A stale lock after a killed process requires review; the tool does not guess whether another operation is safe to interrupt.

Do not rerun the K6B native installer to toggle this setting. Its separate source-hash/OFF-default guards deliberately refuse an enabled/custom source. Use this tool's OFF command first before any separately needed native integration check. Ordinary sync/build does not require reinstalling the billing patch.

## External prerequisites and brief QA

1. Confirm the actual wrapper and APK match the expected package, signing and approved game. A debug certificate may not match an installed Play-signed app; preserve/export saves and use a dedicated test device rather than uninstalling the normal game or changing signing keys. The tool never reads or changes signing configuration.
2. Confirm the purchasing Google account is a **licence tester** and that the active one-time product `seamen_pool_supporter`, buy option `supporter-buy`, price and country availability are correct. Ordinary internal/closed-track membership alone does not make purchases free. Inspect the payment sheet for the intended account and explicit test-payment indication; cancel an ordinary charging path.
3. Run ON, build the existing debug variant and inspect the APK's actual debuggable flag. Verify the existing supporter button obtains its price/capability from native Play. No web changes are needed. Non-debuggable Play-installed builds retain purchase rejection; Restore still works independently of the purchase gate.
4. Only in the authorised device session, test cancellation, approved/declined/pending payment, acknowledgement, duplicate taps, interrupted recovery, same-account restoration and refund-and-revoke propagation. The permanent product must never be consumed. No such transaction was performed in this delivery.
5. Run OFF, rebuild, confirm purchase launching disabled and existing progress retained. The tool does not upload, install, initiate purchases or change Play Console.

The actual external wrapper, its custom sync scripts, actual Android/Gradle build and Windows PowerShell 5.1 host were unavailable here. Tests run PowerShell Core on Linux against disposable wrapper fixtures and compile the resulting ON/OFF policy on the JVM. This proves script/state behaviour, not Play eligibility or physical-device payment interoperability. The script targets PowerShell 5.1 syntax/APIs; actual Windows/device execution remains external QA. See `TEST-REPORT.md` for measured results.

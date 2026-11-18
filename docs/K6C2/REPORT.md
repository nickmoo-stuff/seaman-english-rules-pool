# K6C.2 test report

Baseline game: **0.17.61/build 1591**, K6D `108ede8`. Tool branch: `stage6-k6c2-debug-billing-test-gate`. No version increment: this is a separate native opt-in utility, not a game update.

## Completed

- **41 PowerShell operation assertions PASS** across disposable wrapper fixtures, plus the separately checked omitted-debug-intent refusal. Both LF and UTF-8 BOM/CRLF paths exercise OFF -> authorised debug-test ON -> OFF, no-write dry runs in both directions, repeated ON/OFF commands, exact backups and byte-for-byte OFF restoration.
- **26 refusal fixtures PASS:** wrong/missing debug intent, changed native sources, wrong Capacitor/package/dependency/minimum SDK, package suffix/flavours, release/main-manifest debugging, unknown Gradle expressions, bad permissions/service/registration, duplicate Java/Kotlin classes, UTF-16/UTF-32, linked source/backup paths and conflicting operation lock. Additional edited-ON OFF refusal preserves the unknown source rather than overwriting it.
- Forced write failure leaves the original source and backup intact and releases the operation lock.
- JVM compilation/execution of the actual generated ON policy proves `enabled(true)` permits debug while `enabled(false)` rejects. Restored OFF policy rejects both. Run for both encoding fixtures. This is a boolean policy fixture, not an Android debuggability or payment test.
- Existing native API check PASS: all five unchanged Java sources compile against cached real Billing **9.1.0**, Android API 36 and Capacitor stubs; **13 production-core fixture tests PASS**, existing OFF-default/debug-only policy truth table PASS.
- Protected payload audit PASS: complete `www`, existing K6A/K6B Java/installer and historical K3H native sources remain unchanged from approved `108ede8`. No gameplay, entitlements, saves, artwork, audio, web purchase implementation, Gradle/signing/version configuration or deployment process changed.

Measured logs are in the source branch's `qa/K6C2` (also included under `qa` in the tool ZIP). Reproduce from a full source checkout with `python tests/k6c2-gate.py`; `PWSH` and `ECJ_JAR` select the test host's PowerShell/compiler. Existing `tests/k6a-java-check.py` also needs the cached Billing AAR and Android API jar. Test dependencies are not installed into the user's wrapper by this utility.

## Limits / external prerequisites

Tests ran PowerShell Core on Linux, not Windows PowerShell 5.1. The script uses PowerShell 5.1-compatible syntax/APIs, but actual Windows filesystem/ACL behaviour and the external Windows wrapper remain unverified. Native compilation uses Capacitor stubs, not a full Capacitor/Gradle application build. No APK, Play install, purchase, acknowledgement against Play, Console change, upload or deployment was performed. Fixture writes occurred only in disposable test directories.

The real wrapper must contain the supported K6A/K6B integration, an unchanged supported package/configuration and the existing debug build variant. The actual APK must be debuggable for this gate to permit launching. Rebuild after changing either direction; OFF does not retroactively modify a previously installed ON APK.

Before any physical transaction, verify the Google licence-test account, active permanent product `seamen_pool_supporter`, buy option `supporter-buy`, region/price and explicit non-charging test payment sheet. Ordinary Play internal/closed-track membership is not equivalent to licence testing. Use a safe test device/signing arrangement that preserves the normal app and saved progress. Non-debuggable Play builds remain purchase-disabled; restoration queries remain available independently.

No new billing logic remains to implement for this debug-gate milestone. The utility is ready; local wrapper preflight, the existing debug build, Play account/product configuration and real-device billing/restore QA remain external steps. See README for the exact ON/OFF commands. The supplied repository and native patch defaults remain OFF.

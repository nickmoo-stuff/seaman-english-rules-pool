# K6E native update — both permissions OFF

For the existing Capacitor 8.5.2/Billing 9.1.0 wrapper with K6A/K6B already installed. No new Android project or dependency.

From the full candidate ZIP root, follow [the exact Windows commands](../../docs/K6E/WINDOWS-INSTALL.md). **Install** is a one-time, idempotent native update, not activation. Its only Gradle change is appending one verification apply line to the existing billing foundation file and supplying the guard it loads. Package/signing, SDKs, build types, dependencies, permissions/registration, version fields, web assets and saves are preserved.

Both `PurchaseTestPolicy.TEST_PURCHASES_ENABLED` and `ProductionPurchasePolicy.PRODUCTION_PURCHASES_ENABLED` are false in this bundle. Debug and non-debuggable permissions are separate, native-only and mutually exclusive through the managed opt-ins. The release guard rejects an active debug source and validates native sources, release web mode and matching Android/web versions. No production enablement was performed.

Use K6E **Off** to switch both permissions off, and the retained installation backup with **Rollback** to reverse the update. Historical K6A/K6B/K6C.2 tools remain in the source package for their own native versions; use this K6E utility after upgrading. See [security/device checklist](../../docs/K6E/SECURITY-AND-QA.md) and [measured report](../../docs/K6E/REPORT.md). Build, signing, Console, real purchases and physical-device validation remain external.

# Release holds and device checks

## Safety / trust model

Both shipped native flags are false. Debug permission is `debuggable && TEST_PURCHASES_ENABLED`; production permission is `!debuggable && PRODUCTION_PURCHASES_ENABLED`. Plugin routing selects one appropriate path. Enabling one never enables the other. The update tool rejects mixed opt-ins; release task verification also rejects a leftover debug opt-in. Product/option stay `seamen_pool_supporter` / `supporter-buy`; actual price/currency/offer token come from Play. No consumable/subscription or extra product was added.

Ownership remains the approved on-device Play model, not server verification. Matching product/package PURCHASED and acknowledged inventory is required. Launch/cancel/OK events are not entitlement proof; pending grants nothing and is not acknowledged until purchased. Fresh queries after acknowledgement, coalescing, retries, startup/resume restoration, account changes and revoked/not-owned results retain their existing implementation. No stored/imported flag or native developer shortcut can establish paid ownership. The web confirmation is short-lived and invalidated on relevant lifecycle events; progress and stored cosmetic choices are not erased when confirmation fails.

Google cache/propagation can delay revocation. The five-minute web session is not a promised refund-detection deadline. Android/network/force-stop delays can prevent background acknowledgement retry inside Google's deadline and lead to automatic refunds. Hooked/rooted/repackaged clients can falsify on-device checks; there is no independent server token verification, signature/Integrity attestation or real-time server notification channel. The assets are bundled rather than server DRM. A future backend can validate tokens, own acknowledgement/retry and process developer notifications, without embedding secrets in the app. No backend was invented for this milestone.

## External release prerequisites — not changed here

1. Confirm the real wrapper resolves Capacitor 8.5.2/Billing 9.1.0, expected package `com.seamenpool.game`, unchanged signing and the protected retry service/BILLING/boot permissions in the merged AND packaged application. Confirm native registration once, versionName/versionCode and non-debuggable release APK/AAB using existing Studio tools.
2. Confirm Console product and active buy option IDs, £1.79 UK price, regional/country eligibility and payments setup. Do not change any of them as part of this candidate installation.
3. Confirm licence-test account separately from track membership/opt-in. An ordinary closed/internal-track account can incur a real charge. Check actual sheet account and explicit test-payment indication before an authorised test. Debug flag/approval switch does not make a payment free.
4. Confirm upload code availability; 1592 is only proposed. No Console read access was available here, no upload performed.
5. Preserve the user's installed app/save and signing identity. A debug certificate differs from Play app-signing in many wrappers. Use a suitable dedicated test device; do not generate keys or routinely uninstall the normal game. Verify the app-signing certificate, not just the upload certificate.
6. Obtain separate approval before the documented production-enablement command, any upload, publication or real-money transaction. None occurred here. Packaging is not Play release approval.

## Confirmed external evidence supplied by the user

On Pixel 8 Pro, before K6E: Play returned £1.79, showed a test-card/no-real-charge sheet, completed a licence-test purchase, recognised native ownership, unlocked Darth Vaper/Ol' Cyclops while preserving progression, retained ownership after app restart, and the debug gate was switched OFF. K6D manual QA 17/17 and K6B Android QA 10/10 are user-reported previous-baseline results, not fresh K6E testing.

The final rebuilt OFF-gate APK ownership confirmation is still awaiting the user. Full reinstall/second-device recovery, pending approval/decline on real Play, refund/revocation, interrupted acknowledgement on device, production purchases and this new native/Gradle update have NOT been tested on hardware here. The external Windows wrapper/SDK/signing configuration was not accessible. Automated native/Groovy/browser tests use fixtures; compilation is not a complete Android build.

## Short Android smoke checklist

1. Apply Install once, copy/sync the supplied release `www`, use the existing version/build process, and build/update without clearing data. Confirm 0.17.62/build 1592, existing progress, lesson ticks, trophies and cosmetics. Stop on a signature mismatch.
2. With both gates OFF, confirm the purchase button is disabled, availability feedback agrees, and Restore/startup recovers the prior licence-test ownership on the same account. Confirm the rebuilt OFF-gate ownership result that remains outstanding.
3. Check main-menu wording is unchanged, shimmer is subtle/readable, owned state is grey/non-clickable, reduced motion is static, and portrait/short landscape remain usable. Restore feedback must remain visible without moving the tapped control.
4. Under an authorised debug session only, verify price and payment availability agree, cancel/decline/pending are accurate, duplicate taps do not duplicate flows, and a completed test purchase grants only after acknowledged inventory. End the session with Off and rebuild. Release tasks must refuse a debug-ON source and mismatched web/native version.
5. After approval for recovery testing, check reinstall/second-device same-account Restore, account without a purchase, network loss/resume and interrupted acknowledgement. Back up campaign saves separately; Play restores purchases, not local story progress. Authorised test refund **and revoke**, then recheck after propagation; progress must remain intact while entitlement disappears. Never consume the permanent product to reset a test.
6. Sample free Chapters 0–3/local multiplayer, Chapter 4 gating, Cue Helm/spin and a boss intro -> match -> victory soundtrack. No full gameplay retest is required beyond issues found; automated full regression is recorded separately.
7. Only after separate release approval, enable production explicitly, build a non-debuggable release with the usual workflow and confirm packaged policy/manifest/version/assets. Do not upload or initiate a real transaction merely to inspect the artefact. Keep release output separate from debug-test APKs.

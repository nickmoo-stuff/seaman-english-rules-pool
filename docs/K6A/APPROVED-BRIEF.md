# Seamen English Rules Pool — K6A: Google Play Billing Integration

## Baseline

Use the approved whole-game regression baseline:

- Version: 0.17.59
- Build: 1589
- Chapter 4 content: frozen
- K5A automated regression: 45 PASS / 0 FAIL / 1 NOT TESTED
- K5B desktop regression: 13/13 PASS

**Objective:** Implement secure Google Play supporter purchases and restoration for the Android version while preserving all existing gameplay and content.

This milestone is for development and testing only. Do not activate production purchases or publish an Android release.

## 1. Read-only audit first

Before changing code, inspect:

- Existing Capacitor Android project and plugin versions.
- Current supporter entitlement model and purchase/restore UI.
- Chapter 4 supporter access requirements.
- Existing supporter bonuses in Chapters 1–3.
- Existing Google Play Billing dependencies or bridge code.
- Existing developer supporter-access shortcuts.
- Current save/export/import handling.
- Existing purchase-related tests and mocks.

Report the findings, including any missing configuration or Play Console prerequisites.

Use the existing architecture where practical. Avoid unnecessary dependencies or broad rewrites.

## 2. Google Play Billing integration

Implement Android purchase support using a maintained Google Play Billing integration compatible with the existing Capacitor project.

Requirements:

- Support a **one-time, non-consumable supporter purchase**.
- Do not implement a subscription.
- Do not implement recurring charges.
- Do not introduce consumable currency or repeat purchases.
- Use the configured Google Play product ID; if none exists, request confirmation rather than inventing a production identifier.
- Display the actual Google Play product price and currency returned by the billing service.
- Never hardcode a displayed purchase price.
- Handle purchase success, cancellation, pending transactions, failure and already-owned status.
- Acknowledge completed purchases correctly and idempotently.
- Never consume the non-consumable purchase.

Do not treat a purchase button click or purchase-flow launch as proof of ownership.

## 3. Supporter entitlement

A verified supporter purchase should unlock the existing supporter content, including:

- Chapter 1 optional supporter opponents and rewards.
- Chapter 2 optional supporter opponents and rewards.
- Chapter 3 optional supporter opponents and rewards.
- Chapter 4 main story and Spinball Wizard.

Preserve all existing unlock conditions unrelated to supporter ownership.

Supporter access must not automatically mark opponents as defeated, award trophies or complete chapters.

Keep the free Chapters 0–3 available without purchase.

## 4. Purchase verification and security

- Use Google Play's authoritative purchase states and ownership records.
- Do not grant permanent paid access based solely on editable local storage, imported saves or developer flags.
- Where appropriate, provide a secure server-side verification design using the Google Play Developer API.
- If a verification backend is required but unavailable, identify this explicitly rather than pretending that local validation is equivalent.
- Ensure pending purchases do not unlock content until completed.
- Handle refunds, revocations and cancelled purchases according to Google Play's ownership state.
- Keep entitlement checks separate from gameplay progression and save files.
- Preserve development-only supporter grants for QA, without allowing them to impersonate genuine purchases.

## 5. Restore purchases

Implement an accessible **Restore Purchases** action.

- Query Google Play for existing non-consumable ownership.
- Restore entitlement without charging again.
- Handle reinstall, new device and returning users using the same Google account.
- Provide clear feedback for owned, not owned, pending, unavailable and error states.
- Avoid duplicate simultaneous restore requests.
- Recheck ownership when appropriate, including app startup and return from purchase flow.
- Do not claim successful restoration until ownership is confirmed.

## 6. Platform separation

**Android:**
- Use native Google Play Billing for supporter purchases.
- Preserve normal gameplay while purchase services are unavailable.

**Web/PWA:**
- Do not attempt to invoke Google Play Billing.
- Keep the existing web supporter presentation consistent with approved behaviour.
- Do not create an alternative payment gateway in this milestone.

**Development builds:**
- Retain the existing temporary supporter-access developer cheat.
- Retain Unlock All Pirates.
- Ensure neither creates a real purchase record or persists as genuine ownership.

## 7. UI and error handling

Use existing visual styles and supporter messaging.

Provide understandable feedback for:

- Purchase available.
- Purchase pending.
- Purchase completed.
- Already owned.
- Purchase cancelled.
- Purchase unavailable.
- Restore successful.
- No purchase found.
- Billing service temporarily unavailable.

Avoid misleading success messages or duplicate purchase prompts.

Keep purchase and restore controls usable in portrait and landscape layouts.

## 8. Save compatibility

Preserve:

- Existing story progress.
- Trophies and cosmetics.
- Settings and orientation preferences.
- Statistics and achievements.
- Portable save import/export compatibility.

Do not reset or destructively migrate saves.

Imported saves must not grant paid supporter ownership.

## 9. Automated testing

Add focused tests for:

- Successful purchase and entitlement grant.
- Pending purchases.
- Cancellation and failure.
- Already-owned purchases.
- Restore after reinstall.
- Revocation/refund handling.
- Duplicate purchase and restore requests.
- Billing service unavailable.
- Development-cheat isolation.
- Web/Android separation.
- Existing save compatibility.
- Supporter gating across Chapters 1–4.

Run the existing whole-game regression suite afterward.

Do not modify approved AI, physics, Theatre dialogue, artwork, cosmetics or trophies.

## 10. Delivery

Provide:

1. Read-only audit findings.
2. Summary of implementation changes.
3. Exact billing integration and dependency versions.
4. Any Play Console configuration still required.
5. Automated test results.
6. Remaining security limitations and manual test requirements.
7. Updated game version/build.
8. Branch and commit.
9. Fresh version/build-labelled source ZIP.
10. Android testing/build instructions where applicable.

If external configuration is missing, implement and test everything possible locally, then identify the genuine blocker.

**Do not merge, deploy, publish, activate production billing or make Play Console changes.**

Do not perform real transactions.

Stop only when external credentials, account configuration or consequential approval is genuinely required.
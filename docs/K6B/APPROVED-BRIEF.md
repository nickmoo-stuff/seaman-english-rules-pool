# Seamen English Rules Pool — K6B: Android Billing Patch & Device QA

## Baseline

Use the completed K6A candidate:

- Version: 0.17.60
- Build: 1590
- Branch: `stage6-k6a-google-play-billing`
- Google Play product ID: `seamen_pool_supporter`
- Purchase option: `supporter-buy`
- K6A automated regression: 49 PASS / 0 FAIL / 1 NOT TESTED
- K5B desktop regression: 13/13 PASS

## Objective

Prepare the K6A billing integration for testing on my existing Pixel 8 Pro, using my **already-established Windows Android deployment workflow**.

I have successfully built, installed and tested numerous previous versions of Seamen Pool using my existing Capacitor/Android Studio environment and deployment scripts.

**Do not recreate, reinstall or reconfigure anything that already works.**

This milestone should be a minimal extension of the existing process, not a new Android setup exercise.

## 1. Preserve existing Android workflow

My existing deployment process already handles:

- Copying updated `www` files into the Android project.
- Capacitor sync.
- Android version/build configuration.
- APK generation.
- Installation onto my Pixel 8 Pro.

Do not replace these scripts or create a competing deployment system.

Do not provide introductory Android Studio, SDK, Java, ADB or Capacitor installation instructions.

Do not assume that the Android wrapper is contained in the GitHub repository. It exists separately on my Windows PC.

## 2. Integrate K6A native billing patch

The only new integration requirement is the K6A native Google Play Billing patch.

Inspect the existing K6A installer and its documentation.

Provide:

1. The exact PowerShell command(s) needed to apply the native patch to my existing Android project.
2. Any required working directory or path substitutions.
3. A safe preflight check for compatibility with the existing wrapper.
4. A clear indication of whether the patch must be applied before or after my normal Capacitor sync.
5. Confirmation that applying the patch once is sufficient and that subsequent ordinary builds do not require reinstalling it.
6. Any warnings about native files potentially being overwritten by Capacitor sync.

Prefer a single, straightforward copy-and-paste command where practical.

The installer must preserve my existing Android configuration, signing, application ID and unrelated native customisations.

If the wrapper contains unexpected files or incompatible versions, stop with a clear error rather than overwriting them.

## 3. Billing safety

Keep all Google Play purchases disabled for this milestone.

Verify that:

- Production billing remains OFF.
- Debug purchase flows remain OFF.
- No real-money purchase can be initiated.
- No test purchase sheet opens.
- Existing developer supporter-access shortcuts remain separate from genuine purchase ownership.
- Imported saves cannot grant paid ownership.
- Free Chapters 0–3 remain accessible.

Do not enable billing simply to test whether the UI works.

Actual Google Play licence-test transactions belong to a later, separately approved milestone.

## 4. Minimal build verification

Check only the genuinely new or potentially affected Android integration points:

- Google Play Billing 9.1.0 compatibility.
- Existing Capacitor 8.5.2 compatibility.
- Correct native billing bridge registration.
- Required billing manifest entries.
- Correct versionName 0.17.60 and versionCode 1590.
- No duplicate/conflicting billing code.
- Existing Android signing and application ID remain unchanged.

Use existing scripts and build mechanisms wherever possible.

Do not duplicate previously completed setup work.

## 5. Pixel 8 Pro QA checklist

Prepare a concise numbered manual checklist covering:

1. APK installs as an update without clearing existing data.
2. Version/build correctly displays 0.17.60/1590.
3. Existing save progress, trophies, cosmetics and settings remain intact.
4. Normal free gameplay and Cue Helm spin work.
5. Portrait and landscape controls work.
6. Theatre animations, music and effects work.
7. Supporter screen and Restore Purchases feedback are readable.
8. No purchase sheet opens while billing is disabled.
9. Developer supporter access does not masquerade as genuine ownership.
10. Offline play and save persistence work.

Avoid repeating the full K5 desktop regression or replaying every opponent.

## 6. Delivery

Provide:

- A short summary of any integration findings.
- Exact PowerShell patch command(s) for my existing project.
- Any genuinely necessary modifications to the existing workflow.
- A concise Android QA checklist.
- Any blockers that require my action.

Only create additional scripts or files if they are genuinely needed for this integration.

**Do not create a new Android project, replace my deployment system or repeat basic environment setup.**

Do not merge, deploy, upload to Google Play, publish, activate billing or perform transactions.

Preserve all approved game content and the existing K6A implementation.

The objective is simple: **apply the new billing patch, use our normal Android build process, and test on the Pixel 8 Pro.**
# K4 source candidate — 0.17.59/build 1589

This is development source, not an APK/AAB or a deployment. The full game is in `www`. The existing Capacitor 8.5.2 wrapper, signing configuration and K3H.1 billing bridge are unchanged. Purchases stay disabled.

K4B adds the optional Spinball Wizard supporter encounter; see [K4B QA and checklist](K4B-QA.md).

## Browser testing

1. Extract the source candidate ZIP into a new folder. Keep your installed game and original saves; use a separate browser profile and import a copy of a completed Chapter 3 save for K4 QA.
2. For your established desktop workflow, open `www/index.html` directly in Chrome. Check the displayed version is 0.17.59/build 1589. File-origin saves can depend on the file location/browser policy; import your existing exported save if the new extraction does not contain your Chapter 3 progress. The developer-panel grant works in memory and requires no web server or storage write.
3. As an alternative, in PowerShell in the extracted folder, run `py -m http.server 8000 --directory .\www`. Open `http://localhost:8000/`. On a phone on the same network, open the same server using your PC's LAN address.
4. In this **web development build only**, the existing Supporter information screen's promo-code field accepts `SUPPORTER-DEV`. For temporary developer-panel access, open title-screen Settings and press K, then use **DEV: Grant supporter entitlement**. Feedback beside the buttons states whether Chapter 4 is available or still needs Chapter 3 completion. **DEV: Revoke supporter entitlement** locks test access while retaining story progress. The panel grant expires on reload; the existing promo-code/persistent developer API keeps its previous behaviour. It is explicitly a developer test pass, not a verified purchase. Chapter 3 completion is still required. `SUPPORTER-OFF` revokes that test access without clearing progress.
5. Test the short artwork checklist in K4A.2-ARTWORK-QA.md; the K4A.2-QA.md gameplay checklist is retained. Real Google Play verification remains separate. Source development flags/promo codes cannot grant native ownership and are ignored by release builds.

## Unlock every available opponent for web QA

In title-screen Settings press K, then select **DEV: Unlock all pirates** (or press J outside a text field/control). This unlocks all shipped playable opponents across the catalogue for the current tab, including later chapters and supporter opponents, without marking anyone defeated or previously selected. Unseen introductions still run. Real previously watched/earned progress remains intact. Unavailable prototypes/Spinball Wizard and the Chapter 5 placeholder stay locked.

This bypass does not require a developer supporter grant or completed earlier chapters. It does not establish Google Play ownership or grant cosmetics/rewards. Reload ends the bypass. Release/native builds reject it. See UNLOCK-ALL-QA.md for performed checks.

## Existing Android wrapper

If preparing a local device test, back up `C:\Users\Nick\Documents\SeamenPoolAndroid` and export your save first. Copy the complete `www` contents into that wrapper's `www`, then run the established `SYNC-SEAMEN-TO-ANDROID.bat`. Keep the same application ID, WebView origin and signing configuration. No new native billing patch is required; do not run an older milestone's version-specific installer.

The wrapper is external and has not been edited here. Its `android/app/build.gradle` version metadata must match `versionName "0.17.59"` / `versionCode 1589` for a matching local candidate. The proposed code's availability in Play Console has not been checked. Do not upload, activate purchases or publish this candidate.

Native Chapter 4 requires Chapter 3 completion and an active Google Play ownership session from the existing bridge. With no such session it correctly stays locked, even if web-development access or an imported ownership flag is present. This limits native K4 gameplay QA until legitimate ownership testing is available; no native bypass has been added. Browser touch QA can use the existing development pass.

For an eventual separately authorised public package, use release build mode and repeat the release/native checks. The committed automated suite uses a temporary release projection to verify that developer grants do not bypass native entitlement safeguards. No Android SDK build, signing, installation or real purchase has been performed by this task.

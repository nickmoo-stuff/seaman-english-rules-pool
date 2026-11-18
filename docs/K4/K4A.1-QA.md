# K4A.1 — Developer supporter access correction

Source candidate: **0.17.54/build 1584**. Baseline: K4 `3137e5602f1dae43c4926117cc98a882d679c088`, 0.17.53/build 1583. Development branch unchanged: `stage4-k4-five-circles-of-hell`. No deployment, release publication, Android build or native billing modification.

## Investigation

The old developer buttons called the persistent test-entitlement setter and wrote their action result only into the gameplay HUD message. That HUD can be above/outside the developer-panel viewport. Their status did not explain whether Chapter 3 completion was the reason Chapter 4 stayed locked, or distinguish a temporary test grant from Google Play ownership.

An HTTP Chrome fixture with Chapter 3 complete confirmed the original button could grant access. That observation does not reproduce or establish the cause of the reported Windows `file://` access failure. The managed Chromium here refuses direct file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; installing an isolated Playwright browser was also unavailable (download domain denied). No managed browser policy was changed. Actual Windows Chrome direct-file verification remains **N/T**.

## Correction

- Developer-panel grant/revoke now uses an in-memory, current-tab override. Grant requires no local-storage operation, HTTP connection, fetch or native billing reply. The original persistent developer setter/promo codes remain supported and clear any panel override when explicitly used.
- A permanent status area immediately below the buttons reports granted, revoked or rejected. Minimal nearest scrolling reveals feedback within the panel viewport. Grant explicitly says whether Chapter 4 is available or Chapter 3 remains incomplete.
- Chapter 4 still requires Chapter 3 completion. No campaign win, chapter completion, trophy or cosmetic is fabricated by granting access. Existing progress and equipped selections remain intact.
- Revoke also tries to clear an older stored developer grant. Storage denial cannot prevent the current-tab revocation. The new panel grant disappears on reload; existing story saves persist normally.
- Development mode and non-native runtime guards surround the override. Release/native code rejects requests and ignores even injected local/session flags. Verified Google Play ownership continues to use the existing service; this override never creates a verified purchase or enables payment.
- Direct-file loading skips unsupported service-worker registration. HTTP(S) registration remains available. File-origin native detection and entitlement guards are covered by unit cases; these are distinct from an actual file-navigation browser pass.

## Focused verification

Evidence: `qa/K4A.1/`.

- `tests/k4a1-dev-supporter.cjs`: actual Settings → K → developer-button clicks, storage available/denied × Chapter 3 incomplete/complete, viewport feedback, immediate real Theatre entry, grant/revoke and career preservation, tab-only reload, existing persistent developer API, release/native rejection and injected-flag rejection, file-protocol resolver/native detector/service-worker unit cases.
- `tests/k4.cjs`: authoritative dialogue/assets, real-engine K4 victories, progression/rewards/replay persistence and effects.
- `tests/campaign-regression.cjs`: existing saves, Pool School and representative Chapters 1–3 engine shots.
- `tests/k4-entitlement.cjs`: release/native ownership states, local flags ignored, expiry/requery and revoked ownership.
- `tests/k4-consistency.py`: current version/build, all JavaScript syntax, deterministic dialogue build, approved assets/cache inventory, unchanged schema and native billing sources.
- Real Windows Chrome `file://` navigation: **N/T — environment browser policy blocks it**. File-storage-denial browser scenarios and protocol unit cases are tested separately. Physical Android/iOS and Google Play transactions were not tested or activated.

## Desktop QA

1. Extract the fresh GitHub source ZIP and double-click `www/index.html` in desktop Chrome. Confirm 0.17.54/build 1584; retain/import a copy of your completed Chapter 3 save.
2. Open Settings from the title screen and press K. Click **DEV: Grant supporter entitlement**. Read the feedback immediately below the controls. With Chapter 3 complete, it must say Chapter 4 is available; enter the roster and open the first available K4 opponent.
3. Return to the developer panel and revoke access. Confirm readable feedback, Chapter 4 locking and unchanged story progress/trophies/selections. Grant again and confirm access returns.
4. Reload: the new panel-only grant should expire while story progress remains. An explicitly retained older promo/API development grant may still apply. Repeat the grant on this tab; no reset is needed.
5. Check other developer controls you normally use. Release/native builds must not accept this web developer override; purchase controls remain disabled.

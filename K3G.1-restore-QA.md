# K3G.1 consolidated web corrections — 0.17.50/build 1580

Web-only corrections on `stage3g-k3g1-supporter-foundation`, following wording
commit `d5c8e60`. The current Android bridge, permission/dependency, gameplay,
version/build and save formats are unchanged. No Android patch is generated.

## Investigation and fix

The original restore handler did call the central service and existing Capacitor
plugin. The native plugin correctly returns `verification_unavailable` with
`server_verification_required` for a purchased record when the backend is absent.
The web renderer discarded that distinction and showed only a generic status in
a paragraph **above** the price/actions, away from the tapped control.

A controlled reproduction of `d5c8e60` at 855×384 measured the modal scroll position
changing **548 → 528 pixels** when the status changed from two lines to one. Its
height changed 40.59 → 20.30 pixels. This reproduces the reported one-line movement;
it is browser evidence, not a capture from Nick's physical device.

The service also accepted an ownership response before its awaited price lookup
finished. The old UI re-enabled restore based on status alone, and the service
could queue another request while that operation remained in flight. A native
adapter throwing synchronously could additionally strand the assigned promise.

Corrections:

- Move the existing live status region immediately below restore, or beside it on
  short landscape screens. Reserve its space, retain a static button caption and
  reserve price space; text changes do not move the control or scroll container.
- Show **Checking ownership...** during the ownership request. Keep the final
  result present; no toast timeout, automatic scrolling or hidden result node.
- Explicitly explain the missing trusted backend when native capabilities or the
  native reason indicate it: ownership cannot currently be verified and paid
  content remains locked. Distinguish no purchase found and pending records.
- Expose volatile busy/capability state for the UI; disable restore through the
  in-flight operation and coalesce repeats even after the ownership reply arrives.
  Only invalidated tickets queue a fresh check. Return the completed state after
  busy clears, and recover correctly from synchronous native exceptions.
- Restore does not fetch/rewrite the price. Late/invalidation-fenced responses
  cannot grant ownership, including future-contract purchase recheck callbacks.
- Include the already committed wording correction: future supporter chapters
  start with Chapter 4 and continue beyond, with no fixed upper chapter range.
  The two requested paragraphs and “Planned for future releases” heading remain.

## Performed verification

- `tests/supporter-restore.cjs`: **20 browser cases** over 390×844, Pixel 8 Pro-sized
  855×384, 740×360, 1366×768 and 320×568. Uses the real Capacitor 8 global interface
  shape and exact native response fields through controlled fixtures. Covers
  backend unavailable, not owned, pending, rejected request, accelerated timeout
  and an unverified owner-shaped response. Confirms visible checking/persistent
  result, all text fitting its reserved area, unchanged button/result geometry
  and scroll offsets, duplicate coalescing, no price refresh, unchanged saves,
  disabled purchases, no paid grant and corrected chapter wording.
- `tests/supporter-service.cjs`: existing purchase/restore mock contract, expiry,
  pending/cancelled/error handling and security cases still pass. Added checks
  for coalescing during an unfinished price lookup, accurate busy/result lifetime,
  ownership-only restore, synchronous exception recovery and late recheck fencing.
  These mocks are not Google Play verification or real purchase tests.
- Passed existing `supporter-ui`, `story-reminder-layout`, `campaign-regression`
  in **portrait and landscape**, `pool-school` and `spin-offline` suites.
- JavaScript/Python syntax, patch formatting, player-facing range scan, unchanged
  native/physics/layout/Theatre source checks and package read-back/checksums are
  completed before delivery.

Screenshots in `qa/k3g1-restore/` show controlled native-response/price fixtures,
not physical-device or real Play purchase verification. Timeout tests accelerate
the web deadline; production deadlines are unchanged. Actual Pixel/WebView
hardware, TalkBack/font scaling and Play account/network behaviour remain local
Android QA. The native implementation was inspected but not rebuilt or modified.

## One consolidated package

Generate **only** the web correction archive:

```sh
python tools/package-k3g1.py --web-only --out /path/to/output
```

`SeamenPool-v0.17.50-build1580-web-corrections.zip` includes the complete current
`www` source/assets, both corrections, copy instructions and embedded checksums.
The single archive is provided on GitHub for download (92,340,278 bytes).
SHA-256: `861cf7e3ec60fe67779ffe55ce77db35d67543440d72dea5c03f32ff59fd238d`. Existing native archives
are historical and unchanged; there is no new billing/bridge patch to apply.

## Numbered Android QA

1. Extract the consolidated archive, copy its `www` contents into the existing
   Windows wrapper and run the usual SYNC batch. Gradle Sync/rebuild using the
   current native bridge. Do not install another bridge patch for this update.
2. On Pixel portrait, open Supporter Pack, scroll to restore and tap it. Confirm
   **Checking ownership...**, a disabled control while processing and a readable
   persistent result directly below it, without a one-line jump.
3. Repeat in landscape. The feedback should sit beside the restore button and
   remain readable. Tap repeatedly during a check; it must not start duplicates.
4. With the backend still absent, a purchased/unverified record must explicitly
   say ownership cannot currently be verified, not claim purchase/activation or
   unlock paid content. A successful empty Play query may instead truthfully say
   no matching purchase was found. Recheck offline/failure and returning later.
5. Confirm the opening/planned paragraphs describe Chapter 4 and beyond, with no
   fixed future range. Check saves, selected cosmetics and normal gameplay remain
   intact. Purchases remain disabled; do not activate products, make payments,
   upload a Play release or change Console settings for this QA.

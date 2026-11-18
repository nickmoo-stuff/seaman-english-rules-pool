> Historical contract: superseded for the initial release by [K3H.1 device-only billing](../K3H.1/README.md). A backend is a future upgrade, not a requirement of the current approved model.

# Trusted verification contract — required future implementation

**Status: specification only. No backend/domain exists and no endpoint is called
by this candidate.** Native `purchase()` rejects `PURCHASES_DISABLED`;
`verificationEnabled` and `purchasesEnabled` are literally false. Neither
JavaScript arguments, promo codes nor saved flags can enable the native payment
method. Product lookup and Play-owned-record queries are genuine native calls.

## Required authority and deployment

- Operate a trusted HTTPS service with Google Play Developer API access to the
  existing app. Keep its service-account credentials/ADC, signing keys and tokens
  in server-managed secret storage. Never put them in Android, `www`, this ZIP,
  localStorage, logs or portable game saves.
- Establish the app's actual package ID, authorised signing certificate(s),
  release/version policy and Play Integrity verification. Do not assume an
  uploaded web source package proves the Android identity.
- Decide and implement the authenticated account/installation and token-binding
  policy. Google Play does not expose a Google-account identity to the game just
  because `queryPurchasesAsync` succeeded. Do not invent a client Google-account
  ID. A stable authenticated app account with obfuscated account IDs is one
  option; accountless restoration needs a reviewed attestation/token-binding
  design. This decision and its cross-device recovery tests remain blockers.
- Verify Play Integrity server-side with a fresh request hash covering the
  challenge, app identity, product and token fingerprint. Enforce allowed app
  identity and required licensing/integrity verdicts. Bind requests to their
  authenticated session, nonce, expiry and anti-replay record; rate-limit them.
  Integrity is additional app/request evidence, never proof of a purchase.

## Native-to-backend request (not a web API in this build)

After connecting to Google Play, native code must query current `INAPP` purchases
and select records containing **`seamen_pool_supporter`**. Pending purchases do not
grant access and are not acknowledged. Future payment launch must select a Buy
offer for purchase option **`supporter-buy`** using Google's current ProductDetails
and offer token, not a hardcoded amount or stale locally cached offer.

The future native integration obtains a short-lived authenticated challenge and
posts the following over HTTPS to the service's fixed release-configured origin:

```json
{
  "protocolVersion": 1,
  "challengeId": "server-issued single-use challenge",
  "requestId": "unique request identifier",
  "packageName": "actual signed Android application ID",
  "productId": "seamen_pool_supporter",
  "purchaseOptionId": "supporter-buy",
  "purchaseToken": "opaque token from the current Google Play record",
  "integrityToken": "fresh Play Integrity token bound to this request"
}
```

Authentication is a server-defined authenticated session, not a client-provided
`owned` boolean, Google-account string or unauthenticated token-lookup endpoint.
The token stays native/server-side; it is never sent to the web layer. Match
challenge/session/request/expiry before consulting Play and never log raw tokens.

## Server verification and acknowledgement transaction

1. Query Google Play Developer API for this package and purchase token (current
   one-time product purchase v2 API, with documented fallback only if needed).
   Verify the actual returned product line item, completed purchase state,
   quantity/non-consumable policy, Buy purchase option where supplied, allowed
   test/production environment and account-binding evidence. A client signature,
   `isAcknowledged`, order ID or formatted price alone is not entitlement proof.
2. `PENDING` means pending, never owned. Missing, invalid, cancelled, refunded,
   revoked or consumed records cannot grant active ownership. Distinguish
   definitive invalid/revoked results from transient Google/server outages.
3. After successful verification, acknowledge the non-consumable with the
   appropriate Developer API acknowledgement endpoint. **Never consume it.**
   Treat an already acknowledged purchase idempotently. Acknowledge within
   Google's three-day period from transition to PURCHASED, not from the initial
   pending transaction; use durable jobs/retries and operational alerts so a
   crashed device cannot cause the deadline to be missed.
4. Re-read or otherwise authoritatively establish acknowledgement success before
   issuing an active entitlement. On acknowledgement timeout/uncertain outcome,
   return verification unavailable and retry idempotently; do not grant first
   and hope acknowledgement eventually succeeds.
5. Maintain the verified purchase ledger and refund/revocation state, with RTDN
   handling, notification authenticity checks and periodic reconciliation as
   appropriate. Permanent purchase ownership belongs in this server ledger,
   not a web boolean. Do not mark campaign opponents beaten or grant unearned
   cosmetic rewards as a side effect.
6. Issue a short-lived signed response, bound to request/session/product/app,
   with an allowlisted algorithm/key ID, issuance time and expiry at most five
   minutes away. Native code must validate its signature using provisioned public
   verification keys, matching nonce/audience/package/product and expiry before
   exposing the normalised session below. HTTPS alone does not replace the
   future identity, replay and response-validation design.

## Normalised native-to-web session, protocol 1

The **future completed** native verifier may expose:

```json
{
  "status": "verified_owner",
  "source": "google_play_backend",
  "productId": "seamen_pool_supporter",
  "purchaseState": "PURCHASED",
  "acknowledgementState": "ACKNOWLEDGED",
  "expiresAt": 1800000000000
}
```

The number above is an illustrative epoch timestamp, not a real receipt. Native
code is responsible for verifying the server response before returning this
shape. The web adapter checks shape, product, acknowledgement and short expiry;
it is a UI/content-gating adapter, **not** a cryptographic receipt verifier.
Client-side code can always be modified and is not claimed production-grade
purchase security. Current native code has no `verified_owner` return path.

Other native results use `source: "google_play"`, the same product ID and:

- `not_owned`: a successful current-account Play query with no matching record;
- `pending`: a matching PENDING record, no purchased record to verify;
- `verification_unavailable`: query failure, offline, unsupported service,
  unverified PURCHASED record, invalid receipt or missing verification service.

The UI additionally has `checking` while a check/restore is in flight. On resume,
purchase updates, restored networking or explicit restore, query again. Offline
or failed verification must not claim confirmed ownership/non-ownership, erase
progress or overwrite saved cosmetic choices. Unknown choices may render a
temporary free fallback without granting an unverified cosmetic. No paid session
is loaded from localStorage/imported saves. After reinstall or device change,
restore by querying the same active Play account and verifying its records.

## Gate before any live purchase UI

The native payment implementation, server, identity policy, signed response
verification, acknowledgement/retry system, revocation handling and tests must
exist first. Then test on a **Play-installed** signed build with an authorised
licence tester, including pending instruments, cancellation, already-owned,
network loss during verification/ack, process death/resume, reinstall, another
device on the same account, refund/revocation, replay and a different account.
Draft product status and the pending review/track availability are separate
Console prerequisites. Do not activate the product or make real-money purchases
as part of this milestone. Enabling the native gate requires a later reviewed
code change, not a web settings/local flag switch.

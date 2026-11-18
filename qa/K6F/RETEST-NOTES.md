# K6F retest record

The complete 60-suite run reported 57 PASS / 2 FAIL / 1 NOT TESTED. Both failures were offline tests opening a hardcoded cache name ending in alpha1 after the candidate cache metadata removed that retired development suffix. The worker's caching implementation was unchanged. The tests now use the actual version/build cache identifier without that suffix; they successfully verify cached assets and exercise real offline gameplay controls/reload.

Seven final affected checks passed: promotion, visual behaviour, preservation, both offline tests, metadata consistency and native release gating. Promotion coverage also runs the actual complete promoted web tree in Chromium, verifying v1.0.0/build1594, displayed versions, release safeguards, save metadata/persistence and offline public cache/reload. The source repository and actual external wrapper remain unpromoted. Final totals are 59 PASS / 0 FAIL / 1 NOT TESTED, preserving initial results/logs for audit.

The one NOT TESTED automated suite is file:// blocked by managed Chromium policy. Physical Windows/Android/signing/AAB and Play Console/production transactions were not available and are separately listed as external NOT TESTED areas, not silently counted as PASS. Native positive purchase paths and policy opt-ins use fixtures, not real Google Play transactions.

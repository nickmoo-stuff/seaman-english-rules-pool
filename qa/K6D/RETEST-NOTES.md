# Retest history

The complete 52-suite run initially reported 50 PASS / 1 FAIL / 1 NOT TESTED.
The music test helper stopped at a legitimate internal Theatre transition instead of waiting for the scene to finish. The helper was corrected without changing scene timing. Its expanded intro/match/victory/rematch checks then passed.

A subsequent parallel focused run passed eight checks and timed out in campaign-regression at the existing real-time Lesson 2 yellow-pot wait (15 seconds). The same campaign check passed in the full run and on an isolated rerun; no gameplay/physics changes were made to address this test timing issue. Final affected checks use QA_WORKERS=1 to reduce browser contention. Initial results remain available for audit. Final results combine the full suite with the final serial checks.

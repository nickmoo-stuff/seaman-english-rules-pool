# Catalogue-wide developer unlock — 0.17.57/build 1587

Baseline: `95f1a0758c102eb8ed269c0fdf2f3a1a755c3fb4` (0.17.56/build 1586). Branch: `stage4-k4-five-circles-of-hell`. Source update only; no deployment, Android build, release publication or purchase activation.

## Behaviour

- **DEV: Unlock all pirates** and **J** share one action. It uses the opponent/chapter catalogue rather than a Chapter 1 level cap. All 26 current playable opponents across Chapters 1–4 become available, including supporter opponents, and later shipped catalogue entries are picked up automatically.
- The bypass lives only in the current tab, guarded by development build mode and non-native runtime. Reload ends it. It changes no persistent chapter/legacy-level unlock, selection/history, defeat record, completion, achievement, cosmetic or entitlement flag. Real existing progress is retained.
- First-time introductions are not marked watched by unlocking. Actual selections follow their existing story paths and record seen flags only when the corresponding sequence is actually completed. Selecting the Chapter 2 boss directly in QA now plays its still-unseen chapter intro and boss reveal before the match introduction. Future chapters with no intro scene can use their regular opponent introduction without a recursive missing-scene loop.
- Chapter 2's full roster is visible during this bypass without pretending its intro was already watched. Feedback beside the button reports the current catalogue count and session-only behaviour.
- This is an opponent-access override, separate from supporter ownership. It does not label the Supporter Pack purchased or grant supporter cosmetics. K4 runtime ownership handling consults actual opponent access so a background ownership update cannot incorrectly suspend a valid web developer test frame. Normal release/native ownership checks remain authoritative.
- `playable:false`, hidden, developer/test-only, post-release/foundation entries, missing chapters and missing numerical AI levels are excluded. Spinball Wizard's unavailable match and the non-playable Chapter 5 placeholder remain unavailable. Existing unrelated developer shortcuts retain their handlers.

## Automated checks

Evidence: `qa/unlock-all/`.

1. `tests/unlock-all-pirates.cjs`: real Settings → K → panel click; all 26 available IDs; no career/save/ownership/cosmetic changes; placeholder exclusion; first-time Chapter 2 intro/boss reveal, Chapter 3 arrival/challenge, supporter introductions and Lucy intro; an actual K4 strike with only opponent access; reload and J; injected future playable/prototype catalogue fixtures; release/native rejection even with a forged session flag. Presentation delays are fast-forwarded in these sequencing fixtures; no intro-seen flags are pre-set.
2. `tests/campaign-regression.cjs`: existing campaign/save/Pool School preservation and representative Chapters 1–3 engine shots.
3. `tests/k4.cjs`: dialogue/art integrity, all ten Theatre handoffs, real engine fixture wins, rewards, progression/persistence and effects.
4. `tests/k4-entitlement.cjs`: release/native ownership states, ignored editable flags, expiry/requery and revoked access; native replies are fixtures.
5. `tests/k4-consistency.py`: syntax, current version/build/cache references, approved asset hashes, generated catalogue consistency and unchanged native billing/save schema.

Browser automation uses Chromium over HTTP. Actual Windows Chrome `file://` navigation remains blocked by this environment; physical Android/iOS and real Google Play transactions were not performed. There is no network or storage dependency in the unlock action itself.

## Desktop QA

1. Open `www/index.html`, confirm 0.17.57/build 1587, then Settings → K → **DEV: Unlock all pirates**. Read the confirmation. Chapter 2–4 opponents should be accessible without earning earlier wins.
2. Select opponents you have never played. Check their initial sequences run; the unlock must not mark them defeated or watched. Existing real wins/seen sequences must remain intact. Check Spinball Wizard/Chapter 5 remain unavailable.
3. Reload: the session bypass ends while genuine progress remains. Press J outside text/button focus to enable the same catalogue-wide action again. The developer supporter grant remains a separate control; no verified purchase should be claimed.

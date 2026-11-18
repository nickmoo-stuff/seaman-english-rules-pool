# seamen-pool-development
Seamen English Rules Pool — development and QA

Current **K6G corrected pre-release: v1.0.0/build 1595** (Play code availability unverified), branch `stage6-k6g-player-name-persistence`.
See [root cause, focused tests and minimal installation/QA](docs/K6G/REPORT.md).
Story names save in the existing career record; main-menu Settings reuses the naming interface. Gameplay and native billing are unchanged. No new native patch or K6F promotion is needed; retain the existing approved local native policy.

See [approved whole-game baseline regression](docs/K5A/REPORT.md),
[K4B Spinball Wizard QA](docs/K4/K4B-QA.md),
[K4A.4 presentation and artwork QA](docs/K4/K4A4-QA.md),
[catalogue-wide developer unlock](docs/K4/UNLOCK-ALL-QA.md),
[approved artwork refresh](docs/K4/K4A.2-ARTWORK-QA.md),
[K4A.2 desktop QA corrections](docs/K4/K4A.2-QA.md),
[K4 implementation and remaining limitations](docs/K4/RELEASE-READINESS.md),
[Windows/browser QA](docs/K4/WINDOWS-QA.md) and [changelog](docs/K4/CHANGELOG.md).
Native purchases remain disabled; no deployment or Android publication.

Previous approved **K3I.1 Alpha candidate: 0.17.52/build 1582**, purchases disabled.
Use the [single full release ZIP](downloads/SeamenPool-v0.17.52-build1582-Alpha.zip),
not a generic source-branch ZIP. See the [Windows installation guide](release/K3I.1/WINDOWS-INSTALL.md)
and [release-readiness evidence/remaining checks](release/K3I.1/K3I.1-RELEASE-READINESS.md).
Lesson 3 hotfix from approved `2318acc`; the previous Alpha passed Pixel 8 Pro QA.
Play availability of 1582 and the new external Android build remain unconfirmed.

K3G.1 prepares a **disabled** supporter purchase foundation, proposed source
candidate 0.17.50/build 1580. See the [QA/security report](K3G.1-QA.md) and
[separate Capacitor 8.5.2 bridge patch](native-patches/K3G.1/README.md).

The Android wrapper is maintained separately on Windows. The
[K3F.1 billing foundation patch](native-patches/K3F.1/README.md) applies to that
existing Capacitor 8.5.2 project; it does not replace the wrapper or advance the
approved web game's version. See the [verification report](K3F.1-QA.md).

The [consolidated K3G.1 web corrections](K3G.1-restore-QA.md) include ongoing
supporter chapter wording and persistent restore/check feedback, at the same
0.17.50/build 1580 with the existing native bridge unchanged.

The [K3H.1 device billing review integration](native-patches/K3H.1/README.md)
uses on-device Google Play ownership checks with explicit client-side security
limitations. Payments remain disabled. It supplies a small guarded native patch
and three-file web overlay on approved 0.17.50/build 1580; no full web archive
or Android release is regenerated. See [verification evidence](K3H.1-QA.md).

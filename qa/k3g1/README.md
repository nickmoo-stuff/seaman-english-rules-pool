# K3G.1 — controlled UI fixtures

These browser captures use a mocked future verification response and a mocked
regional price. **No Google Play purchase, real ownership verification or backend
acknowledgement is represented.** The actual native bridge cannot return an owner
or launch payment until the trusted backend and later implementation exist.

- [Mock verified-owner menu on phone](mock-owner-phone.png)
- [Supporter information with mock Google price on phone](mock-information-phone.png)
- [Supporter information on short landscape phone](mock-information-landscape.png)

The screen scrolls within the existing modal. The purchase button is disabled;
restore is available only with the native bridge. See the
[QA report](../../K3G.1-QA.md) for test boundaries and blockers.

package com.seamenpool.billing;

/** Local licence-test gate, never a production activation or ownership authority.
 * OFF in the supplied patch. A reviewed native edit can enable debug-only tests;
 * release/non-debuggable apps always reject, even if requested is changed to true.
 * No JavaScript, storage, imported save or remote-config flag controls this gate.
 */
final class PurchaseTestPolicy {
    private static final boolean TEST_PURCHASES_ENABLED=false;
    static boolean enabled(boolean debuggable) { return allows(debuggable,TEST_PURCHASES_ENABLED); }
    static boolean allows(boolean debuggable,boolean requested) { return debuggable&&requested; }
}

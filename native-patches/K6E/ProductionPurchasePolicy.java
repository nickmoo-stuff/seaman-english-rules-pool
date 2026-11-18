package com.seamenpool.billing;

/** Independent, native build-time production permission. OFF in every supplied candidate.
 * Debug opt-in never grants this permission. No web/save/remote-config switch.
 */
final class ProductionPurchasePolicy {
    private static final boolean PRODUCTION_PURCHASES_ENABLED=false;
    static boolean enabled(boolean debuggable) { return allows(debuggable,PRODUCTION_PURCHASES_ENABLED); }
    static boolean allows(boolean debuggable,boolean approved) { return !debuggable&&approved; }
}

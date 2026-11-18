package com.seamenpool.billing;

import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** K3G.1: real Play queries, NO payment launch, consumption or ownership grant.
 * Server verification/acknowledgement is deliberately not configured.
 */
@CapacitorPlugin(name = "SeamenBilling")
public class SeamenBillingPlugin extends Plugin {
    private static final String PRODUCT = "seamen_pool_supporter";
    private static final String OPTION = "supporter-buy";
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Work> waiting = new ArrayList<>();
    private final List<Work> active = new ArrayList<>();
    private BillingClient billing;
    private boolean connecting;
    private int connectionGeneration;

    private JSObject status(String value, String reason) {
        return new JSObject().put("status", value).put("reason", reason)
            .put("source", "google_play").put("productId", PRODUCT);
    }
    private class Work {
        final PluginCall call;
        final Runnable query;
        final AtomicBoolean done = new AtomicBoolean(false);
        final Runnable timeout;
        Work(PluginCall call, Runnable query) {
            this.call = call; this.query = query;
            active.add(this);
            timeout = () -> finish(status("verification_unavailable", "billing_timeout"));
            main.postDelayed(timeout, 12000);
        }
        void finish(JSObject result) {
            if (done.compareAndSet(false, true)) {
                main.removeCallbacks(timeout); waiting.remove(this); active.remove(this); call.resolve(result);
            }
        }
    }
    @Override public void load() {
        connectionGeneration++;
        billing = BillingClient.newBuilder(getContext())
            .setListener((result, purchases) -> main.post(() -> notifyListeners("purchaseUpdated",
                new JSObject().put("reason", "recheck_required"))))
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }
    private void connect(Work work) {
        if (billing == null) { work.finish(status("verification_unavailable", "bridge_not_ready")); return; }
        if (billing.isReady()) { work.query.run(); return; }
        waiting.add(work);
        if (connecting) return;
        connecting = true;
        final int generation = ++connectionGeneration;
        main.postDelayed(() -> {
            if (generation != connectionGeneration || !connecting) return;
            connecting = false;
            for (Work item : new ArrayList<>(waiting)) item.finish(status("verification_unavailable", "connection_timeout"));
            if (billing != null) billing.endConnection();
            load(); // Fresh client for a later explicit check; old callbacks are fenced.
        }, 10000);
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                main.post(() -> {
                    if (generation != connectionGeneration) return;
                    connecting = false;
                    List<Work> queued = new ArrayList<>(waiting); waiting.clear();
                    for (Work item : queued) {
                        if (item.done.get()) continue;
                        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) item.query.run();
                        else item.finish(status("verification_unavailable", "billing_connection_failed"));
                    }
                });
            }
            @Override public void onBillingServiceDisconnected() {
                main.post(() -> {
                    if (generation != connectionGeneration) return;
                    connecting = false;
                    for (Work item : new ArrayList<>(waiting)) item.finish(status("verification_unavailable", "billing_disconnected"));
                    notifyListeners("purchaseUpdated", new JSObject().put("reason", "billing_disconnected"));
                });
            }
        });
    }
    @PluginMethod public void getCapabilities(PluginCall call) {
        call.resolve(new JSObject().put("protocolVersion", 1).put("purchasesEnabled", false)
            .put("verificationEnabled", false).put("productId", PRODUCT));
    }
    @PluginMethod public void purchase(PluginCall call) {
        // No flag or JavaScript argument can enable payments in this candidate.
        call.reject("Purchases require a deployed, tested verification/acknowledgement backend.", "PURCHASES_DISABLED");
    }
    @PluginMethod public void checkOwnership(PluginCall call) {
        main.post(() -> {
            final Work[] holder = new Work[1];
            holder[0] = new Work(call, () -> billing.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (result, purchases) -> main.post(() -> {
                    Work work = holder[0];
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
                        work.finish(status("verification_unavailable", "ownership_query_failed")); return;
                    }
                    boolean pending = false;
                    for (Purchase purchase : purchases) {
                        if (!purchase.getProducts().contains(PRODUCT)) continue;
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) pending = true;
                        else {
                            // A token/acknowledged flag from the client is not trusted ownership.
                            // Do not send tokens to JS, logs or storage. Backend integration is blocked.
                            work.finish(status("verification_unavailable", "server_verification_required")); return;
                        }
                    }
                    work.finish(status(pending ? "pending" : "not_owned", pending ? "payment_pending" : "play_query_complete"));
                })));
            connect(holder[0]);
        });
    }
    @PluginMethod public void getProduct(PluginCall call) {
        main.post(() -> {
            final Work[] holder = new Work[1];
            holder[0] = new Work(call, () -> billing.queryProductDetailsAsync(
                QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(
                    QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT)
                        .setProductType(BillingClient.ProductType.INAPP).build())).build(),
                (result, details) -> main.post(() -> {
                    Work work = holder[0];
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && details != null) {
                        for (ProductDetails item : details.getProductDetailsList()) {
                            if (!PRODUCT.equals(item.getProductId())) continue;
                            List<ProductDetails.OneTimePurchaseOfferDetails> offers = item.getOneTimePurchaseOfferDetailsList();
                            if (offers == null) continue;
                            for (ProductDetails.OneTimePurchaseOfferDetails offer : offers) {
                                if (OPTION.equals(offer.getPurchaseOptionId())) {
                                    work.finish(new JSObject().put("source", "google_play").put("productId", PRODUCT)
                                        .put("purchaseOptionId", OPTION).put("formattedPrice", offer.getFormattedPrice())); return;
                                }
                            }
                        }
                    }
                    work.finish(status("verification_unavailable", "product_unavailable"));
                })));
            connect(holder[0]);
        });
    }
    @Override protected void handleOnResume() {
        notifyListeners("purchaseUpdated", new JSObject().put("reason", "resume_recheck"));
    }
    @Override protected void handleOnDestroy() {
        connectionGeneration++;
        for (Work item : new ArrayList<>(active)) item.finish(status("verification_unavailable", "bridge_destroyed"));
        if (billing != null) billing.endConnection();
        billing = null; connecting = false;
    }
}

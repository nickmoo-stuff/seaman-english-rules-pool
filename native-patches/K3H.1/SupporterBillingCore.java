package com.seamenpool.billing;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Android-independent production state machine; all callbacks run on one executor.
 * Device Play inventory is the selected authority, NOT server-side verification.
 * No stored ownership or persisted token is accepted as an input.
 */
public final class SupporterBillingCore {
    public static final String PRODUCT = "seamen_pool_supporter", OPTION = "supporter-buy";
    public static final int OK = 0, CANCELLED = 1, ALREADY_OWNED = 7;
    public interface Reply<T> { void done(int code, T value); }
    public interface ResultReply { void done(Result result); }
    public interface PurchaseReply { void done(String outcome, Result result); }
    public interface Gateway {
        void query(Reply<List<Receipt>> reply);
        void acknowledge(String token, Reply<Void> reply);
        void offer(Reply<Offer> reply);
        void launch(Offer offer, Reply<Void> reply);
    }
    public static final class Receipt {
        public final String product, packageName, token;
        public final int state; // Google: UNSPECIFIED=0, PURCHASED=1, PENDING=2.
        public final boolean acknowledged;
        public Receipt(String product, String packageName, String token, int state, boolean acknowledged) {
            this.product=product; this.packageName=packageName; this.token=token;
            this.state=state; this.acknowledged=acknowledged;
        }
    }
    public static final class Offer {
        public final String product, option, price;
        public final Object handle; // Native-only SDK ProductDetails/offer reference.
        public Offer(String product, String option, String price, Object handle) {
            this.product=product; this.option=option; this.price=price; this.handle=handle;
        }
    }
    public static final class Result {
        public final String state, reason;
        public final boolean retry;
        public Result(String state, String reason, boolean retry) { this.state=state; this.reason=reason; this.retry=retry; }
    }
    private final Gateway gateway;
    private final String packageName;
    private final List<ResultReply> waiters = new ArrayList<>();
    private final List<PurchaseReply> buyers = new ArrayList<>();
    private final Set<String> attempted = new HashSet<>();
    private boolean checking, buying;
    private long generation;
    public SupporterBillingCore(Gateway gateway, String packageName) { this.gateway=gateway; this.packageName=packageName; }
    public void check(ResultReply reply) {
        waiters.add(reply);
        if (checking) return;
        checking=true; attempted.clear(); final long ticket=++generation;
        query(ticket);
    }
    private void query(long ticket) {
        try { gateway.query((code, receipts) -> inspect(ticket,code,receipts)); }
        catch (RuntimeException ignored) { finish(ticket,new Result("verification_unavailable","play_query_failed",true)); }
    }
    private void inspect(long ticket, int code, List<Receipt> receipts) {
        if (!checking || ticket!=generation) return;
        if (code!=OK || receipts==null) { finish(ticket,new Result("verification_unavailable","play_query_failed",code!=3&&code!=5)); return; }
        boolean pending=false, purchased=false;
        Receipt needsAck=null;
        for (Receipt receipt:receipts) {
            if (!PRODUCT.equals(receipt.product)) continue;
            if (!packageName.equals(receipt.packageName)||receipt.token==null||receipt.token.isEmpty()||receipt.token.length()>8192) {
                finish(ticket,new Result("verification_unavailable","invalid_play_record",false)); return;
            }
            if (receipt.state==2) { pending=true; continue; }
            if (receipt.state!=1) { finish(ticket,new Result("verification_unavailable","invalid_purchase_state",false)); return; }
            purchased=true;
            if (!receipt.acknowledged && needsAck==null) needsAck=receipt;
        }
        if (needsAck!=null) {
            final String token=needsAck.token;
            // A stale Play cache or another actor may still report unacknowledged.
            // Never loop/ack blindly; a later retry must re-query fresh inventory.
            if (attempted.contains(token)||attempted.size()>=5) {
                finish(ticket,new Result("verification_unavailable","acknowledgement_pending",true)); return;
            }
            attempted.add(token);
            try {
                gateway.acknowledge(token,(ackCode,unused)->{
                    if (checking&&ticket==generation) query(ticket); // Re-read even on uncertain/already-acknowledged errors.
                });
            } catch (RuntimeException ignored) { finish(ticket,new Result("verification_unavailable","acknowledgement_failed",true)); }
            return;
        }
        finish(ticket,purchased?new Result("verified_owner","play_purchased_and_acknowledged",false):
            pending?new Result("pending","payment_pending",true):new Result("not_owned","play_query_complete",false));
    }
    private void finish(long ticket, Result result) {
        if (!checking||ticket!=generation) return;
        checking=false; attempted.clear();
        List<ResultReply> callbacks=new ArrayList<>(waiters); waiters.clear();
        for (ResultReply callback:callbacks) callback.done(result);
    }
    /** Implemented and fixture-tested; the public Capacitor payment gate stays OFF. */
    public void purchase(PurchaseReply reply) {
        buyers.add(reply);
        if (buying) return;
        buying=true;
        check(result->{
            if ("verified_owner".equals(result.state)) { bought("already_owned",result); return; }
            if (!"not_owned".equals(result.state)) { bought(result.state,result); return; }
            try { gateway.offer((code,offer)->{
                if (code!=OK||offer==null||!PRODUCT.equals(offer.product)||!OPTION.equals(offer.option)||offer.handle==null) {
                    bought("unavailable",new Result("verification_unavailable","product_unavailable",false)); return;
                }
                try { gateway.launch(offer,(launchCode,unused)->check(checked->{
                    String outcome=launchCode==CANCELLED?"cancelled":launchCode==ALREADY_OWNED?"already_owned":
                        launchCode==OK?("verified_owner".equals(checked.state)?"completed":"pending".equals(checked.state)?"pending":"interrupted"):"failed";
                    // An OK/already-owned notification can precede inventory propagation.
                    // Do not falsely call that a completed purchase or definitive non-owner.
                    Result finalResult=(launchCode==OK||launchCode==ALREADY_OWNED)&&"not_owned".equals(checked.state)?
                        new Result("verification_unavailable","play_inventory_not_ready",true):checked;
                    bought(outcome,finalResult);
                })); } catch (RuntimeException ignored) { bought("failed",new Result("verification_unavailable","launch_failed",true)); }
            }); } catch (RuntimeException ignored) { bought("unavailable",new Result("verification_unavailable","product_unavailable",true)); }
        });
    }
    private void bought(String outcome, Result result) {
        if (!buying) return;
        buying=false; List<PurchaseReply> callbacks=new ArrayList<>(buyers); buyers.clear();
        for (PurchaseReply callback:callbacks) callback.done(outcome,result);
    }
}

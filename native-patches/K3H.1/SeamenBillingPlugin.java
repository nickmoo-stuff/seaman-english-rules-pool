package com.seamenpool.billing;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/** Device-only Google Play inventory confirmation, not server verification. */
@CapacitorPlugin(name="SeamenBilling")
public final class SeamenBillingPlugin extends Plugin {
    private static final boolean PURCHASES_ENABLED=false; // No JS/config flag can enable payment.
    private PlayBillingClient client;
    private boolean alive;
    private final Consumer<String> changed=reason->{if(alive)notifyListeners("purchaseUpdated",new JSObject().put("reason",reason));};
    @Override public void load(){alive=true;client=PlayBillingClient.get(getContext());client.subscribe(changed);}
    @PluginMethod public void getCapabilities(PluginCall call){
        call.resolve(new JSObject().put("protocolVersion",1).put("purchasesEnabled",PURCHASES_ENABLED)
            .put("verificationEnabled",true).put("verificationModel","google_play_device")
            .put("serverVerificationEnabled",false).put("productId",SupporterBillingCore.PRODUCT));
    }
    private JSObject session(SupporterBillingCore.Result result){
        JSObject reply=new JSObject().put("status",result.state).put("reason",result.reason)
            .put("source","google_play").put("productId",SupporterBillingCore.PRODUCT);
        if("verified_owner".equals(result.state))reply.put("source","google_play_device")
            .put("verificationModel","google_play_device").put("purchaseState","PURCHASED")
            .put("acknowledgementState","ACKNOWLEDGED").put("expiresAt",System.currentTimeMillis()+300000);
        return reply;
    }
    @PluginMethod public void checkOwnership(PluginCall call){
        AtomicBoolean done=new AtomicBoolean();
        Runnable timeout=()->{if(alive&&done.compareAndSet(false,true))call.resolve(session(new SupporterBillingCore.Result("verification_unavailable","play_check_timed_out",true)));};
        client.main.postDelayed(timeout,12000);
        client.check(result->{
            client.main.removeCallbacks(timeout);
            if(!alive)return;
            if(done.compareAndSet(false,true))call.resolve(session(result));
            else if("verified_owner".equals(result.state))changed.accept("recheck_required"); // Refresh after a slow ack, not a second stale reply.
        });
    }
    @PluginMethod public void getProduct(PluginCall call){client.main.post(()->client.offer((code,offer)->{
        if(!alive)return;
        if(code==0&&offer!=null)call.resolve(new JSObject().put("source","google_play")
            .put("productId",offer.product).put("purchaseOptionId",offer.option).put("formattedPrice",offer.price));
        else call.resolve(session(new SupporterBillingCore.Result("verification_unavailable","product_unavailable",false)));
    }));}
    @PluginMethod public void purchase(PluginCall call){
        if(!PURCHASES_ENABLED){call.reject("Purchases are not enabled in this candidate.","PURCHASES_DISABLED");return;}
        client.purchase(getActivity(),(outcome,result)->{if(alive)call.resolve(session(result).put("outcome",outcome));});
    }
    @Override protected void handleOnResume(){if(alive)changed.accept("recheck_required");}
    @Override protected void handleOnDestroy(){alive=false;if(client!=null){client.unsubscribe(changed);client.detach(getActivity());}}
}

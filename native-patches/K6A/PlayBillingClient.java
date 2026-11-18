package com.seamenpool.billing;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/** Single-process SDK adapter, shared by the bridge and retry JobService.
 * Tokens are ephemeral, native-only and never used as stored ownership flags.
 */
final class PlayBillingClient implements SupporterBillingCore.Gateway {
    private static PlayBillingClient instance;
    static synchronized PlayBillingClient get(Context context) {
        if (instance==null) instance=new PlayBillingClient(context.getApplicationContext());
        return instance;
    }
    final Context context;
    final Handler main=new Handler(Looper.getMainLooper());
    final SupporterBillingCore core;
    private BillingClient billing;
    private int generation;
    private boolean connecting;
    private final List<SupporterBillingCore.Reply<Void>> waiting=new ArrayList<>();
    private final List<Consumer<String>> listeners=new ArrayList<>();
    private SupporterBillingCore.Reply<Void> flowReply;
    private Activity flowActivity;
    private PlayBillingClient(Context context) {
        this.context=context;
        core=new SupporterBillingCore(this,context.getPackageName());
        createClient();
    }
    void subscribe(Consumer<String> listener) { main.post(()->listeners.add(listener)); }
    void unsubscribe(Consumer<String> listener) { main.post(()->listeners.remove(listener)); }
    private void changed() { changed("recheck_required"); }
    private void changed(String reason) { for (Consumer<String> listener:new ArrayList<>(listeners)) listener.accept(reason); }
    private void createClient() {
        generation++; connecting=false;
        billing=BillingClient.newBuilder(context)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .setListener((result,purchases)->main.post(()->{
                SupporterBillingCore.Reply<Void> callback=flowReply; flowReply=null;
                if (callback!=null) callback.done(result.getResponseCode(),null);
                // Updates are signals only. Re-query/ack even if no web call survived.
                check(checked->{
                    if(result.getResponseCode()==0&&"not_owned".equals(checked.state))BillingRetryJob.update(context,true);
                    changed();
                });
            })).build();
    }
    private <T> SupporterBillingCore.Reply<T> bounded(SupporterBillingCore.Reply<T> reply,long timeout) {
        AtomicBoolean done=new AtomicBoolean();
        Runnable timer=()->{if(done.compareAndSet(false,true))reply.done(-1000,null);};
        main.postDelayed(timer,timeout);
        return (code,value)->main.post(()->{
            if(done.compareAndSet(false,true)){main.removeCallbacks(timer);reply.done(code,value);}
        });
    }
    private void ready(SupporterBillingCore.Reply<Void> reply) {
        if(billing.isReady()){reply.done(0,null);return;}
        waiting.add(reply);if(connecting)return;
        connecting=true;final int ticket=++generation;
        main.postDelayed(()->{
            if(ticket!=generation||!connecting)return;
            connecting=false;List<SupporterBillingCore.Reply<Void>> callbacks=new ArrayList<>(waiting);waiting.clear();
            billing.endConnection();createClient();
            for(SupporterBillingCore.Reply<Void> callback:callbacks)callback.done(-1000,null);
        },8000);
        try { billing.startConnection(new BillingClientStateListener(){
            @Override public void onBillingSetupFinished(BillingResult result){main.post(()->{
                if(ticket!=generation)return;connecting=false;
                List<SupporterBillingCore.Reply<Void>> callbacks=new ArrayList<>(waiting);waiting.clear();
                for(SupporterBillingCore.Reply<Void> callback:callbacks)callback.done(result.getResponseCode(),null);
            });}
            @Override public void onBillingServiceDisconnected(){main.post(()->{
                if(ticket!=generation)return;connecting=false;
                List<SupporterBillingCore.Reply<Void>> callbacks=new ArrayList<>(waiting);waiting.clear();
                for(SupporterBillingCore.Reply<Void> callback:callbacks)callback.done(-1000,null);
                changed("billing_disconnected");
            });}
        }); } catch(RuntimeException ignored){connecting=false;List<SupporterBillingCore.Reply<Void>> callbacks=new ArrayList<>(waiting);waiting.clear();for(SupporterBillingCore.Reply<Void> callback:callbacks)callback.done(-1000,null);}
    }
    void check(SupporterBillingCore.ResultReply reply){main.post(()->core.check(result->{
        BillingRetryJob.update(context,result.retry);reply.done(result);
    }));}
    void checkForJob(SupporterBillingCore.ResultReply reply){main.post(()->core.check(result->{reply.done(result);if("verified_owner".equals(result.state))changed();}));}
    void detach(Activity activity){main.post(()->{
        if(flowActivity!=activity)return;
        SupporterBillingCore.Reply<Void> callback=flowReply;flowReply=null;flowActivity=null;
        if(callback!=null)callback.done(-1000,null);
    });}
    @Override public void query(SupporterBillingCore.Reply<List<SupporterBillingCore.Receipt>> reply){
        final SupporterBillingCore.Reply<List<SupporterBillingCore.Receipt>> done=bounded(reply,12000);
        ready((code,unused)->{
            if(code!=0){done.done(code,null);return;}
            try { billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),(result,records)->{
                List<SupporterBillingCore.Receipt> receipts=new ArrayList<>();
                if(records!=null)for(Purchase record:records){
                    if(record.getProducts().contains(SupporterBillingCore.PRODUCT))receipts.add(new SupporterBillingCore.Receipt(
                        SupporterBillingCore.PRODUCT,record.getPackageName(),record.getPurchaseToken(),record.getPurchaseState(),record.isAcknowledged()));
                }
                done.done(result.getResponseCode(),records==null?null:receipts);
            }); } catch(RuntimeException ignored){done.done(-1000,null);}
        });
    }
    @Override public void acknowledge(String token,SupporterBillingCore.Reply<Void> reply){
        final SupporterBillingCore.Reply<Void> done=bounded(reply,12000);
        ready((code,unused)->{
            if(code!=0){done.done(code,null);return;}
            try{billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(),r->done.done(r.getResponseCode(),null));}
            catch(RuntimeException ignored){done.done(-1000,null);}
        });
    }
    private static final class OfferHandle {
        final ProductDetails details;final String token;
        OfferHandle(ProductDetails details,String token){this.details=details;this.token=token;}
    }
    @Override public void offer(SupporterBillingCore.Reply<SupporterBillingCore.Offer> reply){
        final SupporterBillingCore.Reply<SupporterBillingCore.Offer> done=bounded(reply,12000);
        ready((code,unused)->{
            if(code!=0){done.done(code,null);return;}
            try{billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder().setProductId(SupporterBillingCore.PRODUCT).setProductType(BillingClient.ProductType.INAPP).build())).build(),(result,details)->{
                if(result.getResponseCode()==0&&details!=null&&details.getProductDetailsList()!=null)for(ProductDetails product:details.getProductDetailsList()){
                    if(!SupporterBillingCore.PRODUCT.equals(product.getProductId())||!BillingClient.ProductType.INAPP.equals(product.getProductType())||product.getOneTimePurchaseOfferDetailsList()==null)continue;
                    for(ProductDetails.OneTimePurchaseOfferDetails offer:product.getOneTimePurchaseOfferDetailsList()){
                        if(SupporterBillingCore.OPTION.equals(offer.getPurchaseOptionId())&&offer.getRentalDetails()==null&&offer.getOfferToken()!=null&&offer.getFormattedPrice()!=null&&!offer.getFormattedPrice().trim().isEmpty()){
                            done.done(0,new SupporterBillingCore.Offer(SupporterBillingCore.PRODUCT,SupporterBillingCore.OPTION,offer.getFormattedPrice(),new OfferHandle(product,offer.getOfferToken()),offer.getPriceCurrencyCode(),offer.getPriceAmountMicros()));return;
                        }
                    }
                }
                done.done(result.getResponseCode()==0?4:result.getResponseCode(),null);
            });}catch(RuntimeException ignored){done.done(-1000,null);}
        });
    }
    void purchase(Activity activity,SupporterBillingCore.PurchaseReply reply){main.post(()->{
        if(flowActivity!=null){reply.done("in_progress",new SupporterBillingCore.Result("verification_unavailable","purchase_in_progress",false));return;}
        flowActivity=activity;BillingRetryJob.update(context,true);
        core.purchase((outcome,result)->{flowActivity=null;BillingRetryJob.update(context,result.retry);reply.done(outcome,result);});
    });}
    @Override public void launch(SupporterBillingCore.Offer offer,SupporterBillingCore.Reply<Void> reply){
        if(flowActivity==null||flowActivity.isFinishing()||!(offer.handle instanceof OfferHandle)){reply.done(-1000,null);return;}
        OfferHandle handle=(OfferHandle)offer.handle;
        final SupporterBillingCore.Reply<Void> done=bounded((code,value)->{flowReply=null;reply.done(code,value);},300000);
        flowReply=done;
        try{
            BillingFlowParams.ProductDetailsParams item=BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(handle.details).setOfferToken(handle.token).build();
            BillingResult result=billing.launchBillingFlow(flowActivity,BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item)).build());
            if(result.getResponseCode()!=0){flowReply=null;done.done(result.getResponseCode(),null);}
        }catch(RuntimeException ignored){flowReply=null;done.done(-1000,null);}
    }
}

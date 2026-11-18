package com.seamenpool.billing;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

/** Executes the actual production state machine with a fake Play transport. */
public final class SupporterBillingCoreTest {
    private static final String PACKAGE="example.actual.app";
    private static int tests;
    private static void require(boolean condition,String message){if(!condition)throw new AssertionError(message);}
    private static SupporterBillingCore.Receipt receipt(int state,boolean ack){return new SupporterBillingCore.Receipt(SupporterBillingCore.PRODUCT,PACKAGE,"native-only-token",state,ack);}
    private static final class Fake implements SupporterBillingCore.Gateway {
        List<SupporterBillingCore.Receipt> records=new ArrayList<>();
        int queries,acks,offers,launches,queryCode,ackCode,launchCode;
        boolean deferred,ackChanges=true;
        String option=SupporterBillingCore.OPTION;
        SupporterBillingCore.Reply<List<SupporterBillingCore.Receipt>> pending;
        Consumer<Fake> atLaunch;
        @Override public void query(SupporterBillingCore.Reply<List<SupporterBillingCore.Receipt>> reply){queries++;if(deferred)pending=reply;else reply.done(queryCode,new ArrayList<>(records));}
        void flush(){deferred=false;SupporterBillingCore.Reply<List<SupporterBillingCore.Receipt>> reply=pending;pending=null;reply.done(queryCode,new ArrayList<>(records));}
        @Override public void acknowledge(String token,SupporterBillingCore.Reply<Void> reply){
            acks++;require(!token.isEmpty(),"no empty ack");
            if(ackChanges){List<SupporterBillingCore.Receipt> updated=new ArrayList<>();for(SupporterBillingCore.Receipt item:records)updated.add(new SupporterBillingCore.Receipt(item.product,item.packageName,item.token,item.state,true));records=updated;}
            reply.done(ackCode,null);
        }
        @Override public void offer(SupporterBillingCore.Reply<SupporterBillingCore.Offer> reply){offers++;reply.done(0,new SupporterBillingCore.Offer(SupporterBillingCore.PRODUCT,option,"regional SDK price",this));}
        @Override public void launch(SupporterBillingCore.Offer offer,SupporterBillingCore.Reply<Void> reply){launches++;if(atLaunch!=null)atLaunch.accept(this);reply.done(launchCode,null);}
    }
    private static SupporterBillingCore.Result check(SupporterBillingCore core){final SupporterBillingCore.Result[] value={null};core.check(r->value[0]=r);require(value[0]!=null,"completed callback");return value[0];}
    private static void test(String name,Runnable run){run.run();tests++;System.out.println("PASS "+name);}
    public static void main(String[] ignored){
        test("purchased record must be acknowledged and re-queried before owner",()->{
            Fake f=new Fake();f.records.add(receipt(1,false));SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);
            require("verified_owner".equals(check(c).state),"owned after ack");require(f.acks==1&&f.queries==2,"ack then fresh query");check(c);require(f.acks==1,"already acknowledged never ack twice");
        });
        test("pending is never granted or acknowledged; completed later is restored",()->{
            Fake f=new Fake();f.records.add(receipt(2,false));SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);require("pending".equals(check(c).state)&&f.acks==0,"pending not owned/acked");
            f.records=Arrays.asList(receipt(1,false));require("verified_owner".equals(check(c).state)&&f.acks==1,"pending resolved and acked");
        });
        test("ack failures/cache lag remain unknown and retry fresh idempotently",()->{
            Fake f=new Fake();f.records.add(receipt(1,false));f.ackCode=2;f.ackChanges=false;SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);
            SupporterBillingCore.Result r=check(c);require("verification_unavailable".equals(r.state)&&r.retry&&f.acks==1&&f.queries==2,"no optimistic grant or busy ack loop");
            f.ackCode=0;f.ackChanges=true;require("verified_owner".equals(check(c).state)&&f.acks==2,"later retry succeeds");
            Fake cache=new Fake();cache.records.add(receipt(1,false));cache.ackChanges=false;require("verification_unavailable".equals(check(new SupporterBillingCore(cache,PACKAGE)).state),"ack OK alone is not inventory confirmation");
        });
        test("uncertain acknowledgement outcome is resolved by Google inventory",()->{
            Fake f=new Fake();f.records.add(receipt(1,false));f.ackCode=6;require("verified_owner".equals(check(new SupporterBillingCore(f,PACKAGE)).state),"API response lost but fresh record acknowledged");
        });
        test("concurrent duplicate checks share query and acknowledge",()->{
            Fake f=new Fake();f.records.add(receipt(1,false));f.deferred=true;SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);int[] count={0};
            c.check(r->{require("verified_owner".equals(r.state),"first owner");count[0]++;});c.check(r->{require("verified_owner".equals(r.state),"second owner");count[0]++;});
            require(f.queries==1,"one initial query");f.flush();require(count[0]==2&&f.acks==1,"coalesced completion");
        });
        test("reinstall/process interruption restores solely from current Play records",()->{
            Fake f=new Fake();f.records.add(receipt(1,true));require("verified_owner".equals(check(new SupporterBillingCore(f,PACKAGE)).state),"fresh instance restore");require(f.acks==0,"does not ack previously acknowledged receipt");
            f.records=Arrays.asList(receipt(1,false));f.ackChanges=false;check(new SupporterBillingCore(f,PACKAGE));f.records=Arrays.asList(receipt(1,true));int acks=f.acks;
            require("verified_owner".equals(check(new SupporterBillingCore(f,PACKAGE)).state)&&f.acks==acks,"process interrupted after ack still restores, no local owner flag");
        });
        test("network outage/unavailable is not unpurchased; revocation uses fresh query",()->{
            Fake f=new Fake();f.records.add(receipt(1,true));SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);require("verified_owner".equals(check(c).state),"initial owner");
            f.queryCode=2;require("verification_unavailable".equals(check(c).state),"offline is unknown");f.queryCode=0;f.records.clear();require("not_owned".equals(check(c).state),"refund/revocation removed record");
        });
        test("wrong product/package, missing token and unspecified state do not grant",()->{
            Fake f=new Fake();f.records.add(new SupporterBillingCore.Receipt("other",PACKAGE,"t",1,true));require("not_owned".equals(check(new SupporterBillingCore(f,PACKAGE)).state),"other product ignored");
            for(SupporterBillingCore.Receipt bad:Arrays.asList(new SupporterBillingCore.Receipt(SupporterBillingCore.PRODUCT,"wrong.package","t",1,true),new SupporterBillingCore.Receipt(SupporterBillingCore.PRODUCT,PACKAGE,"",1,true),receipt(0,false))){
                f.records=Arrays.asList(bad);require("verification_unavailable".equals(check(new SupporterBillingCore(f,PACKAGE)).state)&&f.acks==0,"invalid record neither owned nor acked");
            }
        });
        test("already-owned and pending prevent a second purchase launch",()->{
            for(int state:new int[]{1,2}){Fake f=new Fake();f.records.add(receipt(state,true));SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);c.purchase((outcome,r)->require(outcome.equals(state==1?"already_owned":"pending"),"preflight outcome"));require(f.launches==0&&f.offers==0,"no duplicate dialog");}
        });
        test("future disabled-gate workflow success/cancel/failure/already-owned/pending",()->{
            for(int code:new int[]{0,1,6,7}){Fake f=new Fake();f.launchCode=code;if(code==0||code==7)f.atLaunch=x->x.records=Arrays.asList(receipt(1,false));SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);String[] result={null};
                c.purchase((outcome,r)->{result[0]=outcome;require((code==0||code==7)=="verified_owner".equals(r.state),"fresh inventory determines ownership");});
                require(f.launches==1&&result[0]!=null,"one fake launch, completed callback");require(result[0].equals(code==0?"completed":code==1?"cancelled":code==7?"already_owned":"failed"),"mapped outcome");}
            Fake pending=new Fake();pending.atLaunch=x->x.records=Arrays.asList(receipt(2,false));new SupporterBillingCore(pending,PACKAGE).purchase((outcome,r)->require("pending".equals(outcome)&&pending.acks==0,"pending purchase not acknowledged"));
        });
        test("incorrect purchase option cannot launch",()->{Fake f=new Fake();f.option="rental";new SupporterBillingCore(f,PACKAGE).purchase((outcome,r)->require("unavailable".equals(outcome),"wrong option rejected"));require(f.launches==0,"no invalid offer dialog");});
        test("duplicate purchase preflights coalesce",()->{Fake f=new Fake();f.deferred=true;SupporterBillingCore c=new SupporterBillingCore(f,PACKAGE);int[] replies={0};c.purchase((o,r)->replies[0]++);c.purchase((o,r)->replies[0]++);f.flush();require(f.launches==1&&replies[0]==2,"one fake dialog for duplicate callers");});
        test("successful/already-owned callback before inventory propagation remains unknown and retries",()->{
            for(int code:new int[]{0,7}){Fake f=new Fake();f.launchCode=code;new SupporterBillingCore(f,PACKAGE).purchase((outcome,r)->require((code==0?"interrupted":"already_owned").equals(outcome)&&"verification_unavailable".equals(r.state)&&r.retry,"callback alone never grants or confirms non-ownership"));}
        });
        System.out.println("PASS "+tests+" production-core fixture tests; no real Google purchase or acknowledgement performed");
    }
}

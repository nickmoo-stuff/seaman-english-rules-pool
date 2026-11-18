const assert=require('node:assert/strict');
const {createSupporterService}=require('../www/supporter.js');
const PRODUCT='seamen_pool_supporter';
const plain=(status,reason)=>({status,reason,source:'google_play',productId:PRODUCT});
const owner=()=>({status:'verified_owner',source:'google_play_backend',productId:PRODUCT,purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+1000});
function harness(initial=plain('not_owned')){
 const h={record:initial,purchases:0,checks:0,cap:{protocolVersion:1,verificationEnabled:true,purchasesEnabled:true},outcome:'success'};
 h.bridge={getCapabilities:async()=>h.cap,getProduct:async()=>({source:'google_play',productId:PRODUCT,purchaseOptionId:'supporter-buy',formattedPrice:'₹129.00'}),checkOwnership:async()=>{h.checks++;if(h.error)throw Error('offline');return h.record;},purchase:async()=>{h.purchases++;if(h.onPurchase)await h.onPurchase();return {outcome:h.outcome};}};
 h.service=createSupporterService({bridge:h.bridge,timeoutMs:30});return h;
}
(async()=>{
 let h=harness();await h.service.check();assert.equal(h.service.getState().status,'not_owned');assert(h.service.canPurchase());assert.equal(h.service.getState().price,'₹129.00');
 h.onPurchase=async()=>{h.record=owner();};await Promise.all([h.service.purchase(),h.service.purchase()]);assert.equal(h.purchases,1);assert(h.service.hasVerifiedOwnership());await h.service.purchase();assert.equal(h.purchases,1);h.service.dispose();
 console.log('PASS mock future-contract successful transition, acknowledged verified owner, regional price and duplicate prevention (not a Play purchase)');
 h=harness();await h.service.check();h.onPurchase=async()=>{h.record=plain('pending');};await h.service.purchase();assert.equal(h.service.getState().status,'pending');await h.service.purchase();assert.equal(h.purchases,1);assert(!h.service.hasVerifiedOwnership());h.service.dispose();
 for(const outcome of ['cancelled','failed','interrupted','already_owned']){h=harness();await h.service.check();h.outcome=outcome;if(outcome==='already_owned')h.record=owner();await h.service.purchase();assert.equal(h.service.getState().status,outcome==='already_owned'?'verified_owner':'not_owned');h.service.dispose();}
 console.log('PASS pending, cancelled/failed/interrupted recheck and already-owned mock paths');
 h=harness(owner());await h.service.restore();assert(h.service.hasVerifiedOwnership());h.service.dispose();const restored=createSupporterService({bridge:h.bridge});assert(!restored.hasVerifiedOwnership());await restored.restore();assert(restored.hasVerifiedOwnership());restored.dispose();
 h=harness(owner());await h.service.check();h.error=true;await h.service.restore();assert.equal(h.service.getState().status,'verification_unavailable');assert(!h.service.hasVerifiedOwnership());h.service.dispose();
 console.log('PASS mock restore after a fresh service/reinstall, no persisted paid boolean and offline check becomes unknown');
 for(const patch of [{source:'local'},{productId:'other'},{acknowledgementState:'UNACKNOWLEDGED'},{purchaseState:'PENDING'},{expiresAt:Date.now()-1},{expiresAt:Date.now()+400000}]){h=harness({...owner(),...patch});await h.service.check();assert(!h.service.hasVerifiedOwnership());assert.equal(h.service.getState().status,'verification_unavailable');h.service.dispose();}
 h=harness(owner());h.cap.verificationEnabled=false;h.cap.purchasesEnabled=false;await h.service.check();assert(!h.service.hasVerifiedOwnership());await h.service.purchase();assert.equal(h.purchases,0);h.service.dispose();
 const web=createSupporterService();await web.restore();assert.equal(web.getState().status,'verification_unavailable');assert(!web.canPurchase());web.dispose();
 h=harness();h.bridge.getCapabilities=()=>new Promise(()=>{});await h.service.check();assert.equal(h.service.getState().status,'verification_unavailable');h.service.dispose();
 h=harness({...owner(),expiresAt:Date.now()+80});await h.service.check();assert(h.service.hasVerifiedOwnership());await new Promise(r=>setTimeout(r,100));assert(!h.service.hasVerifiedOwnership());h.service.dispose();
 console.log('PASS fail-closed verification, expiry, missing backend, purchase kill switch, web fallback and timeout');
 h=harness({...owner(),source:'google_play_device',verificationModel:'google_play_device'});h.cap.verificationModel='google_play_device';h.cap.purchasesEnabled=false;await h.service.restore();assert(h.service.hasVerifiedOwnership());assert.equal(h.service.getState().verificationModel,'google_play_device');assert(!h.service.canPurchase());await h.service.purchase();assert.equal(h.purchases,0);h.service.dispose();
 for(const override of [{source:'google_play_backend'},{verificationModel:'google_play_backend'},{acknowledgementState:'UNACKNOWLEDGED'},{purchaseState:'PENDING'}]){h=harness({...owner(),source:'google_play_device',verificationModel:'google_play_device',...override});h.cap.verificationModel='google_play_device';await h.service.restore();assert(!h.service.hasVerifiedOwnership());h.service.dispose();}
 h=harness({...owner(),source:'google_play_device',verificationModel:'google_play_device'});await h.service.restore();assert(!h.service.hasVerifiedOwnership(),'device response cannot masquerade as backend verification');h.service.dispose();
 console.log('PASS explicit device model, acknowledged owner, cross-model rejection and disabled payment gate');

 h=harness();let release;let first=true;h.bridge.checkOwnership=()=>first?(first=false,new Promise(resolve=>{release=resolve;})):Promise.resolve(plain('pending'));
 const before=h.service.check();await new Promise(r=>setTimeout(r,0));h.service.invalidate();const after=h.service.restore();release(owner());await Promise.all([before,after]);assert.equal(h.service.getState().status,'pending');h.service.dispose();
 console.log('PASS stale asynchronous owner result cannot overwrite invalidation or a fresh check');
 h=harness();let releasePrice;let prices=0;
 h.bridge.getProduct=()=>{prices++;return new Promise(resolve=>{releasePrice=resolve;});};
 const checking=h.service.check();await new Promise(r=>setTimeout(r,0));assert.equal(h.service.getState().status,'not_owned');assert(h.service.getState().busy);
 assert.equal(h.service.restore(),checking,'restore coalesces even after ownership replied while price is pending');assert.equal(h.service.check(),checking);
 releasePrice({source:'google_play',productId:PRODUCT,purchaseOptionId:'supporter-buy',formattedPrice:'₹129.00'});const completed=await checking;assert.equal(completed.busy,false);assert.equal(h.checks,1);
 await h.service.restore();assert.equal(h.checks,2);assert.equal(prices,1,'restore never refreshes or changes price');assert(!h.service.getState().busy);h.service.dispose();
 h=harness();h.bridge.getCapabilities=()=>{throw Error('native adapter unavailable');};await h.service.restore();assert.equal(h.service.getState().busy,false);h.bridge.getCapabilities=async()=>h.cap;await h.service.restore();assert.equal(h.service.getState().status,'not_owned');assert.equal(h.checks,1,'synchronous failure does not strand subsequent requests');h.service.dispose();
 console.log('PASS busy/result lifecycle, coalescing during price lookup, ownership-only restore and recovery from a synchronous native exception');
 h=harness();await h.service.check();h.outcome='already_owned';let finishRecheck;h.bridge.checkOwnership=()=>new Promise(resolve=>{finishRecheck=resolve;});const stalePurchase=h.service.purchase();await new Promise(r=>setTimeout(r,0));h.service.invalidate('offline');finishRecheck(owner());await stalePurchase;assert(!h.service.hasVerifiedOwnership());assert.equal(h.service.getState().status,'verification_unavailable');h.service.dispose();
 console.log('PASS invalidation also fences late ownership replies in future-contract purchase rechecks');
})().catch(e=>{console.error(e);process.exitCode=1});

/* K6A: volatile device-Play ownership session. No local-storage purchase authority. */
(function(root){
 'use strict';
 const PRODUCT='seamen_pool_supporter',OPTION='supporter-buy';
 function createSupporterService({bridge=null,now=Date.now,timeoutMs=15000,purchaseTimeoutMs=330000}={}){
  let state=Object.freeze({status:'verification_unavailable',reason:bridge?'not_checked':'web',price:null,currency:null,busy:false,verificationAvailable:null,verificationModel:null,purchasesEnabled:null,action:null,purchaseOutcome:null,purchaseReason:null}),capabilities=null,operation=null,operationTicket=0,epoch=0,expiryTimer=null,propagationUntil=0,verifiedUntil=0,refreshTimer=null;
  const listeners=new Set();
  const emit=patch=>{state=Object.freeze({...state,...patch});for(const f of listeners)f(state);return state;};
  const timed=(promise,limit=timeoutMs)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),limit);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
  function accept(result){
   const status=result?.status;
   if(status==='verified_owner'){
    const ttl=Number(result.expiresAt)-now();
    const device=capabilities?.verificationModel==='google_play_device';
    if(capabilities?.verificationEnabled!==true||result.source!==(device?'google_play_device':'google_play_backend')||(device&&result.verificationModel!=='google_play_device')||result.productId!==PRODUCT||result.purchaseState!=='PURCHASED'||result.acknowledgementState!=='ACKNOWLEDGED'||!(ttl>0&&ttl<=300000))return emit({status:'verification_unavailable',reason:'invalid_verification'});
    clearTimeout(expiryTimer);clearTimeout(refreshTimer);verifiedUntil=now()+ttl;
    expiryTimer=setTimeout(()=>{verifiedUntil=0;emit({status:'verification_unavailable',reason:'verification_expired'});},ttl);
    // Refresh while the existing native verification is still valid. A timeout
    // never extends that bounded lease and cannot become confirmed non-ownership.
    if(ttl>10000)refreshTimer=setTimeout(()=>run('check'),ttl-Math.min(45000,ttl/2));
   }else if(!['not_owned','pending','verification_unavailable'].includes(status)||result.source!=='google_play'||result.productId!==PRODUCT){return emit({status:'verification_unavailable',reason:'invalid_response'});}
   if(status!=='verification_unavailable')propagationUntil=0;
   if(status==='not_owned'||status==='pending'){verifiedUntil=0;clearTimeout(expiryTimer);clearTimeout(refreshTimer);}
   return emit({status,reason:result.reason||null});
  }
  async function product(){
   try{const p=await timed(bridge.getProduct());if(p.source==='google_play'&&p.productId===PRODUCT&&p.purchaseOptionId===OPTION&&typeof p.formattedPrice==='string'&&p.formattedPrice.trim().length>0&&p.formattedPrice.length<100)emit({price:p.formattedPrice,currency:typeof p.priceCurrencyCode==='string'&&/^[A-Z]{3}$/.test(p.priceCurrencyCode)?p.priceCurrencyCode:null});else emit({price:null,currency:null});}catch(e){emit({price:null,currency:null});}
  }
  function run(kind){
   // A final ownership reply may arrive before price lookup finishes. Coalesce
   // that entire operation too; only an invalidated ticket needs a fresh check.
   if(operation)return operationTicket===epoch?operation:operation.then(()=>run(kind));
   if(!bridge)return Promise.resolve(emit({status:'verification_unavailable',reason:'web',price:null}));
   const ticket=++epoch;operationTicket=ticket;emit({status:'checking',reason:kind,busy:true,...(kind==='purchase'||kind==='restore'?{action:kind,purchaseOutcome:null,purchaseReason:null}:{})});
   // Defer work until the promise is assigned, including synchronously throwing
   // native adapters. Otherwise their finally block can leave a stale promise.
   operation=Promise.resolve().then(async()=>{
    try{
     capabilities=await timed(bridge.getCapabilities());
     if(capabilities.protocolVersion!==1)throw Error('bridge_version');
     if(capabilities.productId&&capabilities.productId!==PRODUCT||capabilities.purchaseOptionId&&capabilities.purchaseOptionId!==OPTION)throw Error('product_configuration');
     if(capabilities.verificationModel&&!['google_play_device','google_play_backend'].includes(capabilities.verificationModel))throw Error('verification_model');
     if(ticket!==epoch)return state;
     emit({verificationAvailable:capabilities.verificationEnabled===true,verificationModel:capabilities.verificationModel||'google_play_backend',purchasesEnabled:capabilities.purchasesEnabled===true});
     if(kind==='purchase'){
      if(capabilities.verificationEnabled!==true||capabilities.purchasesEnabled!==true)throw Error('purchases_disabled');
      const result=await timed(bridge.purchase(),purchaseTimeoutMs);
      // Outcome is feedback only, including after a Play-sheet background/resume.
      // Ownership always comes from a separate, current-epoch Play query below.
      const outcome=result?.outcome==='success'?'completed':result?.outcome;
      propagationUntil=['completed','already_owned','pending'].includes(outcome)||result?.reason==='play_inventory_not_ready'?now()+15000:0;
      emit({purchaseOutcome:['completed','pending','cancelled','failed','already_owned','interrupted','unavailable','in_progress'].includes(outcome)?outcome:'failed',purchaseReason:result?.reason||null});
      if(ticket!==epoch)return state;
     }
     const result=await timed(bridge.checkOwnership());if(ticket!==epoch)return state;
     if(result?.status==='not_owned'&&now()<propagationUntil){
      emit({status:'verification_unavailable',reason:'play_inventory_not_ready'});
     }else{
      if(kind!=='purchase'&&result?.status==='not_owned'&&['completed','pending','already_owned'].includes(state.purchaseOutcome))emit({action:null,purchaseOutcome:null,purchaseReason:null});
      accept(result);
     }
     // Restore is ownership-only: do not move/rewrite the price above the button.
     if(kind!=='restore')await product();return state;
    }catch(e){if(ticket===epoch)emit({status:'verification_unavailable',reason:e.message||'unavailable',...(kind==='purchase'?{purchaseOutcome:'failed'}:{})});return state;}
    finally{operation=null;emit({busy:false});}
   }).then(()=>state);return operation;
  }
  return Object.freeze({
   getState:()=>state,
   hasVerifiedOwnership:()=>!!bridge&&verifiedUntil>now(),
   canCheck:()=>!!bridge&&typeof bridge.checkOwnership==='function'&&typeof bridge.getCapabilities==='function',
   canPurchase:()=>state.status==='not_owned'&&!!state.price&&capabilities?.purchasesEnabled===true&&capabilities?.verificationEnabled===true&&!operation,
   subscribe(f){listeners.add(f);return()=>listeners.delete(f);},
   check:()=>run('check'),restore:()=>run('restore'),
   purchase(){if(this.hasVerifiedOwnership()||state.status==='pending'||operation)return operation||Promise.resolve(state);if(!this.canPurchase())return Promise.resolve(state);return run('purchase');},
   invalidate(reason='resume'){++epoch;emit({status:'verification_unavailable',reason});},
   dispose(){++epoch;verifiedUntil=0;clearTimeout(expiryTimer);clearTimeout(refreshTimer);listeners.clear();}
  });
 }
 function nativeBridge(){
  try{const c=root.Capacitor;if(!c?.isNativePlatform?.()||c.getPlatform?.()!=='android')return null;
   if(typeof c.isPluginAvailable==='function'&&!c.isPluginAvailable('SeamenBilling'))return null;
   return c.registerPlugin?c.registerPlugin('SeamenBilling'):c.Plugins?.SeamenBilling||null;
  }catch(e){return null;}
 }
 root.SeamenSupporterFactory=Object.freeze({createSupporterService});
 const bridge=nativeBridge();
 root.SeamenSupporter=createSupporterService({bridge});
 // Lifecycle notifications only cause a fresh check; they never carry ownership.
 if(root.document){
  root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)root.SeamenSupporter.invalidate('background');else root.SeamenSupporter.check();});
  root.addEventListener('online',()=>root.SeamenSupporter.check());
  root.addEventListener('offline',()=>root.SeamenSupporter.invalidate('offline'));
  if(bridge?.addListener)try{Promise.resolve(bridge.addListener('purchaseUpdated',event=>{root.SeamenSupporter.invalidate(event?.reason||'purchase_update');if(event?.reason!=='billing_disconnected')root.SeamenSupporter.check();})).catch(()=>{});}catch(e){/* Older native globals return a handle, not a Promise. */}
 }
 if(typeof module!=='undefined')module.exports={createSupporterService};
})(typeof window!=='undefined'?window:globalThis);

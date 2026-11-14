/* K3H.1: volatile device-Play ownership session. No local-storage purchase authority. */
(function(root){
 'use strict';
 const PRODUCT='seamen_pool_supporter',OPTION='supporter-buy';
 function createSupporterService({bridge=null,now=Date.now,timeoutMs=15000}={}){
  let state=Object.freeze({status:'verification_unavailable',reason:bridge?'not_checked':'web',price:null,busy:false,verificationAvailable:null,verificationModel:null}),capabilities=null,operation=null,operationTicket=0,epoch=0,expiryTimer=null;
  const listeners=new Set();
  const emit=patch=>{state=Object.freeze({...state,...patch});for(const f of listeners)f(state);return state;};
  const timed=promise=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),timeoutMs);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
  function accept(result){
   clearTimeout(expiryTimer);
   const status=result?.status;
   if(status==='verified_owner'){
    const ttl=Number(result.expiresAt)-now();
    const device=capabilities?.verificationModel==='google_play_device';
    if(!capabilities?.verificationEnabled||result.source!==(device?'google_play_device':'google_play_backend')||(device&&result.verificationModel!=='google_play_device')||result.productId!==PRODUCT||result.purchaseState!=='PURCHASED'||result.acknowledgementState!=='ACKNOWLEDGED'||!(ttl>0&&ttl<=300000))return emit({status:'verification_unavailable',reason:'invalid_verification'});
    expiryTimer=setTimeout(()=>emit({status:'verification_unavailable',reason:'verification_expired'}),ttl);
   }else if(!['not_owned','pending','verification_unavailable'].includes(status)||result.source!=='google_play'||result.productId!==PRODUCT){return emit({status:'verification_unavailable',reason:'invalid_response'});}
   return emit({status,reason:result.reason||null});
  }
  async function product(){
   try{const p=await timed(bridge.getProduct());if(p.source==='google_play'&&p.productId===PRODUCT&&p.purchaseOptionId===OPTION&&typeof p.formattedPrice==='string'&&p.formattedPrice.length<100)emit({price:p.formattedPrice});else emit({price:null});}catch(e){emit({price:null});}
  }
  function run(kind){
   // A final ownership reply may arrive before price lookup finishes. Coalesce
   // that entire operation too; only an invalidated ticket needs a fresh check.
   if(operation)return operationTicket===epoch?operation:operation.then(()=>run(kind));
   if(!bridge)return Promise.resolve(emit({status:'verification_unavailable',reason:'web',price:null}));
   const ticket=++epoch;operationTicket=ticket;emit({status:'checking',reason:kind,busy:true});
   // Defer work until the promise is assigned, including synchronously throwing
   // native adapters. Otherwise their finally block can leave a stale promise.
   operation=Promise.resolve().then(async()=>{
    try{
     capabilities=await timed(bridge.getCapabilities());
     if(capabilities.protocolVersion!==1)throw Error('bridge_version');
     if(capabilities.verificationModel&&!['google_play_device','google_play_backend'].includes(capabilities.verificationModel))throw Error('verification_model');
     if(ticket!==epoch)return state;
     emit({verificationAvailable:capabilities.verificationEnabled===true,verificationModel:capabilities.verificationModel||'google_play_backend'});
     if(kind==='purchase'){
      if(!capabilities.verificationEnabled||!capabilities.purchasesEnabled)throw Error('purchases_disabled');
      const result=await timed(bridge.purchase());
      if(ticket!==epoch)return state;
      if(['cancelled','failed','already_owned','interrupted'].includes(result.outcome)){
       const checked=await timed(bridge.checkOwnership());return ticket===epoch?accept(checked):state;
      }
     }
     const result=await timed(bridge.checkOwnership());if(ticket!==epoch)return state;accept(result);
     // Restore is ownership-only: do not move/rewrite the price above the button.
     if(kind!=='restore')await product();return state;
    }catch(e){if(ticket===epoch)emit({status:'verification_unavailable',reason:e.message||'unavailable'});return state;}
    finally{operation=null;emit({busy:false});}
   }).then(()=>state);return operation;
  }
  return Object.freeze({
   getState:()=>state,
   hasVerifiedOwnership:()=>state.status==='verified_owner',
   canCheck:()=>!!bridge&&typeof bridge.checkOwnership==='function'&&typeof bridge.getCapabilities==='function',
   canPurchase:()=>state.status==='not_owned'&&!!state.price&&!!capabilities?.purchasesEnabled&&!!capabilities?.verificationEnabled&&!operation,
   subscribe(f){listeners.add(f);return()=>listeners.delete(f);},
   check:()=>run('check'),restore:()=>run('restore'),
   purchase(){if(state.status==='verified_owner'||state.status==='pending'||operation)return operation||Promise.resolve(state);if(!this.canPurchase())return Promise.resolve(state);return run('purchase');},
   invalidate(reason='resume'){++epoch;clearTimeout(expiryTimer);emit({status:'verification_unavailable',reason});},
   dispose(){++epoch;clearTimeout(expiryTimer);listeners.clear();}
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

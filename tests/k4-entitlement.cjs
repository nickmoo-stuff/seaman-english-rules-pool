// Native bridge responses are fixtures, not real Google Play verification.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const status of ['verified_owner','not_owned','pending','verification_unavailable','checking']){
 const p=await b.newPage({serviceWorkers:'block'});await p.addInitScript(status=>{
  localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));localStorage.setItem('seamenCareer',JSON.stringify({chapters:{chapter_3:{completed:true},chapter_4:{unlocked:true}},poolSchoolCompleted:[1,2,3,4,5]}));window.__payments=0;
  const bridge={getCapabilities:async()=>({protocolVersion:1,verificationEnabled:true,verificationModel:'google_play_device',purchasesEnabled:false}),getProduct:async()=>({source:'google_play',productId:'seamen_pool_supporter',purchaseOptionId:'supporter-buy'}),checkOwnership:async()=>status==='checking'?new Promise(()=>{}):({status,source:status==='verified_owner'?'google_play_device':'google_play',productId:'seamen_pool_supporter',verificationModel:'google_play_device',purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+240000}),purchase:async()=>{window.__payments++;throw Error('disabled');},addListener:()=>({remove(){}})};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>true,Plugins:{SeamenBilling:bridge}};
 },status);
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8013/',{waitUntil:'networkidle'});await p.waitForFunction(s=>SeamenSupporter.getState().status===s,status);
 assert.equal(await p.evaluate(()=>BUILD_MODE),'release');assert.equal(await p.evaluate(()=>chapterIsUnlocked('chapter_4')),status==='verified_owner');assert.equal(await p.evaluate(()=>pirateIsOpen('vile_hedgehog')),status==='verified_owner');assert.equal(await p.evaluate(()=>pirateIsOpen('spinball_wizard')),status==='verified_owner');assert(await p.locator('#purchaseSupporter').isDisabled());assert.equal(await p.evaluate(()=>window.__payments),0);
 assert.deepEqual(await p.evaluate(()=>career.poolSchoolCompleted),[1,2,3,4,5]);await p.close();console.log('PASS release native fixture '+status+': Chapter 4 gate, imported ownership ignored, progress preserved, no payments');
 }
 // Short-lived native sessions exercise expiry/requery and a subsequent revoked reply.
 const q=await b.newPage({serviceWorkers:'block'});await q.addInitScript(()=>{
  localStorage.setItem('seamenCareer',JSON.stringify({chapters:{chapter_3:{completed:true}}}));window.__checks=0;
  const bridge={getCapabilities:async()=>({protocolVersion:1,verificationEnabled:true,verificationModel:'google_play_device',purchasesEnabled:false}),getProduct:async()=>({}),checkOwnership:async()=>({status:++window.__checks<3?'verified_owner':'not_owned',source:window.__checks<3?'google_play_device':'google_play',productId:'seamen_pool_supporter',verificationModel:'google_play_device',purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+4500}),addListener:()=>({remove(){}})};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>true,Plugins:{SeamenBilling:bridge}};
 });await q.goto(process.env.TEST_URL||'http://127.0.0.1:8013/',{waitUntil:'networkidle'});await q.locator('#enterTavern').click();await q.waitForTimeout(2700);
 await q.evaluate(()=>{pendingPirateStart={level:3,pirateId:'vile_hedgehog',playerName:'Expiry QA'};beginPendingPirateMatch(true);confirmCue.click();});
 const rack=await q.evaluate(()=>JSON.stringify({balls,state}));await q.waitForFunction(()=>window.__checks>=2&&SeamenSupporter.hasVerifiedOwnership());assert.equal(await q.evaluate(()=>JSON.stringify({balls,state})),rack);assert(await q.locator('#shoot').isEnabled());
 await q.waitForFunction(()=>window.__checks>=3&&SeamenSupporter.getState().status==='not_owned');assert(await q.locator('#shoot').isDisabled());assert.equal(await q.evaluate(()=>JSON.stringify({balls,state})),rack);await q.close();
 console.log('PASS native expiry fixture: one ownership requery, rack retained, play resumes after ownership reply and stops after revoked reply');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

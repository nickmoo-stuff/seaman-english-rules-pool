const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8008/',out=process.env.TEST_ARTIFACT_DIR||'/tmp/k3g-supporter';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [w,h,mobile] of [[1366,768,false],[390,844,true],[855,384,true]])for(const status of ['not_owned','verified_owner','pending','verification_unavailable','checking']){
  const p=await b.newPage({...mobile?devices['Pixel 7']:{},viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(status=>{
   localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));
   localStorage.setItem('seamenCue','pokey');localStorage.setItem('seamenTableTheme','pokey');localStorage.setItem('seamenCareer',JSON.stringify({piratesDefeated:{pokey_man:true}}));
   window.__billingFixture=status;window.__billingChecks=0;window.__payments=0;
   const bridge={getCapabilities:async()=>status==='checking'?new Promise(()=>{}):({protocolVersion:1,verificationEnabled:true,verificationModel:'google_play_device',purchasesEnabled:false}),
    getProduct:async()=>({source:'google_play',productId:'seamen_pool_supporter',purchaseOptionId:'supporter-buy',formattedPrice:'₹129.00'}),
    checkOwnership:async()=>{window.__billingChecks++;return {status:window.__billingFixture,source:window.__billingFixture==='verified_owner'?'google_play_device':'google_play',productId:'seamen_pool_supporter',verificationModel:'google_play_device',purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+240000};},
    purchase:async()=>{window.__payments++;throw Error('Payment must never be called');},addListener:(name,callback)=>{window.__billingEvent=callback;return {remove:()=>{}};}};
   window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>true,Plugins:{SeamenBilling:bridge}};
  },status);
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(status=>SeamenSupporter.getState().status===status,status);await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  const heading=await p.locator('#titleSupport span').textContent(),subtitle=await p.locator('#titleSupport small').textContent();
  assert.equal(heading,status==='verified_owner'?'Supporter Pack purchased and active':'Support the game and extras');
  assert.equal(await p.locator('#titleSupport').isDisabled(),status==='verified_owner');
  if(status==='not_owned'){assert.equal(subtitle,'Unlock lots of bonuses forever – find out more!');assert.equal(await p.evaluate(()=>localStorage.getItem('seamenCue')),'pokey','not-owned check preserves saved choice without unlocking it');assert.equal(await p.evaluate(()=>cueStyleForShooter(1)),'classic');}
  else if(status==='verified_owner')assert.equal(subtitle,'Thank you!');else assert(!subtitle.includes('Thank you')&&!subtitle.includes('purchased'));
  assert.equal(await p.evaluate(()=>hasEntitlement('supporter_founder_test')),status==='verified_owner','native local test flag cannot grant paid access');
  await p.locator('#titleSupport').scrollIntoViewIfNeeded();const rect=await p.locator('#titleSupport').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=w+1&&rect.height>=44,'menu control remains usable');
  if(status==='verified_owner'){
   assert(Number(await p.locator('#titleSupport').evaluate(el=>getComputedStyle(el).opacity))<1,'disabled visual style');
   await p.locator('#titleSupport').evaluate(el=>el.click());assert(await p.locator('#supportScreen').isHidden());
   await p.screenshot({path:`${out}/owner-${w}.png`});
   await p.evaluate(async()=>{window.__billingFixture='verification_unavailable';await SeamenSupporter.restore();});
   assert(await p.locator('#titleSupport').isEnabled());assert(!await p.evaluate(()=>SeamenSupporter.hasVerifiedOwnership()));
  }
  await p.locator('#titleSupport').click();assert(await p.locator('#supportScreen').isVisible());
  assert(await p.locator('#purchaseSupporter').isDisabled());assert.equal(await p.evaluate(()=>window.__payments),0);
  const text=await p.locator('#supportScreen').innerText();for(const part of ['One permanent purchase','not a recurring subscription','Available in the game now','Planned for future releases','Chapter 4 and beyond are included in the permanent Supporter Pack, without additional chapter purchases.','Further supporter-only story chapters beyond Chapter 4 are planned as part of this permanent pack.','not available in this build'])assert(text.includes(part),part);assert(!/chapters?\s*4\s*[–—-]\s*6/i.test(text),'no fixed future supporter chapter range');
  if(status!=='checking')assert(text.includes('₹129.00'),'price comes from Google-formatted fixture, never a hardcoded UK price');
  if(status==='verification_unavailable'){
   const before=await p.evaluate(()=>collectStorage());await p.locator('#restoreSupporter').click();await p.waitForFunction(()=>SeamenSupporter.getState().status!=='checking');assert.deepEqual(await p.evaluate(()=>collectStorage()),before,'unknown verification does not reset saves/selections');
   assert.equal(await p.evaluate(()=>localStorage.getItem('seamenCue')),'pokey');assert.equal(await p.evaluate(()=>localStorage.getItem('seamenTableTheme')),'pokey');assert.equal(await p.evaluate(()=>activeTableTheme()),'classic','stored choice is preserved without granting an unverified paid table');
   const checks=await p.evaluate(()=>window.__billingChecks);await p.evaluate(()=>window.__billingEvent({reason:'billing_disconnected'}));assert.equal(await p.evaluate(()=>window.__billingChecks),checks,'disconnect does not cause a query retry loop');await p.locator('#supportTitle').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/information-${w}.png`});
  }
  await p.locator('#supportBack').scrollIntoViewIfNeeded();await p.locator('#supportBack').click();assert(await p.locator('#titleScreen').isVisible());assert.deepEqual(errors,[]);await p.close();
  console.log(`PASS ${w}x${h} ${status}: truthful menu, disabled ownership/payment state, information, dynamic fixture price, no local native grant, usable navigation`);
 }
 const web=await b.newPage({serviceWorkers:'block'});await web.goto(url);await web.locator('#enterTavern').click();await web.waitForTimeout(2700);await web.evaluate(()=>setDevEntitlement('supporter_founder_test',true));assert.equal(await web.evaluate(()=>hasEntitlement('supporter_founder_test')),await web.evaluate(()=>IS_DEVELOPMENT_BUILD),'developer entitlement is available only in development web QA');assert(!await web.evaluate(()=>SeamenSupporter.hasVerifiedOwnership()));assert.equal(await web.locator('#titleSupport span').textContent(),'Support the game and extras');await web.locator('#titleSupport').click();assert(await web.locator('#purchaseSupporter').isDisabled());assert(await web.locator('#restoreSupporter').isDisabled());await web.close();
 console.log('PASS web/PWA fallback and legacy developer test pass are never labelled as a verified purchase');
 const missing=await b.newPage({serviceWorkers:'block'});await missing.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>false,Plugins:{}};localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));});await missing.goto(url);await missing.locator('#enterTavern').click();await missing.waitForTimeout(2700);await missing.locator('#titleSupport').click();assert(await missing.locator('#restoreSupporter').isDisabled());assert(await missing.locator('#purchaseSupporter').isDisabled());assert(!await missing.evaluate(()=>hasEntitlement('supporter_founder_test')));await missing.close();
 console.log('PASS Android web-update without installed bridge remains unknown and disables unavailable actions; local flag ignored');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

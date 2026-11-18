const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8009/';
const out=process.env.TEST_ARTIFACT_DIR||'/tmp/k3g-restore';fs.mkdirSync(out,{recursive:true});
async function geometry(p){return p.evaluate(()=>{
 const card=document.querySelector('#supportScreen .support-card'),button=document.getElementById('restoreSupporter'),message=document.getElementById('supportEntitlementState');
 const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 return {scroll:[card.scrollTop,document.getElementById('supportScreen').scrollTop,scrollY],button:box(button),message:box(message),clip:box(card),messageFits:message.scrollHeight<=message.clientHeight+1,text:message.textContent};
});}
function visible(g,w,h){assert(g.message.x>=0&&g.message.right<=w+1&&g.message.y>=Math.max(0,g.clip.y)-1&&g.message.bottom<=Math.min(h,g.clip.bottom)+1,'feedback visible in modal and viewport: '+JSON.stringify(g));assert(g.messageFits,'feedback copy fits reserved area');}
function unchanged(a,b){for(let i=0;i<a.scroll.length;i++)assert(Math.abs(a.scroll[i]-b.scroll[i])<=1,'no scroll jump '+JSON.stringify({a,b}));for(const name of ['button','message'])for(const key of ['x','y','w','h'])assert(Math.abs(a[name][key]-b[name][key])<1,'stable '+name+' '+key+' '+JSON.stringify({a,b}));}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [w,h,mobile] of [[390,844,true],[855,384,true],[740,360,true],[1366,768,false],[320,568,true]]){
  for(const outcome of (w===1366||w===320?['backend']:['backend','not_owned','pending','rejected','timeout','unverified_owner','verified_owner','device_unavailable'])){
   const p=await browser.newPage({...mobile?devices['Pixel 7']:{},viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   if(outcome==='timeout')await p.route('**/supporter.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('www/supporter.js','utf8').replace('timeoutMs=15000','timeoutMs=500')}));
   await p.addInitScript(outcome=>{
    const base={source:'google_play',productId:'seamen_pool_supporter'};window.__restoreCalls=0;window.__priceCalls=0;
    localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));
    localStorage.setItem('seamenCue','pokey');localStorage.setItem('seamenTableTheme','pokey');localStorage.setItem('seamenCareer',JSON.stringify({piratesDefeated:{pokey_man:true}}));
    const bridge={getCapabilities:async()=>({protocolVersion:1,purchasesEnabled:false,verificationEnabled:outcome!=='backend',verificationModel:'google_play_device'}),
     checkOwnership:()=>{window.__restoreCalls++;if(window.__restoreCalls===1)return Promise.resolve({...base,status:'verification_unavailable',reason:'server_verification_required'});return new Promise((resolve,reject)=>{window.__finishRestore=(value,error)=>error?reject(Error(error)):resolve({...base,...value});});},
     getProduct:async()=>{window.__priceCalls++;return {...base,purchaseOptionId:'supporter-buy',formattedPrice:'₹129.00'};},
     purchase:()=>{throw Error('Payments must stay disabled');},addListener:()=>({remove:()=>{}})};
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>true,Plugins:{SeamenBilling:bridge}};
   },outcome);
   await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>!SeamenSupporter.getState().busy&&window.__priceCalls===1);
   await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await p.locator('#titleSupport').click();
   const card=p.locator('#supportScreen .support-card');await card.evaluate(el=>el.scrollTop=el.scrollHeight);await p.locator('#restoreSupporter').scrollIntoViewIfNeeded();
   const before=await geometry(p);visible(before,w,h);const saved=await p.evaluate(()=>collectStorage());
   await p.locator('#restoreSupporter').click();await p.waitForFunction(()=>window.__restoreCalls===2);
   assert(await p.locator('#restoreSupporter').isDisabled());assert.equal(await p.locator('#restoreSupporter').getAttribute('aria-busy'),'true');
   assert.equal(await p.locator('#supportEntitlementState').textContent(),'Checking ownership...');assert.equal(await p.locator('#restoreSupporter').textContent(),'Restore Purchases');
   const during=await geometry(p);visible(during,w,h);unchanged(before,during);
   await p.evaluate(()=>{document.getElementById('restoreSupporter').click();void SeamenSupporter.restore();void SeamenSupporter.restore();});assert.equal(await p.evaluate(()=>window.__restoreCalls),2,'duplicate requests coalesce');
   if(outcome!=='timeout')await p.evaluate(outcome=>{
    const result=outcome==='verified_owner'?{status:'verified_owner',source:'google_play_device',verificationModel:'google_play_device',purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+100000}:outcome==='unverified_owner'?{status:'verified_owner',source:'google_play_backend',purchaseState:'PURCHASED',acknowledgementState:'ACKNOWLEDGED',expiresAt:Date.now()+100000}:{status:['backend','device_unavailable'].includes(outcome)?'verification_unavailable':outcome,reason:outcome==='backend'?'server_verification_required':outcome==='device_unavailable'?'play_query_failed':null};
    window.__finishRestore(result,outcome==='rejected'?'Native bridge rejected request':null);
   },outcome);
   await p.waitForFunction(()=>!SeamenSupporter.getState().busy);
   const after=await geometry(p);visible(after,w,h);unchanged(before,after);
   if(outcome==='not_owned')assert(after.text.includes('No Supporter Pack purchase was found'));
   else if(outcome==='pending')assert(after.text.includes('pending'));
   else if(outcome==='verified_owner')assert(after.text.includes('Restore successful'));
   else assert(after.text.includes(outcome==='backend'?'updated Android billing integration':'Ownership could not be verified'),'readable result: '+after.text);
   assert.equal(await p.locator('#supportEntitlementState').getAttribute('role'),'status');assert.equal(await p.locator('#restoreSupporter').getAttribute('aria-describedby'),'supportEntitlementState');
   assert(await p.locator('#restoreSupporter').isEnabled());assert(await p.locator('#purchaseSupporter').isDisabled());assert.equal(await p.evaluate(()=>hasEntitlement('supporter_founder_test')),outcome==='verified_owner');
   assert.deepEqual(await p.evaluate(()=>collectStorage()),saved,'no saved progress/selection changes');assert.equal(await p.evaluate(()=>window.__priceCalls),1,'restore never refreshes price above the action');
   await p.waitForTimeout(300);unchanged(after,await geometry(p));assert.equal(await p.locator('#supportEntitlementState').textContent(),after.text,'result remains readable after async completion');
   const copy=await p.locator('#supportScreen').textContent();assert(copy.includes('Chapter 4 and beyond'));assert(!/chapters?\s*4\s*[–—-]\s*6/i.test(copy));
   if(outcome==='backend')await p.screenshot({path:`${out}/restore-${w}x${h}.png`});
   assert.deepEqual(errors,[]);await p.close();console.log(`PASS ${w}x${h} ${outcome}: real-global bridge response fixture, visible checking/persistent result, no scroll/geometry jump, coalesced requests and unchanged saves`);
  }
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

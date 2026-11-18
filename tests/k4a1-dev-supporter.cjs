'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),url=process.env.TEST_URL||'http://127.0.0.1:8020/',release=process.env.RELEASE_TEST_URL||'http://127.0.0.1:8021/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const blocked of [false,true])for(const complete of [false,true]){
  const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({blocked,complete})=>{
   localStorage.clear();localStorage.setItem('seamenCareer',JSON.stringify({schema:7,chapters:{chapter_3:{completed:complete},chapter_4:{introSeen:true,lucy_firChallengeSeen:true}},piratesDefeated:{vile_hedgehog:true},poolSchoolCompleted:[1,2,3,4,5],earnedAchievements:['pool_school_star'],unlockedCosmetics:['cues:debugger'],framesPlayed:17,framesWon:10}));
   if(blocked)Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}});
  },{blocked,complete});
  await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  // A denied-storage browser cannot load the fixture, so install the already-parsed
  // career in memory as an imported save would; the tested button still uses its real handler.
  if(blocked)await p.evaluate(complete=>{career.chapters.chapter_3.completed=complete;career.chapters.chapter_4.introSeen=true;career.chapters.chapter_4.lucy_firChallengeSeen=true;career.poolSchoolCompleted=[1,2,3,4,5];career.unlockedCosmetics=['cues:debugger'];},complete);
  const before=await p.evaluate(()=>JSON.stringify(career));
  await p.locator('#titleSettings').click();await p.keyboard.press('k');assert(await p.locator('details').first().evaluate(el=>el.open));
  await p.locator('#devGrantSupporter').click();
  const feedback=p.locator('#devSupporterFeedback');assert(await feedback.isVisible());assert.match(await feedback.textContent(),/granted for this tab/);
  assert.equal(await p.evaluate(()=>hasEntitlement('supporter_founder_test')),true);assert.equal(await p.evaluate(()=>chapterIsUnlocked('chapter_4')),complete);
  assert.match(await feedback.textContent(),complete?/Chapter 4 is available now/:/complete/);
  const bounds=await feedback.boundingBox();assert(bounds.y>=-1&&bounds.y+bounds.height<=901,'feedback next to control remains in the viewport '+JSON.stringify(bounds));
  assert.equal(await p.evaluate(()=>JSON.stringify(career)),before,'grant preserves career byte representation');assert(!await p.evaluate(()=>SeamenSupporter.hasVerifiedOwnership()),'not a confirmed purchase');
  if(!blocked)assert.equal(await p.evaluate(()=>localStorage.getItem('seamenEntitlements')),null,'grant does not persist ownership');
  if(complete){await p.evaluate(()=>{profiledPirateId='vile_hedgehog';startProfiledPirate();});await p.waitForFunction(()=>scenePhase==='ready');assert.equal(await p.evaluate(()=>activeSceneId),'chapter_4_vile_hedgehog_challenge');await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;while(scenePhase==='ready')advanceScene();});await p.waitForFunction(()=>scenePhase==='idle');await p.evaluate(()=>{showTitleScreen();});await p.locator('#titleSettings').click();await p.keyboard.press('k');}
  const beforeRevoke=await p.evaluate(()=>JSON.stringify(career));await p.locator('#devRevokeSupporter').click();assert.match(await feedback.textContent(),/revoked/);assert(!await p.evaluate(()=>hasEntitlement('supporter_founder_test')));assert(!await p.evaluate(()=>chapterIsUnlocked('chapter_4')));assert.equal(await p.evaluate(()=>JSON.stringify(career)),beforeRevoke,'revocation preserves Chapter 4/story progress');
  // Other controls and the persistent developer API retain their existing semantics.
  if(!blocked){await p.evaluate(()=>{setDevEntitlement('supporter_founder_test',true);});assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('seamenEntitlements')).owned.supporter_founder_test));await p.evaluate(()=>{setDevEntitlement('supporter_founder_test',false);});}
  assert.deepEqual(errors,[]);await p.close();console.log(`PASS developer buttons, visible feedback, immediate Chapter 4 gate, save preservation: storage=${blocked?'denied':'available'}, Chapter 3=${complete}`);
 }
 // Tab-only panel grant disappears after reload; story progress does not.
 const p=await b.newPage({serviceWorkers:'block'});await p.goto(url);await p.evaluate(()=>{localStorage.removeItem('seamenEntitlements');career.chapters.chapter_3.completed=true;saveCareer();changeDevSupporterAccess(true);});assert(await p.evaluate(()=>chapterIsUnlocked('chapter_4')));await p.reload();assert(!await p.evaluate(()=>hasEntitlement('supporter_founder_test')));assert(await p.evaluate(()=>career.chapters.chapter_3.completed));await p.close();console.log('PASS tab-only grant reset, stored story progress retained');
 for(const native of [false,true]){
  const q=await b.newPage({serviceWorkers:'block'});if(native)await q.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>false};});await q.goto(native?url:release);const result=await q.evaluate(()=>{entitlements.owned.supporter_founder_test=true;devSupporterSessionOverride=true;const before=JSON.stringify(career),grant=changeDevSupporterAccess(true);return {grant,owned:hasEntitlement('supporter_founder_test'),unchanged:before===JSON.stringify(career),message:document.getElementById('devSupporterFeedback')?.textContent};});assert.equal(result.grant,false);assert(!result.owned);assert(result.unchanged);if(native)assert.match(result.message,/rejected.*native/);await q.close();console.log('PASS '+(native?'native':'release')+' rejects developer grant without ownership/progression change');
 }
 // File-protocol resolver unit cases: do not confuse these with actual Chrome file navigation.
 const game=fs.readFileSync(path.join(root,'www/game.js'),'utf8'),functionText=game.slice(game.indexOf('function hasEntitlement('),game.indexOf('function saveEntitlements('));
 for(const native of [false,true])for(const development of [false,true]){const ctx={location:{protocol:'file:'},IS_DEVELOPMENT_BUILD:development,nativeSupporterRuntime:()=>native,SeamenSupporter:{hasVerifiedOwnership:()=>false},devSupporterSessionOverride:true,entitlements:{owned:{}}};vm.createContext(ctx);vm.runInContext(functionText,ctx);assert.equal(vm.runInContext("hasEntitlement('supporter_founder_test')",ctx),development&&!native);}
 const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
 const detector=html.slice(html.indexOf('function isNativeContainer(){'),html.indexOf('  window.SeamenRuntime='));
 for(const protocol of ['file:','http:','capacitor:','ionic:']){const ctx={window:{},location:{protocol}};vm.createContext(ctx);vm.runInContext(detector,ctx);assert.equal(vm.runInContext('isNativeContainer()',ctx),['capacitor:','ionic:'].includes(protocol));}
 const worker=html.slice(html.lastIndexOf('(function(){\n  var nativeContainer'),html.lastIndexOf('</script></body>'));
 for(const protocol of ['file:','http:']){let registered=0,load;const ctx={location:{protocol},navigator:{serviceWorker:{register:()=>{registered++;return Promise.resolve();}}},window:{addEventListener:(event,fn)=>{load=fn;}},console};vm.createContext(ctx);vm.runInContext(worker,ctx);if(load)load();assert.equal(registered,protocol==='http:'?1:0);}
 console.log('PASS file-protocol resolver unit cases; real file:// navigation N/T: managed Chromium ERR_BLOCKED_BY_ADMINISTRATOR');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

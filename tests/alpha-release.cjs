// Run against the actual staged release, not a development-mode replacement.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8011/';
const baseline=execFileSync('git',['show','2318acc:www/game.js'],{encoding:'utf8',maxBuffer:4*1024*1024});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const fixture of ['new','chapter1','chapter2','chapter3','school']){
  const page=await browser.newPage({serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const native={getCapabilities:async()=>({protocolVersion:1,verificationEnabled:true,verificationModel:'google_play_device',purchasesEnabled:false}),checkOwnership:async()=>({status:'not_owned',source:'google_play',productId:'seamen_pool_supporter'}),getProduct:async()=>({status:'verification_unavailable'}),purchase:async()=>{throw Error('Payment called');},addListener:()=>({remove(){}})};window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>true,Plugins:{SeamenBilling:native}};});
  await page.route('**/game.js',route=>route.fulfill({contentType:'application/javascript',body:baseline}));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.evaluate(fixture=>{
   if(fixture!=='new'){
    career.framesPlayed=17;career.framesWon=10;career.shotsTaken=151;career.piratesDefeated={dave:true,simon:true,holly:true,mick:true,blackball:true};
    career.chapters.chapter_1.completed=true;career.chapters.chapter_1.introSeen=true;career.chapters.chapter_1.endingSeen=true;career.blackballEndingSeen=true;
    career.unlockedCosmetics.push('cues:debugger');localStorage.setItem('seamenCue','debugger');localStorage.setItem('seamenTableTheme','classic');
    if(['chapter2','chapter3','school'].includes(fixture)){career.chapters.chapter_2={unlocked:true,completed:true,introSeen:true,endingSeen:true,bossIntroSeen:true};career.piratesDefeated.chapter2_boss=true;}
    if(['chapter3','school'].includes(fixture))career.chapters.chapter_3={unlocked:true,completed:false,introSeen:true,barleyChallengeSeen:true};
    if(fixture==='school'){career.poolSchoolCompleted=[1,2,3,4,5];career.earnedAchievements.push('daves_star_pupil');}
   }
   // A saved/imported developer flag must never become native purchase authority.
   localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));saveCareer();
  },fixture);
  await page.reload({waitUntil:'networkidle'});
  const before=await page.evaluate(()=>({storage:collectStorage(),career:JSON.parse(JSON.stringify(career)),portable:collectPortableSave()}));
  assert.equal(before.portable.gameVersion,'0.17.51');
  await page.unroute('**/game.js');await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.evaluate(()=>BUILD_MODE),'release');assert.equal(await page.evaluate(()=>APP_VERSION),'0.17.52');assert.equal(await page.evaluate(()=>APP_BUILD_NUMBER),1582);
  assert.deepEqual(await page.evaluate(()=>collectStorage()),before.storage,'baseline storage survives upgrade');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(career))),before.career,'career/trophies/chapters survive upgrade');
  assert(!await page.evaluate(()=>hasEntitlement('supporter_founder_test')),'editable imported flag grants nothing');
  assert.equal(await page.evaluate(()=>setDevEntitlement('supporter_founder_test',true)),false);
  await page.evaluate(save=>applyPortableSave(save),before.portable);await page.reload({waitUntil:'networkidle'});
  assert.deepEqual(await page.evaluate(()=>collectStorage()),before.storage,'0.17.51 portable save round-trip on release');
  const after=await page.evaluate(()=>collectPortableSave());assert.equal(after.gameVersion,'0.17.52');assert.equal(after.saveSchema,before.portable.saveSchema);assert.deepEqual(after.data,before.portable.data);
  assert.equal(await page.evaluate(()=>typeof window.SeamenTheatreQA),'undefined');
  await page.locator('#enterTavern').click();await page.waitForTimeout(2700);
  assert(await page.locator('#devTriggerPlayerWin').isHidden());
  await page.keyboard.press('i');await page.keyboard.press('y');await page.keyboard.press('y');await page.keyboard.press('y');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(career))),before.career,'release shortcut does not unlock progress');
  await page.locator('#titleSupport').click();assert(await page.locator('#purchaseSupporter').isDisabled());
  await page.locator('#restoreSupporter').click();await page.waitForFunction(()=>!SeamenSupporter.getState().busy);
  assert((await page.locator('#supportEntitlementState').textContent()).includes('No Supporter Pack purchase was found'));
  assert.deepEqual(errors,[]);await page.close();console.log('PASS actual release upgrade + portable-save compatibility: '+fixture+'; saves/selections/trophies unchanged, no local ownership or developer access');
 }
 // Real release startup/menu/scene requests and local frame in mobile portrait and Pixel-sized landscape.
 for(const [width,height] of [[390,844],[855,384]]){
  const page=await browser.newPage({...devices['Pixel 7'],viewport:{width,height},screen:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto(url,{waitUntil:'networkidle'});await page.locator('#enterTavern').click();await page.waitForTimeout(2700);
  await page.locator('#titlePlay').click();await page.waitForFunction(()=>scenePhase==='ready');assert.equal(await page.evaluate(()=>activeSceneId),'chapter_1_intro');
  for(let i=0;i<120&&await page.evaluate(()=>!!activeSceneId);i++){await page.waitForFunction(()=>scenePhase==='ready');await page.evaluate(()=>{completeSceneTyping();advanceScene();});}
  await page.waitForFunction(()=>!document.querySelector('.scene-handoff-cover'));
  await page.evaluate(()=>showTitleScreen());await page.locator('#titleLocalMultiplayer').click();await page.getByRole('button',{name:'Start game',exact:true}).click();await page.locator('#confirmCue').click();
  await page.locator('#shoot').click();await page.waitForFunction(()=>!moving&&playHistory.length>0,null,{timeout:20000});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await page.close();console.log(`PASS actual release ${width}x${height}: main menu, Chapter 1 Theatre, local placement/shot, no missing requested assets`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

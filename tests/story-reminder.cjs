const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8007/';
const messages=[
 'Get your bearings: beat each tavern opponent to reach the famous pool champion Captain Blackball, then watch the rest of the story unfold...',
 'Time to begin chapter 2! Scroll down in the story mode menu to get started.',
 'Find out who beckoned you to this strange land.',
 'Investigate the new lead for the seemingly prestigious golden cue.',
 'Progress to chapter 4 to continue your adventure!',
 'Explore the new fiery realm to continue your quest for the seemingly prestigious golden cue.',
 "Begin chapter 5 once it's available to continue your adventure!"
];
async function finishStory(p){
 for(let i=0;i<220;i++){
  await p.waitForFunction(()=>scenePhase==='ready'||scenePhase==='idle');
  if(!await p.evaluate(()=>activeSceneId)){await p.waitForFunction(()=>!document.querySelector('.scene-handoff-cover'));return;}
  await p.evaluate(()=>{completeSceneTyping();advanceScene();});
 }
 throw Error('Story did not finish');
}
async function expectMessage(p,index){assert.equal(await p.locator('#storyProgressReminder').textContent(),messages[index]);}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 await expectMessage(p,0);
 const results=await p.evaluate(expected=>{
  const saved=JSON.stringify(career),stored=JSON.stringify(collectStorage());
  const fixtures=[
   ['fresh',{},0],
   ['Chapter 1 ongoing',{piratesDefeated:{'1':true,'2':true},chapters:{chapter_1:{introSeen:true}}},0],
   ['Blackball won',{piratesDefeated:{'5':true}},1],
   ['legacy Blackball record',{pirateRecords:{'5':{wins:1}}},1],
   ['completed Chapter 1',{chapters:{chapter_1:{completed:true}}},1],
   ['unlocked Chapter 2 is not started',{chapters:{chapter_1:{completed:true},chapter_2:{unlocked:true}}},1],
   ['Chapter 2 intro watched',{chapters:{chapter_2:{introSeen:true}}},2],
   ['legacy Chapter 2 loss',{pirateRecords:{sandy:{losses:1}}},2],
   ['Chapter 2 victory',{piratesDefeated:{sandy:true}},2],
   ['Mr Wiggles won',{piratesDefeated:{chapter2_boss:true}},3],
   ['Mr Wiggles record',{pirateRecords:{chapter2_boss:{wins:1}}},3],
   ['Chapter 2 complete, Chapter 3 unlocked',{chapters:{chapter_2:{completed:true},chapter_3:{unlocked:true}}},3],
   ['Chapter 3 intro watched',{chapters:{chapter_3:{introSeen:true}}},3],
   ['legacy Chapter 3 loss',{pirateRecords:{barley:{losses:1}}},3],
   ['Chapter 3 ongoing',{piratesDefeated:{barley:true,legolass:true}},3],
   ['Chapter 3 complete, optional pair absent',{chapters:{chapter_3:{completed:true}},piratesDefeated:{blockbeard:true}},4],
   ['Chapter 3 complete, optional pair defeated',{chapters:{chapter_3:{completed:true}},piratesDefeated:{gimlet:true,bam_bam:true}},4],
   ['legacy Blockbeard record',{pirateRecords:{blockbeard:{wins:1}}},4],
   ['legacy Chapter 3 ending',{chapters:{chapter_3:{endingSeen:true}}},4],
   ['School, purchases, cosmetics, bonus opponents are not story progress',{lifetimePremium:true,poolSchoolCompleted:[1,2,3,4,5],unlockedCosmetics:['cues:golden'],piratesDefeated:{'6':true,'7':true,pokey_man:true,izzy:true,gimlet:true,bam_bam:true}},0],
   ['optional Chapter 3 encounters alone',{pirateRecords:{gimlet:{wins:2},bam_bam:{losses:1}}},0],
   ['Chapter 4 absent: ignore unrecognised future save data',{chapters:{chapter_3:{completed:true},chapter_4:{completed:true,introSeen:true,unlocked:true}}},4],
   ['future save fields cannot skip a fresh campaign',{chapters:{chapter_4:{completed:true,introSeen:true}}},0],
   ['completed Chapter 3 outranks earlier entries',{chapters:{chapter_2:{introSeen:true},chapter_3:{completed:true}}},4]
  ];
  const checked=[];
  for(const [name,fixture,index] of fixtures){const c={...defaultCareer(),...fixture},before=JSON.stringify(c),actual=resolveStoryReminder(c);if(actual!==expected[index])throw Error(name+': '+actual);if(JSON.stringify(c)!==before)throw Error('Resolver mutated '+name);checked.push(name);}
  // Future-only catalogue fixtures stay outside CHAPTERS/PIRATES and all live saves.
  const four={id:'chapter_4',mainPirates:['fixture_four_boss'],boss:'fixture_four_boss',unlockRule:{type:'entitlement',entitlement:'supporter_founder_test'}};
  const pirates=[...PIRATES,{id:'fixture_four_boss',chapter:'chapter_4',campaignRole:'main',playable:true}];
  const catalogue={...CHAPTERS,chapter_4:four};
  const c={...defaultCareer(),chapters:{chapter_3:{completed:true},chapter_4:{introSeen:true,unlocked:true}}};
  const entitlement=entitlements.owned.supporter_founder_test;
  try{
   delete entitlements.owned.supporter_founder_test;
   if(resolveStoryReminder(c,catalogue,pirates)!==expected[4])throw Error('Locked future chapter must not become ongoing');
   entitlements.owned.supporter_founder_test=true;
   if(resolveStoryReminder({...c,chapters:{chapter_3:{completed:true},chapter_4:{unlocked:true}}},catalogue,pirates)!==expected[4])throw Error('Future unlock alone must not mean started');
   if(resolveStoryReminder(c,catalogue,pirates)!==expected[5])throw Error('Integrated entitled Chapter 4 ongoing');
   c.chapters.chapter_4.completed=true;
   if(resolveStoryReminder(c,catalogue,pirates)!==expected[6])throw Error('Integrated Chapter 4 complete');
   delete c.chapters.chapter_4.completed;c.piratesDefeated.fixture_four_boss=true;
   if(resolveStoryReminder(c,catalogue,pirates)!==expected[6])throw Error('Future authoritative boss victory');
   for(const guard of [{postRelease:true},{foundationOnly:true},{mainPirates:[]}]){
    if(resolveStoryReminder(c,{...catalogue,chapter_4:{...four,...guard}},pirates)!==expected[4])throw Error('Unavailable future chapter surfaced');
   }
   if(resolveStoryReminder(c,catalogue,pirates.map(p=>p?.id==='fixture_four_boss'?{...p,playable:false}:p))!==expected[4])throw Error('Non-playable future content surfaced');
  }finally{if(entitlement===undefined)delete entitlements.owned.supporter_founder_test;else entitlements.owned.supporter_founder_test=entitlement;}
  if(JSON.stringify(career)!==saved||JSON.stringify(collectStorage())!==stored)throw Error('Resolver altered live saves or entitlement');
  return checked;
 },messages);
 console.log(`PASS ${results.length} current/legacy progression fixtures, future catalogue/entitlement gates, priority and resolver save isolation`);
 // Exercise the real result/scene/navigation paths with controlled match outcomes.
 await p.evaluate(()=>{chapterState('chapter_1').introSeen=true;saveCareer();});
 async function winBoss(id){await p.evaluate(id=>{showTitleScreen();const pir=pirateById(id);pendingPirateStart={level:pir.legacyLevel??pir.aiLevel,pirateId:id,playerName:'Reminder QA'};beginPendingPirateMatch(true);devForcedWin=true;finishFrame(1,'Controlled QA result','Victory');devForcedWin=false;},id);await finishStory(p);}
 await winBoss('blackball');await expectMessage(p,1);await p.evaluate(()=>showTitleScreen());await expectMessage(p,1);
 await p.locator('#titlePlay').click();assert(await p.locator('#storyProgressReminder').isHidden());assert.equal(await p.locator('#piratePlaceholder #storyProgressReminder').count(),0);
 await p.locator('#beginChapter2').click();await finishStory(p);await p.locator('#pirateBack').click();await expectMessage(p,2);
 await winBoss('chapter2_boss');await expectMessage(p,3);assert(await p.locator('#titleScreen').isVisible());
 await p.locator('#titlePlay').click();await p.locator('[data-pirate-id="barley"]').click();await finishStory(p);assert(await p.locator('#gameApp').isVisible());
 await p.evaluate(()=>showTitleScreen());await expectMessage(p,3);
 await winBoss('blockbeard');await expectMessage(p,4);assert.equal(await p.evaluate(()=>pirateDefeated('gimlet')||pirateDefeated('bam_bam')),false);
 const beforeReload=await p.evaluate(()=>({career:JSON.stringify(career),storage:collectStorage()}));
 await p.reload({waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await expectMessage(p,4);
 assert.equal(await p.evaluate(()=>JSON.stringify(career)),beforeReload.career);assert.deepEqual(await p.evaluate(()=>collectStorage()),beforeReload.storage);
 assert.deepEqual(await p.evaluate(()=>Object.keys(CHAPTERS)),['chapter_1','chapter_2','chapter_3','chapter_4']);
 assert.equal(await p.locator('#tutorialModal').count(),0);assert.equal(await p.evaluate(()=>APP_VERSION),'1.0.0');assert.equal(await p.evaluate(()=>APP_BUILD_NUMBER),1595);
 for(const [label,raw,index] of [
  ['legacy Blackball win',{pirateRecords:{'5':{wins:1}}},1],
  ['legacy Chapter 2 encounter',{pirateRecords:{sandy:{wins:0,losses:1}}},2],
  ['legacy Mr Wiggles win',{pirateRecords:{chapter2_boss:{wins:1}}},3],
  ['legacy Chapter 3 encounter',{pirateRecords:{barley:{wins:0,losses:1}}},3],
  ['legacy Blockbeard win',{pirateRecords:{blockbeard:{wins:1}}},4]
 ]){
  await p.evaluate(raw=>localStorage.setItem(CAREER_KEY,JSON.stringify({...defaultCareer(),...raw})),raw);
  await p.reload({waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await expectMessage(p,index);
  assert.deepEqual(await p.evaluate(()=>career.pirateRecords),raw.pirateRecords,label+' records retained');
 }
 console.log('PASS reload of five existing saves with missing chapter flags uses established migration and correct reminder');
 assert.deepEqual(errors,[]);console.log('PASS live Blackball/Chapter 2 entry/Mr Wiggles/Chapter 3 entry/Blockbeard updates, main-menu-only placement, persistent reload and unchanged saves; no future access, tutorials or runtime errors');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

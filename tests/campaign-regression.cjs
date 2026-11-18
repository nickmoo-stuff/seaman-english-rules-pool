const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:480,height:900}}),errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await p.goto((process.env.TEST_URL||'http://127.0.0.1:8000/'),{waitUntil:'networkidle'});
 // Existing-career fixture, including Chapters 1–3 and separately stored entitlement.
 const before=await p.evaluate(()=>{career.framesPlayed=12;career.framesWon=8;career.shotsTaken=123;career.piratesDefeated={'1':true};career.chapters.chapter_1.completed=true;career.chapters.chapter_1.introSeen=true;career.chapters.chapter_1.endingSeen=true;career.blackballEndingSeen=true;career.chapters.chapter_2={unlocked:true,completed:true,introSeen:true,endingSeen:true};career.chapters.chapter_3={unlocked:true,completed:false,introSeen:true,barleyChallengeSeen:true};career.unlockedCosmetics.push('cues:debugger');setDevEntitlement('supporter_founder_test',true);saveCareer();return {career:JSON.parse(JSON.stringify(career)),storage:collectStorage()};});
 await p.reload({waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 if(process.env.TEST_LAYOUT==='landscape'){await p.locator('#titleSettings').click();await p.locator('#settingsLayoutControl [data-gameplay-layout=landscape]').click();await p.locator('#closeSettings').click();}
 // Navigate through the real roster/catalogue in the selected layout.
 await p.locator('#titlePlay').click();await p.locator('#openPoolSchool').click();
 assert.equal(await p.locator('#poolSchoolLessons button:enabled').count(),5);
 await p.locator('#poolSchoolLessons button').nth(1).click();
 await p.evaluate(()=>{setAngleDeg(168.8);powerEl.value=50;});
 await p.locator('#shoot').click();await p.waitForFunction(()=>state.groups[1]==='yellow'&&!moving,{},{timeout:15000});
 assert(!(await p.evaluate(()=>career.poolSchoolCompleted.includes(2))),'yellow claim alone does not pass');
 await p.evaluate(()=>{
  const target=balls.find(b=>b.type==='black'),c=cue();let plan=null;
  for(const [px,py] of pockets){const len=Math.hypot(target.x-px,target.y-py),gx=target.x+(target.x-px)/len*ballR*2,gy=target.y+(target.y-py)/len*ballR*2,deg=Math.atan2(gy-c.y,gx-c.x)*180/Math.PI;
   for(const power of [15,20,25,30,35,40,45,50])for(const delta of [0,-.3,.3,-.6,.6]){const r=aiDryRunShot(deg+delta,power,12,1/120);if(!plan&&r.first==='black'&&r.pots.includes('black')&&!r.cuePotted)plan={deg:deg+delta,power};}}
  if(!plan)throw Error('No legal black plan');setAngleDeg(plan.deg);powerEl.value=plan.power;beginShot();let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics timeout');endShot();
 });
 assert(await p.evaluate(()=>career.poolSchoolCompleted.includes(2)));

 assert(await p.locator('#gameApp').isVisible());assert.equal(await p.evaluate(()=>schoolSession.phase),'complete');
 await p.reload({waitUntil:'networkidle'});
 const after=await p.evaluate(()=>({career:JSON.parse(JSON.stringify(career)),storage:collectStorage(),supporter:hasEntitlement('supporter_founder_test')}));
 assert(after.supporter);for(const key of Object.keys(before.career).filter(k=>!['poolSchoolCompleted'].includes(k)))assert.deepEqual(after.career[key],before.career[key],`existing save preserved: ${key}`);
 assert(after.career.poolSchoolCompleted.includes(2));
 for(const key of Object.keys(before.storage).filter(k=>/entitlement|supporter/i.test(k)))assert.deepEqual(after.storage[key],before.storage[key]);
 // Representative post-training match setup and real physics/rule resolution per chapter.
 // Bypass only story presentation; do not fabricate shot outcomes or a campaign victory.
 for(const id of ['dave','sandy','barley']){
 const result=await p.evaluate(id=>{showTitleScreen();const pir=pirateById(id);pendingPirateStart={level:pir.legacyLevel??pir.aiLevel,pirateId:id,playerName:'Regression pupil'};beginPendingPirateMatch(true);const before=career.shotsTaken;confirmCue.click();setAngleDeg(180);powerEl.value=65;beginShot();let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics timeout');endShot();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);return {mode:gameMode,id:currentPirateId,delta:career.shotsTaken-before,eligible:frameStatsEligible,history:playHistory.length,school:schoolSession};},id);
 assert.deepEqual({...result,history:1},{mode:'pirate',id,delta:1,eligible:true,history:1,school:null});assert(result.history>0);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log(`PASS: ${process.env.TEST_LAYOUT||'portrait'} UI lesson selection and real-time pot; existing career/Chapters 1–3/cosmetics/supporter preservation across reload; Chapter 1, 2 and 3 representative match setup and engine-resolved shots; no page errors or failed asset requests.`);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'),url=process.env.TEST_URL||'http://127.0.0.1:8000/',out=process.env.TEST_ARTIFACT_DIR||'/tmp/k4-qa';fs.mkdirSync(out,{recursive:true});
const amendment=JSON.parse(fs.readFileSync(path.join(root,'docs/K4/K4A.2-APPROVED-AMENDMENTS.json'))).additionalYouthLine;
const source=fs.readFileSync(path.join(root,'docs/K4/K4-APPROVED-DIALOGUE-VERBATIM.txt'),'utf8');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),errors=[],bad=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 assert.equal(await p.evaluate(()=>APP_VERSION+' / '+APP_BUILD_NUMBER),'1.0.0 / 1595');
 const dialogue=await p.evaluate(()=>Object.values(SeamenChapter4.scenes).filter(s=>!s.id.includes('spinball_wizard')).flatMap(s=>s.lines));
 for(const line of dialogue){assert(source.includes(line.text)||line.text===amendment,`verbatim authored text: ${line.text}`);assert(!line.text.includes('Dialogue prompt:'));}
 const expected=[];
 for(const raw of source.split('\n')){const line=raw.trim(),m=line.match(/^(Vile Blue Hedgehog|Blackball|Filthy youth with a phone|Socks and Sandals|The Most Evil Creature Imaginable|Lucy)(: |\. )(.*)$/);if(m)expected.push(m[3].replace(' [Vile Blue Hedgehog fades away, scene ends]',''));else if(line.startsWith('Challenge / acceptance line: '))expected.push(line.slice('Challenge / acceptance line: '.length));else if(line==='Dialogue prompt: Bork! Bork!')expected.push('Bork! Bork!');}
 expected.splice(expected.indexOf('Nahhhhh mush')+1,0,amendment);
 assert.deepEqual(dialogue.map(l=>l.text),expected,'all authored spoken lines in source order, without omission');
 assert.equal(dialogue.filter(l=>l.speaker==='Blackball.').length,1,'preserve the authored anomalous character label punctuation');
 assert.equal(await p.evaluate(()=>SeamenChapter4.chapter.mainPirates.length),5);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/K4/asset-manifest.json')));
 for(const a of manifest.assets){const bytes=fs.readFileSync(path.join(root,'www/assets/k4',a.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);}
 console.log('PASS authored dialogue text and all 10 approved artwork encodings preserved; five story opponents');
 const gates=await p.evaluate(()=>{
  const fresh=chapterIsUnlocked('chapter_4');chapterState('chapter_4').unlocked=true;const imported=chapterIsUnlocked('chapter_4');
  chapterState('chapter_3').completed=true;setDevEntitlement('supporter_founder_test',false);const noEntitlement=chapterIsUnlocked('chapter_4');
  setDevEntitlement('supporter_founder_test',true);const owned=chapterIsUnlocked('chapter_4');
  const order=SeamenChapter4.opponents.map(p=>pirateIsOpen(p));return {fresh,imported,noEntitlement,owned,order,optional:pirateIsOpen('spinball_wizard')};
 });
 assert.deepEqual(gates,{fresh:false,imported:false,noEntitlement:false,owned:true,order:[true,false,false,false,false],optional:true});
 console.log('PASS fresh/imported-save entitlement gates, sequential ladder and independent optional match');
 // Preserve existing save fields while extending the campaign registry.
 const saved=await p.evaluate(()=>{career.shotsTaken=42;career.poolSchoolCompleted=[1,2,3,4,5];career.unlockedCosmetics=['cues:debugger'];career.earnedAchievements.push('pool_school_star');saveCareer();return {shots:career.shotsTaken,school:career.poolSchoolCompleted,cosmetics:career.unlockedCosmetics};});
 await p.reload({waitUntil:'networkidle'});assert.deepEqual(await p.evaluate(()=>({shots:career.shotsTaken,school:career.poolSchoolCompleted,cosmetics:career.unlockedCosmetics})),saved);
 await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 await p.evaluate(()=>{for(const s of Object.values(SeamenChapter4.scenes)){s.typewriterMs=0;s.finishFadeMs=1;}});
 async function finishScene(){
  await p.waitForFunction(()=>scenePhase==='ready');
  await p.evaluate(()=>{while(activeSceneId&&scenePhase==='ready'){advanceScene();}});
  await p.waitForFunction(()=>scenePhase==='idle');await p.waitForFunction(()=>!document.querySelector('.scene-handoff-cover'));
 }
 const ids=await p.evaluate(()=>SeamenChapter4.chapter.mainPirates);
 for(const id of ids){
  await p.evaluate(id=>{profiledPirateId=id;startProfiledPirate();},id);
  await p.waitForFunction(()=>scenePhase==='ready');
  assert.equal(await p.evaluate(()=>activeSceneId),'chapter_4_'+id+'_challenge');
  await p.screenshot({path:path.join(out,id+'-intro.png')});
  const startMusic=await p.evaluate(()=>k4Runtime.musicStarts);
  await finishScene();assert.equal(await p.evaluate(()=>currentPirateId),id);
  await p.evaluate(()=>{clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);});
  if(id==='lucy_fir')assert.equal(await p.evaluate(()=>k4Runtime.musicStarts),startMusic,'intro → match never restarts Lucy music');
  // A deterministic fixture sets the final black position; actual engine pots it and decides victory.
  const result=await p.evaluate(()=>{
   clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);state.breakShot=false;state.groups={1:'red',2:'yellow'};state.player=1;placementMode='none';
   for(const b of balls){b.vx=b.vy=0;b.potted=b.type!=='white'&&b.type!=='black';}
   const c=cue(),black=balls.find(b=>b.type==='black');c.x=CENTRE_X;c.y=T+200;c.potted=false;black.x=CENTRE_X;black.y=T+80;black.potted=false;
   setAngleDeg(270);powerEl.value=20;const before=career.framesWon;beginShot();let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics did not settle');endShot();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
   return {winner:state.winner,won:career.framesWon-before,black:black.potted,white:c.potted,defeated:pirateDefeated(currentPirateId),trophy:career.earnedAchievements.includes('k4_'+currentPirateId)};
  });
  assert.deepEqual(result,{winner:1,won:1,black:true,white:false,defeated:true,trophy:true},id);
  await p.waitForFunction(()=>scenePhase==='ready');
  assert.equal(await p.evaluate(()=>activeSceneId),'chapter_4_'+id+'_victory');
  if(id==='lucy_fir'){
   assert.equal(await p.evaluate(()=>k4Runtime.musicStarts),startMusic);
   await p.evaluate(()=>{const s=sceneById(activeSceneId);activeSceneStep=s.lines.findIndex(l=>l.speaker==='TMECI');renderScene();});
   assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('#genericSceneStage .scene-character:not(.scene-character-leaving)')].map(n=>n.dataset.sceneAsset).sort()),['blackball','lucy_fir','most_evil']);
  }
  await finishScene();
  assert(await p.evaluate(id=>chapterState('chapter_4')[id+'VictorySeen'],id));
 }
 const completion=await p.evaluate(()=>({complete:chapterState('chapter_4').completed,ending:chapterState('chapter_4').endingSeen,trophies:career.earnedAchievements.filter(x=>x.startsWith('k4_')),table:cosmeticIsUnlocked('tables','lucy_fir'),ch5:chapterIsUnlocked('chapter_5'),allMainTrophy:career.earnedAchievements.includes('campaign_chapter_4')}));
 assert(completion.complete&&completion.ending&&completion.table&&!completion.ch5&&completion.allMainTrophy);assert.equal(completion.trophies.length,5);
 await p.reload({waitUntil:'networkidle'});assert(await p.evaluate(()=>chapterState('chapter_4').endingSeen&&career.earnedAchievements.filter(x=>x.startsWith('k4_')).length===5));
 await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 const replayAwards=await p.evaluate(()=>{
  const before=career.earnedAchievements.filter(x=>x.startsWith('k4_')).slice();pendingPirateStart={level:3,pirateId:'vile_hedgehog',playerName:'Replay QA'};beginPendingPirateMatch(true);clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);state.breakShot=false;state.groups={1:'red',2:'yellow'};state.player=1;placementMode='none';
  for(const b of balls){b.vx=b.vy=0;b.potted=b.type!=='white'&&b.type!=='black';}const c=cue(),black=balls.find(b=>b.type==='black');Object.assign(c,{x:CENTRE_X,y:T+200,potted:false});Object.assign(black,{x:CENTRE_X,y:T+80,potted:false});setAngleDeg(270);powerEl.value=20;beginShot();let n=0;while(!allStopped()&&n++<8000)step(1/120);endShot();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
  return {before,after:career.earnedAchievements.filter(x=>x.startsWith('k4_')),winner:state.winner,cues:SeamenChapter4.chapter.mainPirates.every(id=>cosmeticIsUnlocked('cues',id))};
 });assert.deepEqual(replayAwards.before,replayAwards.after);assert.equal(replayAwards.winner,1);assert(replayAwards.cues);await finishScene();
 console.log('PASS all 10 real Theatre handoffs, five engine-resolved legal black wins, trophies/rewards, Lucy outro cast, reload persistence and Chapter 5 absent');
 // AI characteristics and effects are tested through real beginShot, including AI strikes.
 for(const id of ids){
  const shotResult=await p.evaluate(id=>{
   pendingPirateStart={level:pirateById(id).aiLevel,pirateId:id,playerName:'K4 QA'};beginPendingPirateMatch(true);clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
   placementMode='none';state.player=2;setAngleDeg(180);powerEl.value=45;k4UpdateEffects(performance.now());const cannons=k4Runtime.cannons;beginShot();
   const result={spin:shot.spin,power:Number(powerEl.value),cannons:k4Runtime.cannons-cannons,profile:aiExecutionProfile().label};
   moving=false;shot=null;balls.forEach(b=>{b.vx=b.vy=0;});return result;
  },id);
  assert.deepEqual(shotResult.spin,id==='vile_hedgehog'?{x:0,y:-.7}:id==='socks_sandals'?{x:0,y:.65}:id==='most_evil'?{x:.55,y:0}:{x:0,y:0});
  if(id==='vile_hedgehog')assert.equal(shotResult.power,66);if(id==='lucy_fir'){assert.equal(shotResult.profile,'Lucy Fir');assert.equal(shotResult.cannons,1);}else assert.equal(shotResult.cannons,0);
 }
 // Loss/retry uses normal newFrame and restarts exactly once, without revoking wins.
 const replay=await p.evaluate(()=>{
  const before=k4Runtime.musicStarts;state.frameOver=true;state.winner=2;restartCurrentGame();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
  const count=k4Runtime.musicStarts-before;setDevEntitlement('supporter_founder_test',false);const unlocked=chapterIsUnlocked('chapter_4');placementMode='none';state.player=1;beginShot();
  return {count,unlocked,blocked:!shot,trophies:career.earnedAchievements.filter(x=>x.startsWith('k4_')).length};
 });assert.deepEqual(replay,{count:1,unlocked:false,blocked:true,trophies:5});
 console.log('PASS AI spin/forced power/isolated level-6 tuning; one Lucy cannon per strike; rematch music restart; entitlement expiry blocks shots and retains achievements');
 await p.evaluate(()=>{setDevEntitlement('supporter_founder_test',true);showTitleScreen();});
 for(const [width,height] of [[1366,900],[390,844],[855,384]]){
  await p.setViewportSize({width,height});
  await p.evaluate(()=>{pendingPirateStart={level:6,pirateId:'lucy_fir',playerName:'K4 QA'};beginPendingPirateMatch(true);k4UpdateEffects(performance.now());clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);});
  await p.waitForTimeout(350);
  const layout=await p.evaluate(()=>({pointer:getComputedStyle(document.getElementById('k4MatchEffects')).pointerEvents,flame:getComputedStyle(document.getElementById('k4Flames')).pointerEvents,opacity:document.getElementById('k4MatchEffects').style.backgroundColor,shoot:!shootBtn.hidden,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert.equal(layout.pointer,'none');assert.equal(layout.flame,'none');assert.equal(layout.opacity,'rgba(0, 0, 0, 0.25)');assert(!layout.overflow);assert(layout.shoot);
  await p.screenshot({path:path.join(out,`lucy-${width}x${height}.png`)});
  await p.evaluate(()=>showTitleScreen());
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PASS desktop/mobile portrait/short landscape effects, 25% darkness, non-intercepting overlays, no page errors or failed requests');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

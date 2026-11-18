'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8020/',out=process.env.TEST_ARTIFACT_DIR||'/tmp/k4a2-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 assert(!await p.evaluate(()=>Object.values(SeamenChapter4.scenes).some(s=>s.lines.some(l=>l.speaker==='The Most Evil Creature Imaginable'))));
 assert.equal(await p.evaluate(()=>pirateById('most_evil').name),'The Most Evil Creature Imaginable');
 // Every K4 opponent uses exactly the inherited normal speaker animation.
 for(const id of ['vile_hedgehog','filthy_youth','socks_sandals','most_evil','lucy_fir']){
  await p.evaluate(id=>{showScene('chapter_4_'+id+'_challenge',null,{preview:true});},id);await p.waitForFunction(()=>scenePhase==='ready'&&!document.querySelector('.scene-handoff-cover'));await p.waitForTimeout(1700);
  const motion=await p.evaluate(id=>{
   const s=sceneById(activeSceneId);activeSceneStep=s.lines.findIndex(l=>sceneSpeakerCharacterId(l)===id);renderScene();const opponent=document.querySelector(`[data-scene-asset="${id}"]`),blackball=document.querySelector('[data-scene-asset="blackball"]');
   const talking={name:getComputedStyle(opponent).animationName,duration:getComputedStyle(opponent).animationDuration,blackball:getComputedStyle(blackball).animationName};completeSceneTyping();const finished=getComputedStyle(opponent).animationName;
   activeSceneStep=s.lines.findIndex(l=>sceneSpeakerCharacterId(l)==='blackball');renderScene();const switched={opponent:getComputedStyle(opponent).animationName,blackball:getComputedStyle(blackball).animationName};completeSceneTyping();return {talking,finished,switched};
  },id);
  assert.equal(motion.talking.name,'sceneSpeakerWiggle');assert.equal(motion.talking.duration,'0.34s');assert.equal(motion.finished,'none');assert.equal(motion.switched.opponent,'none');assert.equal(motion.switched.blackball,'sceneSpeakerWiggle');
  await p.evaluate(id=>{const s=sceneById(activeSceneId);s.typewriterMs=1;activeSceneStep=s.lines.findIndex(l=>sceneSpeakerCharacterId(l)===id);renderScene();},id);await p.waitForFunction(()=>!activeSceneTyping);assert.equal(await p.locator(`[data-scene-asset="${id}"]`).evaluate(el=>getComputedStyle(el).animationName),'none','natural typewriter completion stops motion');
  await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;closeScene();});await p.waitForFunction(()=>scenePhase==='idle'&&!document.querySelector('.scene-handoff-cover'));
 }
 console.log('PASS all five opponents: standard 0.34s speaker-only animation, stationary during Blackball speech, stop on completion');
 await p.evaluate(()=>showScene('chapter_4_filthy_youth_challenge',null,{preview:true}));await p.waitForFunction(()=>scenePhase==='ready'&&!document.querySelector('.scene-handoff-cover'));await p.waitForTimeout(1800);
 for(const [width,height] of [[1366,900],[740,360]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(150);
  const anchor=await p.evaluate(()=>{const stage=ensureSceneStage(),point=k4YouthPoint(stage,.73,.15),wave=stage.querySelector('.k4-phone-wave'),root=stage.getBoundingClientRect(),r=wave.getBoundingClientRect(),vapour=stage.querySelector('.k4-vapour');return {distance:Math.hypot(r.x+r.width/2-root.x-point.left,r.y+r.height/2-root.y-point.top),duration:getComputedStyle(vapour).animationDuration,waves:stage.querySelectorAll('.k4-phone-wave').length};});assert(anchor.distance<8,JSON.stringify(anchor));assert.equal(anchor.duration,'12s');assert.equal(anchor.waves,1);
  await p.screenshot({path:path.join(out,`youth-${width}x${height}.png`)});
 }
 const continuity=await p.evaluate(()=>{const first=document.querySelector('.k4-phone-wave');activeSceneStep++;renderScene();return first===document.querySelector('.k4-phone-wave');});assert(continuity,'waves/vapour persist across dialogue beats');
 const vapourMotion=await p.evaluate(()=>{const node=document.querySelector('.k4-vapour.magenta'),anim=node.getAnimations()[0];anim.currentTime=6000;return {opacity:+getComputedStyle(node).opacity,translate:getComputedStyle(node).translate};});assert(vapourMotion.opacity>.3);assert(vapourMotion.translate.startsWith('0px'),'vapour rises vertically');
 assert(await p.evaluate(()=>sceneById(activeSceneId).lines.at(-1).text==='I have a feeling that phone will be making those awful noisewaves throughout this whole match.'));
 await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;closeScene();});await p.waitForFunction(()=>scenePhase==='idle');assert(await p.evaluate(()=>!k4Runtime.youthObserver));
 console.log('PASS Youth phone anchor after resizing, single repeating wave, slower persistent vapour, approved last line and observer cleanup');
 for(const sid of ['chapter_4_most_evil_challenge','chapter_4_most_evil_victory','chapter_4_lucy_fir_victory']){
  await p.evaluate(id=>showScene(id,null,{preview:true}),sid);await p.waitForFunction(()=>scenePhase==='ready'&&!document.querySelector('.scene-handoff-cover'));
  const rainbow=await p.evaluate(()=>{const s=sceneById(activeSceneId);activeSceneStep=s.lines.findIndex(l=>l.speaker==='TMECI');renderScene();completeSceneTyping();const text=blackballStoryText.textContent,colour=getComputedStyle(blackballStoryText).color,bg=getComputedStyle(blackballStoryText).backgroundImage,label=blackballStoryTitle.textContent;activeSceneStep=s.lines.findIndex(l=>l.speaker==='Blackball');renderScene();completeSceneTyping();return {text,expected:s.lines.find(l=>l.speaker==='TMECI').text,colour,bg,label,other:getComputedStyle(blackballStoryText).backgroundImage};});assert.equal(rainbow.text,rainbow.expected);assert(rainbow.bg.includes('linear-gradient'));assert.equal(rainbow.colour,'rgba(0, 0, 0, 0)');assert.equal(rainbow.other,'none');assert(rainbow.label.includes('TMECI'));assert(!rainbow.label.includes('The Most Evil Creature Imaginable'));
  if(sid==='chapter_4_most_evil_challenge'){await p.evaluate(()=>{const s=sceneById(activeSceneId);activeSceneStep=s.lines.findIndex(l=>l.speaker==='TMECI'&&l.text.length>180);renderScene();completeSceneTyping();});await p.waitForTimeout(1700);await p.screenshot({path:path.join(out,'tmeci-rainbow.png')});}
  await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;closeScene();});await p.waitForFunction(()=>scenePhase==='idle');
 }
 console.log('PASS short TMECI label and rainbow text across all three Theatre appearances; other speakers unaffected');
 await p.evaluate(()=>{renderCareer();renderCosmeticCatalogue();});assert.equal(await p.locator('[data-trophy="k4_lucy_fir"]').count(),0);
 const hidden=await p.evaluate(()=>['cues','tables'].map(type=>cosmeticDisplayDef(type,'lucy_fir')));assert(hidden.every(d=>d.name==='???'&&!JSON.stringify(d).includes('Defeat Lucy')));
 const trophy=await p.evaluate(()=>{
  const definition=achievementById('campaign_chapter_4'),base=defaultCareer();base.piratesDefeated={};const stages=[];
  for(const id of SeamenChapter4.chapter.mainPirates){base.piratesDefeated[id]=true;stages.push(definition.test(base));}return {stages,ids:SeamenChapter4.chapter.mainPirates};
 });assert.deepEqual(trophy.stages,[false,false,false,false,true]);assert(!trophy.ids.includes('spinball_wizard'));
 await p.evaluate(()=>{for(const id of SeamenChapter4.chapter.mainPirates)career.piratesDefeated[id]=true;saveCareer();saveCareer();});assert.equal(await p.evaluate(()=>career.earnedAchievements.filter(id=>id==='campaign_chapter_4').length),1);assert.equal(await p.locator('[data-trophy="k4_lucy_fir"]').count(),1);
 await p.reload({waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>career.earnedAchievements.filter(id=>id==='campaign_chapter_4').length),1);
 const imported=await p.evaluate(()=>{const save=collectPortableSave();applyPortableSave(save);return career.earnedAchievements.filter(id=>id==='campaign_chapter_4').length;});assert.equal(imported,1);await p.reload({waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>career.earnedAchievements.filter(id=>id==='campaign_chapter_4').length),1);
 assert.match(await p.evaluate(()=>COSMETICS.cues.vile_hedgehog.description),/blue.*white.*rings/);assert(!/66%|topspin/i.test(await p.evaluate(()=>COSMETICS.cues.vile_hedgehog.description)));
 assert.equal(await p.locator('#chapter5Placeholder').textContent(),'CHAPTER 5 • LOCKEDIn development!');assert.equal(await p.locator('#chapter5Placeholder').getAttribute('aria-disabled'),'true');assert.equal(await p.locator('#chapter5Placeholder').evaluate(el=>el.tagName),'DIV');assert(!await p.evaluate(()=>chapterIsUnlocked('chapter_5')));
 console.log('PASS Lucy trophy/cosmetics concealment, five-main-opponent completion trophy, replay/reload/import idempotence, cosmetic-only cue text and locked Chapter 5 placeholder');
 await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 const effects=await p.evaluate(()=>{setDevEntitlement('supporter_founder_test',true);chapterState('chapter_3').completed=true;pendingPirateStart={level:6,pirateId:'lucy_fir',playerName:'K4A2'};beginPendingPirateMatch(true);clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);k4Runtime.shotAt=1000;
  const opacity=[];for(const time of [1000,1500,2000]){k4UpdateEffects(time);opacity.push(document.getElementById('k4MatchEffects').style.backgroundColor);}
  const geometry=JSON.stringify({L,R,T,B,pocketR,pockets}),samples=k4CannonSamples(48000);let peak=0,energy=0;for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));if(i>=48000)energy+=samples[i]*samples[i];}
  const glowA=k4PocketGlow(0),glowB=k4PocketGlow(377);drawPocket(pockets[0]);return {opacity,geometry,after:JSON.stringify({L,R,T,B,pocketR,pockets}),peak,tailRMS:Math.sqrt(energy/(samples.length-48000)),duration:samples.length/48000,glowA,glowB,pointer:getComputedStyle(document.getElementById('k4MatchEffects')).pointerEvents};
 });assert.deepEqual(effects.opacity,['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0.125)','rgba(0, 0, 0, 0.25)']);assert.equal(effects.geometry,effects.after);assert(effects.peak<=.901&&effects.peak>.89);assert(effects.tailRMS>.01);assert.equal(effects.duration,1.8);assert.notDeepEqual(effects.glowA,effects.glowB);assert.equal(effects.pointer,'none');
 const audio=await p.evaluate(()=>{masterMuted=false;masterLevel=1;const before=k4Runtime.cannons;k4ShotEffect();const first=k4Runtime.cannonAudio;const volume=first.gain.gain.value;k4ShotEffect();const second=k4Runtime.cannonAudio,targets=[],schedule=second.gain.gain.setTargetAtTime.bind(second.gain.gain);second.gain.gain.setTargetAtTime=(value,...args)=>{targets.push(value);return schedule(value,...args);};musicMuted=true;updateMusicVolume();masterLevel=.4;updateMusicVolume();masterMuted=true;updateMusicVolume();const muted=second.gain.gain.value;k4StopCannon();k4ShotEffect();const mutedStrike=!k4Runtime.cannonAudio;return {events:k4Runtime.cannons-before,volume,distinct:first!==second,stopped:!k4Runtime.cannonAudio,mutedStrike,muted,targets:targets.slice(0,3)};});assert.equal(audio.events,3);assert.deepEqual(audio.targets,[.5,.2,0]);assert(audio.volume>0&&audio.volume<=.5);assert(audio.distinct&&audio.stopped&&audio.mutedStrike);
 console.log('PASS 25% darkness and exact 1s fade, unchanged pocket geometry and pulsing rim parameters, 1.8s normalized cannon with measurable tail energy, per-strike counters and overlap cleanup');
 assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

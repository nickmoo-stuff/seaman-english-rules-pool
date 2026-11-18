'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8000/',out='/tmp/k4-mobile';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [width,height] of [[390,844],[855,384],[740,360]]){
 const context=await b.newContext({...devices['Pixel 7'],viewport:{width,height},screen:{width,height},serviceWorkers:'block'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const cdp=await context.newCDPSession(p);await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,mobile:true,deviceScaleFactor:1,screenWidth:width,screenHeight:height,screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0}});
 await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').tap();await p.waitForTimeout(2700);
 await p.evaluate(()=>{chapterState('chapter_3').completed=true;setDevEntitlement('supporter_founder_test',true);SeamenChapter4.chapter.mainPirates.forEach(id=>{career.piratesDefeated[id]=true;});saveCareer();profiledPirateId='lucy_fir';startProfiledPirate();});
 await p.waitForFunction(()=>scenePhase==='ready');await p.waitForTimeout(1800);
 const chars=await p.evaluate(()=>[...document.querySelectorAll('#genericSceneStage .scene-character')].map(el=>({id:el.dataset.sceneAsset,opacity:+getComputedStyle(el).opacity,visible:el.getBoundingClientRect().height>0,loaded:el.complete&&el.naturalWidth>0})));
 assert(chars.length===2&&chars.every(x=>x.visible&&x.loaded&&x.opacity>.99),JSON.stringify(chars));await p.screenshot({path:`${out}/theatre-${width}x${height}.png`});
 await p.evaluate(()=>{sceneById(activeSceneId).typewriterMs=0;sceneById(activeSceneId).finishFadeMs=1;while(scenePhase==='ready')advanceScene();});await p.waitForFunction(()=>scenePhase==='idle'&&!document.querySelector('.scene-handoff-cover'));await p.waitForTimeout(400);
 await p.locator('#confirmCue').tap();
 if(width>height){
  assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape');
  for(const id of ['helmPort','helmCueBall','helmStarboard','angleMinus5','angleMinus','anglePlus','anglePlus5','power','shoot']){
   const control=await p.locator('#'+id).evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {inView:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===el||el.contains(hit)};});assert(control.inView&&control.hit,id+' accessible through effects');
  }
 }
 await p.evaluate(()=>{clearTimeout(turnOverlayTimer);turnOverlay.classList.remove('show');});await p.screenshot({path:`${out}/match-${width}x${height}.png`});
 // Real touch aim/spin and power controls remain enabled; actual shot invokes effect once.
 if(width<height)await p.locator('#shoot').scrollIntoViewIfNeeded();
 const before=await p.evaluate(()=>k4Runtime.cannons);await p.locator('#shoot').tap();assert(await p.evaluate(()=>moving&&shot!==null));assert.equal(await p.evaluate(()=>k4Runtime.cannons),before+1);
 await p.evaluate(()=>{k4UpdateEffects(performance.now());});
 if(width>height)assert.equal(await p.locator('#k4Flames').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>k4UpdateEffects(performance.now()));assert.equal(await p.locator('#k4Flames').evaluate(el=>getComputedStyle(el).display),'none');
 assert.deepEqual(errors,[]);console.log('PASS K4 mobile '+width+'x'+height+' loaded photographic Theatre layers, touch-confirm/real shot, non-blocking effects, landscape controls and reduced motion');await context.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

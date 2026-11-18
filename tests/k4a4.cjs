'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8020/',out=process.env.TEST_ARTIFACT_DIR||'/tmp/k4a4-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 assert.equal(await p.evaluate(()=>APP_VERSION+' / '+APP_BUILD_NUMBER),'1.0.0 / 1595');
 const data=await p.evaluate(()=>{renderPirateRoster();return {chapter5:{tag:document.getElementById('chapter5Placeholder').tagName,cls:document.getElementById('chapter5Placeholder').className,text:document.getElementById('chapter5Placeholder').textContent,open:chapterIsUnlocked('chapter_5'),opponents:PIRATES.filter(p=>p?.chapter==='chapter_5').length},descriptions:['filthy_youth','socks_sandals','most_evil','lucy_fir'].map(id=>COSMETICS.cues[id].description),scenes:Object.values(SeamenChapter4.scenes).map(s=>({id:s.id,chars:s.assets.characters}))};});
 assert.equal(data.chapter5.tag,'DIV');assert.equal(data.chapter5.cls,'pirate-chapter-heading');assert.equal(data.chapter5.text,'CHAPTER 5 • LOCKEDIn development!');assert(!data.chapter5.open);assert.equal(data.chapter5.opponents,0);
 assert.deepEqual(data.descriptions,['Bright pink cue with gold and white stripes.','Dark brown cue with a green leaf at the tail and a decorative zigzag.','Rainbow cue with a prominent animated rainbow glow.','Fiery black wizard’s staff with an orange glow.']);
 for(const s of data.scenes){if(s.chars.lucy_fir)assert(Math.abs(s.chars.lucy_fir.width-38*.4)<1e-9);if(s.chars.most_evil)assert.equal(s.chars.most_evil.width,(s.id.includes('lucy_fir')?27:38)*1.25);}
 console.log('PASS chapter-level locked Chapter 5, no opponents; four cosmetic-only descriptions; all Lucy/TMECI appearances use requested widths');
 async function show(id){await p.evaluate(id=>showScene(id,null,{preview:true}),id);await p.waitForFunction(()=>scenePhase==='ready'&&!document.querySelector('.scene-handoff-cover'));}
 async function close(){await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;closeScene();});await p.waitForFunction(()=>scenePhase==='idle'&&!document.querySelector('.scene-handoff-cover'));}
 await show('chapter_4_vile_hedgehog_challenge');
 // Inspect the real browser scale transition and sample its interpolation without waiting five seconds.
 const entrance=await p.evaluate(()=>{const e=document.querySelector('.k4-hedgehog'),s=getComputedStyle(e),a=e.getAnimations().find(a=>a.transitionProperty==='scale');if(!a)return {duration:s.transitionDuration,properties:s.transitionProperty,scale:s.scale};a.pause();a.currentTime=2400;const middle=+getComputedStyle(e).scale;a.currentTime=4800;return {duration:a.effect.getTiming().duration,middle,end:getComputedStyle(e).scale==='none'?1:+getComputedStyle(e).scale,frames:a.effect.getKeyframes().map(f=>f.scale)};});
 assert.equal(entrance.duration,4800,JSON.stringify(entrance));assert(entrance.middle>0&&entrance.middle<1);assert.equal(entrance.end,1);assert.equal(entrance.frames[0],'0');await close();
 console.log('PASS real Hedgehog transition: tiny start, interpolated midpoint, normal end over 4.8 seconds');
 for(const [width,height,label] of [[1366,900,'desktop'],[390,844,'portrait'],[740,360,'short-landscape']]){
  await p.setViewportSize({width,height});
  for(const [id,character] of [['chapter_4_lucy_fir_challenge','lucy_fir'],['chapter_4_most_evil_challenge','most_evil'],['chapter_4_lucy_fir_victory','most_evil']]){
   await show(id);await p.evaluate(character=>{const s=sceneById(activeSceneId);const n=s.lines.findIndex(l=>l.stage?.characters?.includes(character));activeSceneStep=n;renderScene();completeSceneTyping();},character);await p.waitForTimeout(1700);
   const bounds=await p.evaluate(character=>{const el=document.querySelector(`[data-scene-asset="${character}"]`),stage=ensureSceneStage().getBoundingClientRect(),box=el.getBoundingClientRect(),style=getComputedStyle(el);const ratio=el.naturalWidth/el.naturalHeight;let w=box.width,h=box.height;if(style.objectFit==='contain'){w=Math.min(box.width,box.height*ratio);h=w/ratio;}return {box:{x:box.x,y:box.y,w:box.width,h:box.height},stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},paint:{x:box.x+(box.width-w)/2,y:box.y+(box.height-h)/2,w,h},natural:ratio,style:{maxHeight:style.maxHeight,width:style.width}};},character);
   assert(bounds.paint.x>=bounds.stage.x-1&&bounds.paint.x+bounds.paint.w<=bounds.stage.x+bounds.stage.w+1,JSON.stringify({label,id,bounds}));assert(bounds.paint.y>=bounds.stage.y-1&&bounds.paint.y+bounds.paint.h<=bounds.stage.y+bounds.stage.h+1,JSON.stringify({label,id,bounds}));
   await p.screenshot({path:out+'/'+label+'-'+id+'.png'});await close();
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS Lucy intro, TMECI intro and Lucy ending artwork bounds on desktop, portrait and short landscape; no page errors');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

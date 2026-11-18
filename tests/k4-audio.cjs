// Media playback is mocked; this verifies lifecycle decisions, not audible output or device autoplay.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({serviceWorkers:'block'});await p.addInitScript(()=>{const states=new WeakMap(),positions=new WeakMap();window.__mediaPlays=[];Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return positions.get(this)||0;},set(value){positions.set(this,value);}});Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return states.get(this)!==true;}});HTMLMediaElement.prototype.play=function(){states.set(this,true);window.__mediaPlays.push({src:this.src,at:this.currentTime});return Promise.resolve();};HTMLMediaElement.prototype.pause=function(){states.set(this,false);};});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000/',{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 await p.evaluate(()=>{chapterState('chapter_3').completed=true;setDevEntitlement('supporter_founder_test',true);for(const id of SeamenChapter4.chapter.mainPirates.slice(0,4))career.piratesDefeated[id]=true;profiledPirateId='lucy_fir';startProfiledPirate();});await p.waitForFunction(()=>scenePhase==='ready'&&currentMusicKey==='lucy_challenge');
 assert.equal(await p.evaluate(()=>__mediaPlays.filter(x=>x.src.endsWith('Lucy%20Fir%20challenge.mp3')).length),1);
 await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;while(scenePhase==='ready')advanceScene();});await p.waitForFunction(()=>scenePhase==='idle');
 assert.equal(await p.evaluate(()=>__mediaPlays.filter(x=>x.src.endsWith('Lucy%20Fir%20challenge.mp3')).length),1,'intro to match continues');
 await p.evaluate(()=>{clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);masterMuted=false;musicMuted=true;updateMusicVolume();});assert.equal(await p.evaluate(()=>musicDeck[activeMusicDeck].volume),0);
 await p.evaluate(()=>{musicMuted=false;masterLevel=.5;musicLevel=.4;updateMusicVolume();});assert.equal(await p.evaluate(()=>musicDeck[activeMusicDeck].volume),.2);
 await p.evaluate(()=>{state.frameOver=true;state.winner=2;restartCurrentGame();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);});await p.waitForFunction(()=>currentMusicKey==='lucy_challenge');
 assert.equal(await p.evaluate(()=>__mediaPlays.filter(x=>x.src.endsWith('Lucy%20Fir%20challenge.mp3')).length),2,'loss rematch restarts');
 // Victory presentation fixture: verifies music lifecycle independently of engine victory tests.
 await p.evaluate(()=>{career.piratesDefeated.lucy_fir=true;k4Victory('lucy_fir');});await p.waitForFunction(()=>scenePhase==='ready');
 assert.equal(await p.evaluate(()=>__mediaPlays.filter(x=>x.src.endsWith('Lucy%20Fir%20challenge.mp3')).length),2,'victory continues same music');
 assert.equal(await p.evaluate(()=>musicDeck.filter(a=>!a.paused).length),1);assert(await p.evaluate(()=>musicDeck[activeMusicDeck].loop));
 await p.evaluate(()=>{sceneById(activeSceneId).finishFadeMs=1;while(scenePhase==='ready')advanceScene();});await p.waitForFunction(()=>scenePhase==='idle'&&currentMusicKey==='menu');
 assert.equal(await p.evaluate(()=>musicDeck.filter(a=>!a.paused).length),1);
 await p.evaluate(()=>{profiledPirateId='lucy_fir';startProfiledPirate();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);});await p.waitForFunction(()=>currentMusicKey==='lucy_challenge');
 const plays=await p.evaluate(()=>__mediaPlays.filter(x=>x.src.endsWith('Lucy%20Fir%20challenge.mp3')));assert.equal(plays.length,3,'replay skipping intro starts anew');assert(plays.every(x=>x.at===0));
 await p.evaluate(()=>showTitleScreen());await p.waitForFunction(()=>currentMusicKey==='menu');assert.equal(await p.evaluate(()=>k4Runtime.lucy),false);assert.equal(await p.locator('#k4MatchEffects').count(),0);
 // Autoplay rejection retains the request; a later interaction retries once.
 await p.evaluate(()=>{const play=HTMLMediaElement.prototype.play;window.__rejectLucy=true;HTMLMediaElement.prototype.play=function(){return window.__rejectLucy&&this.src.includes('Lucy%20Fir')?Promise.reject(Error('gesture required')):play.call(this);};profiledPirateId='lucy_fir';startProfiledPirate();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);});
 await p.waitForFunction(()=>pendingMusicRequest?.key==='lucy_challenge'&&!k4Runtime.starting);
 assert.notEqual(await p.evaluate(()=>currentMusicKey),'lucy_challenge');
 await p.evaluate(()=>{window.__rejectLucy=false;audioReady();audioReady();audioReady();});await p.waitForFunction(()=>currentMusicKey==='lucy_challenge');assert.equal(await p.evaluate(()=>musicDeck.filter(a=>!a.paused).length),1);
 // Resume a paused encounter in place; it must not restart from zero.
 await p.evaluate(()=>{musicDeck[activeMusicDeck].currentTime=12;musicDeck[activeMusicDeck].pause();reconcileMusicAfterResume();});await p.waitForFunction(()=>!musicDeck[activeMusicDeck].paused);assert.equal(await p.evaluate(()=>musicDeck[activeMusicDeck].currentTime),12);
 await p.evaluate(()=>showTitleScreen());
 console.log('PASS mocked media: first-intro/match/victory continuity, loop, one deck, mute/volume, loss restart, replay from zero, menu cleanup, rejected autoplay retry and in-place resume');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

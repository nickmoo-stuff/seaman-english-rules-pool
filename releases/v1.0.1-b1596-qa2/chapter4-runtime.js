'use strict';
/* K4 hooks share the real game engine, Theatre readiness and existing billing session.
   No purchase activation, synthetic wins, entitlement storage or alternate save schema. */
function k4OpponentIds(){return [...window.SeamenChapter4.chapter.mainPirates,...window.SeamenChapter4.chapter.bonusPirates];}
const k4Runtime={wizardShots:0,lucy:false,bossId:null,musicStarts:0,shotAt:-Infinity,cannons:0,lastWave:0,effectOpponent:null,frameOpponent:null};
function k4IsMatch(){return gameMode==='pirate'&&activePirate()?.chapter==='chapter_4';}
function k4CanShoot(){
 if(!k4IsMatch()||pirateIsOpen(activePirate()))return true;
 clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiThinking=false;shootBtn.disabled=true;
 msg.textContent='Supporter ownership cannot currently be confirmed. Restore / check ownership from the main menu to continue Chapter 4.';
 return false;
}
function k4StartOpponent(p){
 pirateProfileModal.hidden=true;playersModal.hidden=true;
 if(p.id==='lucy_fir'){k4Runtime.lucy=true;k4LucyMusic();}
 if(!chapterState('chapter_4')[p.id+'ChallengeSeen']){
  showScene('chapter_4_'+p.id+'_challenge',()=>{chapterState('chapter_4')[p.id+'ChallengeSeen']=true;chapterState('chapter_4').introSeen=true;saveCareer();beginPendingPirateMatch(true);});
 }else beginPendingPirateMatch(true);
}
// One encounter lifecycle, shared with Lucy's original soundtrack and audio decks.
const BOSS_MUSIC_IDS=Object.freeze(['blackball','chapter2_boss','blockbeard','lucy_fir','vaper']);
const BOSS_MUSIC_SCENES=Object.freeze({blackball_intro:'blackball',blackball_ending:'blackball',chapter_2_boss_reveal:'chapter2_boss',chapter_2_ending:'chapter2_boss',chapter_3_blockbeard_challenge:'blockbeard',chapter_3_blockbeard_victory:'blockbeard',chapter_4_lucy_fir_challenge:'lucy_fir',chapter_4_lucy_fir_victory:'lucy_fir',supporter_vaper_intro:'vaper'});
function k4BeginEncounter(id){
 if(!BOSS_MUSIC_IDS.includes(id)){if(k4Runtime.bossId||k4Runtime.lucy)k4ExitEncounter();return;}
 if(k4Runtime.bossId&&k4Runtime.bossId!==id)k4ExitEncounter();
 k4Runtime.bossId=id;k4Runtime.lucy=id==='lucy_fir';k4LucyMusic();
}
function k4LucyMusic(){
 if(!k4Runtime.bossId&&!k4Runtime.lucy)return;
 if(pendingMusicRequest?.key==='lucy_challenge')return;
 if(currentMusicKey==='lucy_challenge'&&!musicDeck[activeMusicDeck].ended){updateMusicVolume();return;}
 k4Runtime.musicStarts++;k4Runtime.starting=true;playMusic('lucy_challenge','assets/k4/Lucy Fir challenge.mp3',{crossfade:false}).finally(()=>{k4Runtime.starting=false;});
}
function k4NewFrame(){
 k4ClearEffects();k4Runtime.shotAt=-Infinity;if(k4IsMatch()&&currentPirateId==='spinball_wizard')k4Runtime.wizardShots=0;
 const boss=gameMode==='pirate'&&BOSS_MUSIC_IDS.includes(currentPirateId);
 if(boss){
  if(k4Runtime.frameOpponent===currentPirateId&&state?.frameOver)k4ResetLucyTrack();
  else k4BeginEncounter(currentPirateId);
 }else if((k4Runtime.bossId||k4Runtime.lucy)&&!pendingPirateStart)k4ExitEncounter();
 k4Runtime.frameOpponent=gameMode==='pirate'?currentPirateId:null;
}
function k4ResetLucyTrack(){
 k4Runtime.lucy=k4Runtime.bossId==='lucy_fir';
 for(const deck of musicDeck){deck.pause();deck.currentTime=0;deck.onended=null;}
 currentMusicKey='';pendingMusicRequest=null;++musicFadeToken;k4LucyMusic();
}
function k4ExitEncounter(){
 k4ClearEffects();if(!k4Runtime.bossId&&!k4Runtime.lucy)return;
 k4StopCannon();k4Runtime.lucy=false;k4Runtime.bossId=null;k4Runtime.frameOpponent=null;
 if(currentMusicKey==='lucy_challenge'||pendingMusicRequest?.key==='lucy_challenge'){
  ++musicFadeToken;pendingMusicRequest=null;currentMusicKey='';
  for(const deck of musicDeck){deck.pause();deck.currentTime=0;deck.onended=null;}
  playMusic('menu',MUSIC.menu,{crossfade:false});
 }
}
function k4PendingVictory(){
 const ch=chapterState('chapter_4'),id=ch.pendingVictoryScene;
 if(k4OpponentIds().includes(id)&&pirateDefeated(id))return id;
 // Durable win evidence restores an interrupted transition, even if the browser closed
 // between career recording and showWinCelebration.
 return k4OpponentIds().find(id=>pirateDefeated(id)&&!ch[id+'VictorySeen'])||null;
}
function k4Victory(id){
 if(!k4OpponentIds().includes(id)||!pirateDefeated(id))return;
 const ch=chapterState('chapter_4');ch.pendingVictoryScene=id;saveCareer();
 k4ClearEffects();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);gameApp.hidden=true;winModal.hidden=true;
 if(id==='lucy_fir'){k4Runtime.lucy=true;k4LucyMusic();}
 showScene('chapter_4_'+id+'_victory',()=>{
  const ch=chapterState('chapter_4');
  ch[id+'VictorySeen']=true;delete ch.pendingVictoryScene;
  if(id==='lucy_fir'){ch.endingSeen=true;ch.endingPending=false;ch.completed=true;}
  saveCareer();forcedTableTheme=null;refreshCosmeticsUI();startMenuMusic();showPirateRosterAfterStory();
 });
}
function aiSkillLevel(){return gameMode==='pirate'&&currentPirateId==='lucy_fir'?5:currentPirateLevel;}
function aiExecutionProfile(fallback=1){
 if(gameMode==='pirate'&&currentPirateId==='lucy_fir')return {...AI_PROFILES[5],label:'Lucy Fir',aimError:.12,potError:.08,potChoice:12,powerError:0};
 return AI_PROFILES[currentPirateLevel]||AI_PROFILES[fallback];
}
function k4AIContact(deg=angle*180/Math.PI){
 if(gameMode==='pirate'&&currentPirateId==='vaper'&&state.player===aiPlayer)return {...(pendingAIPlan?.spinContact||{x:0,y:0})};
 if(!k4IsMatch())return{x:0,y:0};
 if(currentPirateId==='spinball_wizard')return k4WizardContact();
 if(currentPirateId==='vile_hedgehog')return{x:0,y:-.7};
 if(currentPirateId==='socks_sandals')return{x:0,y:.65};
 // Running side follows the planned approach direction; the silent planner uses
 // exactly this same bounded contact, including its real cushion exchange.
 if(currentPirateId==='most_evil')return{x:Math.sin(deg*Math.PI/180)>=0?.55:-.55,y:0};
 return{x:0,y:0};
}
// A deterministic per-strike cycle keeps every forecast and its execution identical.
function k4WizardContact(){
 const points=[{x:0,y:-.75},{x:.7,y:0},{x:0,y:.75},{x:-.7,y:0},{x:.5,y:-.55},{x:-.5,y:.55},{x:.5,y:.55},{x:-.5,y:-.55}];
 return {...points[k4Runtime.wizardShots%points.length]};
}
function k4PrepareShot(){
 if(k4IsMatch()&&state.player===aiPlayer&&currentPirateId==='vile_hedgehog'){
  powerEl.value=66;powerText.textContent='66%';if(pendingAIPlan)pendingAIPlan.power=66;
 }
}
function k4CushionPreference(){
 const pick=aiFindCushionEscape();if(!pick)return null;
 const test=aiDryRunShot(pick.deg,pick.power,12,1/120);
 const target=balls.find(b=>b.id===test.firstId);
 if(!target||!aiLegalTargets().includes(target)||test.cuePotted||test.pots.includes('black')&&onType(state.player)!=='black')return null;
 return {...pick,personalityInfluence:'Socks favours a validated cushion approach'};
}
function k4ClearEffects(){document.getElementById('k4MatchEffects')?.remove();document.getElementById('k4Flames')?.remove();k4Runtime.effectOpponent=null;k4Runtime.lastWave=0;}
function k4ReducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduced-character-portrait-motion');}
function k4UpdateEffects(now){
 if(!k4IsMatch()||gameApp.hidden||gamePaused||state?.frameOver){if(k4Runtime.effectOpponent)k4ClearEffects();return;}
 const id=currentPirateId;let el=document.getElementById('k4MatchEffects');
 if(k4Runtime.effectOpponent!==id){k4ClearEffects();el=null;k4Runtime.effectOpponent=id;}
 if(!el){el=document.createElement('div');el.id='k4MatchEffects';el.setAttribute('aria-hidden','true');el.className='k4-match-effects k4-'+id;tableWrap.appendChild(el);if(id==='most_evil')for(let i=0;i<18;i++){const rain=document.createElement('i');rain.className='k4-rain';rain.style.cssText=`left:${(i*37)%100}%;top:${(i*19)%90}%;animation-delay:-${i*.11}s`;el.appendChild(rain);}}
 el.classList.toggle('k4-reduced',k4ReducedMotion());
 if(id==='filthy_youth'&&!k4ReducedMotion()&&now-k4Runtime.lastWave>=500){k4Runtime.lastWave=now;const wave=document.createElement('i');wave.className='k4-table-wave';wave.style.cssText=`left:${10+Math.random()*80}%;top:${10+Math.random()*80}%;--wave-angle:${Math.random()*360}deg`;el.appendChild(wave);while(el.children.length>5)el.firstChild.remove();}
 if(id==='lucy_fir'){
  el.style.backgroundColor=`rgba(0,0,0,${.25*Math.min(1,Math.max(0,(now-k4Runtime.shotAt)/1000))})`;
  let flames=document.getElementById('k4Flames');if(!flames){flames=document.createElement('div');flames.id='k4Flames';flames.setAttribute('aria-hidden','true');document.body.appendChild(flames);}
  flames.classList.toggle('surging',moving&&!k4ReducedMotion());
 }
}
function k4ShotEffect(){
 if(!k4IsMatch()||currentPirateId!=='lucy_fir')return;
 k4Runtime.shotAt=performance.now();k4Runtime.cannons++;
 const el=document.getElementById('k4MatchEffects');if(el)el.style.backgroundColor='rgba(0,0,0,0)';
 k4PlayCannon();
}
// The source image's phone emitter and face positions, in natural-image fractions.
// Resolve against the actual contained image, rather than the stage or elbow.
function k4YouthPoint(stage,x,y){
 const img=stage.querySelector('[data-scene-asset="filthy_youth"]');if(!img)return null;
 const rect=img.getBoundingClientRect(),base=stage.getBoundingClientRect();
 const ratio=(img.naturalWidth||1024)/(img.naturalHeight||1536),w=Math.min(rect.width,rect.height*ratio),h=w/ratio;
 return {left:rect.left-base.left+(rect.width-w)/2+w*x,top:rect.top-base.top+(rect.height-h)/2+h*y};
}

function k4SceneEffects(stage,scene,entry){
 stage.classList.toggle('k4-theatre',scene.chapter==='chapter_4');
 const fx=stage.querySelector('.generic-scene-fx');if(!fx||scene.chapter!=='chapter_4'){k4ClearSceneFX();return;}
 if((entry.stage?.characters||[]).includes('filthy_youth')){
  if(!fx.querySelector('.k4-phone-wave'))for(const cls of ['k4-vapour magenta','k4-vapour cyan','k4-phone-wave']){const node=document.createElement('i');node.className=cls;const point=cls==='k4-phone-wave'?k4YouthPoint(stage,.73,.15):k4YouthPoint(stage,.50,.16);if(point){node.style.left=point.left+'px';node.style.top=point.top+'px';}fx.appendChild(node);}
  if(!k4Runtime.youthObserver){k4Runtime.youthObserver=new ResizeObserver(()=>k4PositionYouthFX(stage));k4Runtime.youthObserver.observe(stage);}
  k4PositionYouthFX(stage);requestAnimationFrame(()=>requestAnimationFrame(()=>k4PositionYouthFX(stage)));
 }else k4ClearSceneFX();
 if(entry.stage?.fadeHedgehog)stage.querySelector('[data-scene-asset="vile_hedgehog"]')?.classList.add('k4-parting');
}
function k4RenderCue(g,x1,y1,x2,y2,id){
 if(!k4OpponentIds().includes(id))return false;
 if(id==='spinball_wizard')return k4RenderWizardStaff(g,x1,y1,x2,y2);
 const len=Math.hypot(x2-x1,y2-y1)||1,now=k4ReducedMotion()?0:performance.now();
 g.save();g.translate(x1,y1);g.rotate(Math.atan2(y2-y1,x2-x1));g.lineCap='round';
 const line=(a,b,width,colour)=>{g.strokeStyle=colour;g.lineWidth=width;g.beginPath();g.moveTo(a,0);g.lineTo(b,0);g.stroke();};
 let colour={vile_hedgehog:'#007dff',filthy_youth:'#ff20aa',socks_sandals:'#49301d',most_evil:'#ec3344',lucy_fir:'#161014'}[id];
 if(id==='most_evil'){const grad=g.createLinearGradient(0,0,len,0);['red','orange','yellow','lime','cyan','blue','violet'].forEach((c,i)=>grad.addColorStop(i/6,c));colour=grad;g.shadowColor=`hsl(${now/15%360},100%,60%)`;g.shadowBlur=20+7*Math.sin(now/250);}
 if(id==='lucy_fir'){g.shadowColor='#ff741f';g.shadowBlur=22;}
 line(0,len,id==='lucy_fir'?12:9,colour);
 if(id==='vile_hedgehog'){
  line(22,28,10,'white');line(39,45,10,'white');g.shadowBlur=0;g.strokeStyle='#ffd349';g.lineWidth=4;
  for(const x of [len*.74,len*.83,len*.92]){g.beginPath();g.ellipse(x,0,5,17,0,0,Math.PI*2);g.stroke();}
 }
 if(id==='filthy_youth')for(const [x,c] of [[25,'white'],[43,'#ffd248'],[len*.8,'white'],[len*.85,'#ffd248']])line(x,x+6,10,c);
 if(id==='socks_sandals'){
  g.strokeStyle='#765737';g.lineWidth=13;g.beginPath();g.moveTo(10,0);for(let i=1;i<=12;i++)g.lineTo(len*i/12,i===12?0:(i%2?8:-8));g.stroke();
  g.fillStyle='#234f27';g.beginPath();g.ellipse(len-8,-9,19,7,-.55,0,Math.PI*2);g.fill();
 }
 if(id==='lucy_fir'){
  g.strokeStyle='#ff883a';g.lineWidth=3;g.beginPath();for(let x=0;x<=len;x+=2){const y=Math.sin(x/11)*6;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  g.fillStyle='#ed6b16';g.beginPath();g.ellipse(len,0,10,16,0,0,Math.PI*2);g.fill();
 }
 g.restore();return true;
}

function k4RetryAudio(){
 if((!k4Runtime.bossId&&!k4Runtime.lucy)||k4Runtime.retrying||k4Runtime.starting)return;
 const pending=pendingMusicRequest?.key==='lucy_challenge',active=musicDeck[activeMusicDeck];
 if(!pending&&(currentMusicKey!=='lucy_challenge'||!active.paused))return;
 k4Runtime.retrying=true;
 const attempt=pending?playMusic('lucy_challenge','assets/k4/Lucy Fir challenge.mp3',{crossfade:false}):active.play().then(()=>{if(k4Runtime.bossId||k4Runtime.lucy)updateMusicVolume();});
 Promise.resolve(attempt).catch(()=>{}).finally(()=>{k4Runtime.retrying=false;});
}

// Compare a bounded set of visible-table trajectories using the existing silent
// engine. Follow-up distance ranks real reproduced pots; nothing edits live balls.
function k4LucyAttack(pots){
 const choices=[];
 for(const candidate of pots.slice(0,4)){
  const error=aiRandError(aiExecutionProfile().potError),deg=candidate.deg+error;
  for(const power of [...new Set([candidate.power,Math.round(candidate.power*.7),Math.round(candidate.power*.85),Math.round(candidate.power*1.15)])]){
   const a=aiDryRunShot(deg,power,9,1/60);
   const legal=test=>test.firstId===candidate.target.id&&!test.cuePotted&&test.potIds.includes(candidate.target.id)&&(!test.pots.includes('black')||onType(state.player)==='black');
   if(!legal(a))continue;
   const b=aiDryRunShot(deg,power,9,1/120);if(!legal(b))continue;
   const next=aiLegalTargets().filter(ball=>!b.potIds.includes(ball.id));
   const distance=next.length?Math.min(...next.map(ball=>Math.hypot(ball.x-b.cuePosition.x,ball.y-b.cuePosition.y))):0;
   choices.push({...candidate,deg,intendedDeg:candidate.deg,error,power,powerError:0,kind:'DIRECT POT',profile:'Lucy Fir',chainScore:candidate.score+distance*.4,physicsSafety:'PASS (intended pot and cue survival at 60/120 Hz)',personalityInfluence:'Lucy compares reproduced pots and next-ball position'});
   break;
  }
 }
 choices.sort((a,b)=>a.chainScore-b.chainScore);return choices[0]||null;
}

function k4OwnershipChanged(session){
 const encounter=(k4IsMatch()&&!gameApp.hidden)||sceneById(activeSceneId)?.chapter==='chapter_4';
 if(!encounter)return;
 // Expiry is not ownership evidence. Query Play again once through the existing
 // coalescing restore API, leaving the live rack and earned progress untouched.
 if(session.reason==='verification_expired'&&!session.busy&&SeamenSupporter.canCheck()){
  SeamenSupporter.restore();return;
 }
 if(!k4IsMatch()||gameApp.hidden||theatreBusy()||moving||state?.frameOver)return;
 if(!pirateIsOpen(activePirate())){
  k4Runtime.ownershipPaused=true;clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiThinking=false;shootBtn.disabled=true;
  msg.textContent=session.status==='checking'?'Checking supporter ownership… Your frame is preserved.':'Supporter ownership cannot currently be confirmed. Restore / check ownership from the main menu to continue Chapter 4.';
 }else if(k4Runtime.ownershipPaused){
  k4Runtime.ownershipPaused=false;updateHUD();shootBtn.disabled=!!(moving||state.frameOver||pendingChoice||placementMode!=='none'||state.player===aiPlayer);msg.textContent='Ownership checked. Continue your frame.';if(!gamePaused)maybeScheduleAI();
 }
}

function k4PocketGlow(now=performance.now()){
 const pulse=k4ReducedMotion()?.75:(.5+.5*Math.sin(now/240));
 return {alpha:.55+.45*pulse,width:5+3*pulse,blur:20+24*pulse};
}
function k4DrawPocketRim(g,x,y,radius,start,end){
 const glow=k4PocketGlow();g.save();g.lineCap='round';g.shadowColor='#ff3e08';g.shadowBlur=glow.blur;
 g.strokeStyle=`rgba(255,65,8,${glow.alpha})`;g.lineWidth=glow.width+8;g.beginPath();g.arc(x,y,radius,start,end);g.stroke();
 g.shadowColor='#ff7b13';g.shadowBlur=glow.blur*.6;g.strokeStyle=`rgba(255,164,48,${glow.alpha})`;g.lineWidth=glow.width;g.stroke();g.restore();
}
function k4CannonSamples(rate,duration=1.8){
 const samples=new Float32Array(Math.ceil(rate*duration));
 for(let i=0;i<samples.length;i++){
  const t=i/rate,noise=Math.random()*2-1;
  const bass=Math.sin(2*Math.PI*(46*t+38*.10*(1-Math.exp(-t/.10))));
  samples[i]=noise*(.6*Math.exp(-t/.045)+.22*Math.exp(-t/.50))+.85*bass*Math.exp(-t/.48);
 }
 // Early room reflections are mixed into the same single strike buffer.
 const dry=samples.slice();
 for(const [delay,gain] of [[.09,.32],[.17,.22],[.29,.14],[.43,.09]]){
  const offset=Math.round(delay*rate);for(let i=offset;i<samples.length;i++)samples[i]+=dry[i-offset]*gain;
 }
 let peak=0;
 for(let i=0;i<samples.length;i++){samples[i]*=Math.min(1,(duration-i/rate)/.12);peak=Math.max(peak,Math.abs(samples[i]));}
 if(peak)for(let i=0;i<samples.length;i++)samples[i]*=.9/peak;
 return samples;
}

function k4StopCannon(){
 const active=k4Runtime.cannonAudio;if(!active)return;
 k4Runtime.cannonAudio=null;const t=active.ac.currentTime;
 active.gain.gain.cancelScheduledValues(t);active.gain.gain.setTargetAtTime(0,t,.012);
 try{active.src.stop(t+.06);}catch(_){}
}
function k4UpdateCannonVolume(){
 const active=k4Runtime.cannonAudio;if(!active)return;
 active.gain.gain.setTargetAtTime(masterMuted?0:Math.min(.5,.25*SFX_GAIN)*masterLevel,active.ac.currentTime,.015);
}
function k4PlayCannon(){
 k4StopCannon();if(masterMuted||masterLevel<=0)return;
 const ac=audioReady();if(!ac)return;const t=ac.currentTime,samples=k4CannonSamples(ac.sampleRate);
 const buffer=ac.createBuffer(1,samples.length,ac.sampleRate);buffer.getChannelData(0).set(samples);
 const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
 src.buffer=buffer;filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=.7;
 gain.gain.value=Math.min(.5,.25*SFX_GAIN)*masterLevel;
 src.connect(filter);filter.connect(gain);gain.connect(ac.destination);
 const active={ac,src,filter,gain};k4Runtime.cannonAudio=active;
 src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();if(k4Runtime.cannonAudio===active)k4Runtime.cannonAudio=null;};
 src.start(t);src.stop(t+1.8);
}

function k4PositionYouthFX(stage){
 for(const node of stage.querySelectorAll('.k4-phone-wave,.k4-vapour')){
  const point=node.classList.contains('k4-phone-wave')?k4YouthPoint(stage,.73,.15):k4YouthPoint(stage,.50,.16);
  if(point){node.style.left=point.left+'px';node.style.top=point.top+'px';}
 }
}
function k4ClearSceneFX(){k4Runtime.youthObserver?.disconnect();k4Runtime.youthObserver=null;}

// The same renderer is called by gameplay and every Cosmetics preview. Orbits move
// around the handle only; the shaft and tip stay on the actual aiming axis.
function k4RenderWizardStaff(g,x1,y1,x2,y2){
 const len=Math.hypot(x2-x1,y2-y1)||1,t=k4ReducedMotion()?0:performance.now(),pulse=.5+.5*Math.sin(t/220);
 g.save();g.translate(x1,y1);g.rotate(Math.atan2(y2-y1,x2-x1));g.lineCap='round';
 g.shadowColor='#b52bff';g.shadowBlur=24+20*pulse;g.strokeStyle='#9020db';g.lineWidth=12;g.beginPath();g.moveTo(0,0);g.lineTo(len,0);g.stroke();
 g.strokeStyle='#e6c5ff';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(len,0);g.stroke();
 g.strokeStyle='#3fffff';g.lineWidth=3;g.beginPath();for(let x=14;x<len-5;x+=2){const y=Math.sin(x/10+t/420)*6;x===14?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();
 g.shadowBlur=10;g.strokeStyle='#e3c2ff';g.lineWidth=2;
 for(const x of [len*.35,len*.55,len*.72]){g.beginPath();g.moveTo(x-6,0);g.lineTo(x,-8);g.lineTo(x+6,0);g.lineTo(x,8);g.closePath();g.stroke();}
 g.fillStyle='#bffaff';g.beginPath();g.moveTo(len-12,0);g.lineTo(len,-14);g.lineTo(len+9,0);g.lineTo(len,14);g.closePath();g.fill();
 for(let i=0;i<4;i++){const phase=t/500+i*Math.PI/2,x=len*(.70+i*.045)+Math.cos(phase)*11,y=Math.sin(phase)*17;g.globalAlpha=.45+.25*(1+Math.cos(phase))/2;g.fillStyle=i%2?'#54ffff':'#db8cff';g.shadowColor='#bd32ff';g.shadowBlur=18;g.beginPath();g.arc(x,y,4+2*pulse,0,Math.PI*2);g.fill();}
 g.restore();return true;
}

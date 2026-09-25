'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const piratePlayerName=document.getElementById('piratePlayerName');
const aiVsAiMode=document.getElementById('aiVsAiMode'),aiVsAiMenu=document.getElementById('aiVsAiMenu'),aiVsAiP1=document.getElementById('aiVsAiP1'),aiVsAiP2=document.getElementById('aiVsAiP2'),startAiVsAi=document.getElementById('startAiVsAi'),aiVsAiBack=document.getElementById('aiVsAiBack');
const playersModal=document.getElementById('playersModal'),modeMenu=document.getElementById('modeMenu'),localMode=document.getElementById('localMode'),pirateMode=document.getElementById('pirateMode'),testMode=document.getElementById('testMode'),testScenarioMenu=document.getElementById('testScenarioMenu'),testBack=document.getElementById('testBack'),testPlayerName=document.getElementById('testPlayerName'),nightmareScenario=document.getElementById('nightmareScenario'),cannonScenario=document.getElementById('cannonScenario'),fiveFrameScenario=document.getElementById('fiveFrameScenario'),backToMode=document.getElementById('backToMode'),piratePlaceholder=document.getElementById('piratePlaceholder'),pirateBack=document.getElementById('pirateBack'),playersForm=document.getElementById('playersForm'),player1Name=document.getElementById('player1Name'),player2Name=document.getElementById('player2Name'),showGameLog=document.getElementById('showGameLog'),gameLogModal=document.getElementById('gameLogModal'),gameLogModalText=document.getElementById('gameLogModalText'),closeGameLog=document.getElementById('closeGameLog'),copyGameLog=document.getElementById('copyGameLog'),copyGameLogStatus=document.getElementById('copyGameLogStatus');
let playerNames={1:'Player 1',2:'Player 2'};
let gameMode='local',aiPlayer=null,aiTimer=null,aiWatchdogTimer=null,aiThinking=false,currentPirateLevel=1,currentPirateName='Deckhand Dave',aiVsAiLevels={1:5,2:5};
const PIRATES=[null,{name:'Deckhand Dave',role:'Deckhand'},{name:'Salty Steve',role:'Old salt'},{name:'Bosun Barry',role:'Bosun'},{name:'First Mate Mick',role:'First mate'},{name:'Captain Blackball',role:'Captain'},{name:"Ol' Cyclops",role:'DEV • 100% power'},{name:'Darth Vaper',role:'DEV • Perfect'}];
let devPiratesUnlocked=false,devScenariosUnlocked=false,currentScenario=null;
let fiveFrameTestActive=false,fiveFrameTestCompleted=0,pendingFiveFrameCelebration=null;
// V0.7.15: iOS/WebKit interaction hardening without cancelling ordinary button taps.
document.body.classList.add('game-interaction-hardened');
const interactionControlSelector='button, canvas, .fine-aim, .power-buttons, .cue-nudge-grid, .controls, .cue-placement-controls';
function isProtectedInteractionTarget(target){
  if(!(target instanceof Element))return false;
  if(target.closest('#gameLogModalText,input,textarea,select'))return false;
  return !!target.closest(interactionControlSelector);
}
document.addEventListener('selectstart',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
document.addEventListener('contextmenu',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
const holdControlSelector='.fine-aim button,.power-buttons button,.cue-nudge-grid button,#shoot';
document.addEventListener('selectionchange',()=>{
  const sel=window.getSelection?.();if(!sel||sel.isCollapsed)return;
  const node=sel.anchorNode?.nodeType===1?sel.anchorNode:sel.anchorNode?.parentElement;
  if(node instanceof Element&&node.closest(holdControlSelector))sel.removeAllRanges();
});

function getUnlockedPirateLevel(){try{return clamp(Number(localStorage.getItem('seamenPirateUnlocked')||1),1,5)}catch(e){return 1}}
function setUnlockedPirateLevel(level){try{localStorage.setItem('seamenPirateUnlocked',String(clamp(level,1,5)))}catch(e){}}
function refreshPirateButtons(){const unlocked=getUnlockedPirateLevel();document.querySelectorAll('.pirate-choice[data-level]').forEach(btn=>{const level=Number(btn.dataset.level),isDev=level>=6,open=isDev?devPiratesUnlocked:level<=unlocked;btn.disabled=!open;btn.classList.toggle('unlocked',open);const small=btn.querySelector('small');if(small)small.textContent=isDev?`DEV opponent • ${open?PIRATES[level].role:'Locked 🔒'}`:`Difficulty ${level} • ${open?PIRATES[level].role:'Locked 🔒'}`;});}
const shootBtn=document.getElementById('shoot'),confirmCue=document.getElementById('confirmCue'),cuePlacementControls=document.getElementById('cuePlacementControls'),tableWrap=document.querySelector('.table-wrap'),powerEl=document.getElementById('power'),powerText=document.getElementById('powerText'),angleEl=document.getElementById('angle'),angleText=document.getElementById('angleText'),msg=document.getElementById('message'),turnEl=document.getElementById('turn');
const phaseEl=document.getElementById('phase'),lastShotEl=document.getElementById('lastShot'),choice=document.getElementById('choice'),choiceText=document.getElementById('choiceText'),choiceA=document.getElementById('choiceA'),choiceB=document.getElementById('choiceB'),turnOverlay=document.getElementById('turnOverlay'),breakHelp=document.getElementById('breakHelp'),breakRules=document.getElementById('breakRules'),closeBreakRules=document.getElementById('closeBreakRules'),winModal=document.getElementById('winModal'),winTitle=document.getElementById('winTitle'),winText=document.getElementById('winText'),playAgain=document.getElementById('playAgain'),returnMenu=document.getElementById('returnMenu'),prototypeModal=document.getElementById('prototypeModal'),prototypeGotIt=document.getElementById('prototypeGotIt');
const PLAY_W=1600,PLAY_H=800,rail=90,W=PLAY_W+rail*2,H=PLAY_H+rail*2,L=rail,R=L+PLAY_W,T=rail,B=T+PLAY_H;
const ballR=25.4,pocketR=41,BAULK_X=L+PLAY_W*.8,CENTRE_X=(L+R)/2;
const pockets=[[L,T],[CENTRE_X,T],[R,T],[L,B],[CENTRE_X,B],[R,B]];
const colors={red:'#b72d2d',yellow:'#e3b834',black:'#151515',white:'#f5f1e7'};
let balls=[],angle=Math.PI,moving=false,last=performance.now(),draggingCue=false;
let state,shot=null,placementMode='none',pendingChoice=null,pendingAIPlan=null;
let devAngleGuide=false,playHistory=[],shotNumber=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let turnOverlayTimer=null;
function announceTurn(){
  if(!turnOverlay||!state||state.frameOver||pendingChoice)return;
  clearTimeout(turnOverlayTimer);
  const open=!state.groups[1];
  turnOverlay.textContent=`${pname(state.player)}, your turn!${open&&!state.breakShot?' Open table.':''}`;
  turnOverlay.classList.remove('show');
  void turnOverlay.offsetWidth;
  turnOverlay.classList.add('show');
  turnOverlayTimer=setTimeout(()=>turnOverlay.classList.remove('show'),3000);
}

let audioCtx=null,lastBallSound=0,lastCushionSound=0;
function audioReady(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}
function tone(freq,dur=.05,gain=.06,type='sine',when=0){const ac=audioReady();if(!ac)return;const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur);}
function soundShot(power){tone(105+power*55,.055,.09,'triangle');tone(62,.07,.035,'sine',.008);}
function soundBall(speed=300){const now=performance.now();if(now-lastBallSound<28)return;lastBallSound=now;tone(330+Math.min(speed,900)*.12,.025,.025,'square');}
function soundCushion(speed=250){const now=performance.now();if(now-lastCushionSound<35)return;lastCushionSound=now;tone(145+Math.min(speed,800)*.06,.035,.035,'triangle');}
let potStreakPlayer=null,potStreakCount=0;
function resetPotStreak(){potStreakPlayer=null;potStreakCount=0;}
function soundPocketDrop(){tone(82,.11,.075,'sine');tone(116,.08,.04,'triangle',.015);}
function soundLegalPot(player,count=1){
  if(potStreakPlayer!==player){potStreakPlayer=player;potStreakCount=0;}
  for(let n=0;n<count;n++){
    const step=potStreakCount+n,scale=Math.pow(2,Math.min(step,8)/24),when=n*.12;
    tone(740*scale,.075,.042,'square',when);tone(1110*scale,.10,.034,'triangle',when+.05);tone(1480*scale,.15,.024,'sine',when+.095);
  }
  potStreakCount+=count;
}
function soundFoulPot(){tone(1040,.085,.045,'triangle');tone(780,.11,.04,'triangle',.075);tone(520,.18,.045,'sine',.16);tone(110,.14,.055,'sine',.03);resetPotStreak();}

function soundVictory(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,.07,'triangle',i*.11));tone(1319,.35,.08,'sine',.45);}
function soundFiveFrameComplete(){[0,1,2,3,4].forEach(i=>{tone(1175,.16,.09,'triangle',i*.24);tone(1760,.10,.045,'sine',i*.24+.035);});}
function ball(x,y,type,id){return{x,y,vx:0,vy:0,type,id,potted:false,crossedCentre:false};}
function newState(breaker=1){return{player:breaker,breaker,groups:{1:null,2:null},breakShot:true,frameOver:false,winner:null};}
function rackBalls(){balls=[];balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));const eightX=L+PLAY_W*.25,sy=H/2,gap=ballR*2.06,rowDx=gap*.89,apexX=eightX+2*rowDx;const rows=[['red'],['yellow','red'],['red','black','yellow'],['yellow','red','yellow','red'],['red','yellow','yellow','red','yellow']];let id=0;rows.forEach((row,ri)=>{const x=apexX-ri*rowDx;row.forEach((type,i)=>balls.push(ball(x,sy+(i-ri/2)*gap,type,id++)));});}
function rack28Balls(){balls=[];balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));const sy=H/2,gap=ballR*2.06,rowDx=gap*.89,apexX=L+PLAY_W*.31;let types=[];for(let i=0;i<13;i++)types.push('red');for(let i=0;i<14;i++)types.push('yellow');types.push('black');let id=0,idx=0;for(let ri=0;ri<7;ri++){const x=apexX-ri*rowDx;for(let i=0;i<=ri;i++){let type;if(ri===3&&i===1){type='black';const bi=types.indexOf('black');types.splice(bi,1);}else{const pick=Math.floor(Math.random()*types.length);type=types.splice(pick,1)[0];}balls.push(ball(x,sy+(i-ri/2)*gap,type,id++));}}}
function randomFreeSpot(existing,minX,maxX,minY,maxY){for(let tries=0;tries<300;tries++){const x=minX+Math.random()*(maxX-minX),y=minY+Math.random()*(maxY-minY);if(existing.every(b=>Math.hypot(b.x-x,b.y-y)>ballR*2.35))return{x,y};}return{x:minX+60,y:minY+60};}
function rackNightmare(){balls=[];/* Keep the six-yellow blockade horizontally central. The deliberate escape gap is on the LEFT, so all three reds are generated on the RIGHT-hand side away from that exit. */const cx=L+PLAY_W*.50,cy=H/2;balls.push(ball(cx,cy,'white','cue'));let id=0;const ringAngles=[-120,-72,-24,24,72,120];for(const deg of ringAngles){const a=deg*Math.PI/180,r=ballR*3.15;balls.push(ball(cx+Math.cos(a)*r,cy+Math.sin(a)*r,'yellow',id++));}for(let i=0;i<3;i++){const q=randomFreeSpot(balls,L+PLAY_W*.62,R-ballR*3,T+ballR*3,B-ballR*3);balls.push(ball(q.x,q.y,'red',id++));}const q=randomFreeSpot(balls,L+PLAY_W*.18,L+PLAY_W*.82,T+ballR*3,B-ballR*3);balls.push(ball(q.x,q.y,'black',id++));}
function startScenario(kind){clearTimeout(aiTimer);currentScenario=kind;gameMode='pirate';aiPlayer=2;currentPirateLevel=5;currentPirateName='Captain Blackball';playerNames={1:(testPlayerName?.value.trim()||'Player 1'),2:'Captain Blackball'};resetPotStreak();if(kind==='nightmare')rackNightmare();else rack28Balls();state=newState(kind==='nightmare'?2:1);if(kind==='nightmare'){state.breakShot=false;state.groups={1:'yellow',2:'red'};placementMode='none';msg.textContent="Blackball’s nightmare — Captain Blackball is on RED and must play from the fixed cue-ball position.";}else{placementMode='baulk';msg.textContent='Cannon fodder — 28 object balls racked in seven rows. Place the white in baulk for the opening break.';}moving=false;shot=null;draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=placementMode!=='none';playersModal.hidden=true;updateHUD();setTimeout(announceTurn,40);setTimeout(maybeScheduleAI,500);}
function startFiveFrameTest(){
  clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;
  currentScenario='fiveframe';fiveFrameTestActive=true;fiveFrameTestCompleted=0;pendingFiveFrameCelebration=null;
  gameMode='aivai';aiVsAiLevels={1:5,2:7};aiPlayer=1;currentPirateLevel=5;currentPirateName='Captain Blackball';
  playerNames={1:'Captain Blackball',2:'Darth Vaper'};playHistory=[];shotNumber=0;renderPlayLog();
  playersModal.hidden=true;testScenarioMenu.hidden=true;audioReady();
  playHistory.push('=== 5-FRAME AI TESTING RUN • Captain Blackball vs Darth Vaper ===\nFrame 1 of 5');renderPlayLog();
  newFrame(1);msg.textContent='5-frame AI testing run — Frame 1 of 5. Captain Blackball vs Darth Vaper.';
}
function restartCurrentGame(breaker=1){if(currentScenario==='fiveframe')return startFiveFrameTest();if(currentScenario)return startScenario(currentScenario);newFrame(breaker);}
function newFrame(breaker=1){clearTimeout(aiTimer);rackBalls();resetPotStreak();state=newState(breaker);moving=false;shot=null;placementMode='baulk';draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=true;msg.textContent='Opening break — tap or drag anywhere in baulk to place the white, then confirm its position.';updateHUD();setTimeout(announceTurn,40);setTimeout(maybeScheduleAI,450);}
function cue(){return balls[0];}
function opponent(p){return p===1?2:1;}
function pname(p){return playerNames[p]||`Player ${p}`;}
function pshort(p){return pname(p);}
function remaining(type){return balls.filter(b=>b.type===type&&!b.potted).length;}
function onType(player){const g=state.groups[player];if(!g)return 'open';return remaining(g)===0?'black':g;}
function updatePlacementUI(){const placing=placementMode!=='none'&&!moving&&!state?.frameOver&&!pendingChoice;confirmCue.hidden=!placing;if(cuePlacementControls)cuePlacementControls.hidden=!placing;tableWrap?.classList.toggle('placing-cue',placing);if(placing)shootBtn.disabled=true;}
function updateHUD(){turnEl.innerHTML=state.frameOver?`${pname(state.winner)}<br>WINS`:`${"Playing now:<br>"+pname(state.player)}`;phaseEl.textContent=state.frameOver?'FRAME OVER':state.breakShot?'BREAK':state.groups[1]?'GROUPS SET':'OPEN TABLE';breakHelp.hidden=state.frameOver||!state.breakShot||moving||!!pendingChoice;if(breakHelp.hidden)breakRules.hidden=true;for(const p of [1,2]){const g=state.groups[p];document.getElementById('p'+p+'group').textContent=pshort(p);document.getElementById('p'+p+'left').textContent=g?`${g.toUpperCase()} group\n${remaining(g)} ${remaining(g)===1?'ball':'balls'} left`:'OPEN TABLE\nNo group yet';}updatePlacementUI();if(((gameMode==='pirate'&&aiPlayer===state.player)||gameMode==='aivai')&&!state.frameOver){shootBtn.disabled=true;confirmCue.hidden=true;if(cuePlacementControls)cuePlacementControls.hidden=true;}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function normaliseDeg(d){return ((d%360)+360)%360;}function syncAngleUI(){const deg=normaliseDeg(angle*180/Math.PI);angleEl.value=Math.round(deg*10);angleText.textContent=deg.toFixed(1)+'°';}function setAngleDeg(deg){angle=normaliseDeg(deg)*Math.PI/180;syncAngleUI();}
function aimAt(e){if(moving||state.frameOver||cue().potted||pendingChoice)return;const p=canvasPoint(e),c=cue();angle=Math.atan2(p.y-c.y,p.x-c.x);syncAngleUI();}
function validCuePosition(x,y){if(x<L+ballR||x>R-ballR||y<T+ballR||y>B-ballR)return false;if(placementMode==='baulk'&&x<BAULK_X-ballR*.5)return false;return balls.slice(1).filter(b=>!b.potted).every(b=>Math.hypot(b.x-x,b.y-y)>=ballR*2.02);}
function placeCueAt(e){if(placementMode==='none'||moving)return;const p=canvasPoint(e),c=cue();let x=clamp(p.x,L+ballR,R-ballR),y=clamp(p.y,T+ballR,B-ballR);if(placementMode==='baulk')x=clamp(x,BAULK_X-ballR*.5,R-ballR);if(validCuePosition(x,y)){c.x=x;c.y=y;updatePlacementUI();}}
function nudgeCue(dx,dy){if(placementMode==='none'||moving||state.frameOver||pendingChoice)return;const c=cue(),step=ballR*.55;let x=clamp(c.x+dx*step,L+ballR,R-ballR),y=clamp(c.y+dy*step,T+ballR,B-ballR);if(placementMode==='baulk')x=clamp(x,BAULK_X-ballR*.5,R-ballR);if(validCuePosition(x,y)){c.x=x;c.y=y;updatePlacementUI();}}
function addPressHold(el,action,repeatMs){let delay=null,repeat=null,active=false;const clear=()=>{clearTimeout(delay);clearInterval(repeat);delay=repeat=null;active=false;};const start=e=>{if(active)return;active=true;if(e.cancelable)e.preventDefault();const sel=window.getSelection?.();if(sel&&!sel.isCollapsed)sel.removeAllRanges();action();delay=setTimeout(()=>{repeat=setInterval(action,repeatMs)},350);};if(window.PointerEvent){el.addEventListener('pointerdown',e=>{try{el.setPointerCapture?.(e.pointerId)}catch(_){}start(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,clear));}else{el.addEventListener('touchstart',start,{passive:false});['touchend','touchcancel'].forEach(ev=>el.addEventListener(ev,clear,{passive:true}));el.addEventListener('mousedown',start);['mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,clear));}el.addEventListener('contextmenu',e=>e.preventDefault());}
function addCueNudge(id,dx,dy){const el=document.getElementById(id);addPressHold(el,()=>nudgeCue(dx,dy),70);}
addCueNudge('cueUp',0,-1);addCueNudge('cueLeft',-1,0);addCueNudge('cueDown',0,1);addCueNudge('cueRight',1,0);
canvas.addEventListener('pointerdown',e=>{if(moving||state.frameOver||pendingChoice||cue().potted)return;canvas.setPointerCapture(e.pointerId);if(placementMode!=='none'){e.preventDefault();draggingCue=true;placeCueAt(e);return;}draggingCue=false;aimAt(e);});
canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture(e.pointerId))return;if(draggingCue)placeCueAt(e);else aimAt(e)});canvas.addEventListener('pointerup',()=>draggingCue=false);canvas.addEventListener('pointercancel',()=>draggingCue=false);
powerEl.addEventListener('input',()=>powerText.textContent=powerEl.value+'%');angleEl.addEventListener('input',()=>setAngleDeg(Number(angleEl.value)/10));function nudgeAngle(delta){if(!moving&&!state.frameOver&&!pendingChoice)setAngleDeg(angle*180/Math.PI+delta)}
function addHoldNudge(id,delta){const el=document.getElementById(id);addPressHold(el,()=>nudgeAngle(delta),45);}addHoldNudge('angleMinus5',-5);addHoldNudge('angleMinus',-.1);addHoldNudge('anglePlus',.1);addHoldNudge('anglePlus5',5);
function nudgePower(delta){if(moving||state.frameOver||pendingChoice)return;powerEl.value=clamp(Number(powerEl.value)+delta,Number(powerEl.min),Number(powerEl.max));powerText.textContent=powerEl.value+'%';}
function addHoldPower(id,delta){const el=document.getElementById(id);addPressHold(el,()=>nudgePower(delta),90);}
addHoldPower('powerMinus45',-45);addHoldPower('powerMinus5',-5);addHoldPower('powerPlus5',5);addHoldPower('powerPlus45',45);
function beginShot(){clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;if(moving||state.frameOver||pendingChoice||cue().potted||placementMode!=='none')return;const p=Number(powerEl.value)/100,speed=150+5800*Math.pow(p,1.35),c=cue();shot={number:++shotNumber,player:state.player,isBreak:state.breakShot,startOn:onType(state.player),firstContact:null,firstContactId:null,pots:[],cuePotted:false,cushionAfterContact:false,objectCushions:new Set(),breakCrossers:new Set(),aiPlan:pendingAIPlan};pendingAIPlan=null;placementMode='none';draggingCue=false;c.vx=Math.cos(angle)*speed;c.vy=Math.sin(angle)*speed;soundShot(p);moving=true;shootBtn.disabled=true;breakHelp.hidden=true;breakRules.hidden=true;msg.textContent='Balls in motion…';}
shootBtn.addEventListener('click',beginShot);
function collide(a,b){let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=ballR*2;if(d2>=min*min||d2===0)return;let d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;if(shot&&!shot.firstContact){if(a.type==='white'&&b.type!=='white'&&!b.potted){shot.firstContact=b.type;shot.firstContactId=b.id;}else if(b.type==='white'&&a.type!=='white'&&!a.potted){shot.firstContact=a.type;shot.firstContactId=a.id;}}let rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)return;soundBall(Math.abs(sep));const j=-(1+.965)*sep/2,ix=j*nx,iy=j*ny;a.vx-=ix;a.vy-=iy;b.vx+=ix;b.vy+=iy;}
function pocketBall(b){soundPocketDrop();b.potted=true;b.vx=b.vy=0;if(shot){shot.pots.push(b.type);if(b.type==='white')shot.cuePotted=true;}return true;}
function pocketCheck(b){
  // Normal pocket capture around each pocket centre.
  for(const p of pockets){const dx=b.x-p[0],dy=b.y-p[1];if(dx*dx+dy*dy<pocketR*pocketR)return pocketBall(b);}
  // Pocket-throat capture: once a ball has genuinely entered through an open
  // pocket mouth it must fall, rather than slipping beyond the cushion and
  // becoming stranded outside the playable bed.
  const mouth=pocketR+ballR*.55;
  if((b.y<T-ballR*.12||b.y>B+ballR*.12)&&
     (Math.abs(b.x-L)<mouth||Math.abs(b.x-CENTRE_X)<mouth||Math.abs(b.x-R)<mouth))return pocketBall(b);
  if((b.x<L-ballR*.12||b.x>R+ballR*.12)&&
     (Math.abs(b.y-T)<mouth||Math.abs(b.y-B)<mouth))return pocketBall(b);
  return false;
}
function noteCushion(b){soundCushion(Math.hypot(b.vx,b.vy));if(!shot||!shot.firstContact)return;shot.cushionAfterContact=true;if(b.type!=='white')shot.objectCushions.add(b.id);}
function walls(b){
  const nearLeft=Math.abs(b.x-L)<pocketR*1.3,nearRight=Math.abs(b.x-R)<pocketR*1.3,nearMiddle=Math.abs(b.x-CENTRE_X)<pocketR*1.35;
  if(b.x-ballR<L&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=L+ballR;b.vx=Math.abs(b.vx)*.91;noteCushion(b)}
  if(b.x+ballR>R&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=R-ballR;b.vx=-Math.abs(b.vx)*.91;noteCushion(b)}
  if(b.y-ballR<T&&!nearLeft&&!nearRight&&!nearMiddle){b.y=T+ballR;b.vy=Math.abs(b.vy)*.91;noteCushion(b)}
  if(b.y+ballR>B&&!nearLeft&&!nearRight&&!nearMiddle){b.y=B-ballR;b.vy=-Math.abs(b.vy)*.91;noteCushion(b)}
  // Last-resort containment. A ball may enter a pocket throat, but it may
  // never finish outside the table because of a gap in cushion geometry.
  const escaped=b.x<L-ballR*1.25||b.x>R+ballR*1.25||b.y<T-ballR*1.25||b.y>B+ballR*1.25;
  if(escaped){
    if(pocketCheck(b))return;
    b.x=clamp(b.x,L+ballR,R-ballR);b.y=clamp(b.y,T+ballR,B-ballR);
    if(b.x<=L+ballR+.01)b.vx=Math.abs(b.vx)*.91;
    if(b.x>=R-ballR-.01)b.vx=-Math.abs(b.vx)*.91;
    if(b.y<=T+ballR+.01)b.vy=Math.abs(b.vy)*.91;
    if(b.y>=B-ballR-.01)b.vy=-Math.abs(b.vy)*.91;
    noteCushion(b);
  }
}
function trackBreakCrossing(b){if(!shot||!shot.isBreak||b.type==='white'||b.potted||b.crossedCentre)return;/* Rack is on the left/top side. A break point is earned as soon as the WHOLE object ball has passed the centre-pocket line. */if(b.x-ballR>=CENTRE_X){b.crossedCentre=true;shot.breakCrossers.add(b.id);}}
function step(dt){const maxSpeed=Math.max(...balls.filter(b=>!b.potted).map(b=>Math.hypot(b.vx,b.vy)),0),sub=Math.max(4,Math.min(12,Math.ceil(maxSpeed*dt/(ballR*.55)))),sdt=dt/sub;for(let k=0;k<sub;k++){for(const b of balls){if(b.potted)continue;b.x+=b.vx*sdt;b.y+=b.vy*sdt;trackBreakCrossing(b);if(pocketCheck(b))continue;walls(b);const drag=Math.pow(.985,sdt*60);b.vx*=drag;b.vy*=drag;if(Math.hypot(b.vx,b.vy)<5)b.vx=b.vy=0;}for(let i=0;i<balls.length;i++)if(!balls[i].potted)for(let j=i+1;j<balls.length;j++)if(!balls[j].potted)collide(balls[i],balls[j]);}}
function allStopped(){return balls.every(b=>b.potted||Math.hypot(b.vx,b.vy)<.01)}
function respotBlack(){const b=balls.find(x=>x.type==='black');if(!b||!b.potted)return;b.potted=false;b.vx=b.vy=0;const spotX=L+PLAY_W*.25,spotY=H/2;for(let dir of [-1,1])for(let dist=0;dist<PLAY_W*.6;dist+=ballR*2.05){const x=spotX+dir*dist,y=spotY;if(x>L+ballR&&x<R-ballR&&balls.filter(o=>o!==b&&!o.potted).every(o=>Math.hypot(o.x-x,o.y-y)>=ballR*2.01)){b.x=x;b.y=y;return;}}}
function restoreCue(mode){const c=cue();c.potted=false;c.vx=c.vy=0;placementMode=mode;let x=mode==='baulk'?L+PLAY_W*.8:L+PLAY_W*.72,y=H/2;for(let tries=0;tries<40&&!validCuePosition(x,y);tries++)y=T+ballR+((tries+1)*(PLAY_H-2*ballR)/41);c.x=x;c.y=y;}
function finishFrame(winner,text,resultText='Frame complete'){state.frameOver=true;state.winner=winner;moving=false;shootBtn.disabled=true;placementMode='none';let finalText=text;if(gameMode==='pirate'&&winner===1&&currentPirateLevel<5){const before=getUnlockedPirateLevel(),next=currentPirateLevel+1;if(next>before){setUnlockedPirateLevel(next);refreshPirateButtons();finalText+=` ${PIRATES[next].name} (Difficulty ${next}) unlocked!`;}}msg.textContent=finalText;lastShotEl.textContent=resultText;updateHUD();if(fiveFrameTestActive)pendingFiveFrameCelebration={winner,text:finalText};else showWinCelebration(winner,finalText);}
function standardFoul(reason,ballInHand='anywhere'){if(shot&&shot.pots.length)soundFoulPot();else resetPotStreak();const incoming=opponent(state.player);state.player=incoming;state.breakShot=false;if(cue().potted)restoreCue(ballInHand==='baulk'?'baulk':'anywhere');else placementMode='anywhere';msg.textContent=`FOUL — ${reason}. ${pname(incoming)}: cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;lastShotEl.textContent=`FOUL: ${reason} • Opponent gets cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;}
function showBreakChoice(){pendingChoice='break';choice.hidden=false;const chooser=opponent(state.breaker);choiceText.textContent=`Illegal break — 3 points are required. ${pname(chooser)} chooses who takes the re-rack break.`;choiceA.textContent='I will break';choiceB.textContent='Opponent breaks';shootBtn.disabled=true;choiceA.onclick=()=>resolveBreakChoice(chooser);choiceB.onclick=()=>resolveBreakChoice(state.breaker);if(aiPlayer===chooser||gameMode==='aivai'){choice.hidden=true;msg.textContent=`Illegal break — ${pname(chooser)} is choosing who breaks the re-rack…`;clearTimeout(aiTimer);aiTimer=setTimeout(()=>resolveBreakChoice(chooser),1100);}}
function resolveBreakChoice(breaker){pendingChoice=null;choice.hidden=true;newFrame(breaker);msg.textContent=`Re-rack — ${pname(breaker)} to break.`;}
function describeColourPots(pots){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length,parts=[];if(reds)parts.push(`${reds} RED${reds===1?'':'S'}`);if(yellows)parts.push(`${yellows} YELLOW${yellows===1?'':'S'}`);return parts.length?parts.join(' + '):'no red/yellow balls';}
function evaluateBreak(){const pottedObjects=balls.filter(b=>b.type!=='white'&&b.potted).map(b=>b.id),pointIds=new Set([...shot.breakCrossers,...pottedObjects]),points=pointIds.size,groupPots=shot.pots.filter(t=>t==='red'||t==='yellow'),potSummary=describeColourPots(groupPots);lastShotEl.textContent=`Break: ${points} point${points===1?'':'s'} • ${potSummary} potted${points<3?' • 3 points required for a legal break':''}`;if(points<3){if(shot.pots.length)soundFoulPot();else resetPotStreak();moving=false;showBreakChoice();return;}state.breakShot=false;if(shot.pots.includes('black'))respotBlack();if(shot.cuePotted){if(shot.pots.length)soundFoulPot();else resetPotStreak();state.player=opponent(state.player);restoreCue('baulk');msg.textContent=`Legal break (${points} points) — ${potSummary} potted; IN-OFF. ${pname(state.player)} has cue ball in hand in baulk. Table remains OPEN.`;}else if(groupPots.length>0){soundLegalPot(state.player,groupPots.length);msg.textContent=`Legal break (${points} points) — ${potSummary} potted. Table remains OPEN; ${pname(state.player)} continues.`;}else{resetPotStreak();state.player=opponent(state.player);msg.textContent=`Legal break (${points} points) — no red/yellow balls potted. ${pname(state.player)}'s turn. Table remains OPEN.`;}updateHUD();}
function legalFirstContact(player,onAtStart=shot.startOn){const on=onAtStart;if(on==='open')return shot.firstContact==='red'||shot.firstContact==='yellow';return shot.firstContact===on;}
function evaluateNormal(){const p=state.player,opp=opponent(p),on=shot.startOn,pots=shot.pots.filter(t=>t!=='white'),blackPotted=pots.includes('black');const ownBefore=state.groups[p]?remaining(state.groups[p])+shot.pots.filter(t=>t===state.groups[p]).length:null;
  if(blackPotted){const cleared=state.groups[p]&&ownBefore===0;if(!cleared||shot.cuePotted||!legalFirstContact(p,on)){const left=state.groups[p]?ownBefore:0,reason=shot.cuePotted?'cue ball also potted':!legalFirstContact(p,on)?'illegal first contact':`${left} ${String(state.groups[p]||'colour').toUpperCase()}${left===1?'':'S'} remaining`;soundFoulPot();finishFrame(opp,`LOSS OF FRAME — ${pname(p)} potted the eight-ball illegally. ${pname(opp)} beat off ${pname(p)}!`,`LOSS — BLACK potted illegally • ${reason} • ${pname(opp)} wins`);return;}soundLegalPot(p,1);finishFrame(p,`${pname(p)} legally pots the eight-ball. ${pname(p)} beat off ${pname(opp)}!`,`WIN — BLACK potted legally • ${pname(p)} wins`);return;}
  const firstOK=legalFirstContact(p,on),actionAfter=shot.pots.length>0||shot.cushionAfterContact;
  if(shot.cuePotted){standardFoul('cue ball potted (in-off)');updateHUD();return;}
  if(!firstOK){standardFoul(on==='open'?'failed to contact a red or yellow first':`first contact was ${shot.firstContact||'no ball'}, not ${on}`);updateHUD();return;}
  if(!actionAfter){standardFoul('no ball was potted and no ball contacted a cushion after first contact');updateHUD();return;}
  if(!state.groups[p]){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length;if(reds||yellows){let g;if(reds&&yellows)g=shot.firstContact;else g=reds?'red':'yellow';state.groups[p]=g;state.groups[opp]=g==='red'?'yellow':'red';soundLegalPot(p,pots.filter(t=>t==='red'||t==='yellow').length);const combo=reds&&yellows;msg.textContent=combo?`Legal combination — RED and YELLOW potted. ${pname(p)} struck ${g.toUpperCase()} first, so ${pname(p)} is ${g.toUpperCase()} and continues.`:`Groups decided — ${pname(p)} is ${g.toUpperCase()}. Legal pot: continue.`;lastShotEl.textContent=combo?`LEGAL: both colours potted • ${g.toUpperCase()} struck first, so that group is assigned • continue`:`LEGAL POT: ${g.toUpperCase()} potted • group assigned to ${pname(p)} • continue`;updateHUD();return;}resetPotStreak();state.player=opp;msg.textContent=`Legal shot, no pot — ${pname(opp)}. Table remains OPEN.`;lastShotEl.textContent='LEGAL: correct first contact + cushion, but no pot • loss of turn • table stays open';updateHUD();return;}
  const g=state.groups[p],onLabel=on==='black'?'black':g,ownPots=pots.filter(t=>t===g).length,oppPots=pots.filter(t=>t===state.groups[opp]).length;if(ownPots>0){soundLegalPot(p,ownPots);msg.textContent=`Legal pot — ${pname(p)} continues${oppPots?` (${oppPots} opponent ball also potted)`:''}.`;lastShotEl.textContent=oppPots?`LEGAL COMBINATION: ${ownPots} ${g.toUpperCase()} + ${oppPots} opponent ball${oppPots===1?'':'s'} potted • own/on ball was struck first • continue`:`LEGAL POT: ${ownPots} ${g.toUpperCase()} potted • continue`;}else{if(oppPots)soundFoulPot();else resetPotStreak();state.player=opp;msg.textContent=oppPots?`Opponent ball potted without an on-ball — loss of turn. ${pname(opp)}'s turn, ${state.groups[opp]} group.`:`No ${onLabel} potted — ${pname(opp)}'s turn, ${state.groups[opp]} group.`;lastShotEl.textContent=oppPots?`LOSS OF TURN: opponent ball potted but no ${onLabel.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group • cue ball stays where it lies`:`LOSS OF TURN: no ${onLabel.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group`;}updateHUD();}
function renderPlayLog(){const el=document.getElementById('playLog');if(!el)return;el.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';}
function recordShotTrace(s){const first=s.firstContact?`${s.firstContact.toUpperCase()}${s.firstContactId!==null?` #${s.firstContactId}`:''}`:'NONE';const pots=s.pots.length?s.pots.map(x=>x.toUpperCase()).join(', '):'none';const result=lastShotEl.textContent||msg.textContent;let qa='';if(s.aiPlan){const matched=s.firstContactId===s.aiPlan.targetId;qa=`\nAI QA: planned ${String(s.aiPlan.targetType).toUpperCase()} #${s.aiPlan.targetId} • actual first contact ${first} • ${matched?'PLAN CONTACT MATCH':'⚠ PLAN CONTACT MISMATCH'}`;}playHistory.push(`#${s.number} | ${pname(s.player)} | ${s.isBreak?'BREAK':`on ${String(s.startOn).toUpperCase()}`}\nFirst contact: ${first} | Pots: ${pots} | Cushion after contact: ${s.cushionAfterContact?'yes':'no'}${qa}\nResult: ${result}\nTable after: red ${remaining('red')}, yellow ${remaining('yellow')}, black ${remaining('black')}`);renderPlayLog();}
function endShot(){moving=false;shootBtn.disabled=false;const completed=shot;if(completed.isBreak)evaluateBreak();else evaluateNormal();recordShotTrace(completed);shot=null;if(pendingFiveFrameCelebration){const done=pendingFiveFrameCelebration;pendingFiveFrameCelebration=null;showWinCelebration(done.winner,done.text);return;}if(!pendingChoice&&!state.frameOver){shootBtn.disabled=placementMode!=='none';updatePlacementUI();announceTurn();maybeScheduleAI();}}
function rayBallHit(x,y,dx,dy,ignore){let best=Infinity,hitBall=null;for(const b of balls){if(b===ignore||b.potted||b.type==='white')continue;const ox=b.x-x,oy=b.y-y,t=ox*dx+oy*dy;if(t<=.01)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(Math.max(0,rr-perp2));if(hit<best){best=hit;hitBall=b;}}}return{distance:best,ball:hitBall};}
function rayCushionDistance(x,y,dx,dy){let vals=[];if(dx>1e-6)vals.push((R-ballR-x)/dx);if(dx<-1e-6)vals.push((L+ballR-x)/dx);if(dy>1e-6)vals.push((B-ballR-y)/dy);if(dy<-1e-6)vals.push((T+ballR-y)/dy);vals=vals.filter(v=>v>.01);return vals.length?Math.min(...vals):Infinity;}
function guide(){if(moving||state.frameOver||pendingChoice||cue().potted)return;const c=cue(),dx=Math.cos(angle),dy=Math.sin(angle);let best=2000,target=null;for(const b of balls.slice(1)){if(b.potted)continue;const ox=b.x-c.x,oy=b.y-c.y,t=ox*dx+oy*dy;if(t<=0)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(rr-perp2);if(hit<best){best=hit;target=b;}}}const tx=c.x+dx*best,ty=c.y+dy*best;ctx.save();ctx.setLineDash([13,12]);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff8';ctx.beginPath();ctx.arc(tx,ty,6,0,Math.PI*2);ctx.fill();
  if(devAngleGuide&&target){const nx=target.x-tx,ny=target.y-ty,nlen=Math.hypot(nx,ny);if(nlen>.001){const odx=nx/nlen,ody=ny/nlen;const ballHit=rayBallHit(target.x,target.y,odx,ody,target),cush=rayCushionDistance(target.x,target.y,odx,ody),dist=Math.min(ballHit.distance,cush);if(Number.isFinite(dist)&&dist>0){ctx.strokeStyle='#ffe28a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x+odx*dist,target.y+ody*dist);ctx.stroke();}}}
  ctx.restore();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#56371f';ctx.fillRect(0,0,W,H);ctx.fillStyle='#2a7b57';ctx.fillRect(L,T,R-L,B-T);ctx.strokeStyle='#163f30';ctx.lineWidth=8;ctx.strokeRect(L,T,R-L,B-T);ctx.strokeStyle='#d8d0b755';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BAULK_X,T);ctx.lineTo(BAULK_X,B);ctx.stroke();for(const p of pockets){ctx.fillStyle='#090909';ctx.beginPath();ctx.arc(p[0],p[1],pocketR,0,Math.PI*2);ctx.fill()}guide();for(const b of balls){if(b.potted)continue;ctx.fillStyle=colors[b.type];ctx.beginPath();ctx.arc(b.x,b.y,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0007';ctx.lineWidth=2;ctx.stroke();if(b.type==='black'){ctx.fillStyle='#eee';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('8',b.x,b.y)}}}
function loop(now){let dt=Math.min((now-last)/1000,.025);last=now;if(moving){step(dt);if(allStopped())endShot()}draw();requestAnimationFrame(loop)}
document.getElementById('reset').onclick=()=>restartCurrentGame(1);document.getElementById('rack').onclick=()=>restartCurrentGame(state?.breaker||1);document.getElementById('clear').onclick=()=>{balls.slice(1).forEach(b=>{if(b.type!=='black')b.potted=true});updateHUD();};document.getElementById('soft').onclick=()=>{powerEl.value=25;powerText.textContent='25%'};document.getElementById('hard').onclick=()=>{powerEl.value=100;powerText.textContent='100%'};
document.getElementById('toggleAngleGuide').onclick=e=>{devAngleGuide=!devAngleGuide;e.currentTarget.textContent=`Toggle guide Ian angle: ${devAngleGuide?'ON':'OFF'}`;};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select'||tag==='button')return;const k=e.key.toLowerCase();if(k==='a'){e.preventDefault();nudgeAngle(-.1);}else if(k==='d'){e.preventDefault();nudgeAngle(.1);}else if(k==='w'){e.preventDefault();nudgePower(5);}else if(k==='s'){e.preventDefault();nudgePower(-5);}else if(k==='g'){e.preventDefault();devAngleGuide=!devAngleGuide;const btn=document.getElementById('toggleAngleGuide');if(btn)btn.textContent=`Toggle guide Ian angle: ${devAngleGuide?'ON':'OFF'}`;}else if(k==='e'){e.preventDefault();if(!shootBtn.disabled&&!moving&&!state.frameOver&&!pendingChoice&&placementMode==='none')beginShot();}else if(k==='h'){e.preventDefault();devScenariosUnlocked=true;nightmareScenario.disabled=false;cannonScenario.disabled=false;if(fiveFrameScenario)fiveFrameScenario.disabled=false;nightmareScenario.querySelector('small').textContent='Captain Blackball • 3 reds vs 6-yellow blockade';cannonScenario.querySelector('small').textContent='Captain Blackball • oversized 28-ball rack';if(fiveFrameScenario)fiveFrameScenario.querySelector('small').textContent='Captain Blackball vs Darth Vaper • 5 automatic frames';msg.textContent='DEV: Test scenarios unlocked for this session.';}else if(k==='j'){e.preventDefault();setUnlockedPirateLevel(5);devPiratesUnlocked=true;refreshPirateButtons();msg.textContent="DEV: all five standard pirates plus Ol' Cyclops and Darth Vaper unlocked for testing.";}else if(k==='r'&&state?.frameOver&&!winModal.hidden){e.preventDefault();playAgain.click();}});
document.getElementById('pickupCue').onclick=()=>{if(moving||state.frameOver||pendingChoice)return;restoreCue('anywhere');msg.textContent=`DEV: ${pname(state.player)} may tap or drag anywhere on the table to reposition the cue ball, then confirm.`;updateHUD();};
document.getElementById('unlockPirates').onclick=()=>{setUnlockedPirateLevel(5);devPiratesUnlocked=true;refreshPirateButtons();msg.textContent="DEV: all five standard pirates plus Ol' Cyclops and Darth Vaper unlocked for testing.";};
document.getElementById('unlockScenarios').onclick=()=>{devScenariosUnlocked=true;nightmareScenario.disabled=false;cannonScenario.disabled=false;if(fiveFrameScenario)fiveFrameScenario.disabled=false;nightmareScenario.querySelector('small').textContent='Captain Blackball • 3 reds vs 6-yellow blockade';cannonScenario.querySelector('small').textContent='Captain Blackball • oversized 28-ball rack';if(fiveFrameScenario)fiveFrameScenario.querySelector('small').textContent='Captain Blackball vs Darth Vaper • 5 automatic frames';msg.textContent='DEV: Test scenarios unlocked for this session.';};
confirmCue.onclick=()=>{if(placementMode==='none'||moving||state.frameOver||pendingChoice)return;placementMode='none';draggingCue=false;shootBtn.disabled=false;confirmCue.hidden=true;if(cuePlacementControls)cuePlacementControls.hidden=true;tableWrap?.classList.remove('placing-cue');msg.textContent=state.breakShot?'Cue ball placed — aim your break, choose power, then play the shot.':`Cue ball placed — ${pname(state.player)}, aim and play your shot.`;};
const clearPlayLogButton=document.getElementById('clearPlayLog');if(clearPlayLogButton)clearPlayLogButton.onclick=()=>{playHistory=[];shotNumber=0;renderPlayLog();};
function aiLegalTargets(){
  const on=onType(aiPlayer);
  return balls.filter(b=>!b.potted&&b.type!=='white'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
}
function aiPlaceCue(){
  if(placementMode==='none')return null;
  const c=cue(),profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[1],original={x:c.x,y:c.y};
  // Levels 4-5 actively use ball in hand: sample legal positions and keep the one
  // offering the best direct pot. Lower levels retain the simple placement behaviour.
  if(currentPirateLevel>=4&&!state.breakShot&&placementMode==='anywhere'){
    const candidates=[[c.x,c.y]];
    for(let ix=1;ix<=7;ix++)for(let iy=1;iy<=5;iy++)candidates.push([L+ballR+(PLAY_W-2*ballR)*ix/8,T+ballR+(PLAY_H-2*ballR)*iy/6]);
    let best=null;
    for(const [x,y] of candidates){
      if(!validCuePosition(x,y))continue;c.x=x;c.y=y;
      const pots=aiFindDirectPots();
      if(pots.length&&(!best||pots[0].score<best.plan.score))best={x,y,plan:{...pots[0]}};
    }
    if(best){c.x=best.x;c.y=best.y;placementMode='none';draggingCue=false;updatePlacementUI();return{smart:true,plan:best.plan,x:best.x,y:best.y};}
  }
  c.x=original.x;c.y=original.y;
  const candidates=[[c.x,c.y],[L+PLAY_W*.68,H/2],[L+PLAY_W*.72,T+PLAY_H*.35],[L+PLAY_W*.72,T+PLAY_H*.65]];
  for(const [x,y] of candidates){if(validCuePosition(x,y)){c.x=x;c.y=y;break;}}
  placementMode='none';draggingCue=false;updatePlacementUI();return{smart:false,x:c.x,y:c.y};
}
function aiSegmentClear(x1,y1,x2,y2,ignoreA=null,ignoreB=null,clearance=ballR*2.04){
  const vx=x2-x1,vy=y2-y1,len2=vx*vx+vy*vy;
  if(len2<1)return false;
  for(const b of balls){
    if(b.potted||b===ignoreA||b===ignoreB)continue;
    let t=((b.x-x1)*vx+(b.y-y1)*vy)/len2;t=clamp(t,0,1);
    const px=x1+vx*t,py=y1+vy*t;
    if(Math.hypot(b.x-px,b.y-py)<clearance)return false;
  }
  return true;
}
function aiDirectPreflight(plan){
  // V0.6.3: reconcile the attack planner with the actual straight-line first-contact geometry.
  // This does not simulate the shot or alter physics; it only rejects a theoretical pot when
  // the intended target is not actually the first ball on the cue-ball ray, or when that ray
  // enters a pocket mouth before reaching the planned ghost-ball contact point.
  const c=cue(),first=aiRayFirstBall(plan.deg);
  if(first!==plan.target)return {ok:false,reason:'FIRST CONTACT',first};
  const rad=plan.deg*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad);
  const contactDist=Math.hypot(plan.gx-c.x,plan.gy-c.y);
  for(let pi=0;pi<pockets.length;pi++){
    const [px,py]=pockets[pi],vx=px-c.x,vy=py-c.y,t=vx*dx+vy*dy;
    if(t<=0||t>=contactDist-ballR*.35)continue;
    const miss=Math.hypot(vx-dx*t,vy-dy*t);
    // Use a conservative mouth radius for Captain+; if the centre-line passes this close to
    // a pocket before object-ball contact, the route is too fragile to call a safe direct pot.
    if(miss<pocketR+ballR*.30)return {ok:false,reason:'CUE POCKET PATH',pocket:pi,margin:miss};
  }
  return {ok:true,first};
}

// V0.6.3: dry-run the planned shot through a silent copy of the real table physics.
// This lets Captain/Vaper validate post-contact cue-ball safety (including cushion rebounds)
// and catches geometry plans whose theoretical route disagrees with the actual engine.
function aiDryRunShot(deg,power,maxSeconds=9,frameDt=1/60){
  const sim=balls.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,vx:0,vy:0,potted:b.potted}));
  const c=sim.find(b=>b.type==='white');if(!c||c.potted)return{first:null,firstId:null,cuePotted:true,pots:[],potIds:[]};
  const p=power/100,speed=150+5800*Math.pow(p,1.35),rad=deg*Math.PI/180;c.vx=Math.cos(rad)*speed;c.vy=Math.sin(rad)*speed;
  let first=null,firstId=null;const pots=[],potIds=[];
  const pocketLocal=b=>{for(const q of pockets){const dx=b.x-q[0],dy=b.y-q[1];if(dx*dx+dy*dy<pocketR*pocketR){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}}const mouth=pocketR+ballR*.55;if((b.y<T-ballR*.12||b.y>B+ballR*.12)&&(Math.abs(b.x-L)<mouth||Math.abs(b.x-CENTRE_X)<mouth||Math.abs(b.x-R)<mouth)){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}if((b.x<L-ballR*.12||b.x>R+ballR*.12)&&(Math.abs(b.y-T)<mouth||Math.abs(b.y-B)<mouth)){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}return false;};
  const wallsLocal=b=>{const nearLeft=Math.abs(b.x-L)<pocketR*1.3,nearRight=Math.abs(b.x-R)<pocketR*1.3,nearMiddle=Math.abs(b.x-CENTRE_X)<pocketR*1.35;if(b.x-ballR<L&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=L+ballR;b.vx=Math.abs(b.vx)*.91}if(b.x+ballR>R&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=R-ballR;b.vx=-Math.abs(b.vx)*.91}if(b.y-ballR<T&&!nearLeft&&!nearRight&&!nearMiddle){b.y=T+ballR;b.vy=Math.abs(b.vy)*.91}if(b.y+ballR>B&&!nearLeft&&!nearRight&&!nearMiddle){b.y=B-ballR;b.vy=-Math.abs(b.vy)*.91}const escaped=b.x<L-ballR*1.25||b.x>R+ballR*1.25||b.y<T-ballR*1.25||b.y>B+ballR*1.25;if(escaped){if(pocketLocal(b))return;b.x=clamp(b.x,L+ballR,R-ballR);b.y=clamp(b.y,T+ballR,B-ballR);if(b.x<=L+ballR+.01)b.vx=Math.abs(b.vx)*.91;if(b.x>=R-ballR-.01)b.vx=-Math.abs(b.vx)*.91;if(b.y<=T+ballR+.01)b.vy=Math.abs(b.vy)*.91;if(b.y>=B-ballR-.01)b.vy=-Math.abs(b.vy)*.91;}};
  const collideLocal=(a,b)=>{let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=ballR*2;if(d2>=min*min||d2===0)return;let d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;if(!first){if(a.type==='white'&&b.type!=='white'&&!b.potted){first=b.type;firstId=b.id}else if(b.type==='white'&&a.type!=='white'&&!a.potted){first=a.type;firstId=a.id}}let rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)return;const j=-(1+.965)*sep/2,ix=j*nx,iy=j*ny;a.vx-=ix;a.vy-=iy;b.vx+=ix;b.vy+=iy;};
  const dt=frameDt,steps=Math.ceil(maxSeconds/dt);for(let z=0;z<steps;z++){const maxSpeed=Math.max(...sim.filter(b=>!b.potted).map(b=>Math.hypot(b.vx,b.vy)),0);if(maxSpeed<5&&z>20)break;const sub=Math.max(4,Math.min(12,Math.ceil(maxSpeed*dt/(ballR*.55)))),sdt=dt/sub;for(let k=0;k<sub;k++){for(const b of sim){if(b.potted)continue;b.x+=b.vx*sdt;b.y+=b.vy*sdt;if(pocketLocal(b))continue;wallsLocal(b);const drag=Math.pow(.985,sdt*60);b.vx*=drag;b.vy*=drag;if(Math.hypot(b.vx,b.vy)<5)b.vx=b.vy=0;}for(let i=0;i<sim.length;i++)if(!sim[i].potted)for(let j=i+1;j<sim.length;j++)if(!sim[j].potted)collideLocal(sim[i],sim[j]);}}
  return{first,firstId,cuePotted:sim.find(b=>b.type==='white')?.potted||false,pots,potIds};
}
// V0.7.5: Darth Vaper is 'Perfect', so his confidence labels must describe the actual
// physics result, not merely a legal first contact.  A direct attack counts as successful only
// when the intended object ball is actually potted; a combination must pot its intended second ball.
function aiForecastPotsIntended(test,plan){
  if(!test||!plan)return false;
  if(plan.kind==='DIRECT POT')return test.potIds?.includes(plan.target?.id);
  if(plan.kind==='COMBINATION POT')return test.potIds?.includes(plan.secondary?.id);
  return true;
}
// V0.7.10: dedicated black-ball win validator.  Once a player is actually on black,
// a direct pot is judged as a frame-winning shot rather than an ordinary attack.  The black
// must be potted, the intended black must be first contact, and the cue ball must survive at
// both physics cadences plus narrow aim/power probes.  This specifically guards against the
// late-frame black+white losses exposed by the five-frame QA run.
function aiBlackWinConfidence(candidate){
  if(!candidate||onType(state.player)!=='black'||candidate.target?.type!=='black')return 0;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  let passed=0;
  for(const [da,dp,dt] of probes){
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    if(test.first==='black'&&test.firstId===candidate.target.id&&!test.cuePotted&&test.potIds?.includes(candidate.target.id))passed++;
  }
  return passed/probes.length;
}

// V0.7.11: Vaper may take a high-confidence frame ball without requiring a perfect 6/6.
// FRAME KILL still requires every probe to make the correct first contact and keep the cue ball alive;
// the 5/6 threshold therefore permits a plausible miss, never a forecast foul/black+white loss.
function aiVaperFrameKillSafe(candidate){
  if(currentPirateLevel!==7||!candidate||candidate.target?.type!=='black')return false;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  return probes.every(([da,dp,dt])=>{
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    return test.first==='black'&&test.firstId===candidate.target.id&&!test.cuePotted;
  });
}

function aiVaperDirectConfidence(candidate){
  if(currentPirateLevel!==7||!candidate)return 0;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  let passed=0;
  const plan={...candidate,kind:'DIRECT POT'};
  for(const [da,dp,dt] of probes){
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    if(test.first===candidate.target?.type&&test.firstId===candidate.target?.id&&!test.cuePotted&&aiForecastPotsIntended(test,plan))passed++;
  }
  return passed/probes.length;
}

function aiValidateFinalPlan(plan){
  if(state.breakShot)return plan;
  // V0.7.4: high-level AI must notice a foreseeable early-black loss before committing.
  // This is not clairvoyance: it uses the same silent physics forecast already used for QA.
  if(currentPirateLevel>=4&&onType(state.player)!=='black'){
    const blackTests=[aiDryRunShot(plan.deg,plan.power,9,1/60),aiDryRunShot(plan.deg,plan.power,9,1/120)];
    if(blackTests.some(test=>test.pots.includes('black'))){plan.blackLossRisk=true;plan.physicsSafety='REJECT: BLACK LOSS RISK — forecast pots black before colours are cleared';return null;}
  }
  if(currentPirateLevel<5)return plan;
  // V0.6.5: validate against both a normal 60 Hz browser frame and the finer 120 Hz dry-run.
  // The live game advances using requestAnimationFrame, so a route that is safe only at one
  // integration cadence is too fragile for Captain/Vaper to trust.
  const tests=[aiDryRunShot(plan.deg,plan.power,9,1/60),aiDryRunShot(plan.deg,plan.power,9,1/120)];
  const contactOK=tests.every(test=>test.first===plan.target?.type&&test.firstId===plan.target?.id);
  const cueSafe=tests.every(test=>!test.cuePotted);
  plan.physicsForecast=tests[0];
  const isBlack=plan.target?.type==='black';
  // Small aim/power probes now apply to every Captain/Vaper attack, not only the final black.
  // This is deliberately narrow: it catches pocket-mouth edge cases without making the AI
  // abandon ordinary attacking pool simply because a wildly different shot would be unsafe.
  const vaperAttack=currentPirateLevel===7&&(plan.kind==='DIRECT POT'||plan.kind==='COMBINATION POT');
  const intendedPotOK=!vaperAttack||tests.every(test=>aiForecastPotsIntended(test,plan));
  let robust=contactOK&&cueSafe&&intendedPotOK;
  // V0.7.7: Darth Vaper must not talk himself out of a sound final-colour pot merely
  // because one of the deliberately harsh +/-0.12deg robustness probes misses. If the
  // actual intended shot pots his final colour at BOTH physics cadences, hits the correct
  // ball first and keeps the white up, protect that attack from the later safety hard-veto.
  // Premature-black risk is still rejected above, so this is not a rules/physics cheat.
  const vaperGroup=state.groups[state.player];
  const vaperFinalColour=currentPirateLevel===7&&plan.kind==='DIRECT POT'&&vaperGroup&&remaining(vaperGroup)===1&&plan.target?.type===vaperGroup;
  const vaperFinalBasePass=vaperFinalColour&&contactOK&&cueSafe&&intendedPotOK;
  if(robust){
    for(const [da,dp] of [[-.12,0],[.12,0],[0,-1],[0,1]]){
      const probe60=aiDryRunShot(plan.deg+da,clamp(plan.power+dp,5,100),9,1/60);
      const probe120=aiDryRunShot(plan.deg+da,clamp(plan.power+dp,5,100),9,1/120);
      const probePotOK=!vaperAttack||(aiForecastPotsIntended(probe60,plan)&&aiForecastPotsIntended(probe120,plan));
      if(probe60.first!==plan.target?.type||probe60.firstId!==plan.target?.id||probe60.cuePotted||probe120.first!==plan.target?.type||probe120.firstId!==plan.target?.id||probe120.cuePotted||!probePotOK){robust=false;break;}
    }
  }
  if(robust){plan.physicsSafety=isBlack?'PASS (black robustness checked)':'PASS (robustness checked)';return plan;}
  if(plan.vaperFrameKill&&isBlack&&aiVaperFrameKillSafe(plan)&&aiBlackWinConfidence(plan)>=5/6){
    plan.physicsSafety='PASS (FRAME KILL: safe black contact/cue survival across probes; 5/6+ pot confidence)';
    plan.personalityInfluence=`BLACK BALL INTELLIGENCE • FRAME KILL • ${Math.round(aiBlackWinConfidence(plan)*100)}% probe confidence • Vaper aggression override`;
    return plan;
  }
  if(vaperFinalBasePass){
    plan.finalColourOverride=true;
    plan.physicsSafety='PASS (final-colour direct pot protected; base physics reproduced at 60/120 Hz)';
    plan.personalityInfluence='ENDGAME OVERRIDE: FINAL COLOUR • direct pot protected from safety veto';
    return plan;
  }
  // Captain's tiny execution error must never knowingly turn a sound intended route into an illegal one.
  if(plan.intendedDeg!=null&&Math.abs(plan.deg-plan.intendedDeg)>.0001){
    const retry60=aiDryRunShot(plan.intendedDeg,plan.power,9,1/60),retry120=aiDryRunShot(plan.intendedDeg,plan.power,9,1/120);
    if(retry60.first===plan.target?.type&&retry60.firstId===plan.target?.id&&!retry60.cuePotted&&retry120.first===plan.target?.type&&retry120.firstId===plan.target?.id&&!retry120.cuePotted){plan.deg=plan.intendedDeg;plan.error=0;plan.physicsForecast=retry60;plan.physicsSafety='PASS (aim error suppressed)';return plan;}
  }
  const badContact=tests.find(test=>test.first!==plan.target?.type||test.firstId!==plan.target?.id);
  plan.physicsSafety=`REJECT: ${badContact?'predicted first contact '+String(badContact.first||'NONE').toUpperCase()+(badContact.firstId!=null?' #'+badContact.firstId:''):!cueSafe?'predicted cue-ball in-off':vaperAttack&&!intendedPotOK?'intended pot not reproduced by physics forecast':'fragile cue-ball/contact route'}`;return null;
}

function aiFindDirectPots(){
  const c=cue(),plans=[];
  for(const target of aiLegalTargets())for(let pi=0;pi<pockets.length;pi++){
    const [px,py]=pockets[pi],pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);
    if(pdist<ballR*2.2)continue;
    const ux=pvx/pdist,uy=pvy/pdist;
    // Ghost-ball centre: where the cue ball centre should be at impact to send the object ball to pocket.
    const gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
    if(!aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82))continue;
    if(!aiSegmentClear(c.x,c.y,gx,gy,c,target,currentPirateLevel>=4?ballR*2.18:ballR*2.03))continue;
    const cueDist=Math.hypot(gx-c.x,gy-c.y),aimx=gx-c.x,aimy=gy-c.y,ilen=Math.max(1,Math.hypot(aimx,aimy));
    const incomingX=aimx/ilen,incomingY=aimy/ilen,cutCos=clamp(incomingX*ux+incomingY*uy,-1,1),cutDeg=Math.acos(cutCos)*180/Math.PI;
    // Crude cue-ball danger estimate: after a cut the white tends to continue along the component
    // of its incoming direction not transferred to the object ball. Penalise that line if it heads at a pocket.
    let rx=incomingX-ux*Math.max(0,cutCos),ry=incomingY-uy*Math.max(0,cutCos),rlen=Math.hypot(rx,ry),inOffRisk=false,inOffMargin=999;
    // Start the post-impact cue-ball prediction at the ghost-ball contact position, not the
    // object-ball centre. This is deliberately conservative for the stronger pirates.
    if(rlen>.08){rx/=rlen;ry/=rlen;for(const [qx,qy] of pockets){const vx=qx-gx,vy=qy-gy,t=vx*rx+vy*ry;if(t>0){const miss=Math.hypot(vx-rx*t,vy-ry*t);inOffMargin=Math.min(inOffMargin,miss);if(miss<pocketR+ballR*.72){inOffRisk=true;break;}}}}
    // Short routes and gentle cuts are easier. Very thin/back-cut-looking routes are marked
    // marginal so Levels 4+ can compare them with a safety rather than blindly attacking.
    const marginalAttack=cutDeg>72||cueDist>1050||pdist>1250;
    const score=pdist+cueDist*.72+cutDeg*10+(inOffRisk?1400:0)+(marginalAttack?450:0);
    const candidate={target,pocket:pi,gx,gy,deg:Math.atan2(aimy,aimx)*180/Math.PI,power:clamp(Math.round(30+(cueDist+pdist)*.025),32,68),score,cutDeg,inOffRisk,inOffMargin,marginalAttack};
    if(currentPirateLevel>=5){
      const preflight=aiDirectPreflight(candidate);candidate.preflight=preflight;
      if(!preflight.ok)continue;
    }
    plans.push(candidate);
  }
  return plans.sort((a,b)=>a.score-b.score);
}

function aiFindCombinationPots(){
  // V0.6.3 strategic attack layer: deliberate two-object-ball combinations.
  // Geometry: cue -> legal ball A -> same-group/legal ball B -> pocket.
  // Start with Captain Blackball + Darth Vaper so the feature can be validated
  // without confusing geometry failures with the larger execution errors of lower AI.
  if(state.breakShot||!(currentPirateLevel===5||currentPirateLevel===7))return [];
  const c=cue(),legal=aiLegalTargets(),plans=[];
  const on=onType(state.player);
  const secondaries=balls.filter(b=>!b.potted&&b.type!=='white'&&b.type!=='black'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
  for(const first of legal){
    if(first.type==='black')continue; // don't use the frame ball as a cannoning ball
    for(const second of secondaries){
      if(second===first||second.type!==first.type)continue; // simple same-group combinations only in this first pass
      for(let pi=0;pi<pockets.length;pi++){
        const [px,py]=pockets[pi];
        // Secondary ball B must have a clean line to the pocket.
        const bvx=px-second.x,bvy=py-second.y,bdist=Math.hypot(bvx,bvy);if(bdist<ballR*2.2)continue;
        const bux=bvx/bdist,buy=bvy/bdist;
        if(!aiSegmentClear(second.x,second.y,px,py,second,null,ballR*1.82))continue;
        // A must arrive one diameter behind B on B's pocket line.
        const ax=second.x-bux*ballR*2,ay=second.y-buy*ballR*2;
        if(ax<L+ballR||ax>R-ballR||ay<T+ballR||ay>B-ballR)continue;
        const avx=ax-first.x,avy=ay-first.y,adist=Math.hypot(avx,avy);if(adist<ballR*2.15)continue;
        const aux=avx/adist,auy=avy/adist;
        // Reject combinations requiring A to travel through another ball before B.
        if(!aiSegmentClear(first.x,first.y,ax,ay,first,second,ballR*1.86))continue;
        // Cue ghost position needed to send A toward the A->B collision point.
        const gx=first.x-aux*ballR*2,gy=first.y-auy*ballR*2;
        if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
        if(!aiSegmentClear(c.x,c.y,gx,gy,c,first,ballR*2.18))continue;
        const cueDist=Math.hypot(gx-c.x,gy-c.y),inx=(gx-c.x)/Math.max(1,cueDist),iny=(gy-c.y)/Math.max(1,cueDist);
        const firstCut=Math.acos(clamp(inx*aux+iny*auy,-1,1))*180/Math.PI;
        // At A->B impact, A's travel direction should be reasonably aligned with B's pocket line.
        const secondCut=Math.acos(clamp(aux*bux+auy*buy,-1,1))*180/Math.PI;
        if(firstCut>78||secondCut>34)continue;
        const total=cueDist+adist+bdist;
        const score=total+firstCut*13+secondCut*18+420; // complexity premium vs a direct pot
        const power=clamp(Math.round(38+total*.022),42,76);
        plans.push({target:first,secondary:second,pocket:pi,gx,gy,deg:Math.atan2(gy-c.y,gx-c.x)*180/Math.PI,power,score,cutDeg:firstCut,secondCut,routeDistance:total,kind:'COMBINATION POT',profile:(AI_PROFILES[currentPirateLevel]||AI_PROFILES[5]).label});
      }
    }
  }
  return plans.sort((a,b)=>a.score-b.score);
}

const AI_PROFILES={
  1:{label:'Wobbly',aimError:4.2,potError:3.4,potChoice:1,breakPower:88,fallbackPower:55,powerError:10},
  2:{label:'Learner',aimError:2.8,potError:2.2,potChoice:2,breakPower:90,fallbackPower:52,powerError:7},
  3:{label:'Competent',aimError:1.55,potError:1.15,potChoice:3,breakPower:91,fallbackPower:50,powerError:4},
  4:{label:'Sharp',aimError:.75,potError:.55,potChoice:5,breakPower:92,fallbackPower:48,powerError:2},
  5:{label:'Captain',aimError:.28,potError:.18,potChoice:8,breakPower:93,fallbackPower:47,powerError:1},
  6:{label:'Cyclops',aimError:.75,potError:.55,potChoice:5,breakPower:100,fallbackPower:100,powerError:0},
  7:{label:'Perfect',aimError:0,potError:0,potChoice:999,breakPower:93,fallbackPower:47,powerError:0}
};
// V0.7.0 personality framework: difficulty controls execution; personality biases selection only.
const AI_PERSONALITIES={
  1:{label:'Eager Deckhand',aggression:.92,safety:.70,flair:.55,position:.55},
  2:{label:'Pub Improviser',aggression:1.02,safety:.78,flair:.72,position:.68},
  3:{label:'Straight Shooter',aggression:1.00,safety:.92,flair:.78,position:.88},
  4:{label:'Cagey First Mate',aggression:.92,safety:1.18,flair:.82,position:1.08},
  5:{label:'Tactical Captain',aggression:1.00,safety:1.18,flair:.95,position:1.22},
  6:{label:'One-Eyed Wrecking Ball',aggression:1.38,safety:.48,flair:1.12,position:.62},
  7:{label:'Dark Showman',aggression:1.18,safety:1.02,flair:1.48,position:1.12}
};
function aiPersonality(){return AI_PERSONALITIES[currentPirateLevel]||AI_PERSONALITIES[3];}
function aiPersonalityLine(pick){const q=aiPersonality();return `PERSONALITY: ${q.label} • aggression ${q.aggression.toFixed(2)} • safety ${q.safety.toFixed(2)} • flair ${q.flair.toFixed(2)} • position ${q.position.toFixed(2)}${pick?.personalityInfluence?' • influence: '+pick.personalityInfluence:''}`;}
function aiRandError(max){return (Math.random()*2-1)*max;}

function aiCountOpponentDirectPotsFrom(x,y){
  const c=cue(),ox=c.x,oy=c.y,op=opponent(aiPlayer),on=onType(op);let count=0;
  c.x=x;c.y=y;
  const targets=balls.filter(b=>!b.potted&&b.type!=='white'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
  for(const target of targets){
    for(const [px,py] of pockets){
      const pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);if(pdist<ballR*2.2)continue;
      const ux=pvx/pdist,uy=pvy/pdist,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
      if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
      if(aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82)&&aiSegmentClear(x,y,gx,gy,c,target,ballR*2.03)){count++;break;}
    }
  }
  c.x=ox;c.y=oy;return count;
}
function aiRayFirstBall(deg,maxDist=4000){
  // Predict the first object ball touched by a straight cue-ball ray. This is used as a
  // legality gate for tactical/fallback plans; it does not alter the shared physics engine.
  const c=cue(),rad=deg*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad);let best=null,bestT=Infinity;
  for(const b of balls){
    if(b.potted||b===c)continue;
    const vx=b.x-c.x,vy=b.y-c.y,along=vx*dx+vy*dy;if(along<=0||along>maxDist)continue;
    const perp2=vx*vx+vy*vy-along*along,rr=(ballR*2.02)**2;if(perp2>rr)continue;
    const hit=along-Math.sqrt(Math.max(0,rr-perp2));if(hit<bestT){bestT=hit;best=b;}
  }
  return best;
}
function aiCountPotsForTypeFrom(x,y,type,exclude=null){
  const c=cue(),ox=c.x,oy=c.y;let count=0;c.x=x;c.y=y;
  const targets=balls.filter(b=>!b.potted&&b!==exclude&&b.type===type);
  for(const target of targets)for(const [px,py] of pockets){
    const pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);if(pdist<ballR*2.2)continue;
    const ux=pvx/pdist,uy=pvy/pdist,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
    if(aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82)&&aiSegmentClear(x,y,gx,gy,c,target,ballR*2.18)){count++;break;}
  }
  c.x=ox;c.y=oy;return count;
}
function aiFindSafety(){
  if(state.breakShot||currentPirateLevel<4)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const before=aiCountOpponentDirectPotsFrom(c.x,c.y),candidates=[];
  for(const target of targets){
    const dx=target.x-c.x,dy=target.y-c.y,d=Math.hypot(dx,dy);if(d<1)continue;
    if(!aiSegmentClear(c.x,c.y,target.x,target.y,c,target,ballR*2.03))continue;
    const ux=dx/d,uy=dy/d;
    // Approximate a controlled thin/medium contact. We deliberately favour leaving the white
    // near a cushion while still making a legal first contact; physics remains identical for AI/human.
    for(const offset of [-2.2,0,2.2]){
      const deg=Math.atan2(dy,dx)*180/Math.PI+offset;
      if(aiRayFirstBall(deg)!==target)continue; // V0.6.3: never knowingly foul on first contact
      const travel=Math.min(250,Math.max(110,d*.22));
      const rad=deg*Math.PI/180,ex=clamp(target.x+Math.cos(rad)*travel,L+ballR,R-ballR),ey=clamp(target.y+Math.sin(rad)*travel,T+ballR,B-ballR);
      const after=aiCountOpponentDirectPotsFrom(ex,ey);
      const rail=Math.min(ex-L,R-ex,ey-T,B-ey);
      const score=after*500+rail*.8+d*.08;
      candidates.push({target,deg,intendedDeg:deg,power:currentPirateLevel===7?34:38,kind:'SAFETY',profile:(AI_PROFILES[currentPirateLevel]||AI_PROFILES[4]).label,opponentPotsBefore:before,opponentPotsAfter:after,estimatedCue:{x:ex,y:ey},safetyScore:score});
    }
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.safetyScore-b.safetyScore);
  const best={...candidates[0]},profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[4];
  const error=currentPirateLevel===7?0:aiRandError(profile.aimError*.55),powerError=currentPirateLevel===7?0:Math.round(aiRandError(Math.max(1,profile.powerError)));
  best.error=error;best.deg+=error;best.power=currentPirateLevel===6?100:clamp(best.power+powerError,22,100);best.powerError=currentPirateLevel===6?0:powerError;
  if(currentPirateLevel>=5){const checked=aiValidateFinalPlan(best);if(!checked)return null;return checked;}
  return best;
}


function aiFindCushionEscape(){
  // Stronger pirates can deliberately escape a snooker by going cue ball -> cushion -> legal ball.
  // This planner only chooses geometry; the actual shot still uses the normal shared physics engine.
  if(state.breakShot||currentPirateLevel<4)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const rails=[
    {name:'left',axis:'x',v:L+ballR},
    {name:'right',axis:'x',v:R-ballR},
    {name:'top',axis:'y',v:T+ballR},
    {name:'bottom',axis:'y',v:B-ballR}
  ];
  const plans=[];
  for(const target of targets)for(const rail of rails){
    // Mirror the target centre across the cushion. A straight line to the mirror gives the
    // equal-angle cushion contact point. Then stop the second leg one ball diameter short.
    const mx=rail.axis==='x'?2*rail.v-target.x:target.x;
    const my=rail.axis==='y'?2*rail.v-target.y:target.y;
    const vx=mx-c.x,vy=my-c.y;
    let t;
    if(rail.axis==='x'){
      if(Math.abs(vx)<1e-6)continue;t=(rail.v-c.x)/vx;
    }else{
      if(Math.abs(vy)<1e-6)continue;t=(rail.v-c.y)/vy;
    }
    if(t<=.02||t>=.98)continue;
    const bx=c.x+vx*t,by=c.y+vy*t;
    if(bx<L+ballR||bx>R-ballR||by<T+ballR||by>B-ballR)continue;
    // Don't plan a bank through a pocket mouth/corner jaw.
    if(pockets.some(([px,py])=>Math.hypot(px-bx,py-by)<pocketR+ballR*1.35))continue;
    const ax=target.x-bx,ay=target.y-by,alen=Math.hypot(ax,ay);if(alen<ballR*2.4)continue;
    const ux=ax/alen,uy=ay/alen,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    // Both legs must be genuinely clear. A conservative envelope is intentional here: a
    // level-5 escape should not knowingly clip an opponent ball before reaching its target.
    const clearance=currentPirateLevel>=5?ballR*2.16:ballR*2.08;
    if(!aiSegmentClear(c.x,c.y,bx,by,c,null,clearance))continue;
    if(!aiSegmentClear(bx,by,gx,gy,c,target,clearance))continue;
    const leg1=Math.hypot(bx-c.x,by-c.y),leg2=Math.hypot(gx-bx,gy-by),total=leg1+leg2;
    const incidence=rail.axis==='x'?Math.abs((bx-c.x)/Math.max(1,leg1)):Math.abs((by-c.y)/Math.max(1,leg1));
    if(incidence<.12)continue; // reject almost-parallel grazes that are too fragile numerically
    const score=total+(1-incidence)*180;
    plans.push({target,rail:rail.name,bounce:{x:bx,y:by},ghost:{x:gx,y:gy},deg:Math.atan2(by-c.y,bx-c.x)*180/Math.PI,power:clamp(Math.round(46+total*.018),48,72),escapeScore:score,kind:'CUSHION ESCAPE',profile:(AI_PROFILES[currentPirateLevel]||AI_PROFILES[4]).label});
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]},profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[4];
  const error=currentPirateLevel===7?0:aiRandError(profile.aimError*.38),powerError=currentPirateLevel===7?0:Math.round(aiRandError(Math.max(1,profile.powerError*.7)));
  best.intendedDeg=best.deg;best.error=error;best.deg+=error;best.power=currentPirateLevel===6?100:clamp(best.power+powerError,35,100);best.powerError=currentPirateLevel===6?0:powerError;
  return best;
}


function aiFindTwoCushionEscape(){
  // Captain Blackball and Darth Vaper can search a genuine two-cushion escape when neither
  // a direct legal contact nor a one-cushion route exists. This is pure table geometry: the
  // eventual shot is still executed by the same physics engine as a human shot.
  if(state.breakShot||!(currentPirateLevel===5||currentPirateLevel===7))return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const rails=[
    {name:'left',axis:'x',v:L+ballR},
    {name:'right',axis:'x',v:R-ballR},
    {name:'top',axis:'y',v:T+ballR},
    {name:'bottom',axis:'y',v:B-ballR}
  ];
  const reflectPoint=(x,y,rail)=>rail.axis==='x'?{x:2*rail.v-x,y}:{x,y:2*rail.v-y};
  const transformedRail=(rail,mirror)=>{
    if(rail.axis===mirror.axis)return {axis:rail.axis,v:2*mirror.v-rail.v};
    return {axis:rail.axis,v:rail.v};
  };
  const lineHit=(x1,y1,x2,y2,rail)=>{
    const dx=x2-x1,dy=y2-y1;
    if(rail.axis==='x'){
      if(Math.abs(dx)<1e-7)return null;const t=(rail.v-x1)/dx;
      return {t,x:rail.v,y:y1+dy*t};
    }
    if(Math.abs(dy)<1e-7)return null;const t=(rail.v-y1)/dy;
    return {t,x:x1+dx*t,y:rail.v};
  };
  const inside=(x,y)=>x>=L+ballR&&x<=R-ballR&&y>=T+ballR&&y<=B-ballR;
  const plans=[];
  for(const target of targets)for(const r1 of rails)for(const r2 of rails){
    if(r1===r2)continue;
    // Unfold the table twice: target reflected in the second cushion, then the first.
    const im2=reflectPoint(target.x,target.y,r2),image=reflectPoint(im2.x,im2.y,r1);
    const h1=lineHit(c.x,c.y,image.x,image.y,r1);if(!h1||h1.t<=.015||h1.t>=.96)continue;
    const r2u=transformedRail(r2,r1),h2u=lineHit(c.x,c.y,image.x,image.y,r2u);
    if(!h2u||h2u.t<=h1.t+.02||h2u.t>=.985)continue;
    const b1={x:h1.x,y:h1.y},b2=reflectPoint(h2u.x,h2u.y,r1);
    if(!inside(b1.x,b1.y)||!inside(b2.x,b2.y))continue;
    if(pockets.some(([px,py])=>Math.hypot(px-b1.x,py-b1.y)<pocketR+ballR*1.45||Math.hypot(px-b2.x,py-b2.y)<pocketR+ballR*1.45))continue;
    const ax=target.x-b2.x,ay=target.y-b2.y,alen=Math.hypot(ax,ay);if(alen<ballR*2.5)continue;
    const ux=ax/alen,uy=ay/alen,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    const clearance=ballR*2.16;
    if(!aiSegmentClear(c.x,c.y,b1.x,b1.y,c,null,clearance))continue;
    if(!aiSegmentClear(b1.x,b1.y,b2.x,b2.y,c,null,clearance))continue;
    if(!aiSegmentClear(b2.x,b2.y,gx,gy,c,target,clearance))continue;
    const d1=Math.hypot(b1.x-c.x,b1.y-c.y),d2=Math.hypot(b2.x-b1.x,b2.y-b1.y),d3=Math.hypot(gx-b2.x,gy-b2.y),total=d1+d2+d3;
    // Reject very shallow rail grazes: they are fragile and rarely a sensible escape.
    const inc1=r1.axis==='x'?Math.abs((b1.x-c.x)/Math.max(1,d1)):Math.abs((b1.y-c.y)/Math.max(1,d1));
    const inc2=r2.axis==='x'?Math.abs((b2.x-b1.x)/Math.max(1,d2)):Math.abs((b2.y-b1.y)/Math.max(1,d2));
    if(inc1<.11||inc2<.11)continue;
    const score=total+(1-inc1)*170+(1-inc2)*170;
    plans.push({target,rails:[r1.name,r2.name],bounce1:b1,bounce2:b2,ghost:{x:gx,y:gy},deg:Math.atan2(b1.y-c.y,b1.x-c.x)*180/Math.PI,power:clamp(Math.round(57+total*.014),58,82),escapeScore:score,kind:'TWO CUSHION ESCAPE',profile:(AI_PROFILES[currentPirateLevel]||AI_PROFILES[5]).label});
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]},profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[5];
  const error=currentPirateLevel===7?0:aiRandError(profile.aimError*.28),powerError=currentPirateLevel===7?0:Math.round(aiRandError(Math.max(1,profile.powerError*.6)));
  best.intendedDeg=best.deg;best.error=error;best.deg+=error;best.power=clamp(best.power+powerError,45,100);best.powerError=powerError;
  return best;
}


function aiFindThreeCushionEscape(){
  // Darth Vaper only: if direct, one-cushion and two-cushion legal routes all fail,
  // search a three-cushion escape. This deliberately remains a last resort.
  if(state.breakShot||currentPirateLevel!==7)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const minX=L+ballR,maxX=R-ballR,minY=T+ballR,maxY=B-ballR;
  const pocketDanger=(x,y)=>pockets.some(([px,py])=>Math.hypot(px-x,py-y)<pocketR+ballR*1.45);
  const rayToRail=(x,y,dx,dy)=>{
    const hits=[];
    if(dx<-.00001)hits.push({t:(minX-x)/dx,name:'left'});
    if(dx>.00001)hits.push({t:(maxX-x)/dx,name:'right'});
    if(dy<-.00001)hits.push({t:(minY-y)/dy,name:'top'});
    if(dy>.00001)hits.push({t:(maxY-y)/dy,name:'bottom'});
    const h=hits.filter(q=>q.t>.001).sort((a,b)=>a.t-b.t)[0];
    if(!h)return null;
    return{x:x+dx*h.t,y:y+dy*h.t,t:h.t,name:h.name};
  };
  const plans=[];
  // Vaper is a diagnostic opponent, so a dense deterministic angular search is appropriate.
  // 0.1 degree resolution matches the player's precision control and introduces no hidden physics.
  for(let tenth=0;tenth<3600;tenth++){
    const deg=tenth/10,rad=deg*Math.PI/180;let x=c.x,y=c.y,dx=Math.cos(rad),dy=Math.sin(rad),prev={x,y};
    const bounces=[],rails=[];let valid=true,total=0;
    for(let n=0;n<3;n++){
      const h=rayToRail(x,y,dx,dy);if(!h){valid=false;break;}
      if(pocketDanger(h.x,h.y)){valid=false;break;}
      const seg=Math.hypot(h.x-prev.x,h.y-prev.y);if(seg<ballR*2.8){valid=false;break;}
      if(!aiSegmentClear(prev.x,prev.y,h.x,h.y,c,null,ballR*2.16)){valid=false;break;}
      total+=seg;bounces.push({x:h.x,y:h.y});rails.push(h.name);
      // Avoid immediate same-rail numerical rebounds and very shallow grazes.
      const incidence=(h.name==='left'||h.name==='right')?Math.abs(dx):Math.abs(dy);
      if(incidence<.11){valid=false;break;}
      if(h.name==='left'||h.name==='right')dx=-dx;else dy=-dy;
      x=h.x+dx*.05;y=h.y+dy*.05;prev={x:h.x,y:h.y};
    }
    if(!valid||rails[0]===rails[1]||rails[1]===rails[2])continue;
    const end=rayToRail(x,y,dx,dy);if(!end)continue;
    // Find a legal object ball whose centre lies on the post-third-cushion ray before the next rail.
    for(const target of targets){
      const vx=target.x-x,vy=target.y-y,along=vx*dx+vy*dy;
      if(along<=ballR*2.2||along>=end.t)continue;
      const perp=Math.abs(vx*dy-vy*dx);
      if(perp>ballR*1.90)continue;
      // Stop at the ghost/contact point and verify that the final leg is clear of every other ball.
      const hitAlong=along-Math.sqrt(Math.max(0,(ballR*2)**2-perp**2));
      if(hitAlong<=0)continue;
      const gx=x+dx*hitAlong,gy=y+dy*hitAlong;
      if(!aiSegmentClear(x,y,gx,gy,c,target,ballR*2.16))continue;
      const route=total+hitAlong;
      const score=route+perp*20;
      plans.push({target,rails:[...rails],bounces:[...bounces],ghost:{x:gx,y:gy},deg,power:clamp(Math.round(68+route*.009),70,94),escapeScore:score,kind:'THREE CUSHION ESCAPE',profile:(AI_PROFILES[7]||{}).label||'Perfect'});
    }
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]};best.intendedDeg=best.deg;best.error=0;best.powerError=0;
  return best;
}



// V0.7.6: Darth Vaper's final escape layer is physics-led rather than geometry-led.
// It is only reached after the normal safety + 1/2/3-cushion solvers fail.  Unlike the
// generic emergency fallback, every returned route has actually reproduced a legal first
// contact in the silent copy of the real table physics.  This deliberately costs more CPU:
// Difficulty 7 is the hidden "Perfect" opponent and should search harder before accepting a foul.
function aiFindVaperPerfectEscape(){
  if(state.breakShot||currentPirateLevel!==7)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const targetKeys=new Set(targets.map(b=>`${b.type}:${b.id}`));
  const stillOnColours=onType(state.player)!=='black';
  const valid=(test)=>{
    if(!test||test.cuePotted||test.firstId==null)return false;
    if(!targetKeys.has(`${test.first}:${test.firstId}`))return false;
    if(stillOnColours&&test.pots.includes('black'))return false;
    return true;
  };
  const make=(target,deg,power,test,mode)=>({target,deg,intendedDeg:deg,error:0,power,powerError:0,
    kind:'PERFECT ESCAPE',profile:'Perfect',clearRoute:false,legalityValidated:true,
    predictedFirstType:test.first,predictedFirstId:test.firstId,physicsForecast:test,
    physicsSafety:'PASS (Perfect escape physics-validated)',perfectEscapeMode:mode,
    personalityInfluence:'PERFECT ESCAPE SEARCH — all simpler legal routes exhausted'});

  // Stage A: search very densely around each legal object's bearing.  This catches narrow
  // straight/glancing windows that the centre-line geometry can miss without invoking banks.
  const powers=[40,52,64,76,88];
  const offsets=[0];for(let d=.25;d<=12;d+=.25){offsets.push(-d,d);}
  for(const target of targets){
    const base=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
    for(const off of offsets)for(const power of powers){
      const deg=base+off,test=aiDryRunShot(deg,power,6,1/90);
      if(valid(test)&&test.first===target.type&&test.firstId===target.id)return make(target,deg,power,test,'dense legal-contact search');
    }
  }

  // Stage B: unrestricted table search.  Because this is judged by the real dry-run rather
  // than ray geometry, successful candidates may naturally reach the legal ball via cushions
  // or caroms.  We only need one legal survival route; elegance is irrelevant at this depth.
  for(let deg=0;deg<360;deg+=2){
    for(const power of [52,68,84,94]){
      const test=aiDryRunShot(deg,power,7,1/90);if(!valid(test))continue;
      const target=targets.find(b=>b.type===test.first&&b.id===test.firstId);if(target)return make(target,deg,power,test,'full-table physics search');
    }
  }
  return null;
}

function aiEmergencyFallback(reason='normal planner exhausted'){
  // V0.7.6: Vaper gets one final physics-validated escape search before the deliberately
  // foul-tolerant generic deadlock guard is allowed to fire.
  if(currentPirateLevel===7&&!state.breakShot){const perfect=aiFindVaperPerfectEscape();if(perfect){perfect.emergencyReason=reason;return perfect;}}
  // V0.7.1 deadlock guard: an AI turn must always resolve to a physical shot.
  // First look cheaply for ANY straight legal first contact. If none exists after the normal
  // safety/cushion solvers have already failed, play a least-bad contact attempt rather than
  // leaving the turn waiting forever. A foul is a valid game outcome; a frozen turn is not.
  const c=cue(),profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[1];
  let targets=aiLegalTargets();
  if(!targets.length)targets=balls.filter(b=>!b.potted&&b.type!=='white');
  if(!targets.length)return null;
  let chosen=null;
  for(let tenth=0;tenth<3600;tenth+=5){
    const deg=tenth/10,hit=aiRayFirstBall(deg);
    if(hit&&targets.includes(hit)){
      const d=Math.hypot(hit.x-c.x,hit.y-c.y);
      if(!chosen||d<chosen.d)chosen={target:hit,deg,d};
    }
  }
  if(!chosen){
    const target=[...targets].sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
    chosen={target,deg:Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI,d:Math.hypot(target.x-c.x,target.y-c.y)};
  }
  const legalFirst=aiRayFirstBall(chosen.deg)===chosen.target;
  const power=currentPirateLevel===6?100:clamp(Math.max(42,profile.fallbackPower||62),20,100);
  return {target:chosen.target,deg:chosen.deg,intendedDeg:chosen.deg,error:0,power,powerError:0,kind:'EMERGENCY FALLBACK',profile:profile.label,clearRoute:legalFirst,legalityValidated:legalFirst,predictedFirstType:aiRayFirstBall(chosen.deg)?.type||null,predictedFirstId:aiRayFirstBall(chosen.deg)?.id??null,emergencyReason:reason,personalityInfluence:'DEADLOCK GUARD — normal personality selection exhausted'};
}

function aiChooseBasicShot(){
  const c=cue(),targets=aiLegalTargets(),profile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[1],personality=aiPersonality();
  if(!targets.length)return aiEmergencyFallback('no legal target returned by rules-state lookup');
  if(!state.breakShot){
    const pots=aiFindDirectPots();
    const combinations=aiFindCombinationPots();
    // V0.7.5 Vaper discipline: before flair is allowed to promote a cannon/combination,
    // inspect the best few direct routes with the real physics engine. A genuinely high-
    // confidence simple pot is locked in: showmanship may break ties, not throw away free money.
    let vaperSimpleLock=null;
    if(currentPirateLevel===7&&pots.length){
      const candidates=pots.slice(0,Math.min(3,pots.length)).map(p=>({...p,vaperConfidence:aiVaperDirectConfidence(p)}));
      const reliable=candidates.filter(p=>p.vaperConfidence>=.999&&p.cutDeg<=38&&!p.inOffRisk&&!p.marginalAttack);
      if(reliable.length){
        reliable.sort((a,b)=>(a.score-b.score));
        vaperSimpleLock=reliable[0];
      }
    }
    // Blackball/Vaper now compare deliberate simple combinations with direct attacks.
    // A combination carries a complexity premium, so it wins only when it is genuinely
    // preferable to the available direct route rather than merely because it exists.
    const comboThreshold=.90*personality.flair;
    if(!vaperSimpleLock&&combinations.length&&(!pots.length||combinations[0].score<(pots[0].score*comboThreshold))){
      const comboProfile=AI_PROFILES[currentPirateLevel]||AI_PROFILES[5];
      for(const combo of combinations){
        let plan={...combo};
        const error=currentPirateLevel===7?0:aiRandError(comboProfile.potError*.72),powerError=currentPirateLevel===7?0:Math.round(aiRandError(Math.max(1,comboProfile.powerError)));
        plan.intendedDeg=plan.deg;plan.error=error;plan.deg+=error;plan.power=clamp(plan.power+powerError,35,88);plan.powerError=powerError;
        plan.directAlternative=pots.length?pots[0].score:null;
        plan.personalityInfluence=`FLAIR favoured combination (threshold ${comboThreshold.toFixed(2)})`;
        const checked=aiValidateFinalPlan(plan);if(checked)return checked;
      }
      // V0.6.4 hard veto: every rejected cannon is discarded; execution falls through to a safer plan.
    }
    if(pots.length){
      // Higher levels reject obvious in-off routes. If every theoretical pot is dangerous,
      // they are allowed to abandon the attack and look for a safety instead.
      let eligible=currentPirateLevel>=4?pots.filter(p=>!p.inOffRisk):pots;
      const blackDecision=onType(state.player)==='black'&&currentPirateLevel>=5;
      if(blackDecision&&eligible.length){
        eligible=eligible.map(p=>({...p,blackWinConfidence:aiBlackWinConfidence(p)}));
        const robustWins=eligible.filter(p=>p.blackWinConfidence>=1);
        if(robustWins.length){
          robustWins.sort((a,b)=>a.score-b.score);
          eligible=robustWins.map(p=>({...p,blackWinLock:true,personalityInfluence:`BLACK BALL INTELLIGENCE • WIN NOW • ${(p.blackWinConfidence*100).toFixed(0)}% robust physics confidence`}));
        }else if(currentPirateLevel===7){
          const frameKills=eligible.filter(p=>p.blackWinConfidence>=5/6&&aiVaperFrameKillSafe(p));
          if(frameKills.length){
            frameKills.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
            eligible=frameKills.map(p=>({...p,vaperFrameKill:true,personalityInfluence:`BLACK BALL INTELLIGENCE • FRAME KILL • ${Math.round(p.blackWinConfidence*100)}% probe confidence • Vaper aggression override`}));
          }else{
            eligible.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
          }
        }else{
          // No direct black is robust enough to call a winning shot. Keep the candidates for
          // diagnostics, but let the normal safety/escape decision layer compare them.
          eligible.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
        }
      }
      if(vaperSimpleLock&&!blackDecision){
        eligible=[{...vaperSimpleLock,personalityInfluence:`SIMPLE POT LOCK • ${(vaperSimpleLock.vaperConfidence*100).toFixed(0)}% physics confidence • flair override prohibited`}];
      }
      if(!eligible.length&&currentPirateLevel>=4){const safety=aiFindSafety();if(safety){safety.rejectedAttack={reason:'all direct pots carried an in-off risk',bestScore:pots[0].score};return safety;}}
      if(!eligible.length)eligible=pots;
      // Captain Blackball starts thinking one ball ahead. Estimate where the white will finish
      // after each pot and prefer a route that leaves it nearer another legal object ball.
      if(currentPirateLevel>=5&&eligible.length>=1){
        const liveTargets=aiLegalTargets();
        eligible=eligible.map(p=>{
          const c=cue(),vx=p.gx-c.x,vy=p.gy-c.y,vlen=Math.max(1,Math.hypot(vx,vy)),ix=vx/vlen,iy=vy/vlen;
          const [px,py]=pockets[p.pocket],ovx=px-p.target.x,ovy=py-p.target.y,olen=Math.max(1,Math.hypot(ovx,ovy)),ux=ovx/olen,uy=ovy/olen;
          const transfer=Math.max(0,ix*ux+iy*uy),rx=ix-ux*transfer,ry=iy-uy*transfer,rlen=Math.hypot(rx,ry);
          const ex=clamp(p.target.x+(rlen>.05?rx/rlen:ix)*170,L+ballR,R-ballR),ey=clamp(p.target.y+(rlen>.05?ry/rlen:iy)*170,T+ballR,B-ballR);
          const next=liveTargets.filter(b=>b!==p.target);const nextDist=next.length?Math.min(...next.map(b=>Math.hypot(b.x-ex,b.y-ey))):0;
          const group=state.groups[state.player],groupLeft=group?remaining(group):99;
          // V0.6.3 endgame: with 1-3 colours left, value actual next-shot availability rather
          // than distance alone. On the final colour, explicitly prepare a route to the black.
          let endgameBonus=0,nextRoutes=0,blackRoutes=0,endgameLabel='';
          if(group&&groupLeft<=3){
            if(groupLeft===1&&p.target.type===group){
              blackRoutes=aiCountPotsForTypeFrom(ex,ey,'black');
              endgameBonus=blackRoutes?-520:420;
              endgameLabel=blackRoutes?`FINAL COLOUR → black has ${blackRoutes} direct route${blackRoutes===1?'':'s'}`:'FINAL COLOUR → no direct black route predicted';
            }else if(p.target.type===group){
              nextRoutes=aiCountPotsForTypeFrom(ex,ey,group,p.target);
              endgameBonus=nextRoutes?-Math.min(360,nextRoutes*150):260;
              endgameLabel=`CLEARANCE: ${groupLeft} ${group.toUpperCase()} left • predicted next-pot routes ${nextRoutes}`;
            }
          }
          return {...p,positionScore:nextDist,estimatedCue:{x:ex,y:ey},nextRoutes,blackRoutes,endgameLabel,captainScore:p.score+nextDist*(.25*personality.position)+endgameBonus*personality.position,personalityInfluence:personality.position>1.1?'POSITION weighted strongly':personality.position<.75?'POSITION de-emphasised':'BALANCED position weighting'};
        });
        // V0.7.4: on the final colour, compare every viable pot route as a route TO the black,
        // not merely as a colour pot. If at least one forecast leaves a direct black, Captain+
        // strongly reject routes that leave none. Blackball weights this most heavily; Vaper still
        // values the black route but keeps a little more freedom for his flair personality.
        const group=state.groups[state.player],groupLeft=group?remaining(group):99;
        if(group&&groupLeft===1){
          const finalRoutes=eligible.filter(p=>p.target?.type===group);
          const withBlack=finalRoutes.filter(p=>(p.blackRoutes||0)>0);
          const candidateCount=finalRoutes.length,blackCandidateCount=withBlack.length;
          for(const p of finalRoutes){
            p.finalColourCandidates=candidateCount;p.blackCandidateCount=blackCandidateCount;
            if(blackCandidateCount){
              const routeWeight=currentPirateLevel===5?1.35:currentPirateLevel===7?1.12:1.20;
              if(p.blackRoutes>0){
                p.captainScore-=routeWeight*(900+Math.min(3,p.blackRoutes)*180)*personality.position;
                p.personalityInfluence=`BLACK POSITION prioritised • ${p.blackRoutes} direct black route${p.blackRoutes===1?'':'s'} forecast`;
                p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • ${blackCandidateCount} produce direct black • selected route forecasts ${p.blackRoutes}`;
              }else{
                p.captainScore+=routeWeight*1250*personality.position;
                p.personalityInfluence=`BLACK POSITION penalised route with no direct black`;
                p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • ${blackCandidateCount} produce direct black • this route produces none`;
              }
            }else{
              p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • no candidate produces direct black • selecting best available colour shot`;
            }
          }
        }
        eligible.sort((a,b)=>a.captainScore-b.captainScore);
      }
      // Mick/Blackball/Vaper compare ugly attacks with a genuine safety. A direct pot is not
      // automatically the right choice merely because the geometry can describe one.
      if(currentPirateLevel>=4&&eligible.length){
        const bestAttack=eligible[0],safety=aiFindSafety();
        const attackUgly=bestAttack.marginalAttack||bestAttack.cutDeg>72||bestAttack.score>1550;
        const safetyThreshold=.72*(personality.safety/personality.aggression);
        const safetyClearlyBetter=safety&&((safety.opponentPotsAfter<Math.max(1,safety.opponentPotsBefore)&&personality.safety>=.85)||safety.safetyScore<bestAttack.score*safetyThreshold);
        const blackWinLocked=bestAttack.blackWinLock===true;
        const vaperFrameKill=bestAttack.vaperFrameKill===true;
        const blackAttackProtected=blackWinLocked||vaperFrameKill;
        const blackAttackUnproven=onType(state.player)==='black'&&currentPirateLevel>=5&&!blackAttackProtected;
        if(safety&&!blackAttackProtected&&((attackUgly&&safetyClearlyBetter)||blackAttackUnproven)){
          const why=blackAttackUnproven?`black attack not robust enough to call WIN NOW (${Math.round((bestAttack.blackWinConfidence||0)*100)}% probe confidence)`:`marginal attack (cut ${bestAttack.cutDeg.toFixed(1)}°, route ${bestAttack.score.toFixed(0)})`;
          safety.rejectedAttack={reason:why,bestScore:bestAttack.score,target:bestAttack.target};
          safety.personalityInfluence=blackAttackUnproven?'BLACK BALL INTELLIGENCE • SAFETY preferred over unproven frame-ball attack':`SAFETY preferred (threshold ${safetyThreshold.toFixed(2)})`;
          return safety;
        }
      }
      const pool=eligible.slice(0,Math.min(profile.potChoice,eligible.length));
      const ordered=currentPirateLevel<=2?[pool[Math.floor(Math.random()*pool.length)]]:pool;
      let rejectedPlan=null;
      for(const candidate of ordered){
        let plan={...candidate};
        const error=aiRandError(profile.potError),powerError=Math.round(aiRandError(profile.powerError));
        plan.intendedDeg=plan.deg;plan.error=error;plan.deg+=error;plan.power=currentPirateLevel===6?100:clamp(plan.power+powerError,20,85);plan.powerError=currentPirateLevel===6?0:powerError;plan.kind='DIRECT POT';plan.profile=profile.label;plan.personalityInfluence=plan.personalityInfluence||((personality.aggression>1.15)?'AGGRESSION backed attack':(personality.position>1.1?'POSITION influenced route choice':'BALANCED attack'));
        const checked=aiValidateFinalPlan(plan);if(checked)return checked;rejectedPlan=plan;
      }
      if(currentPirateLevel>=5){const safety=aiFindSafety();if(safety){const blackRisk=rejectedPlan?.blackLossRisk;safety.rejectedAttack={reason:blackRisk?'BLACK LOSS RISK preflight rejected the remaining direct attack':'hard veto rejected all candidate direct attacks',bestScore:rejectedPlan?.score??eligible[0].score};return safety;}}
      if(currentPirateLevel<5&&rejectedPlan)return rejectedPlan;
      // Captain/Vaper never execute a direct attack their own forecast rejected.

    }
  }
  // No direct pot: first try a normal direct-contact safety. If every legal target is hidden,
  // Levels 4+ search for a one-cushion escape instead of knowingly shooting through blockers.
  const safety=aiFindSafety();
  if(safety){safety.personalityInfluence=safety.personalityInfluence||`${personality.safety>=1.1?'SAFETY identity':'TACTICAL fallback'} when no pot available`;return safety;}
  const escape=aiFindCushionEscape();
  if(escape){const checked=aiValidateFinalPlan(escape);if(checked)return checked;}
  // If one cushion cannot produce a legal route, Captain Blackball and Darth Vaper unfold
  // the table a second time and search a two-cushion escape before accepting a likely foul.
  const twoEscape=aiFindTwoCushionEscape();
  if(twoEscape){const checked=aiValidateFinalPlan(twoEscape);if(checked)return checked;}
  // Darth Vaper alone gets a third geometric escape layer. It is deliberately searched only
  // after every simpler route has failed, so three-cushion heroics never replace an easier shot.
  const threeEscape=aiFindThreeCushionEscape();
  if(threeEscape){const checked=aiValidateFinalPlan(threeEscape);if(checked)return checked;}
  // V0.7.6: if Vaper's geometric solvers all fail, search the actual physics engine for any
  // survivable legal contact (including routes that naturally bank/carom) before emergency play.
  const perfectEscape=aiFindVaperPerfectEscape();
  if(perfectEscape)return perfectEscape;
  // Otherwise prefer a target with a clearer cue-ball route instead of blindly taking nearest.
  const ranked=targets.map(target=>{const d=Math.hypot(target.x-c.x,target.y-c.y);const clearance=currentPirateLevel>=4?ballR*2.18:ballR*2.03;const clear=aiSegmentClear(c.x,c.y,target.x,target.y,c,target,clearance);return{target,d,clear,score:d+(clear?0:900)}}).sort((a,b)=>a.score-b.score);
  const clearRanked=ranked.filter(r=>r.clear);
  const choice=currentPirateLevel>=4&&clearRanked.length?clearRanked[0]:(currentPirateLevel>=3?ranked[0]:ranked[Math.min(ranked.length-1,Math.floor(Math.random()*Math.min(2,ranked.length)))]);
  const target=choice.target,base=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
  let predictedFirst=aiRayFirstBall(base),legalityValidated=predictedFirst===target,finalBase=base;
  if(currentPirateLevel>=5&&!legalityValidated&&!state.breakShot){
    let rescue=null;for(let d=.1;d<=18&&!rescue;d+=.1)for(const sign of [-1,1]){const testDeg=base+sign*d,hit=aiRayFirstBall(testDeg);if(hit&&hit===target){rescue=testDeg;predictedFirst=hit;legalityValidated=true;break;}}
    if(rescue!=null)finalBase=rescue;
  }
  const error=state.breakShot?aiRandError(profile.aimError*.25):aiRandError(profile.aimError);
  const basePower=state.breakShot?profile.breakPower:profile.fallbackPower,powerError=Math.round(aiRandError(profile.powerError));
  const fallback={target,deg:finalBase+error,intendedDeg:finalBase,error,power:currentPirateLevel===6?100:clamp(basePower+powerError,20,100),powerError:currentPirateLevel===6?0:powerError,kind:'LEGAL HIT',profile:profile.label,clearRoute:choice.clear,legalityValidated,predictedFirstType:predictedFirst?.type||null,predictedFirstId:predictedFirst?.id??null};
  if(currentPirateLevel>=5&&!state.breakShot){
    if(!legalityValidated)return aiEmergencyFallback('fallback target had no validated straight first contact');
    return aiValidateFinalPlan(fallback)||aiEmergencyFallback('final fallback rejected by physics robustness check');
  }
  return fallback;
}
function maybeScheduleAI(){
  clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;
  const activeAI=(gameMode==='pirate'&&aiPlayer===state?.player)||(gameMode==='aivai'&&(state?.player===1||state?.player===2));
  if(!activeAI||moving||state.frameOver||pendingChoice||shot)return;
  if(gameMode==='aivai'){currentPirateLevel=aiVsAiLevels[state.player];currentPirateName=PIRATES[currentPirateLevel].name;aiPlayer=state.player;}
  const scheduledPlayer=state.player;
  aiThinking=true;shootBtn.disabled=true;msg.textContent=`${pname(state.player)} is sizing up the table…`;

  // V0.7.2 watchdog: once an AI turn has been scheduled it may never remain stuck in
  // "thinking". This is deliberately outside the normal planner and only fires if no
  // physical shot has begun after the normal think window.
  aiWatchdogTimer=setTimeout(()=>{
    const stillSameTurn=state&&!state.frameOver&&!moving&&!shot&&!pendingChoice&&state.player===scheduledPlayer&&aiThinking;
    if(!stillSameTurn)return;
    let pick=null;
    try{pick=aiEmergencyFallback('watchdog timeout — AI turn exceeded maximum thinking time');}catch(err){}
    if(!pick){
      const c=cue(),target=balls.find(b=>!b.potted&&b.type!=='white');
      if(target){
        const deg=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
        pick={target,deg,intendedDeg:deg,error:0,power:55,powerError:0,kind:'EMERGENCY FALLBACK',profile:(AI_PROFILES[currentPirateLevel]||AI_PROFILES[1]).label,clearRoute:false,legalityValidated:false,predictedFirstType:null,predictedFirstId:null,emergencyReason:'watchdog absolute fallback',personalityInfluence:'DEADLOCK GUARD — watchdog forced physical shot'};
      }
    }
    if(!pick){
      aiThinking=false;playHistory.push(`AI FAILSAFE ERROR | ${pname(scheduledPlayer)} | watchdog found no object ball; forcing turn resolution`);renderPlayLog();
      // With no object ball there is no meaningful shot to play. Resolve the stale turn rather
      // than leave the UI frozen; normal rules/frame state will take over on the next update.
      state.player=opponent(state.player);updateHUD();setTimeout(maybeScheduleAI,250);return;
    }
    setAngleDeg(pick.deg);powerEl.value=pick.power;powerText.textContent=pick.power+'%';
    pendingAIPlan={kind:pick.kind,targetId:pick.target?.id??null,targetType:pick.target?.type??null,intendedDeg:pick.intendedDeg??pick.deg,playedDeg:pick.deg,power:pick.power};
    playHistory.push(`AI WATCHDOG | ${pname(scheduledPlayer)} | normal turn did not launch a shot in time\nAI FALLBACK: FORCED PHYSICAL SHOT • target ${pick.target.type.toUpperCase()} #${pick.target.id} • reason: ${pick.emergencyReason||'watchdog timeout'}\nCalculated aim: ${normaliseDeg(pick.deg).toFixed(1)}° | Power: ${pick.power}%`);renderPlayLog();
    msg.textContent=`${pname(scheduledPlayer)} takes an emergency shot…`;aiThinking=false;beginShot();
  },4000);

  aiTimer=setTimeout(()=>{
    if(!((gameMode==='pirate'&&aiPlayer===state?.player)||(gameMode==='aivai'&&(state?.player===1||state?.player===2)))||moving||state.frameOver||pendingChoice)return;
    let placement=null,pick=null,plannerError=null;
    try{
      placement=aiPlaceCue();
      pick=aiChooseBasicShot();
    }catch(err){
      plannerError=err;
    }
    if(!pick){
      try{pick=aiEmergencyFallback(plannerError?`planner exception: ${plannerError?.message||String(plannerError)}`:'planner unexpectedly returned no shot');}
      catch(err){plannerError=plannerError||err;}
    }
    if(!pick){
      // Do not cancel the watchdog. It is the final independent layer and will force the turn
      // to resolve even if both the normal planner and emergency planner fail.
      playHistory.push(`AI FAILSAFE WARNING | ${pname(aiPlayer)} | planner produced no shot${plannerError?` • ${plannerError?.message||String(plannerError)}`:''} • watchdog armed`);renderPlayLog();
      msg.textContent=`${pname(aiPlayer)} is forcing an emergency route…`;return;
    }
    clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;
    setAngleDeg(pick.deg);powerEl.value=pick.power;powerText.textContent=pick.power+'%';
    const pocketNames=['top-left','top-centre','top-right','bottom-left','bottom-centre','bottom-right'];
    const planDetail=pick.kind==='DIRECT POT'?`Direct pot found: ${pick.target.type.toUpperCase()} #${pick.target.id} → ${pocketNames[pick.pocket]} pocket`:pick.kind==='COMBINATION POT'?`AI TACTIC: COMBINATION POT • ${pick.target.type.toUpperCase()} #${pick.target.id} → ${pick.secondary.type.toUpperCase()} #${pick.secondary.id} → ${pocketNames[pick.pocket]} pocket`:pick.kind==='SAFETY'?`AI TACTIC: SAFETY • target ${pick.target.type.toUpperCase()} #${pick.target.id} • no worthwhile direct pot selected`:pick.kind==='CUSHION ESCAPE'?`AI TACTIC: CUSHION ESCAPE • ${pick.rail.toUpperCase()} cushion → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='TWO CUSHION ESCAPE'?`AI TACTIC: TWO-CUSHION ESCAPE • ${pick.rails[0].toUpperCase()} → ${pick.rails[1].toUpperCase()} cushions → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='THREE CUSHION ESCAPE'?`AI TACTIC: THREE-CUSHION ESCAPE • ${pick.rails[0].toUpperCase()} → ${pick.rails[1].toUpperCase()} → ${pick.rails[2].toUpperCase()} cushions → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='PERFECT ESCAPE'?`AI TACTIC: PERFECT ESCAPE SEARCH • ${pick.target.type.toUpperCase()} #${pick.target.id} • ${pick.perfectEscapeMode} • physics-validated legal first contact`:pick.kind==='EMERGENCY FALLBACK'?`AI FALLBACK: EMERGENCY SHOT • target ${pick.target.type.toUpperCase()} #${pick.target.id} • ${pick.legalityValidated?'legal straight first contact found':'no legal route found; least-bad contact attempt'} • reason: ${pick.emergencyReason}`:`No clear direct pot found • legal target: ${pick.target.type.toUpperCase()} #${pick.target.id}${pick.clearRoute===false?' • route obstructed/awkward':''}${pick.legalityValidated===false?` • LEGALITY WARNING: predicted first contact ${String(pick.predictedFirstType||'none').toUpperCase()}${pick.predictedFirstId!=null?' #'+pick.predictedFirstId:''}`:' • LEGALITY CHECK: intended ball first'}`;
    const positionDetail=pick.positionScore!=null?` • next-ball position ${pick.positionScore.toFixed(0)}${pick.estimatedCue?` • estimated white (${Math.round(pick.estimatedCue.x)}, ${Math.round(pick.estimatedCue.y)})`:''}${pick.endgameLabel?`\nENDGAME PLAN: ${pick.endgameLabel}${pick.blackRoutes!=null?` • black routes ${pick.blackRoutes}`:''}`:''}${pick.finalColourOverride?'\nENDGAME OVERRIDE: FINAL COLOUR • direct pot protected from safety veto':''}`:'';
    const rejectedDetail=pick.rejectedAttack?`\nATTACK REJECTED: ${pick.rejectedAttack.reason} • Decision: SAFETY`:'';
    const quality=pick.kind==='DIRECT POT'?`Shot quality: cut ${pick.cutDeg.toFixed(1)}° • route score ${pick.score.toFixed(0)} • in-off risk ${pick.inOffRisk?'YES':'no'}${pick.blackWinConfidence!=null?` • black win confidence ${Math.round(pick.blackWinConfidence*100)}%${pick.blackWinLock?' • WIN NOW LOCK':pick.vaperFrameKill?' • FRAME KILL':''}`:''}${pick.marginalAttack?' • marginal attack':''}${currentPirateLevel>=4?' • selected from scored legal pot routes':''}${currentPirateLevel>=5?'\nPREFLIGHT: PASS • intended target is first contact • cue path clear of pocket before contact':''}${pick.physicsSafety?`\nCUE-BALL FORECAST: ${pick.physicsSafety}`:''}${positionDetail}`:pick.kind==='COMBINATION POT'?`Combination geometry: first contact ${pick.target.type.toUpperCase()} #${pick.target.id} • cannon into ${pick.secondary.type.toUpperCase()} #${pick.secondary.id} • first cut ${pick.cutDeg.toFixed(1)}° • second cut ${pick.secondCut.toFixed(1)}° • route score ${pick.score.toFixed(0)}${pick.directAlternative!=null?` • best direct score ${pick.directAlternative.toFixed(0)} • Decision: COMBINATION preferred over direct attack`:' • no direct pot available'}`:pick.kind==='SAFETY'?`Safety estimate: opponent direct-pot opportunities ${pick.opponentPotsBefore} → ${pick.opponentPotsAfter} • estimated white (${Math.round(pick.estimatedCue.x)}, ${Math.round(pick.estimatedCue.y)}) • safety score ${pick.safetyScore.toFixed(0)}${rejectedDetail}`:pick.kind==='CUSHION ESCAPE'?`Escape geometry: bounce (${Math.round(pick.bounce.x)}, ${Math.round(pick.bounce.y)}) • route score ${pick.escapeScore.toFixed(0)} • objective: legal first contact, not a pot`:pick.kind==='TWO CUSHION ESCAPE'?`Escape geometry: bounces (${Math.round(pick.bounce1.x)}, ${Math.round(pick.bounce1.y)}) → (${Math.round(pick.bounce2.x)}, ${Math.round(pick.bounce2.y)}) • route score ${pick.escapeScore.toFixed(0)} • objective: legal first contact via two cushions`:pick.kind==='THREE CUSHION ESCAPE'?`Escape geometry: bounces (${Math.round(pick.bounces[0].x)}, ${Math.round(pick.bounces[0].y)}) → (${Math.round(pick.bounces[1].x)}, ${Math.round(pick.bounces[1].y)}) → (${Math.round(pick.bounces[2].x)}, ${Math.round(pick.bounces[2].y)}) • route score ${pick.escapeScore.toFixed(0)} • simpler legal escape routes: none • objective: legal first contact via three cushions`:pick.kind==='PERFECT ESCAPE'?`PERFECT ESCAPE: normal safety + one/two/three-cushion solvers exhausted • silent physics reproduced legal first contact on ${pick.target.type.toUpperCase()} #${pick.target.id} • cue ball survives • emergency foul fallback avoided`:pick.kind==='EMERGENCY FALLBACK'?`DEADLOCK GUARD: normal planner exhausted • this shot is intentionally allowed to foul if no legal trajectory survived the normal solvers`:'';
    const placementDetail=placement?.smart?`Ball in hand: tactical placement chosen at (${Math.round(placement.x)}, ${Math.round(placement.y)}) to create a direct pot.`:(placementMode==='none'&&placement?`Ball in hand: standard placement.`:'');
    playHistory.push(`AI PLAN | ${pname(aiPlayer)} | DIFFICULTY ${currentPirateLevel} (${pick.profile||'Basic'})\n${aiPersonalityLine(pick)}\n${placementDetail?placementDetail+'\n':''}${planDetail}${quality?'\n'+quality:''}${pick.physicsSafety&&pick.kind!=='DIRECT POT'?`\nCUE-BALL FORECAST: ${pick.physicsSafety}`:''}\nCalculated aim: ${normaliseDeg(pick.intendedDeg??pick.deg).toFixed(1)}° | Aim error: ${(pick.error||0)>=0?'+':''}${(pick.error||0).toFixed(1)}° | Played: ${normaliseDeg(pick.deg).toFixed(1)}° | Power: ${pick.power}%${pick.powerError?` (power error ${(pick.powerError>0?'+':'')+pick.powerError}%)`:''}`);renderPlayLog();
    pendingAIPlan={kind:pick.kind,targetId:pick.target?.id??null,targetType:pick.target?.type??null,secondaryId:pick.secondary?.id??null,secondaryType:pick.secondary?.type??null,pocket:pick.pocket??null,intendedDeg:pick.intendedDeg??pick.deg,playedDeg:pick.deg,power:pick.power};
    msg.textContent=`${pname(aiPlayer)} takes the shot…`;aiThinking=false;beginShot();
  },1250);
}
function showWinCelebration(winner,text){
  clearTimeout(turnOverlayTimer);turnOverlay.classList.remove('show');
  if(fiveFrameTestActive){
    fiveFrameTestCompleted++;
    playHistory.push(`=== FRAME ${fiveFrameTestCompleted} OF 5 COMPLETE • ${pname(winner)} WINS ===`);renderPlayLog();
    if(fiveFrameTestCompleted<5){
      const next=fiveFrameTestCompleted+1;
      playHistory.push(`=== FRAME ${next} OF 5 ===`);renderPlayLog();
      msg.textContent=`5-frame AI testing run — Frame ${fiveFrameTestCompleted} complete. Starting frame ${next}…`;
      setTimeout(()=>{newFrame(1);msg.textContent=`5-frame AI testing run — Frame ${next} of 5. Captain Blackball vs Darth Vaper.`;},900);
      return;
    }
    fiveFrameTestActive=false;currentScenario=null;
    soundFiveFrameComplete();
    winTitle.textContent='5-frame AI testing run complete!';
    winText.textContent='DING DING DING DING DING! All 5 Captain Blackball vs Darth Vaper frames are complete.';
    winModal.hidden=false;return;
  }
  soundVictory();winTitle.textContent=`${pname(winner)} wins!`;winText.textContent=text;winModal.hidden=false;
}
playAgain.onclick=()=>{winModal.hidden=true;prototypeModal.hidden=true;restartCurrentGame(1);};
returnMenu.onclick=()=>{winModal.hidden=true;prototypeModal.hidden=true;showModeMenu();};
prototypeGotIt.onclick=()=>{prototypeModal.hidden=true;winModal.hidden=false;};

showGameLog.onclick=()=>{gameLogModalText.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';if(copyGameLogStatus)copyGameLogStatus.textContent='';if(copyGameLog){copyGameLog.textContent='Select all and copy';copyGameLog.classList.remove('copied');}winModal.hidden=true;gameLogModal.hidden=false;};
copyGameLog.onclick=async()=>{const text=gameLogModalText.textContent||'';try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);}else{const range=document.createRange();range.selectNodeContents(gameLogModalText);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);const ok=document.execCommand('copy');if(!ok)throw new Error('copy failed');}copyGameLog.textContent='Copied! ✓';copyGameLog.classList.add('copied');copyGameLogStatus.textContent='Entire game log selected and copied to clipboard.';}catch(err){const range=document.createRange();range.selectNodeContents(gameLogModalText);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);copyGameLog.textContent='Selected — press Ctrl+C';copyGameLogStatus.textContent='Automatic copy was blocked by this browser, so the full log has been selected for you.';}};
closeGameLog.onclick=()=>{gameLogModal.hidden=true;winModal.hidden=false;};
function showModeMenu(){fiveFrameTestActive=false;fiveFrameTestCompleted=0;currentScenario=null;playersModal.hidden=false;modeMenu.hidden=false;playersForm.hidden=true;piratePlaceholder.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;if(aiVsAiMenu)aiVsAiMenu.hidden=true;refreshPirateButtons();}
function populateAiVsAi(){for(const sel of [aiVsAiP1,aiVsAiP2]){sel.innerHTML='';for(let i=1;i<=7;i++){const o=document.createElement('option');o.value=i;o.textContent=`${PIRATES[i].name} — ${i<=5?'Difficulty '+i:PIRATES[i].role}`;sel.appendChild(o);}}aiVsAiP1.value='5';aiVsAiP2.value='5';}
aiVsAiMode.onclick=()=>{audioReady();currentScenario=null;populateAiVsAi();modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;aiVsAiMenu.hidden=false;};
aiVsAiBack.onclick=()=>showModeMenu();
startAiVsAi.onclick=()=>{const l1=Number(aiVsAiP1.value),l2=Number(aiVsAiP2.value);aiVsAiLevels={1:l1,2:l2};gameMode='aivai';aiPlayer=1;currentScenario=null;playerNames={1:PIRATES[l1].name,2:PIRATES[l2].name};playersModal.hidden=true;aiVsAiMenu.hidden=true;audioReady();newFrame(1);};
localMode.onclick=()=>{audioReady();currentScenario=null;gameMode='local';aiPlayer=null;modeMenu.hidden=true;playersForm.hidden=false;piratePlaceholder.hidden=true;player1Name.focus();};
pirateMode.onclick=()=>{audioReady();currentScenario=null;refreshPirateButtons();modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;if(testScenarioMenu)testScenarioMenu.hidden=true;piratePlayerName?.focus();};
testMode.onclick=()=>{audioReady();modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;testScenarioMenu.hidden=false;nightmareScenario.disabled=!devScenariosUnlocked;cannonScenario.disabled=!devScenariosUnlocked;if(fiveFrameScenario)fiveFrameScenario.disabled=!devScenariosUnlocked;testPlayerName?.focus();};
testBack.onclick=showModeMenu;nightmareScenario.onclick=()=>{if(devScenariosUnlocked)startScenario('nightmare');};cannonScenario.onclick=()=>{if(devScenariosUnlocked)startScenario('cannon');};if(fiveFrameScenario)fiveFrameScenario.onclick=()=>{if(devScenariosUnlocked)startFiveFrameTest();};
backToMode.onclick=showModeMenu;pirateBack.onclick=showModeMenu;
playersForm.addEventListener('submit',e=>{e.preventDefault();playerNames={1:player1Name.value.trim()||'Player 1',2:player2Name.value.trim()||'Player 2'};audioReady();playersModal.hidden=true;newFrame(1);});
piratePlaceholder.addEventListener('submit',e=>{e.preventDefault();const btn=e.submitter?.closest?.('.pirate-choice[data-level]');if(!btn||btn.disabled)return;const level=Number(btn.dataset.level);if(level>=6&&!devPiratesUnlocked)return;if(level<=5&&level>getUnlockedPirateLevel())return;currentScenario=null;currentPirateLevel=level;currentPirateName=btn.dataset.name||PIRATES[level].name;gameMode='pirate';aiPlayer=2;playerNames={1:piratePlayerName.value.trim()||'Player 1',2:currentPirateName};audioReady();playersModal.hidden=true;newFrame(1);});
function detectUnsupportedBrowser(){
  const ua=navigator.userAgent||'';
  const embedded=/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|; wv\)|\bwv\b/i.test(ua);
  const obsolete=/MSIE|Trident\/|Edge\/[0-9]+/i.test(ua);
  const missing=!('PointerEvent' in window)||!document.createElement('canvas').getContext||!('requestAnimationFrame' in window);
  const warning=document.getElementById('browserWarning');
  if(warning) warning.hidden=!(embedded||obsolete||missing);
}
detectUnsupportedBrowser();
syncAngleUI();newFrame(1);requestAnimationFrame(loop);

// V0.2.8: contextual break-scoring help.
breakHelp.onclick=()=>{breakRules.hidden=false};closeBreakRules.onclick=()=>{breakRules.hidden=true};breakRules.addEventListener('click',e=>{if(e.target===breakRules)breakRules.hidden=true});

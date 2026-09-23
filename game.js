'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const playersModal=document.getElementById('playersModal'),playersForm=document.getElementById('playersForm'),player1Name=document.getElementById('player1Name'),player2Name=document.getElementById('player2Name'),showGameLog=document.getElementById('showGameLog'),gameLogModal=document.getElementById('gameLogModal'),gameLogModalText=document.getElementById('gameLogModalText'),closeGameLog=document.getElementById('closeGameLog');
let playerNames={1:'Player 1',2:'Player 2'};
const shootBtn=document.getElementById('shoot'),powerEl=document.getElementById('power'),powerText=document.getElementById('powerText'),angleEl=document.getElementById('angle'),angleText=document.getElementById('angleText'),msg=document.getElementById('message'),turnEl=document.getElementById('turn');
const phaseEl=document.getElementById('phase'),lastShotEl=document.getElementById('lastShot'),choice=document.getElementById('choice'),choiceText=document.getElementById('choiceText'),choiceA=document.getElementById('choiceA'),choiceB=document.getElementById('choiceB'),turnOverlay=document.getElementById('turnOverlay'),breakHelp=document.getElementById('breakHelp'),breakRules=document.getElementById('breakRules'),closeBreakRules=document.getElementById('closeBreakRules'),winModal=document.getElementById('winModal'),winTitle=document.getElementById('winTitle'),winText=document.getElementById('winText'),playAgain=document.getElementById('playAgain'),returnMenu=document.getElementById('returnMenu'),prototypeModal=document.getElementById('prototypeModal'),prototypeGotIt=document.getElementById('prototypeGotIt');
const PLAY_W=1600,PLAY_H=800,rail=90,W=PLAY_W+rail*2,H=PLAY_H+rail*2,L=rail,R=L+PLAY_W,T=rail,B=T+PLAY_H;
const ballR=25.4,pocketR=41,BAULK_X=L+PLAY_W*.8,CENTRE_X=(L+R)/2;
const pockets=[[L,T],[CENTRE_X,T],[R,T],[L,B],[CENTRE_X,B],[R,B]];
const colors={red:'#b72d2d',yellow:'#e3b834',black:'#151515',white:'#f5f1e7'};
let balls=[],angle=Math.PI,moving=false,last=performance.now(),draggingCue=false;
let state,shot=null,placementMode='none',pendingChoice=null;
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
function soundPot(){/* Deep, satisfying synthetic 'ker-ching': low pocket thump + short metallic cash-register chime. */tone(82,.13,.09,'sine');tone(116,.10,.055,'triangle',.018);tone(740,.075,.045,'square',.055);tone(1110,.10,.035,'triangle',.105);tone(1480,.16,.025,'sine',.15);}
function soundVictory(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,.07,'triangle',i*.11));tone(1319,.35,.08,'sine',.45);}
function ball(x,y,type,id){return{x,y,vx:0,vy:0,type,id,potted:false,crossedCentre:false};}
function newState(breaker=1){return{player:breaker,breaker,groups:{1:null,2:null},breakShot:true,frameOver:false,winner:null};}
function rackBalls(){balls=[];balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));const eightX=L+PLAY_W*.25,sy=H/2,gap=ballR*2.06,rowDx=gap*.89,apexX=eightX+2*rowDx;const rows=[['red'],['yellow','red'],['red','black','yellow'],['yellow','red','yellow','red'],['red','yellow','yellow','red','yellow']];let id=0;rows.forEach((row,ri)=>{const x=apexX-ri*rowDx;row.forEach((type,i)=>balls.push(ball(x,sy+(i-ri/2)*gap,type,id++)));});}
function newFrame(breaker=1){rackBalls();state=newState(breaker);moving=false;shot=null;placementMode='baulk';draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=false;msg.textContent='Opening break — position the white anywhere in baulk, then break.';updateHUD();setTimeout(announceTurn,40);}
function cue(){return balls[0];}
function opponent(p){return p===1?2:1;}
function pname(p){return playerNames[p]||`Player ${p}`;}
function pshort(p){return pname(p);}
function remaining(type){return balls.filter(b=>b.type===type&&!b.potted).length;}
function onType(player){const g=state.groups[player];if(!g)return 'open';return remaining(g)===0?'black':g;}
function updateHUD(){turnEl.innerHTML=state.frameOver?`${pname(state.winner)}<br>WINS`:`${"Playing now:<br>"+pname(state.player)}`;phaseEl.textContent=state.frameOver?'FRAME OVER':state.breakShot?'BREAK':state.groups[1]?'GROUPS SET':'OPEN TABLE';breakHelp.hidden=state.frameOver||!state.breakShot||moving||!!pendingChoice;if(breakHelp.hidden)breakRules.hidden=true;for(const p of [1,2]){const g=state.groups[p];document.getElementById('p'+p+'group').textContent=pshort(p);document.getElementById('p'+p+'left').textContent=g?`${g.toUpperCase()} group\n${remaining(g)} ${remaining(g)===1?'ball':'balls'} left`:'OPEN TABLE\nNo group yet';}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function normaliseDeg(d){return ((d%360)+360)%360;}function syncAngleUI(){const deg=normaliseDeg(angle*180/Math.PI);angleEl.value=Math.round(deg*10);angleText.textContent=deg.toFixed(1)+'°';}function setAngleDeg(deg){angle=normaliseDeg(deg)*Math.PI/180;syncAngleUI();}
function aimAt(e){if(moving||state.frameOver||cue().potted||pendingChoice)return;const p=canvasPoint(e),c=cue();angle=Math.atan2(p.y-c.y,p.x-c.x);syncAngleUI();}
function validCuePosition(x,y){if(x<L+ballR||x>R-ballR||y<T+ballR||y>B-ballR)return false;if(placementMode==='baulk'&&x<BAULK_X-ballR*.5)return false;return balls.slice(1).filter(b=>!b.potted).every(b=>Math.hypot(b.x-x,b.y-y)>=ballR*2.02);}
function placeCueAt(e){if(placementMode==='none'||moving)return;const p=canvasPoint(e),c=cue();let x=clamp(p.x,L+ballR,R-ballR),y=clamp(p.y,T+ballR,B-ballR);if(placementMode==='baulk')x=clamp(x,BAULK_X-ballR*.5,R-ballR);if(validCuePosition(x,y)){c.x=x;c.y=y;}}
canvas.addEventListener('pointerdown',e=>{if(moving||state.frameOver||pendingChoice||cue().potted)return;const p=canvasPoint(e),c=cue(),d=Math.hypot(p.x-c.x,p.y-c.y);draggingCue=placementMode!=='none'&&d<=ballR*1.65;canvas.setPointerCapture(e.pointerId);if(draggingCue)placeCueAt(e);else aimAt(e);});
canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture(e.pointerId))return;if(draggingCue)placeCueAt(e);else aimAt(e)});canvas.addEventListener('pointerup',()=>draggingCue=false);canvas.addEventListener('pointercancel',()=>draggingCue=false);
powerEl.addEventListener('input',()=>powerText.textContent=powerEl.value+'%');angleEl.addEventListener('input',()=>setAngleDeg(Number(angleEl.value)/10));function nudgeAngle(delta){if(!moving&&!state.frameOver&&!pendingChoice)setAngleDeg(angle*180/Math.PI+delta)}
function addHoldNudge(id,delta){const el=document.getElementById(id);let delay=null,repeat=null;const stop=()=>{clearTimeout(delay);clearInterval(repeat);delay=repeat=null};el.addEventListener('pointerdown',e=>{e.preventDefault();nudgeAngle(delta);delay=setTimeout(()=>repeat=setInterval(()=>nudgeAngle(delta),45),350)});['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,stop));el.addEventListener('contextmenu',e=>e.preventDefault())}addHoldNudge('angleMinus5',-5);addHoldNudge('angleMinus',-.1);addHoldNudge('anglePlus',.1);addHoldNudge('anglePlus5',5);
function nudgePower(delta){if(moving||state.frameOver||pendingChoice)return;powerEl.value=clamp(Number(powerEl.value)+delta,Number(powerEl.min),Number(powerEl.max));powerText.textContent=powerEl.value+'%';}
function addHoldPower(id,delta){const el=document.getElementById(id);let delay=null,repeat=null;const stop=()=>{clearTimeout(delay);clearInterval(repeat);delay=repeat=null};el.addEventListener('pointerdown',e=>{e.preventDefault();nudgePower(delta);delay=setTimeout(()=>repeat=setInterval(()=>nudgePower(delta),90),350)});['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,stop));el.addEventListener('contextmenu',e=>e.preventDefault())}
addHoldPower('powerMinus45',-45);addHoldPower('powerMinus5',-5);addHoldPower('powerPlus5',5);addHoldPower('powerPlus45',45);
function beginShot(){if(moving||state.frameOver||pendingChoice||cue().potted)return;const p=Number(powerEl.value)/100,speed=150+5800*Math.pow(p,1.35),c=cue();shot={number:++shotNumber,player:state.player,isBreak:state.breakShot,startOn:onType(state.player),firstContact:null,firstContactId:null,pots:[],cuePotted:false,cushionAfterContact:false,objectCushions:new Set(),breakCrossers:new Set()};placementMode='none';draggingCue=false;c.vx=Math.cos(angle)*speed;c.vy=Math.sin(angle)*speed;soundShot(p);moving=true;shootBtn.disabled=true;breakHelp.hidden=true;breakRules.hidden=true;msg.textContent='Balls in motion…';}
shootBtn.addEventListener('click',beginShot);
function collide(a,b){let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=ballR*2;if(d2>=min*min||d2===0)return;let d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;if(shot&&!shot.firstContact){if(a.type==='white'&&b.type!=='white'&&!b.potted){shot.firstContact=b.type;shot.firstContactId=b.id;}else if(b.type==='white'&&a.type!=='white'&&!a.potted){shot.firstContact=a.type;shot.firstContactId=a.id;}}let rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)return;soundBall(Math.abs(sep));const j=-(1+.965)*sep/2,ix=j*nx,iy=j*ny;a.vx-=ix;a.vy-=iy;b.vx+=ix;b.vy+=iy;}
function pocketBall(b){soundPot();b.potted=true;b.vx=b.vy=0;if(shot){shot.pots.push(b.type);if(b.type==='white')shot.cuePotted=true;}return true;}
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
function finishFrame(winner,text){state.frameOver=true;state.winner=winner;moving=false;shootBtn.disabled=true;placementMode='none';msg.textContent=text;lastShotEl.textContent='Frame complete';updateHUD();showWinCelebration(winner,text);}
function standardFoul(reason,ballInHand='anywhere'){const incoming=opponent(state.player);state.player=incoming;state.breakShot=false;if(cue().potted)restoreCue(ballInHand==='baulk'?'baulk':'anywhere');else placementMode='anywhere';msg.textContent=`FOUL — ${reason}. ${pname(incoming)}: cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;lastShotEl.textContent=`FOUL: ${reason} • Opponent gets cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;}
function showBreakChoice(){pendingChoice='break';choice.hidden=false;choiceText.textContent=`Illegal break — 3 points are required. ${pname(opponent(state.breaker))} chooses who takes the re-rack break.`;choiceA.textContent='I will break';choiceB.textContent='Opponent breaks';shootBtn.disabled=true;choiceA.onclick=()=>resolveBreakChoice(opponent(state.breaker));choiceB.onclick=()=>resolveBreakChoice(state.breaker);}
function resolveBreakChoice(breaker){pendingChoice=null;choice.hidden=true;newFrame(breaker);msg.textContent=`Re-rack — ${pname(breaker)} to break.`;}
function describeColourPots(pots){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length,parts=[];if(reds)parts.push(`${reds} RED${reds===1?'':'S'}`);if(yellows)parts.push(`${yellows} YELLOW${yellows===1?'':'S'}`);return parts.length?parts.join(' + '):'no red/yellow balls';}
function evaluateBreak(){const pottedObjects=balls.filter(b=>b.type!=='white'&&b.potted).map(b=>b.id),pointIds=new Set([...shot.breakCrossers,...pottedObjects]),points=pointIds.size,groupPots=shot.pots.filter(t=>t==='red'||t==='yellow'),potSummary=describeColourPots(groupPots);lastShotEl.textContent=`Break: ${points} point${points===1?'':'s'} • ${potSummary} potted${points<3?' • 3 points required for a legal break':''}`;if(points<3){moving=false;showBreakChoice();return;}state.breakShot=false;if(shot.pots.includes('black'))respotBlack();if(shot.cuePotted){state.player=opponent(state.player);restoreCue('baulk');msg.textContent=`Legal break (${points} points) — ${potSummary} potted; IN-OFF. ${pname(state.player)} has cue ball in hand in baulk. Table remains OPEN.`;}else if(groupPots.length>0){msg.textContent=`Legal break (${points} points) — ${potSummary} potted. Table remains OPEN; ${pname(state.player)} continues.`;}else{state.player=opponent(state.player);msg.textContent=`Legal break (${points} points) — no red/yellow balls potted. ${pname(state.player)}'s turn. Table remains OPEN.`;}updateHUD();}
function legalFirstContact(player,onAtStart=shot.startOn){const on=onAtStart;if(on==='open')return shot.firstContact==='red'||shot.firstContact==='yellow';return shot.firstContact===on;}
function evaluateNormal(){const p=state.player,opp=opponent(p),on=shot.startOn,pots=shot.pots.filter(t=>t!=='white'),blackPotted=pots.includes('black');const ownBefore=state.groups[p]?remaining(state.groups[p])+shot.pots.filter(t=>t===state.groups[p]).length:null;
  if(blackPotted){const cleared=state.groups[p]&&ownBefore===0;if(!cleared||shot.cuePotted||!legalFirstContact(p,on)){finishFrame(opp,`LOSS OF FRAME — ${pname(p)} potted the eight-ball illegally. ${pname(opp)} wins.`);return;}finishFrame(p,`${pname(p)} legally pots the eight-ball and wins the frame!`);return;}
  const firstOK=legalFirstContact(p,on),actionAfter=shot.pots.length>0||shot.cushionAfterContact;
  if(shot.cuePotted){standardFoul('cue ball potted (in-off)');updateHUD();return;}
  if(!firstOK){standardFoul(on==='open'?'failed to contact a red or yellow first':`first contact was ${shot.firstContact||'no ball'}, not ${on}`);updateHUD();return;}
  if(!actionAfter){standardFoul('no ball was potted and no ball contacted a cushion after first contact');updateHUD();return;}
  if(!state.groups[p]){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length;if(reds||yellows){let g;if(reds&&yellows)g=shot.firstContact;else g=reds?'red':'yellow';state.groups[p]=g;state.groups[opp]=g==='red'?'yellow':'red';const combo=reds&&yellows;msg.textContent=combo?`Legal combination — RED and YELLOW potted. ${pname(p)} struck ${g.toUpperCase()} first, so ${pname(p)} is ${g.toUpperCase()} and continues.`:`Groups decided — ${pname(p)} is ${g.toUpperCase()}. Legal pot: continue.`;lastShotEl.textContent=combo?`LEGAL: both colours potted • ${g.toUpperCase()} struck first, so that group is assigned • continue`:`LEGAL POT: ${g.toUpperCase()} potted • group assigned to ${pname(p)} • continue`;updateHUD();return;}state.player=opp;msg.textContent=`Legal shot, no pot — ${pname(opp)}. Table remains OPEN.`;lastShotEl.textContent='LEGAL: correct first contact + cushion, but no pot • loss of turn • table stays open';updateHUD();return;}
  const g=state.groups[p],ownPots=pots.filter(t=>t===g).length,oppPots=pots.filter(t=>t===state.groups[opp]).length;if(ownPots>0){msg.textContent=`Legal pot — ${pname(p)} continues${oppPots?` (${oppPots} opponent ball also potted)`:''}.`;lastShotEl.textContent=oppPots?`LEGAL COMBINATION: ${ownPots} ${g.toUpperCase()} + ${oppPots} opponent ball${oppPots===1?'':'s'} potted • own/on ball was struck first • continue`:`LEGAL POT: ${ownPots} ${g.toUpperCase()} potted • continue`;}else{state.player=opp;msg.textContent=oppPots?`Opponent ball potted without an on-ball — loss of turn. ${pname(opp)}'s turn, ${state.groups[opp]} group.`:`No ${g} potted — ${pname(opp)}'s turn, ${state.groups[opp]} group.`;lastShotEl.textContent=oppPots?`LOSS OF TURN: opponent ball potted but no ${g.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group • cue ball stays where it lies`:`LOSS OF TURN: no ${g.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group`;}updateHUD();}
function renderPlayLog(){const el=document.getElementById('playLog');if(!el)return;el.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';}
function recordShotTrace(s){const first=s.firstContact?`${s.firstContact.toUpperCase()}${s.firstContactId!==null?` #${s.firstContactId}`:''}`:'NONE';const pots=s.pots.length?s.pots.map(x=>x.toUpperCase()).join(', '):'none';const result=lastShotEl.textContent||msg.textContent;playHistory.push(`#${s.number} | ${pname(s.player)} | ${s.isBreak?'BREAK':`on ${String(s.startOn).toUpperCase()}`}\nFirst contact: ${first} | Pots: ${pots} | Cushion after contact: ${s.cushionAfterContact?'yes':'no'}\nResult: ${result}\nTable after: red ${remaining('red')}, yellow ${remaining('yellow')}, black ${remaining('black')}`);renderPlayLog();}
function endShot(){moving=false;shootBtn.disabled=false;const completed=shot;if(completed.isBreak)evaluateBreak();else evaluateNormal();recordShotTrace(completed);shot=null;if(!pendingChoice&&!state.frameOver){shootBtn.disabled=false;announceTurn();}}
function rayBallHit(x,y,dx,dy,ignore){let best=Infinity,hitBall=null;for(const b of balls){if(b===ignore||b.potted||b.type==='white')continue;const ox=b.x-x,oy=b.y-y,t=ox*dx+oy*dy;if(t<=.01)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(Math.max(0,rr-perp2));if(hit<best){best=hit;hitBall=b;}}}return{distance:best,ball:hitBall};}
function rayCushionDistance(x,y,dx,dy){let vals=[];if(dx>1e-6)vals.push((R-ballR-x)/dx);if(dx<-1e-6)vals.push((L+ballR-x)/dx);if(dy>1e-6)vals.push((B-ballR-y)/dy);if(dy<-1e-6)vals.push((T+ballR-y)/dy);vals=vals.filter(v=>v>.01);return vals.length?Math.min(...vals):Infinity;}
function guide(){if(moving||state.frameOver||pendingChoice||cue().potted)return;const c=cue(),dx=Math.cos(angle),dy=Math.sin(angle);let best=2000,target=null;for(const b of balls.slice(1)){if(b.potted)continue;const ox=b.x-c.x,oy=b.y-c.y,t=ox*dx+oy*dy;if(t<=0)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(rr-perp2);if(hit<best){best=hit;target=b;}}}const tx=c.x+dx*best,ty=c.y+dy*best;ctx.save();ctx.setLineDash([13,12]);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff8';ctx.beginPath();ctx.arc(tx,ty,6,0,Math.PI*2);ctx.fill();
  if(devAngleGuide&&target){const nx=target.x-tx,ny=target.y-ty,nlen=Math.hypot(nx,ny);if(nlen>.001){const odx=nx/nlen,ody=ny/nlen;const ballHit=rayBallHit(target.x,target.y,odx,ody,target),cush=rayCushionDistance(target.x,target.y,odx,ody),dist=Math.min(ballHit.distance,cush);if(Number.isFinite(dist)&&dist>0){ctx.strokeStyle='#ffe28a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x+odx*dist,target.y+ody*dist);ctx.stroke();}}}
  ctx.restore();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#56371f';ctx.fillRect(0,0,W,H);ctx.fillStyle='#2a7b57';ctx.fillRect(L,T,R-L,B-T);ctx.strokeStyle='#163f30';ctx.lineWidth=8;ctx.strokeRect(L,T,R-L,B-T);ctx.strokeStyle='#d8d0b755';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BAULK_X,T);ctx.lineTo(BAULK_X,B);ctx.stroke();for(const p of pockets){ctx.fillStyle='#090909';ctx.beginPath();ctx.arc(p[0],p[1],pocketR,0,Math.PI*2);ctx.fill()}guide();for(const b of balls){if(b.potted)continue;ctx.fillStyle=colors[b.type];ctx.beginPath();ctx.arc(b.x,b.y,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0007';ctx.lineWidth=2;ctx.stroke();if(b.type==='black'){ctx.fillStyle='#eee';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('8',b.x,b.y)}}}
function loop(now){let dt=Math.min((now-last)/1000,.025);last=now;if(moving){step(dt);if(allStopped())endShot()}draw();requestAnimationFrame(loop)}
document.getElementById('reset').onclick=()=>newFrame(1);document.getElementById('rack').onclick=()=>newFrame(state?.breaker||1);document.getElementById('clear').onclick=()=>{balls.slice(1).forEach(b=>{if(b.type!=='black')b.potted=true});updateHUD();};document.getElementById('soft').onclick=()=>{powerEl.value=25;powerText.textContent='25%'};document.getElementById('hard').onclick=()=>{powerEl.value=100;powerText.textContent='100%'};
document.getElementById('toggleAngleGuide').onclick=e=>{devAngleGuide=!devAngleGuide;e.currentTarget.textContent=`Angle guide: ${devAngleGuide?'ON':'OFF'}`;};
document.getElementById('pickupCue').onclick=()=>{if(moving||state.frameOver||pendingChoice)return;restoreCue('anywhere');msg.textContent=`DEV: ${pname(state.player)} may reposition the cue ball anywhere before the next shot.`;updateHUD();};
document.getElementById('clearPlayLog').onclick=()=>{playHistory=[];shotNumber=0;renderPlayLog();};
function showWinCelebration(winner,text){clearTimeout(turnOverlayTimer);turnOverlay.classList.remove('show');soundVictory();winTitle.textContent=`${pname(winner)} wins!`;winText.textContent=text;winModal.hidden=false;}
playAgain.onclick=()=>{winModal.hidden=true;prototypeModal.hidden=true;newFrame(1);};
returnMenu.onclick=()=>{winModal.hidden=true;prototypeModal.hidden=false;};
prototypeGotIt.onclick=()=>{prototypeModal.hidden=true;winModal.hidden=false;};

showGameLog.onclick=()=>{gameLogModalText.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';winModal.hidden=true;gameLogModal.hidden=false;};
closeGameLog.onclick=()=>{gameLogModal.hidden=true;winModal.hidden=false;};
playersForm.addEventListener('submit',e=>{e.preventDefault();playerNames={1:player1Name.value.trim()||'Player 1',2:player2Name.value.trim()||'Player 2'};audioReady();playersModal.hidden=true;newFrame(1);});
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

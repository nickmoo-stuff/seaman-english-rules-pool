// Deterministic table fixtures; all plans and outcomes run through the real planner/engine.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({serviceWorkers:'block'});await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000/',{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 await p.evaluate(()=>{chapterState('chapter_3').completed=true;setDevEntitlement('supporter_founder_test',true);for(const id of SeamenChapter4.chapter.mainPirates)career.piratesDefeated[id]=true;});
 for(const id of ['socks_sandals','most_evil','lucy_fir']){
 const result=await p.evaluate(id=>{
  pendingPirateStart={level:pirateById(id).aiLevel,pirateId:id,playerName:'Planner QA'};beginPendingPirateMatch(true);clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);state.player=2;state.breakShot=false;state.groups={1:'yellow',2:'red'};placementMode='none';
  balls.forEach(b=>{b.potted=true;b.vx=b.vy=0;});const c=cue(),red=balls.filter(b=>b.type==='red'),black=balls.find(b=>b.type==='black'),yellow=balls.find(b=>b.type==='yellow');
  Object.assign(c,{potted:false,x:L+180,y:T+180});Object.assign(red[0],{potted:false,x:L+65,y:T+65});Object.assign(red[1],{potted:false,x:CENTRE_X,y:T+80});Object.assign(black,{potted:false,x:CENTRE_X,y:B-100});Object.assign(yellow,{potted:false,x:R-100,y:B-100});
  const originalRandom=Math.random;Math.random=()=>.5;
  if(id==='socks_sandals'){let found=false;for(const x of [L+220,L+420,CENTRE_X,R-200]){if(found)break;for(const y of [T+120,T+270,B-150]){c.x=x;c.y=y;if(k4CushionPreference()){found=true;break;}}}if(!found)throw Error('No validated cushion fixture');}
  const plans=[];
  for(let visit=0;visit<(id==='lucy_fir'?2:1);visit++){
   const pick=aiChooseBasicShot();if(!pick)throw Error('No planned shot');const forecast=aiDryRunShot(pick.deg,pick.power,12,1/120);setAngleDeg(pick.deg);powerEl.value=pick.power;beginShot();
   let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics timeout');
   const detail={kind:pick.kind,forecastFirst:forecast.first,first:shot.firstContact,spin:shot.spin,pots:[...shot.pots],white:shot.cuePotted};endShot();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);detail.turn=state.player;plans.push(detail);
   if(state.player!==2||state.frameOver)break;
  }
  Math.random=originalRandom;return plans;
 },id);
 assert(result.length>0);assert.equal(result[0].first,'red');assert.equal(result[0].forecastFirst,result[0].first);assert(!result[0].white);
 if(id==='socks_sandals'){assert.equal(result[0].kind,'CUSHION ESCAPE');assert.equal(result[0].spin.y,.65);}
 if(id==='most_evil')assert.equal(Math.abs(result[0].spin.x),.55);
 if(id==='lucy_fir'){assert.equal(result.length,2,'Lucy chains a second shot');for(const r of result){assert(r.pots.includes('red'),'real colour pot');assert.equal(r.turn,2);assert.deepEqual(r.spin,{x:0,y:0});}}
 console.log('PASS K4 AI '+id+': '+JSON.stringify(result));
 }
 await p.evaluate(()=>{showTitleScreen();gameMode='pirate';currentPirateId='cyclops';currentPirateLevel=6;});assert.equal(await p.evaluate(()=>aiExecutionProfile().breakPower),100);assert.equal(await p.evaluate(()=>aiExecutionProfile().label),'Cyclops');console.log('PASS Cyclops level-6 profile preserved independently of Lucy');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

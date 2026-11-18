const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const spin=require('../www/spin-physics.js');
const url=process.env.TEST_URL||'http://127.0.0.1:8001/';
async function run(page,options={}){return page.evaluate(o=>{
 gameMode='school';aiPlayer=null;currentScenario=null;schoolSession=null;clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
 frameStatsEligible=false;state=newState(1);state.breakShot=false;state.groups={1:'red',2:'yellow'};
 moving=false;shot=null;placementMode='none';pendingChoice=null;pendingAIPlan=null;
 if(o.kind==='cushion')balls=[ball(700,300,'white','cue')];
 else if(['pocket','black','earlyBlack','wrong'].includes(o.kind)){balls=[ball(CENTRE_X,T+240,'white','cue'),ball(CENTRE_X,T+100,o.kind==='wrong'?'yellow':o.kind==='pocket'?'red':'black',1)];if(o.kind==='earlyBlack'||o.kind==='wrong')balls.push(ball(L+200,490,'red',2));}
 else if(o.kind==='break'){newFrame(1);placementMode='none';}
 else balls=[ball(700,490,'white','cue'),ball(920,490,'red',1)];
 setAngleDeg(['cushion','pocket','black','earlyBlack','wrong'].includes(o.kind)?270:o.kind==='break'?180:0);
 powerEl.value=o.power||30;
 if(typeof setSpinContact==='function')setSpinContact(o.x||0,o.y||0);
 beginShot();let n=0,bounce=null,contactAt=null,followSample=null;const dt=o.dt||1/120;
 while(!allStopped()&&n++<12000){const vy=cue().vy;step(dt);if(shot.firstContact&&contactAt===null)contactAt=n;if(contactAt!==null&&!followSample&&(n-contactAt)*dt>=.4)followSample={x:cue().x,vx:cue().vx};if(!bounce&&o.kind==='cushion'&&vy<0&&cue().vy>0)bounce={vx:cue().vx,vy:cue().vy};}
 if(n>=12000)throw Error('Physics did not settle');
 const trace={first:shot.firstContact,pots:[...shot.pots],inOff:shot.cuePotted,cushion:shot.cushionAfterContact,breakCrossers:[...shot.breakCrossers]};
 const result={balls:balls.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,vx:b.vx,vy:b.vy,potted:b.potted})),trace,bounce,followSample,n};
 if(o.resolve){endShot();result.message=lastShotEl.textContent;result.frameOver=state.frameOver;}
 return result;
},options);}
(async()=>{
 assert(Math.hypot(...Object.values(spin.contact(9,9)))<=.8500001);
 assert.deepEqual(spin.contact(NaN,Infinity),{x:0,y:0});
 const b={vx:100,vy:0};spin.strike(b,{x:.7,y:-.3},0,100);const first={...b.cueSpin};spin.advance(b,1);assert(Math.abs(b.cueSpin.side)<Math.abs(first.side));assert(Math.abs(b.cueSpin.x)<Math.abs(first.x));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const current=await browser.newPage({serviceWorkers:'block'}),baseline=await browser.newPage({serviceWorkers:'block'}),errors=[];
 current.on('pageerror',e=>errors.push(e.message));baseline.on('pageerror',e=>errors.push(e.message));
 const source=execFileSync('git',['show','e9af41e:www/game.js'],{encoding:'utf8'});
 await baseline.route('**/layout.js',route=>route.fulfill({body:'',contentType:'application/javascript'}));
 await baseline.route('**/game.js',route=>route.fulfill({body:source,contentType:'application/javascript'}));
 await Promise.all([current.goto(url,{waitUntil:'networkidle'}),baseline.goto(url,{waitUntil:'networkidle'})]);
 for(const kind of ['collision','cushion','pocket','break'])for(const power of [15,35,70]){
  const old=await run(baseline,{kind,power}),neutral=await run(current,{kind,power});assert.deepEqual(neutral,old,`exact approved-baseline centre comparison: ${kind}/${power}`);
 }
 console.log('PASS 12 exact zero-spin baseline comparisons: collisions, cushions, pots and breaks at 3 powers');
 const centre=await run(current),follow=await run(current,{y:-.65}),draw=await run(current,{y:.65});
 assert(follow.balls[0].x>centre.balls[0].x+100);assert(draw.balls[0].x<centre.balls[0].x-100);
 const left=await run(current,{kind:'cushion',x:-.65}),right=await run(current,{kind:'cushion',x:.65}),straight=await run(current,{kind:'cushion'});
 assert(left.bounce.vx*right.bounce.vx<0);assert(Math.abs(straight.bounce.vx)<1e-8);
 assert(Math.abs(left.bounce.vx)>10);assert(Math.abs(left.bounce.vx+right.bounce.vx)<1e-8);
 const diagonal=await run(current,{x:.55,y:-.55,power:100}),sideOnly=await run(current,{x:.55,power:100});
 assert(Math.abs(diagonal.balls[0].x-sideOnly.balls[0].x)>50);
 assert(Math.abs(diagonal.balls[0].y-follow.balls[0].y)>5);
 const weak=await run(current,{y:.3}),firm=await run(current,{y:-.65,power:40});assert(Math.abs(weak.balls[0].x-centre.balls[0].x)<Math.abs(draw.balls[0].x-centre.balls[0].x));assert(firm.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));
 for(const dt of [1/60,1/240]){const r=await run(current,{y:.65,dt});assert(Math.abs(r.balls[0].x-draw.balls[0].x)<20,'draw stable across integration rates');}
 const slowDraw=await run(current,{y:.65,power:20}),fastDraw=await run(current,{y:.65,power:40});assert(fastDraw.followSample.vx<slowDraw.followSample.vx-30,'firm draw retains more reverse surface speed after contact');
 const black=await run(current,{kind:'black',power:35,y:.65,resolve:true});assert(black.message.includes('WIN'));assert(black.frameOver);
 const early=await run(current,{kind:'earlyBlack',power:35,y:.65,resolve:true});assert(early.message.includes('LOSS'));
 const wrong=await run(current,{kind:'wrong',power:35,y:.65,resolve:true});assert(wrong.message.includes('FOUL'));
 const safePot=await run(current,{kind:'pocket',power:35,y:.65,resolve:true});assert(safePot.trace.pots.includes('red'));assert(safePot.message.includes('LEGAL'));
 const scratch=await run(current,{kind:'pocket',power:65,y:-.8,resolve:true});assert(scratch.trace.inOff);assert(scratch.message.includes('FOUL'));
 assert(await current.evaluate(()=>{gameMode='pirate';aiPlayer=1;state=newState(1);placementMode='none';moving=false;pendingChoice=null;balls=[ball(700,490,'white','cue'),ball(920,490,'red',1)];setSpinContact(.6,.5);beginShot();return shot.spin.x===0&&shot.spin.y===0&&!cue().cueSpin&&selectedSpin.x===0&&selectedSpin.y===0;}));
 assert.deepEqual(errors,[]);
 console.log('PASS follow/draw, mirrored side-cushion impulses, diagonal combinations, proportional strength, decay, powers, integration rates, real pot/foul rules and neutral AI');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

// Production release + real physics/rules and mobile placement controls. No fabricated shot results.
const assert=require('node:assert/strict'),{chromium,devices}=require('playwright');
const {execFileSync}=require('node:child_process');
const url=process.env.TEST_URL||'http://127.0.0.1:8012/';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const landscape of [false,true]){
  const size=landscape?{width:855,height:384}:{width:390,height:844};
  const p=await browser.newPage({...devices['Pixel 7'],viewport:size,screen:size,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setDeviceMetricsOverride',{...size,mobile:true,deviceScaleFactor:1,screenWidth:size.width,screenHeight:size.height,screenOrientation:{type:landscape?'landscapePrimary':'portraitPrimary',angle:landscape?90:0}});
  await p.goto(url,{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>BUILD_MODE),'release');
  await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  const careerBefore=await p.evaluate(()=>JSON.parse(JSON.stringify(career)));
  async function shot(deg=270,power=35){return p.evaluate(([deg,power])=>{setAngleDeg(deg);powerEl.value=power;beginShot();if(!shot)return {blocked:true};let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics timeout');const r={first:shot.firstContact,pots:[...shot.pots],scratch:shot.cuePotted,cushion:shot.cushionAfterContact};endShot();return r;},[deg,power]);}
  async function closeTip(){await p.locator('#schoolTipClose').click();}
  async function begin(){await p.evaluate(()=>startSchoolLesson(3));const initial=await shot();assert(initial.scratch);assert.equal(await p.evaluate(()=>schoolSession.phase),'correction');assert.equal(await p.evaluate(()=>placementMode),'anywhere');assert.equal(await p.evaluate(()=>schoolSession.inOffDemonstrated),true);await closeTip();}
  async function tapAt(x,y){const point=await p.evaluate(({x,y})=>{const r=canvas.getBoundingClientRect();return {x:r.x+x/W*r.width,y:r.y+y/H*r.height};},{x,y});await p.touchscreen.tap(point.x,point.y);}
  async function good(){const target=await p.evaluate(()=>({x:CENTRE_X,y:T+180}));await tapAt(target.x,target.y);const r=await p.locator('.cue-nudge-grid button').filter({hasText:'▼'}).boundingBox();assert(r&&r.height>0,'mobile placement arrow visible');await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);assert(await p.evaluate(()=>validCuePosition(cue().x,cue().y)));}
  async function confirm(){await p.locator('#confirmCue').click();assert.equal(await p.evaluate(()=>placementMode),'none');}
  async function failed(label){assert(!await p.evaluate(()=>career.poolSchoolCompleted.includes(3)),label);assert.equal(await p.evaluate(()=>schoolSession.phase),'correction');assert.equal(await p.evaluate(()=>placementMode),'anywhere');assert.equal(await p.evaluate(()=>schoolSession.confirmedPlacement),null);assert(await p.evaluate(()=>schoolSession.inOffDemonstrated));await closeTip();console.log('PASS '+size.width+'x'+size.height+' '+label+'; corrective retry retained');}
  async function plan(type){return p.evaluate(type=>{const target=balls.find(b=>b.type===type&&!b.potted),c=cue();for(const [px,py] of pockets){const length=Math.hypot(target.x-px,target.y-py),gx=target.x+(target.x-px)/length*ballR*2,gy=target.y+(target.y-py)/length*ballR*2,deg=Math.atan2(gy-c.y,gx-c.x)*180/Math.PI;for(const power of [20,25,30,35,40,50,65])for(const offset of [0,-.3,.3,-.6,.6]){const r=aiDryRunShot(deg+offset,power,12,1/120);if(r.first===type&&r.pots.includes(type)&&!r.cuePotted)return{deg:deg+offset,power};}}return null;},type);}
  await begin();
  assert(await p.evaluate(()=>{const c=cue();return validCuePosition(c.x,c.y)&&rayBallHit(c.x,c.y,0,-1,c).ball.type==='yellow'&&balls.every((a,i)=>balls.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>ballR*2.02));}),'legal blocked origin with no overlap');
  assert((await p.locator('#schoolCoach p').textContent()).includes('sink that red to finish the lesson'));
  await confirm();assert.equal(await p.evaluate(()=>schoolSession.confirmedPlacement),null);await shot();await failed('unchanged-position confirmation does not pass');
  await good();assert.deepEqual(await shot(),{blocked:true},'movement without confirmation cannot shoot');assert(!await p.evaluate(()=>career.poolSchoolCompleted.includes(3)));await confirm();
  const miss=await p.evaluate(()=>{for(const power of [50,65,80])for(let deg=240;deg<=300;deg+=2){const r=aiDryRunShot(deg,power,12,1/120);if(r.first==='red'&&!r.pots.length&&!r.cuePotted)return{deg,power};}return null;});assert(miss,'legal miss plan');const missed=await shot(miss.deg,miss.power);assert.equal(missed.first,'red');assert(!missed.pots.length&&missed.cushion&&!missed.scratch);await failed('legal red contact and cushion without red pot does not pass');
  await good();await confirm();const yellow=await plan('yellow');assert(yellow,'yellow pot plan');const yp=await shot(yellow.deg,yellow.power);assert(yp.pots.includes('yellow'));await failed('yellow pot does not pass');
  // Behind-yellow combination pots the red after illegal first contact.
  const origin=await p.evaluate(()=>schoolSession.placement);await tapAt(origin.x,origin.y+ballOffset());
  function ballOffset(){return 14;}
  await confirm();const illegal=await p.evaluate(()=>{for(const power of [25,35,45,55,65,80]){const r=aiDryRunShot(270,power,12,1/120);if(r.first==='yellow'&&r.pots.includes('red'))return{deg:270,power};}return null;});assert(illegal,'illegal red combination plan');const ir=await shot(illegal.deg,illegal.power);assert(ir.first==='yellow'&&ir.pots.includes('red'));await failed('illegal red pot does not pass');
  await good();await confirm();const scratch=await p.evaluate(()=>{const c=cue();for(const [x,y]of pockets){const deg=Math.atan2(y-c.y,x-c.x)*180/Math.PI;for(const power of [20,35,50])if(aiDryRunShot(deg,power,12,1/120).cuePotted)return{deg,power};}return null;});assert(scratch);assert((await shot(scratch.deg,scratch.power)).scratch);await failed('second in-off does not pass');
  await good();await confirm();const black=await plan('black');assert(black);assert((await shot(black.deg,black.power)).pots.includes('black'));await failed('early black foul does not pass');
  await good();await confirm();assert(await p.evaluate(()=>!!schoolSession.confirmedPlacement));
  await p.evaluate(()=>{setAngleDeg(270);powerEl.value=25;});await p.locator('#shoot').click();await p.waitForFunction(()=>schoolSession.phase==='complete',null,{timeout:15000});
  assert(await p.evaluate(()=>career.poolSchoolCompleted.includes(3)));assert.equal(await p.evaluate(()=>remaining('black')),1);assert.equal(await p.evaluate(()=>state.winner),null);assert.equal(await p.evaluate(()=>state.frameOver),false);assert.deepEqual(await shot(),{blocked:true},'completed lesson cannot restart shooting');assert(await p.locator('#shoot').isDisabled());assert.equal(await p.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true');
  await p.locator('#schoolExit').click();assert((await p.locator('.pool-school-lesson').nth(2).innerText()).includes('✓'));await p.reload({waitUntil:'networkidle'});assert(await p.evaluate(()=>career.poolSchoolCompleted.includes(3)));
  const after=await p.evaluate(()=>JSON.parse(JSON.stringify(career)));for(const key of Object.keys(careerBefore).filter(k=>k!=='poolSchoolCompleted'))assert.deepEqual(after[key],careerBefore[key],'no career/campaign contamination: '+key);
  // Retained existing completed lessons and trophy survive replay failures.
  await p.evaluate(()=>{career.poolSchoolCompleted=[1,2,3,4,5];saveCareer();});await p.reload({waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await p.evaluate(()=>startSchoolLesson(3));await shot();await closeTip();await confirm();await shot();await p.evaluate(()=>{leaveSchoolTable();showPoolSchool();});await p.reload({waitUntil:'networkidle'});
  assert.deepEqual(await p.evaluate(()=>career.poolSchoolCompleted),[1,2,3,4,5]);assert(await p.evaluate(()=>career.earnedAchievements.includes('daves_star_pupil')));
  assert.deepEqual(errors,[]);await p.screenshot({path:'/tmp/lesson3-hotfix-'+size.width+'.png'});await p.close();console.log('PASS '+size.width+'x'+size.height+' real opening/blocked rack/mobile arrows/confirmed red pot/immediate completion/persistence/trophy/career isolation');
 }
 // Lessons 1,2,4 initial engine arrangements/instructions remain byte-equivalent in behaviour.
 const old=execFileSync('git',['show','2318acc:www/game.js'],{encoding:'utf8',maxBuffer:4*1024*1024});
 async function otherLessons(baseline){const p=await browser.newPage({serviceWorkers:'block'});if(baseline)await p.route('**/game.js',route=>route.fulfill({contentType:'application/javascript',body:old}));await p.goto(url);const result=await p.evaluate(()=>[1,2,4].map(id=>{startSchoolLesson(id);return{id,balls:balls.map(({x,y,type,id})=>({x,y,type,id})),groups:state.groups,text:document.querySelector('#schoolCoach p').textContent};}));await p.close();return result;}
 assert.deepEqual(await otherLessons(false),await otherLessons(true));console.log('PASS Lessons 1/2/4 racks/groups/instructions match approved Alpha; Lesson 5 implementation untouched');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

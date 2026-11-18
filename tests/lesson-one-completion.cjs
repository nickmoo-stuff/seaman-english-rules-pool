// End-to-end regression: real browser clicks and real-time physics, no input quota.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [width,height] of [[390,844],[1280,900]]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.TEST_URL||'http://127.0.0.1:8000/'),{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  await p.evaluate(()=>{chapterState('chapter_1').introSeen=true;saveCareer();}); // Fixture: opening story is covered by theatre tests.
  await p.locator('#titlePlay').click();await p.locator('#openPoolSchool').click();await p.locator('.pool-school-lesson button').first().click();
  const baseline=await p.evaluate(()=>({shots:career.shotsTaken,frames:career.framesPlayed}));
  await p.locator('#schoolTipClose').click();await p.locator('#shoot').click();
  await p.waitForFunction(()=>!moving&&remaining('red')===1,{},{timeout:15000});
  assert(await p.locator('#schoolTipBody').isVisible(),'first-pot text reopens dismissed guidance');
  for(const type of ['red','black']){
   for(let attempt=0;attempt<6&&await p.evaluate(type=>remaining(type)>0,type);attempt++){
   const plan=await p.evaluate(type=>{const target=balls.find(b=>b.type===type&&!b.potted),c=cue();
    for(const [px,py] of pockets){const len=Math.hypot(target.x-px,target.y-py),gx=target.x+(target.x-px)/len*ballR*2,gy=target.y+(target.y-py)/len*ballR*2,deg=Math.atan2(gy-c.y,gx-c.x)*180/Math.PI;
     for(const power of [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100])for(const delta of [0,-.1,.1,-.2,.2,-.3,.3,-.5,.5,-.7,.7,-1,1]){const robust=[1/30,1/60,1/90,1/120].every(dt=>[-.1,0,.1].every(error=>{const r=aiDryRunShot(deg+delta+error,power,12,dt);return r.first===type&&r.pots.includes(type)&&!r.cuePotted;}));if(robust)return {deg:deg+delta,power};}}
    // A valid lesson can need a positioning shot: do not assume every real-time
    // table leaves a direct pot safe at all integration cadences.
    if(type==='black'){
     const deg=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
     for(const power of [35,40,45,50,55,60]){const safe=[1/30,1/60,1/90,1/120].every(dt=>{const r=aiDryRunShot(deg,power,12,dt);return r.first==='black'&&!r.cuePotted&&!r.pots.includes('black');});if(safe)return {deg,power,positioning:true};}
    }
    return null;},type);assert(plan,`legal ${type} pot available: `+JSON.stringify(await p.evaluate(()=>({balls:balls.map(({id,type,x,y,potted})=>({id,type,x,y,potted})),spin:selectedSpin,history:playHistory,phase:schoolSession.phase}))));
   await p.evaluate(plan=>{setAngleDeg(plan.deg);powerEl.value=plan.power;powerText.textContent=plan.power+'%';},plan);
   if(await p.locator('#schoolTipBody').isVisible())await p.locator('#schoolTipToggle').click();await p.locator('#shoot').click();
   await p.waitForFunction(()=>!moving,{},{timeout:15000});
   if(!plan.positioning)assert.equal(await p.evaluate(type=>remaining(type),type),0,JSON.stringify(await p.evaluate(()=>({last:lastShotEl.textContent,angle:angleText.textContent,trace:playHistory.at(-1),phase:schoolSession.phase}))));
   else assert(!/^FOUL|^LOSS —/i.test(await p.locator('#lastShot').textContent()),'positioning shot must be legal');
   if(await p.evaluate(type=>remaining(type)===0,type))assert(await p.locator('#schoolTipBody').isVisible(),`${type} result text is expanded`);
   }
   assert.equal(await p.evaluate(type=>remaining(type),type),0,'bounded legal play finishes '+type);
  }
  assert.equal(await p.evaluate(()=>schoolSession.phase),'complete');
  assert(await p.locator('#shoot').isDisabled());assert((await p.locator('#schoolCoach p').innerText()).includes('completion tick is saved'));
  const snapshot=()=>p.evaluate(()=>balls.map(({id,x,y,potted})=>({id,x,y,potted})));
  const finalBalls=await snapshot();await p.waitForTimeout(700);assert.deepEqual(await snapshot(),finalBalls,'no automatic rerack');
  assert.deepEqual(await p.evaluate(()=>({shots:career.shotsTaken,frames:career.framesPlayed})),baseline);
  if(width===390)await p.screenshot({path:'/tmp/lesson-one-completed.png'});
  await p.locator('#schoolExit').click();assert((await p.locator('.pool-school-lesson').first().innerText()).includes('✓'));
  await p.reload({waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  await p.locator('#titlePlay').click();await p.locator('#openPoolSchool').click();assert((await p.locator('.pool-school-lesson').first().innerText()).includes('✓'),'tick survives reload');
  assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: real-time legal clearance, expanded result, frozen completed table, stored/menu/reloaded tick, no career inflation`);
  await p.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

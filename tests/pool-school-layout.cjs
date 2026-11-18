const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 for(const [width,height] of [[320,568],[390,844],[480,800],[800,600],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:8000/'),{waitUntil:'networkidle'});
  await page.locator('#enterTavern').click();await page.waitForTimeout(2700);
  await page.evaluate(()=>{chapterState('chapter_1').introSeen=true;saveCareer();}); // Fixture: opening story is covered by theatre tests.
  await page.locator('#titlePlay').click();await page.locator('#openPoolSchool').click();
  const cards=page.locator('.pool-school-lesson');assert.equal(await cards.count(),5);
  for(let i=0;i<5;i++){
   const button=cards.nth(i).locator('button');await button.scrollIntoViewIfNeeded();
   const geometry=await cards.nth(i).evaluate(el=>{const box=el.getBoundingClientRect(),text=el.firstElementChild.getBoundingClientRect(),button=el.querySelector('button').getBoundingClientRect();return {textBottom:text.bottom,buttonTop:button.top,inside:button.left>=box.left&&button.right<=box.right&&button.left>=0&&button.right<=innerWidth,overflow:el.scrollWidth>el.clientWidth};});
   assert(geometry.inside,`contained Start button at ${width}, card ${i}`);assert(geometry.buttonTop>=geometry.textBottom,`stacked rows at ${width}`);assert(!geometry.overflow);
  }
  if(width===390)await page.screenshot({path:'/tmp/school-menu-fixed.png'});
  await cards.nth(0).locator('button').click();
  assert(await page.locator('#schoolCoach').isVisible());
  assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#schoolTipIndicator').textContent(),'Hide');
  assert.equal(await page.locator('#gameApp #schoolCoach').count(),0,'tip outside match layout');
  const pane=await page.locator('.mobile-scroll-zone').evaluate(el=>({height:el.clientHeight,overflow:el.scrollHeight>el.clientHeight}));
  assert(pane.height>80,`usable controls pane at ${width}: ${pane.height}`);
  assert(await page.locator('#schoolTipBody').isVisible());
  const tip=await page.locator('#schoolCoach').boundingBox();assert(tip.width<=300&&tip.height<height*.5);
  // A normal Helm interaction minimises the expanded tip without blocking input.
  await page.locator('#helmPort').click();assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'false');
  await page.locator('#schoolTipToggle').click();await page.locator('#schoolTipClose').click();assert(await page.locator('#schoolCoach').isHidden());
  await page.getByRole('button',{name:'Game menu',exact:true}).click();
  await page.locator('#schoolShowTip').click();assert(await page.locator('#schoolTipBody').isVisible());
  await page.locator('#schoolTipClose').click();
  // Restore the initially lined-up angle using existing UI fine controls: Helm click
  // changes one degree; ten -0.1 degree presses undo it (or read displayed value).
  const angle=await page.evaluate(()=>Number(angleText.textContent.replace('°','')));
  const fine=angle<270?'#anglePlus':'#angleMinus';
  for(let i=0;i<Math.round(Math.abs(angle-270)*10);i++)await page.locator(fine).click();
  await page.locator('#shoot').click();
  await page.waitForFunction(()=>remaining('red')===1&&!moving,{},{timeout:15000});
  assert(await page.locator('#gameApp').isVisible());assert.equal(await page.evaluate(()=>state.frameOver),false);
  assert.equal(await page.evaluate(()=>remaining('red')),1,'real UI shot succeeds');
  assert(!(await page.evaluate(()=>career.poolSchoolCompleted.includes(1))),'first pot alone earns no tick');
  assert(await page.locator('#schoolCoach').isVisible());
  assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true','new text reopens guidance');
  await page.getByRole('button',{name:'Game menu',exact:true}).click();await page.locator('#schoolMenuExit').click();
  // New guidance reopens a dismissed tip when the in-off changes lesson phase.
  await page.locator('.pool-school-lesson').nth(2).locator('button').click();
  await page.locator('#schoolTipClose').click();await page.locator('#shoot').click();
  await page.waitForFunction(()=>schoolSession?.phase==='correction',{},{timeout:15000});
  assert(await page.locator('#schoolCoach').isVisible());
  assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true');
  await page.locator('#confirmCue').click(); // unchanged position must fail after shot
  await page.locator('#shoot').click();await page.waitForFunction(()=>!moving,{},{timeout:15000});
  assert.equal(await page.evaluate(()=>state.frameOver),false,'unsuccessful attempts remain playable');
  await page.getByRole('button',{name:'Game menu',exact:true}).click();
  await page.locator('#schoolMenuRetry').click();assert.equal(await page.evaluate(()=>schoolSession.phase),'practice');
  await page.getByRole('button',{name:'Game menu',exact:true}).click();await page.locator('#schoolMenuExit').click();
  assert(await page.locator('#poolSchoolScreen').isVisible());
  assert.deepEqual(errors,[]);
  console.log(`PASS ${width}x${height}: stacked contained buttons, usable controls, expand/minimise/close/reopen, real shot, hidden phase updates, restart/exit after failure`);
  await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict');const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8002/';
const near=(a,b,t=.8)=>assert(Math.abs(a-b)<t,`${a} ≈ ${b}`);
async function enter(p){await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await p.locator('#titleLocalMultiplayer').click();await p.getByRole('button',{name:'Start game',exact:true}).click();}
async function mode(p,value){await p.locator(`#headerLayoutControl [data-gameplay-layout=${value}]`).click();await p.waitForTimeout(100);}
async function snapshot(p){return p.evaluate(()=>({balls:JSON.parse(JSON.stringify(balls)),state:JSON.parse(JSON.stringify(state)),names:{...playerNames},power:powerEl.value,angle,spin:{...selectedSpin},spinMode:helmSpinMode,moving,paused:gamePaused,career:JSON.stringify(career),mode:gameMode,scenario:currentScenario}));}
async function assertLandscape(p,w,h,compact=false){
 await p.waitForFunction(()=>canvas.getBoundingClientRect().width>30);
 const boxes=await p.evaluate(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();return {canvas:rect('game'),left:rect('landscapePlayer'),right:rect('landscapeRight'),helm:rect('landscapeHelm'),fine:rect('landscapeFine'),power:rect('power'),shoot:rect('shoot'),main:[gameApp.clientWidth,gameApp.scrollWidth,gameApp.clientHeight,gameApp.scrollHeight],page:[document.documentElement.scrollWidth,document.documentElement.clientWidth,document.documentElement.scrollHeight,innerHeight],intrinsic:[canvas.width,canvas.height],vertical:getComputedStyle(powerEl).writingMode,heading:gameApp.querySelector('header').getBoundingClientRect().toJSON()};});
 near(boxes.canvas.width/boxes.canvas.height,1780/980,.004);assert.deepEqual(boxes.intrinsic,[1780,980]);assert(boxes.canvas.width>150,'playable table width');
 assert(boxes.main[1]<=boxes.main[0]+1&&boxes.main[3]<=boxes.main[2]+1,'no page/main overflow');assert(boxes.page[0]<=boxes.page[1]+1&&boxes.page[2]<=boxes.page[3]+1,'no document scrolling '+JSON.stringify(boxes.page));
 if(!compact){assert(boxes.left.right<=boxes.canvas.left+1);assert(boxes.right.left>=boxes.canvas.right-1);}
 assert(boxes.fine.top>=boxes.canvas.bottom-1);assert(boxes.helm.top>=boxes.canvas.bottom-1);assert(boxes.power.height>boxes.power.width);assert(boxes.vertical.startsWith('vertical'));
 assert(boxes.shoot.y>=0&&boxes.shoot.bottom<=h+1,'shot control is always in viewport');
 const fine=await p.locator('.angle-buttons button').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().toJSON()));assert(fine.every(b=>b.height>=43&&b.width>=43));assert(fine.every(b=>Math.abs(b.y-fine[0].y)<1),'fine aiming is horizontal');
 for(const id of ['soundToggle','settingsButton','reset']){const b=await p.locator('#'+id).boundingBox();assert(b.x>=0&&b.x+b.width<=w+1&&b.y+b.height<=boxes.heading.bottom+1);}
 const projection=await p.evaluate(()=>{const r=canvas.getBoundingClientRect();return canvasPoint({clientX:r.left+r.width*.37,clientY:r.top+r.height*.61});});near(projection.x,1780*.37,.01);near(projection.y,980*.61,.01);
 return boxes;
}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [w,h] of [[1920,1080],[1366,768],[600,760],[500,700]]){
  const p=await browser.newPage({viewport:{width:w,height:h},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await enter(p);
  assert.equal(await p.evaluate(()=>document.documentElement.dataset.layoutDevice),'desktop');assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'portrait');
  await p.locator('#confirmCue').click();await p.locator('#helmCueBall').dblclick({delay:80});await p.locator('[data-spin=Backspin]').click();
  await p.evaluate(()=>{powerEl.value=55;powerText.textContent='55%';gamePaused=true;});
  const before=await snapshot(p);await p.locator('#headerLayoutControl [data-gameplay-layout=portrait]').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);assert.deepEqual(await snapshot(p),before,'ready state preserved on toggle');
  await assertLandscape(p,w,h,w<=560);
  if(w===1366){
   const arrow=await p.locator('#helmPort').boundingBox();await p.mouse.move(arrow.x+arrow.width/2,arrow.y+arrow.height/2);await p.mouse.down();
   const held=await p.evaluate(()=>angle);await p.evaluate(()=>document.querySelector('#headerLayoutControl [data-gameplay-layout=portrait]').click());await p.waitForTimeout(450);
   assert.equal(await p.evaluate(()=>angle),held,'layout switch cancels a held-arrow repeat');await p.mouse.up();await p.evaluate(a=>setAngleDeg(a*180/Math.PI),before.angle);await mode(p,'landscape');
   assert.deepEqual(await snapshot(p),before);
   const shot=await p.locator('#shoot').boundingBox();await p.mouse.move(shot.x+shot.width/2,shot.y+shot.height/2);await p.mouse.down();await p.setViewportSize({width:w,height:h+2});await p.waitForTimeout(1500);await p.mouse.up();
   assert(await p.evaluate(()=>shot===null),'resizing while holding PLAY SHOT cannot fire on release');await p.setViewportSize({width:w,height:h});assert.deepEqual(await snapshot(p),before);
  }
  if(w===1920||w===1366)await p.screenshot({path:`/tmp/stage3c-desktop-${w}.png`});
  await p.locator('#settingsButton').click();assert.equal(await p.locator('#settingsLayoutControl [data-gameplay-layout=landscape]').getAttribute('aria-pressed'),'true');
  await p.locator('#settingsLayoutControl [data-gameplay-layout=portrait]').click();await p.locator('#closeSettings').click();assert.equal(await p.locator('#headerLayoutControl [data-gameplay-layout=portrait]').getAttribute('aria-pressed'),'true');assert.deepEqual(await snapshot(p),before);
  // Simulate live velocities without allowing elapsed physics to mask a reset.
  await p.evaluate(()=>{moving=true;cue().vx=123;cue().vy=-57;});const live=await snapshot(p);await mode(p,'landscape');assert.deepEqual(await snapshot(p),live,'live velocity/state fields are not reset');
  await p.setViewportSize({width:520,height:650});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape','F12-like resize retains desktop choice');assert.deepEqual(await snapshot(p),live);
  const zoom=await p.context().newCDPSession(p);await zoom.send('Emulation.setPageScaleFactor',{pageScaleFactor:1.25});assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape');await zoom.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
  await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{moving=false;cue().vx=cue().vy=0;});
  await p.reload({waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape','preference survives reload');
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('seamenAudioSettings')).gameplayLayout),'landscape');
  assert.deepEqual(errors,[]);console.log(`PASS desktop ${w}x${h}: default/toggles/settings/state/persistence/resize/canvas geometry`);await p.close();
 }
 for(const [w,h] of [[960,540],[844,390],[740,360]]){
  const p=await browser.newPage({...devices['Pixel 7'],viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:1,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));const cdp=await p.context().newCDPSession(p);
  async function rotate(width,height,landscape){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height,screenOrientation:{type:landscape?'landscapePrimary':'portraitPrimary',angle:landscape?90:0}});await p.waitForTimeout(150);}
  await rotate(w,h,true);await enter(p);assert.equal(await p.evaluate(()=>document.documentElement.dataset.layoutDevice),'mobile');assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape');
  assert(await p.locator('#headerLayoutControl').isHidden());await p.locator('#settingsButton').tap();assert(await p.locator('.layout-setting').isHidden());await p.locator('#closeSettings').tap();
  await assertLandscape(p,w,h);
  await p.locator('#confirmCue').tap();await p.locator('#helmCueBall').tap();await p.waitForTimeout(70);await p.locator('#helmCueBall').tap();assert(await p.evaluate(()=>helmSpinMode),'mobile double-tap enables spin');await p.locator('[data-spin=Topspin]').tap();
  await p.evaluate(()=>{powerEl.value=60;powerText.textContent='60%';gamePaused=true;});const before=await snapshot(p);
  await rotate(390,844,false);assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'portrait');assert.deepEqual(await snapshot(p),before,'rotation preserves selected spin/Helm mode/power');
  assert(await p.locator('#headerLayoutControl').isHidden());
  // A soft-keyboard-sized viewport with unchanged physical orientation stays portrait.
  await rotate(390,300,false);assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'portrait');
  await rotate(w,h,true);assert.deepEqual(await snapshot(p),before);
  await p.evaluate(()=>{gamePaused=false;restoreCue('anywhere');updateHUD();});await p.waitForTimeout(300);const r=await p.locator('#game').boundingBox();await p.touchscreen.tap(r.x+r.width*.8,r.y+r.height*.65);
  near(await p.evaluate(()=>cue().x),1780*.8,8);near(await p.evaluate(()=>cue().y),980*.65,8);await p.locator('#confirmCue').tap();
  // Vertical range: top is stronger, keyboard Up increases and Down decreases.
  await p.locator('#power').focus();const power=await p.evaluate(()=>Number(powerEl.value));await p.keyboard.press('ArrowUp');assert.equal(await p.evaluate(()=>Number(powerEl.value)),power+1);await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>Number(powerEl.value)),power);
  await p.locator('#anglePlus').tap();await p.locator('#helmStarboard').tap();assert(await p.locator('#shoot').isEnabled());
  await p.screenshot({path:`/tmp/stage3c-mobile-${w}.png`});assert.deepEqual(errors,[]);console.log(`PASS mobile ${w}x${h}: orientation, hidden desktop controls, rotation state, placement coordinates and vertical power`);await p.close();
 }
 // A narrow touch Windows desktop remains manual; iPad desktop UA is automatic.
 const pc=await browser.newPage({viewport:{width:430,height:760},hasTouch:true,userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'});await pc.emulateMedia({});await pc.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=q=>['(pointer: coarse)','(hover: none)'].includes(q)?original('(max-width: 0px)'):original(q);});await pc.goto(url);assert.equal(await pc.evaluate(()=>document.documentElement.dataset.layoutDevice),'desktop');await pc.close();
 const ipad=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true,userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'});await ipad.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});});await ipad.goto(url);assert.equal(await ipad.evaluate(()=>document.documentElement.dataset.layoutDevice),'mobile');await ipad.close();
 const settings=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});await settings.goto(url);await settings.locator('#enterTavern').click();await settings.waitForTimeout(2700);await settings.locator('#titleSettings').click();await settings.locator('#settingsLayoutControl [data-gameplay-layout=landscape]').click();
 await settings.locator('#masterVolume').focus();await settings.keyboard.press('Home');await settings.keyboard.press('ArrowRight');
 assert.equal(await settings.evaluate(()=>JSON.parse(localStorage.getItem('seamenAudioSettings')).gameplayLayout),'landscape','audio saves retain the shared layout preference');
 assert(await settings.evaluate(()=>validatePortableSave(collectPortableSave())));
 assert(await settings.evaluate(()=>{const value=collectPortableSave(),audio=JSON.parse(value.data.seamenAudioSettings);audio.gameplayLayout='sideways';value.data.seamenAudioSettings=JSON.stringify(audio);try{validatePortableSave(value);return false;}catch(e){return e.message.includes('Gameplay layout');}}));
 const storage=await settings.context().storageState();const next=await browser.newContext({storageState:storage,serviceWorkers:'block'}),restored=await next.newPage();await restored.goto(url);assert.equal(await restored.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape','new browser session restores layout');assert.equal(await restored.evaluate(()=>masterLevel),.01);await next.close();await settings.close();
 console.log('PASS device classification and shared audio/settings persistence, save validation and new-session restoration');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

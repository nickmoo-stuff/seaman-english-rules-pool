const {doubleTap:touchDoubleTap}=require('./touch-input.cjs');
const assert=require('node:assert/strict');
const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8001/';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const touch of [false,true]){
 const landscape=process.env.TEST_LAYOUT==='landscape',size=touch?(landscape?{width:844,height:390}:{width:390,height:844}):{width:1366,height:900};
 const options=touch&&landscape?{...devices['Pixel 7'],screen:size,deviceScaleFactor:1}:{hasTouch:touch,isMobile:touch};
 const page=await browser.newPage({...options,viewport:size,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(touch&&landscape){const c=await page.context().newCDPSession(page);await c.send('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:true,screenWidth:size.width,screenHeight:size.height,screenOrientation:{type:'landscapePrimary',angle:90}});}

 await page.goto(url,{waitUntil:'networkidle'});await page.locator('#enterTavern').click();await page.waitForTimeout(2700);await page.locator('#titleLocalMultiplayer').click();await page.getByRole('button',{name:'Start game',exact:true}).click();if(landscape&&!touch)await page.locator('#headerLayoutControl [data-gameplay-layout=landscape]').click();await page.locator('#confirmCue').click();
 const ball=page.locator('#helmCueBall');
 const get=()=>page.evaluate(()=>({angle:angle*180/Math.PI,power:Number(powerEl.value),mode:helmSpinMode,point:{...selectedSpin}}));
 async function tap(){if(touch)await ball.tap();else await ball.click();}
 async function doubleTap(){if(touch)await touchDoubleTap(page,ball);else await ball.dblclick({delay:80});await page.waitForTimeout(250);}
 async function drag(dx,dy=0){
  await ball.scrollIntoViewIfNeeded();const r=await ball.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
  if(touch){
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*.5,y:y+dy*.5}]});await page.waitForTimeout(45);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});
   await page.waitForTimeout(90);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx*.5,y+dy*.5);await page.mouse.move(x+dx,y+dy,{steps:3});await page.waitForTimeout(90);await page.mouse.up();
  }
 }
 await tap();await page.waitForTimeout(400);assert.equal((await get()).mode,false,'single tap never enables spin');
 const start=(await get()).angle;await drag(32);assert((await get()).angle>start,'normal ball dragging still aims');assert.equal((await get()).mode,false);
 await ball.focus();await page.keyboard.press('Enter');assert.equal((await get()).mode,true);await page.keyboard.press('ArrowUp');assert((await get()).point.y<0);await page.keyboard.press('Enter');assert.equal((await get()).mode,false);await page.evaluate(()=>resetCueSpin());
 const originalArrows=await page.locator('#helmPort').evaluate(e=>{const s=getComputedStyle(e);return [e.offsetWidth,e.offsetHeight,s.backgroundImage,s.borderRadius,s.fontSize]});
 const beforeToggle=(await get()).angle;await doubleTap();assert.equal((await get()).mode,true);assert(await page.evaluate(()=>shot===null),'mode switch cannot fire a shot');assert(Math.abs((await get()).angle-beforeToggle)<1e-8,'toggle does not rotate aim');
 assert(await page.locator('#spinInstruction').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return Math.abs((a.left+a.right-b.left-b.right)/2)<1;}),'spin instruction is centrally aligned');
 assert(await page.locator('#spinPresets').isVisible());assert.equal(await page.locator('#helmAimInstruction').isVisible(),false);assert.equal(await page.locator('#spinInstruction').textContent(),'DOUBLE-TAP CUE BALL TO RETURN TO AIM');
 assert.deepEqual(await page.locator('[data-spin]').allTextContents(),['Centre','Topspin','Backspin','Left','Right']);
 for(const [name,x,y] of [['Centre',0,0],['Topspin',0,-.65],['Backspin',0,.65],['Left',-.65,0],['Right',.65,0]]){await page.locator(`[data-spin="${name}"]`).click();assert.deepEqual((await get()).point,{x,y});assert.equal(await page.locator(`[data-spin="${name}"]`).getAttribute('aria-pressed'),'true');}
 await drag(12,-12);let state=await get();assert(state.point.x>0&&state.point.y<0);assert.equal(state.angle,beforeToggle);assert.equal(await page.locator('[data-spin][aria-pressed="true"]').count(),0,'custom diagonal is not falsely labelled a preset');
 await drag(100,100);state=await get();assert(Math.hypot(state.point.x,state.point.y)<=.850001);
 assert.deepEqual(await page.locator('#helmPort').evaluate(e=>{const s=getComputedStyle(e);return [e.offsetWidth,e.offsetHeight,s.backgroundImage,s.borderRadius,s.fontSize]}),originalArrows,'arrow style/dimensions preserved');
 for(const mode of [true,false]){
  if((await get()).mode!==mode)await doubleTap();
  let a=(await get()).angle;const keyboardPower=(await get()).power;await ball.focus();await page.keyboard.press('a');assert(Math.abs((await get()).angle-(a-.1))<.01);await page.keyboard.press('d');await page.keyboard.press('w');assert.equal((await get()).power,keyboardPower+5);await page.keyboard.press('s');assert.equal((await get()).power,keyboardPower);await page.locator('#helmPort').click();assert(Math.abs((await get()).angle-(a-1))<.01);await page.locator('#helmStarboard').click();assert(Math.abs((await get()).angle-a)<.01);
  await page.locator('#anglePlus5').click();await page.locator('#angleMinus').click();assert(Math.abs((await get()).angle-(a+4.9))<.01);await page.locator('#angleMinus5').click();await page.locator('#anglePlus').click();assert(Math.abs((await get()).angle-a)<.01);
  await page.locator('#cueHelm').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowRight');assert(Math.abs((await get()).angle-a)<.01);
  let power=(await get()).power;await page.locator('#powerMinus5').click();assert.equal((await get()).power,power-5);await page.locator('#powerPlus5').click();assert.equal((await get()).power,power);await page.locator('#powerMinus45').click();assert.equal((await get()).power,power-45);await page.locator('#powerPlus45').click();assert.equal((await get()).power,power);
 }
 // Returning to aim retains the selected contact point.
 if(!(await get()).mode)await doubleTap();await page.locator('[data-spin="Backspin"]').click();await doubleTap();assert.deepEqual((await get()).point,{x:0,y:.65});assert.equal((await get()).mode,false);assert.equal(await page.locator('#spinPresets').getAttribute('aria-hidden'),'true');
 await page.getByRole('button',{name:'Game menu',exact:true}).click();await page.locator('#aimMethodReversed').click();await page.locator('#resumeGame').click();
 const reversedStart=(await get()).angle;await drag(32);assert((await get()).angle<reversedStart,'reversed aiming preference works');
 await page.getByRole('button',{name:'Game menu',exact:true}).click();await page.locator('#aimMethodSimulation').click();await page.locator('#resumeGame').click();
 await page.evaluate(()=>{showPowerSlider=true;syncPowerSliderVisibility();syncTouchSliderLocks();});if(touch&&!landscape)await page.locator('#powerTouchLock').click();
 await page.locator('#power').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.equal((await get()).power,6);assert.equal(await page.locator('#powerText').textContent(),'6%');
 for(let cycle=0;cycle<3;cycle++){await doubleTap();assert.equal((await get()).mode,true,'repeat toggle after slider focus');await page.locator('#power').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await doubleTap();assert.equal((await get()).mode,false,'repeat return retains normal mode');}
 await doubleTap();await page.locator('#power').focus();await page.keyboard.press('ArrowRight');assert.equal((await get()).power,7);assert.equal((await get()).mode,true);await page.locator('[data-spin="Topspin"]').click();await ball.focus();await page.keyboard.press('e');
 assert.deepEqual((await get()).point,{x:0,y:0});assert.equal((await get()).mode,false);assert.equal(await page.locator('#spinPresets').getAttribute('aria-hidden'),'true');assert(await page.evaluate(()=>shot.spin.y===-.65&&!!cue().cueSpin));
 await page.evaluate(()=>{moving=false;shot=null;setSpinContact(.6,.3);helmSpinMode=true;newFrame();});assert.deepEqual((await get()).point,{x:0,y:0});assert.equal((await get()).mode,false);
 const placementAngle=(await get()).angle;await doubleTap();assert.equal((await get()).mode,false,'placement cannot enter spin mode');assert.equal((await get()).angle,placementAngle);
 await page.evaluate(()=>{setSpinContact(.5,-.5);startSchoolLesson(1);});assert.deepEqual((await get()).point,{x:0,y:0});assert.equal((await get()).mode,false);
 await page.evaluate(()=>{leaveSchoolTable();setSpinContact(.5,-.5);startScenario('nightmare');});assert.deepEqual((await get()).point,{x:0,y:0});assert.equal((await get()).mode,false);
 await page.evaluate(()=>{localStorage.setItem('seamenAimMethod','reversed');setSpinContact(.4,.3);helmSpinMode=true;});await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>aimMethod),'reversed');assert.deepEqual((await get()).point,{x:0,y:0});assert.equal((await get()).mode,false,'spin never persists across reload');
 assert.deepEqual(errors,[]);
 console.log(`PASS ${landscape?'landscape':'portrait'} ${touch?'touch/Android pointer':'desktop mouse'}: taps/drags/toggle, presets/diagonals/clamp, unchanged arrows, both-mode fine aim/power, reversed/simulation, slider, shot/frame reset and placement`);
 await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

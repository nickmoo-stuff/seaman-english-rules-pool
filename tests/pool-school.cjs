// Run with the static www server on port 8000 and installed Playwright/Chromium.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8000/'),{waitUntil:'networkidle'});
 await page.locator('#enterTavern').click();await page.waitForTimeout(2700);
 await page.locator('#titleLocalMultiplayer').click();await page.locator('#backToMode').click();
 assert(await page.locator('#titleScreen').isVisible());
 assert.equal(await page.getByText('Online multiplayer',{exact:true}).count(),0);
 const initial=await page.evaluate(()=>JSON.parse(JSON.stringify(career)));
 // Invoke only existing engine input and physics, never fabricated shot outcomes.
 await page.evaluate(()=>{window.testShot=(deg=270,power=35)=>{setAngleDeg(deg);powerEl.value=power;beginShot();if(!shot)throw Error('Shot did not start');let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics timeout');const result={first:shot.firstContact,pots:[...shot.pots],inOff:shot.cuePotted};endShot();return result;};});
 async function start(id){await page.evaluate(id=>startSchoolLesson(id),id);}
 async function shot(deg=270,power=35){return page.evaluate(([d,p])=>window.testShot(d,p),[deg,power]);}
 async function ticks(){return page.evaluate(()=>career.poolSchoolCompleted);}
 await start(1);
 assert.equal(await page.evaluate(()=>balls.filter(b=>b.type==='red').length),2);
 assert.equal(await page.evaluate(()=>balls.filter(b=>b.type==='yellow').length),0);
 assert.equal(await page.locator('#schoolTipIndicator').textContent(),'Hide');
 assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true');
 await page.locator('#schoolTipToggle').click();assert.equal(await page.locator('#schoolTipIndicator').textContent(),'Read');
 await shot(90,10);assert.equal(await page.evaluate(()=>state.frameOver),false,'miss must allow another shot');
 assert.equal(await page.evaluate(()=>state.player),1);await page.locator('#confirmCue').click();
 assert.equal(await page.locator('#shoot').isEnabled(),true);
 // A legal finish must count even without a specific control-input checklist.
 await start(1);await page.locator('#schoolTipClose').click();await shot();
 assert(!(await ticks()).includes(1),'first pot alone does not complete the frame');
 assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true','updated first-pot guidance reopens');
 await page.locator('#schoolTipToggle').click();
 await page.evaluate(()=>schoolPanel(document.querySelector('#schoolCoach p').textContent));
 assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true','repeated teaching triggers also reopen guidance');
 assert(await page.locator('#schoolCoach').isVisible(),'updated text reopens a dismissed overlay');
 await pot('red');await page.locator('#schoolTipToggle').click();await pot('black');
 assert((await ticks()).includes(1),'legal finish earns a tick regardless of input method');
 assert(await page.evaluate(()=>JSON.parse(localStorage.getItem(CAREER_KEY)).poolSchoolCompleted.includes(1)),'completion is stored persistently');
 assert.equal(await page.evaluate(()=>schoolSession.phase),'complete');
 assert.equal(await page.evaluate(()=>state.frameOver),true);
 assert.equal(await page.locator('#shoot').isDisabled(),true);
 assert.equal(await page.locator('#schoolTipToggle').getAttribute('aria-expanded'),'true','completion expands guidance');
 assert((await page.locator('#schoolCoach p').textContent()).includes('completion tick is saved'));
 const finished=await page.evaluate(()=>balls.map(({id,type,x,y,potted})=>({id,type,x,y,potted})));
 await page.waitForTimeout(500);
 assert.deepEqual(await page.evaluate(()=>balls.map(({id,type,x,y,potted})=>({id,type,x,y,potted}))),finished,'finished balls stay in place');
 assert.equal(await page.evaluate(()=>remaining('red')+remaining('black')),0);
 await page.locator('#schoolExit').click();
 assert((await page.locator('.pool-school-lesson').first().innerText()).includes('✓'),'lesson menu shows tick');
 assert.equal(await page.locator('.pool-school-lesson button').first().textContent(),'Replay');
 // Explicit restart is the only action which supplies a fresh lesson-1 rack.
 await page.locator('.pool-school-lesson button').first().click();await shot();
 assert.equal(await page.evaluate(()=>state.frameOver),false);
 assert.equal(await page.locator('#shoot').isEnabled(),true,'first pot leaves shooting available');
 assert.equal(await page.evaluate(()=>state.groups[1]),'red');
 assert((await page.locator('#schoolCoach p').textContent()).startsWith("Good pot! Now it's time to finish up this lesson. First, practice all three controls:"));
 await page.locator('#helmPort').click();await page.locator('#anglePlus').click();await page.locator('#powerPlus5').click();
 assert(await page.evaluate(()=>['helm','fine','power'].every(k=>schoolSession.used.has(k))));
 await pot('red');assert.equal(await page.evaluate(()=>schoolSession.phase),'practice');
 await shot(90,5);assert.equal(await page.evaluate(()=>state.frameOver),false,'a missed black attempt stays playable');
 if(await page.evaluate(()=>placementMode!=='none'))await page.locator('#confirmCue').click();
 await pot('black');assert.equal(await page.evaluate(()=>schoolSession.phase),'complete');
 await page.locator('#schoolRetry').click();
 assert.equal(await page.evaluate(()=>remaining('red')),2);assert.equal(await page.evaluate(()=>remaining('black')),1);
 assert.equal(await page.evaluate(()=>state.frameOver),false);assert((await ticks()).includes(1),'restart retains earned tick');
 await start(2);await shot(90,10);assert(!(await ticks()).includes(2),'miss/foul cannot claim colours');
 await start(2);assert((await shot(90,35)).inOff);assert(!(await ticks()).includes(2),'in-off cannot claim colours');
 await start(2);await pot('black');assert(!(await ticks()).includes(2),'black first cannot claim colours');
 assert.equal(await page.evaluate(()=>schoolSession.phase),'finished');assert.equal(await page.evaluate(()=>remaining('black')),0,'illegal black stays potted until explicit restart');
 await start(2);assert((await shot()).pots.includes('red'));assert(!(await ticks()).includes(2),'red claim is not the lesson objective');
 await pot('black');assert(!(await ticks()).includes(2),'a red-group win cannot pass the yellow lesson');
 assert((await page.locator('#schoolCoach p').textContent()).includes('requires claiming YELLOW'));
 await start(2);assert((await shot(168.8,50)).pots.includes('yellow'));
 assert.equal(await page.evaluate(()=>state.groups[1]),'yellow');assert(!(await ticks()).includes(2),'yellow claim alone is not completion');
 assert.equal(await page.evaluate(()=>schoolSession.phase),'practice');
 await pot('black');assert((await ticks()).includes(2));assert.equal(await page.evaluate(()=>schoolSession.phase),'complete');
 await start(3);assert((await page.locator('#schoolCoach p').textContent()).includes("Under EPA International rules, the other player receives something called 'cue ball in hand', not two visits (or two turns)."));
 assert((await shot()).inOff);assert(!(await ticks()).includes(3),'in-off alone cannot pass');
 assert((await page.locator('#schoolCoach p').textContent()).includes('behind the yellow'));
 assert.equal(await page.evaluate(()=>placementMode),'anywhere');
 await page.locator('#confirmCue').click();await shot();assert(!(await ticks()).includes(3),'confirmation without moving does not pass');
 await start(3);await shot();
 // Place above the blocker, then use the actual nudge control and confirmation.
 await page.evaluate(()=>{const c=cue();c.x=CENTRE_X;c.y=T+180;});
 const down=page.locator('#cuePlacementControls button').filter({hasText:'▼'});await down.dispatchEvent('pointerdown',{pointerId:3});await down.dispatchEvent('pointerup',{pointerId:3});
 await page.locator('#confirmCue').click();await shot();assert((await ticks()).includes(3));
 await start(4);await page.evaluate(()=>{pauseGameForMenu();restartCurrentGame();});assert.equal(await page.evaluate(()=>gamePaused),false);assert.equal(await page.evaluate(()=>schoolSession.id),4);
 // Search legal black-first shots using engine dry-run, then execute the real shot.
 async function pot(type){const plan=await page.evaluate(type=>{
 const target=balls.find(b=>b.type===type&&!b.potted),c=cue();
 for(const [px,py] of pockets){const len=Math.hypot(target.x-px,target.y-py),gx=target.x+(target.x-px)/len*ballR*2,gy=target.y+(target.y-py)/len*ballR*2;const deg=Math.atan2(gy-c.y,gx-c.x)*180/Math.PI;
 for(const power of [15,20,25,30,35,40,45,50])for(const offset of [0,-.3,.3,-.6,.6]){const r=aiDryRunShot(deg+offset,power,12,1/120);if(r.first===type&&r.pots.includes(type)&&!r.cuePotted)return {deg:deg+offset,power};}}
 return null;},type);assert(plan,`pot plan for ${type}`);return shot(plan.deg,plan.power);}
 await pot('black');assert(!(await ticks()).includes(4),'black early loses');
 await start(4);await shot();assert(!(await ticks()).includes(4),'final colour alone cannot pass');assert((await page.locator('#schoolCoach p').textContent()).includes('without the white going in as well.'));await pot('black');assert((await ticks()).includes(4));
 await page.evaluate(()=>startSchoolCosmeticLesson());assert((await page.locator('#schoolCosmeticGuide').textContent()).includes('Clicking back to title without selecting a new table design to try won’t earn you a tick here!'));await page.locator('#cosmeticsBack').click();assert(!(await ticks()).includes(5));
 await page.evaluate(()=>startSchoolCosmeticLesson());
 await page.locator('.cosmetic-choice[disabled]').first().dispatchEvent('click');assert(!(await ticks()).includes(5),'locked item cannot complete lesson');
 await page.locator('.cosmetic-choice:not([disabled])').first().click();assert((await ticks()).includes(5));
 await page.evaluate(()=>startSchoolCosmeticLesson());await page.locator('[data-cosmetic-tab="cues"]').click();await page.locator('.cue-choice:not([disabled])').first().click();
 assert.equal((await ticks()).filter(n=>n===5).length,1,'cue replay does not duplicate completion');
 const after=await page.evaluate(()=>JSON.parse(JSON.stringify(career)));
 assert(after.earnedAchievements.includes('daves_star_pupil'));
 assert((await page.locator('#poolSchoolProgress').textContent()).includes('Additional lessons may be added later.'));
 for(const key of ['framesPlayed','framesWon','framesLost','shotsTaken','legalBallsPotted','foulsCommitted','bestPotStreak','sevenBallWins','blackOnBlackWins','foulFreeWins','oneVisitClearances','piratesDefeated','pirateRecords','chapters','unlockedCosmetics','lifetimePremium'])assert.deepEqual(after[key],initial[key],`training isolation: ${key}`);
 await page.reload({waitUntil:'networkidle'});assert.deepEqual((await ticks()).sort(),[1,2,3,4,5]);
 assert(await page.evaluate(()=>career.earnedAchievements.includes('daves_star_pupil')));
 await page.evaluate(()=>{POOL_SCHOOL_LESSONS.push({id:6,title:'Future',detail:'Future lesson'});saveCareer();});
 assert(await page.evaluate(()=>career.earnedAchievements.includes('daves_star_pupil')));
 // A real normal multiplayer shot restores normal tracking after training.
 await page.locator('#enterTavern').click();await page.waitForTimeout(2700);await page.locator('#titleLocalMultiplayer').click();await page.getByRole('button',{name:'Start game',exact:true}).click();
 await page.locator('#confirmCue').click();await page.locator('#shoot').click();await page.waitForFunction(()=>!moving,{},{timeout:20000});assert(await page.evaluate(()=>playHistory.length>0));
 assert.equal(await page.evaluate(()=>career.shotsTaken),initial.shotsTaken+1);
 assert.equal(await page.evaluate(()=>gameMode),'local');
 assert.deepEqual(errors,[]);console.log('PASS: menu fixes; lessons 1–5 engine outcomes, failures, control requirements, placement, early black, persistence, trophy, future lesson stability, career isolation, normal multiplayer tracking.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

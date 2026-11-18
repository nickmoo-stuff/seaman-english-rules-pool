const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const c=await b.newContext(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8001/',{waitUntil:'networkidle'});
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 assert(await p.evaluate(async()=>{const cache=await caches.open(`seamen-pwa-v${APP_VERSION.replaceAll('.','')}-b${APP_BUILD_NUMBER}`);return (await Promise.all(['spin-physics.js','layout.js','layout.css','theatre.js','supporter.js'].map(path=>cache.match(new URL(path,location.href).href)))).every(Boolean);}));
 const expectedBuild=await p.evaluate(()=>APP_BUILD_NUMBER); await c.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof SeamenSpinPhysics==='object'&&typeof SeamenTheatre==='object');
 assert.equal(await p.evaluate(()=>APP_BUILD_NUMBER),expectedBuild);await p.locator('#enterTavern').click();await p.waitForTimeout(2700);assert.equal(await p.locator('#storyProgressReminder').textContent(),await p.evaluate(()=>STORY_REMINDERS.chapter1));await p.locator('#titleLocalMultiplayer').click();await p.getByRole('button',{name:'Start game',exact:true}).click();await p.locator('#confirmCue').click();await p.locator('#headerLayoutControl [data-gameplay-layout=landscape]').click();await p.waitForFunction(()=>document.getElementById('pwaNotice').parentElement.id==='landscapeLast');assert.equal(await p.evaluate(()=>document.documentElement.dataset.gameplayLayout),'landscape');await p.locator('#helmCueBall').dblclick({delay:80});
 assert(await p.evaluate(()=>helmSpinMode));await p.locator('[data-spin="Backspin"]').click();assert.equal(await p.evaluate(()=>selectedSpin.y),.65);
 assert.deepEqual(errors,[]);console.log('PASS cached offline startup: current build, spin/layout modules, local frame and spin controls');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict');const {chromium}=require('playwright');
const base='http://127.0.0.1:8022/pool/',control='http://127.0.0.1:8022/__control';
const set=async(build,fault)=>{const r=await fetch(control+'?build='+build+(fault?'&fault='+encodeURIComponent(fault):''),{method:'POST'});assert(r.ok);};
async function boot(p){if(await p.locator('#enterTavern').isVisible()){await p.locator('#enterTavern').click();await p.waitForTimeout(2700);}}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 // Real old worker, origin, storage and app. Only the local server changes its deployment.
 await set('old');const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await boot(p);assert.equal(await p.evaluate(()=>APP_VERSION),'0.17.0');
 const before=await p.evaluate(()=>{career.framesPlayed=19;career.framesWon=11;career.shotsTaken=177;career.piratesDefeated['1']=true;career.chapters.chapter_1.completed=true;career.blackballEndingSeen=true;career.unlockedCosmetics.push('cues:dave');saveCareer();equippedCue='dave';localStorage.setItem('seamenCue','dave');const volume=document.getElementById('masterVolume');volume.value='37';volume.dispatchEvent(new Event('input',{bubbles:true}));localStorage.setItem('seamenEntitlements',JSON.stringify({schema:1,owned:{supporter_founder_test:true}}));return {save:collectPortableSave(),career:JSON.parse(JSON.stringify(career))};});
 await context.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof APP_VERSION!=='undefined');assert.equal(await p.evaluate(()=>APP_VERSION),'0.17.0');await context.setOffline(false);await boot(p);
 await p.locator('#titlePlay').click();await p.locator('#localMode').click();await p.getByRole('button',{name:'Start game',exact:true}).click();
 const match=await p.evaluate(()=>JSON.stringify({balls,state}));
 await set('new');await p.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
 await p.waitForFunction(()=>!document.getElementById('pwaNotice').hidden&&document.getElementById('pwaNoticeAction').textContent==='Restart game',null,{timeout:45000});
 assert.equal(await p.evaluate(()=>APP_VERSION),'0.17.0','no forced reload during active frame');assert.equal(await p.evaluate(()=>JSON.stringify({balls,state})),match,'old frame stays intact');
 await p.locator('#pwaNoticeAction').click();await p.waitForURL('**/releases/v0.17.52-b1582/',{timeout:45000});await p.waitForFunction(()=>typeof APP_VERSION!=='undefined');assert.equal(await p.evaluate(()=>APP_VERSION),'0.17.52');assert.equal(await p.evaluate(()=>APP_BUILD_NUMBER),1582);assert.equal(await p.evaluate(()=>BUILD_MODE),'release');
 assert.equal(await p.evaluate(()=>typeof Capacitor),'undefined');assert(!await p.evaluate(()=>SeamenSupporter.hasVerifiedOwnership()));assert(!await p.evaluate(()=>hasEntitlement('supporter_founder_test')));assert(!await p.evaluate(()=>SeamenSupporter.canCheck()));
 for(const key of ['framesPlayed','framesWon','shotsTaken'])assert.deepEqual(await p.evaluate(key=>career[key],key),before.career[key],key+' preserved');
 for(const key of ['earnedAchievements','unlockedCosmetics']){const current=await p.evaluate(key=>career[key],key);assert(before.career[key].every(value=>current.includes(value)),key+' preserved; legitimate evidence reconciliation may add missing rewards');}
 assert.equal(await p.evaluate(()=>localStorage.getItem('seamenCue')),'dave');assert.equal(await p.locator('#masterVolume').inputValue(),'37','audio preference retained');
 assert(await p.evaluate(()=>career.chapters.chapter_1.completed));
 assert(await p.evaluate(async()=>{const keys=await caches.keys();return keys.includes('seamen-pwa-v0170-b1530')&&keys.some(x=>x.startsWith('seamen-browser-v0.17.52-b1582-'));}),'previous cache retained');
 await p.evaluate(save=>applyPortableSave(save),before.save);await p.reload({waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>career.framesPlayed),19,'old exported save imports');
 await context.setOffline(true);await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForURL('**/releases/v0.17.52-b1582/',{timeout:15000});await p.waitForFunction(()=>typeof APP_VERSION!=='undefined');assert.equal(await p.evaluate(()=>APP_VERSION),'0.17.52');await boot(p);
 await p.locator('#titleLocalMultiplayer').click();await p.getByRole('button',{name:'Start game',exact:true}).click();await p.locator('#confirmCue').click();await p.locator('#shoot').click();await p.waitForFunction(()=>!moving&&playHistory.length>0,null,{timeout:20000});
 const manifest=await p.evaluate(async()=>{const r=await fetch('../../manifest.webmanifest');return r.json();});assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
 assert.deepEqual(errors,[]);await context.close();console.log('PASS actual v0.17.0 worker/cache -> ready notification, preserved active frame, explicit restart, v0.17.52 import/migration, no native/ownership dependency, scoped root offline restart and real frame');
 // Interrupted deployment: integrity mismatch must not activate a partial build or purge old caches.
 await set('old');const broken=await browser.newContext(),q=await broken.newPage();await q.goto(base,{waitUntil:'networkidle'});await q.evaluate(()=>navigator.serviceWorker.ready);await q.waitForFunction(()=>!!navigator.serviceWorker.controller);await boot(q);
 await q.evaluate(()=>{career.framesPlayed=7;saveCareer();});
 await set('new','releases/v0.17.52-b1582/supporter.js');
 await q.goto(base,{waitUntil:'domcontentloaded'});await q.locator('#previous').waitFor({state:'visible',timeout:45000});
 assert((await q.locator('#status').textContent()).includes('complete update could not be prepared'));
 assert(await q.evaluate(async()=>!(await caches.keys()).some(x=>x.startsWith('seamen-browser-v0.17.52-b1582-'))),'incomplete cache removed');
 await broken.setOffline(true);await q.locator('#previous').click();await q.waitForFunction(()=>typeof APP_VERSION!=='undefined'&&APP_VERSION==='0.17.0');assert.equal(await q.evaluate(()=>career.framesPlayed),7,'old cached fallback keeps save');
 await broken.setOffline(false);await set('new');await q.goto(base,{waitUntil:'domcontentloaded'});await q.waitForURL('**/releases/v0.17.52-b1582/',{timeout:25000}).catch(async error=>{console.log('RECOVERY STATE',await q.evaluate(async()=>({status:document.getElementById('status')?.textContent,url:location.href,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({active:r.active?.state,installing:r.installing?.state,waiting:r.waiting?.state})),caches:await caches.keys()})));throw error;});await q.waitForFunction(()=>typeof APP_VERSION!=='undefined');assert.equal(await q.evaluate(()=>career.framesPlayed),7,'recovery after complete deployment');await broken.close();
 console.log('PASS hash-mismatched partial deployment rejected, old offline game/save recoverable, complete retry recovers');
}finally{await set('new');await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

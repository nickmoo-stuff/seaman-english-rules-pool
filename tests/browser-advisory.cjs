// UA/capability fixtures run in Chromium; these are not real Safari/Firefox/Edge executions.
const assert=require('node:assert/strict'),{chromium,devices}=require('playwright');
const url='http://127.0.0.1:8020/releases/v0.17.52-b1582/';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
const android='Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const desktop='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const cases=[['Safari iPhone',iphone,false],['Safari iPad desktop UA','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15',false],['Chrome Android',android,false],['Chrome desktop',desktop,false],['Edge desktop',desktop+' Edg/130.0.0.0',false],['Edge Android',android+' EdgA/130.0.0.0',false],['Edge iOS',iphone+' EdgiOS/130.0',false],['Chrome iOS',iphone.replace('Version/17.6','CriOS/130.0'),false],['Firefox desktop','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',false],['Firefox iOS',iphone+' FxiOS/132.0',false],['Messenger iOS',iphone+' [FBAN/MessengerForiOS;FBAV/480.0]',true],['Messenger Android',android+' [FB_IAB/Orca-Android;FBAV/480.0;]',true],['Facebook',iphone+' [FBAN/FBIOS;FBAV/480.0]',true],['Instagram',android+' Instagram 350.0',true],['LINE',iphone+' Line/14.0',true],['Snapchat',iphone+' Snapchat/13.0',true],['TikTok',iphone+' BytedanceWebview TikTok/35.0',true],['Android WebView',android.replace('Android 14;','Android 14; wv;'),true],['missing pointer capability',iphone,true,'missing'],['native Android WebView',android+' wv',false,'native']];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [name,userAgent,warn,fixture] of cases){
  const p=await b.newPage({userAgent,viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(fixture==='missing')await p.addInitScript(()=>{delete window.PointerEvent;});
  if(fixture==='native')await p.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',isPluginAvailable:()=>false};});
  await p.goto(url,{waitUntil:'networkidle'});assert.equal(await p.locator('#browserWarning').evaluate(el=>!el.hidden),warn,name);
  const before=await p.evaluate(()=>JSON.stringify(collectStorage()));await p.evaluate(()=>detectUnsupportedBrowser());assert.equal(await p.evaluate(()=>JSON.stringify(collectStorage())),before);
  assert.equal(await p.locator('#browserWarning').evaluate(el=>el.tagName),'P','advisory remains non-modal');assert.deepEqual(errors,[]);await p.close();console.log('PASS advisory UA/capability fixture: '+name+' -> '+(warn?'advisory':'no advisory'));
 }
 for(const [width,height] of [[390,844],[844,390]]){
  const p=await b.newPage({...devices['iPhone 13'],userAgent:iphone+' [FBAN/MessengerForiOS;]',viewport:{width,height},screen:{width,height},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,mobile:true,deviceScaleFactor:1,screenWidth:width,screenHeight:height,screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0}});
  await p.goto(url);await p.locator('#enterTavern').click();await p.waitForTimeout(2700);await p.locator('#titleLocalMultiplayer').click();await p.getByRole('button',{name:'Start game',exact:true}).click();
  assert(await p.locator('#browserWarning').isVisible());const text=await p.locator('#browserWarning').textContent();assert(text.includes('You can keep playing here')&&text.includes('Export your save'));
  const before=await p.evaluate(()=>career.shotsTaken);await p.locator('#confirmCue').click();await p.locator('#shoot').click();await p.waitForFunction(()=>!moving&&playHistory.length>0,null,{timeout:20000});assert.equal(await p.evaluate(()=>career.shotsTaken),before+1);await p.reload();assert.equal(await p.evaluate(()=>career.shotsTaken),before+1);assert.deepEqual(errors,[]);await p.close();
  console.log(`PASS Messenger advisory ${width}x${height}: visible non-modal text, placement/shot usable, normal statistics/save retained across reload`);
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

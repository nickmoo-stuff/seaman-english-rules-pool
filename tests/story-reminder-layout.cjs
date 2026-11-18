const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,devices}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8007/';
const out=process.env.TEST_ARTIFACT_DIR||'/tmp/seamen-story-reminder';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [w,h,mobile,scale] of [[1366,768,false,1],[1920,1080,false,1],[320,568,true,1],[390,844,true,1],[740,360,true,1],[855,384,true,1],[390,844,true,2]]){
  const p=await b.newPage({...mobile?devices['Pixel 7']:{},viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(url,{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
  // User text-size override: exercise wrapping and scrolling with every approved message.
  if(scale===2)await p.addStyleTag({content:'.story-progress-reminder{font-size:26px!important}'});
  const texts=await p.evaluate(()=>Object.values(STORY_REMINDERS));
  for(let i=0;i<texts.length;i++){
   await p.locator('#storyProgressReminder').evaluate((el,text)=>el.textContent=text,texts[i]);await p.locator('.story-progress-summary').scrollIntoViewIfNeeded();
   const g=await p.evaluate(()=>{
    const el=document.getElementById('storyProgressReminder'),play=document.getElementById('titlePlay'),card=document.querySelector('.title-menu-card'),r=el.getBoundingClientRect(),pr=play.getBoundingClientRect(),s=getComputedStyle(el),heading=document.getElementById('storyProgressHeading'),hr=heading.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(el);const lines=[...range.getClientRects()].map(r=>({x:r.x,right:r.right,top:r.top,bottom:r.bottom}));
    const rgb=x=>x.match(/\d+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}),lum=x=>{const v=rgb(x);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
    const a=lum(s.color),z=lum(getComputedStyle(el.parentElement).backgroundColor);
    return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,cardWidth:card.clientWidth,cardScroll:card.scrollWidth,ownHeight:el.clientHeight,ownScroll:el.scrollHeight,ownWidth:el.clientWidth,ownScrollWidth:el.scrollWidth,r:{x:r.x,right:r.right,top:r.top,bottom:r.bottom},playTop:pr.top,lines,contrast:(Math.max(a,z)+.05)/(Math.min(a,z)+.05),heading:heading.textContent,headingTop:hr.top,headingBottom:hr.bottom,headingWeight:Number(getComputedStyle(heading).fontWeight),messageWeight:Number(s.fontWeight),next:el.parentElement.nextElementSibling.id,tag:el.tagName,tabIndex:el.tabIndex,role:el.getAttribute('role'),description:play.getAttribute('aria-describedby')};
   });
   assert.equal(g.heading,'Current story mode progress:');assert(g.headingWeight>g.messageWeight,'heading has stronger weight');assert(g.headingTop>=0&&g.headingBottom<=g.r.top,'heading stays visible above every message');assert.equal(g.next,'titlePlay');assert.equal(g.tag,'P');assert.equal(g.tabIndex,-1);assert.equal(g.role,'status');assert.equal(g.description,'storyProgressReminder');
   assert(g.pageWidth<=g.width+1&&g.cardScroll<=g.cardWidth+1,`no horizontal scroll: ${w} ${JSON.stringify(g)}`);
   assert(g.ownScroll<=g.ownHeight+1&&g.ownScrollWidth<=g.ownWidth+1,'no clipped copy');assert(g.r.x>=0&&g.r.right<=w+1,'paragraph fits viewport');
   assert(g.r.top>=0&&g.r.bottom<=h+1,`reminder is vertically reachable: ${w}x${h} ${JSON.stringify(g.r)}`);
   assert(g.r.bottom<=g.playTop+1,'reminder does not overlap Play');assert(g.contrast>=4.5,'WCAG normal text contrast');
   for(const line of g.lines)assert(line.x>=g.r.x&&line.right<=g.r.right+1&&line.top>=g.r.top&&line.bottom<=g.r.bottom+1,'all text remains within paragraph');
  }
  await p.evaluate(()=>renderStoryReminder());await p.locator('.story-progress-summary').scrollIntoViewIfNeeded();
  if(scale===1&&[1366,390,855].includes(w))await p.screenshot({path:`${out}/menu-${w}x${h}.png`});
  // Existing buttons must remain keyboard reachable and tappable after the added copy.
  await p.locator('#titlePlay').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'titleLocalMultiplayer');
  await p.locator('#titleLocalMultiplayer').click();await p.getByRole('button',{name:'Start game',exact:true}).click();assert(await p.locator('#gameApp').isVisible());assert(await p.locator('#storyProgressReminder').isHidden());
  await p.evaluate(()=>showTitleScreen());await p.evaluate(()=>{chapterState('chapter_1').introSeen=true;saveCareer();});await p.locator('#titlePlay').click();assert(await p.locator('#piratePlaceholder').isVisible());assert(await p.locator('#storyProgressReminder').isHidden());await p.locator('#pirateBack').click();assert(await p.locator('#storyProgressReminder').isVisible());
  assert.deepEqual(errors,[]);console.log(`PASS menu ${w}x${h}, text ${scale*100}%: all seven messages wrap without clipping/overlap/horizontal scrolling, contrast, keyboard order, local/story navigation`);await p.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

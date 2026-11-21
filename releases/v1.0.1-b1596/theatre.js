/* K3D.1: readiness and opaque handoffs for the existing Theatre. No story data. */
(function(){
 'use strict';
 const assets=new Map(),failed=new Set();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function load(src,fresh=false){
  if(!src)return Promise.resolve({src,ok:true});
  if(fresh||failed.has(new URL(src,location.href).href))assets.delete(src);
  if(assets.has(src))return assets.get(src);
  const promise=new Promise(resolve=>{
   const img=new Image();let settled=false,decoding=false;
   const finish=ok=>{if(settled)return;settled=true;clearTimeout(timeout);img.onload=img.onerror=null;if(ok)failed.delete(new URL(src,location.href).href);else failed.add(new URL(src,location.href).href);resolve({src,ok});};
   const loaded=async()=>{if(settled||decoding)return;decoding=true;let ok=img.naturalWidth>0;if(ok&&img.decode)try{await img.decode();}catch(_){ok=false;}finish(ok);};
   // A network/decoder deadline is a failure path, never the reveal condition.
   const timeout=setTimeout(()=>finish(false),15000);
   img.onload=loaded;img.onerror=()=>finish(false);img.src=src;
   if(img.complete){if(img.naturalWidth)loaded();else finish(false);}
  });
  assets.set(src,promise);return promise;
 }
 function sources(scene){return [...new Set(Object.values(scene?.assets||{}).flatMap(group=>Object.values(group).map(def=>def.src).filter(Boolean)))];}
 async function prepare(scenes){
  const urls=[...new Set(scenes.flatMap(sources))];for(const src of urls)if(failed.has(new URL(src,location.href).href))assets.delete(src);
  const results=await Promise.all(urls.map(src=>load(src)));return results.filter(result=>!result.ok);
 }
 function cover(className=''){
  const el=document.createElement('div');el.className='scene-handoff-cover '+className;el.style.transition='none';el.style.opacity='1';el.setAttribute('aria-hidden','true');document.body.append(el);return el;
 }
 function paint(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
 function fade(el,opacity,duration){
  duration=reduced()?0:Math.max(0,duration);
  if(!duration){el.style.transition='none';el.style.opacity=String(opacity);return Promise.resolve();}
  return new Promise(resolve=>{
   let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);el.removeEventListener('transitionend',onEnd);el.removeEventListener('transitioncancel',finish);el.style.transition='none';el.style.opacity=String(opacity);resolve();};
   const onEnd=e=>{if(e.target===el&&e.propertyName==='opacity')finish();};
   el.addEventListener('transitionend',onEnd);el.addEventListener('transitioncancel',finish);
   // Animation fallback for suspended tabs/engines which omit transitionend.
   const timer=setTimeout(finish,duration+100);
   void el.offsetWidth;el.style.transition=`opacity ${duration}ms ease`;el.style.opacity=String(opacity);
  });
 }
 async function reveal(el,duration=0){await fade(el,0,duration);el.remove();}
 function readyElement(img){
  const src=img.src||img.currentSrc;
  return new Promise(resolve=>{
   let done=false,decoding=false;
   const finish=ok=>{if(done)return;done=true;clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',error);if(!ok){img.hidden=true;failed.add(new URL(src,location.href).href);}resolve({src,ok});};
   const loaded=async()=>{if(done||decoding)return;decoding=true;let ok=img.naturalWidth>0;if(ok&&img.decode)try{await img.decode();}catch(_){ok=false;}finish(ok);};
   const error=()=>finish(false),timer=setTimeout(error,15000);
   img.addEventListener('load',loaded);img.addEventListener('error',error);
   if(img.complete)loaded();
  });
 }
 async function destination(root=document){
  const urls=new Set(),images=[];for(const el of root.querySelectorAll('*')){
   if(!el.getClientRects().length)continue;
   if(el.tagName==='IMG'&&(el.currentSrc||el.src))images.push(readyElement(el));
   const bg=getComputedStyle(el).backgroundImage;for(const match of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g))urls.add(match[1]);
  }
  const results=await Promise.all([...images,...[...urls].map(src=>load(src,true))]);if(document.fonts?.ready)await document.fonts.ready;await paint();return results.filter(result=>!result.ok);
 }
 window.SeamenTheatre=Object.freeze({load,prepare,cover,fade,reveal,paint,destination,failed:src=>failed.has(new URL(src,location.href).href)});
})();

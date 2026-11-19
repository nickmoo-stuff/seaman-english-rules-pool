/* K3I.2: immutable, hash-verified browser bundle. No independently updated runtime files. */
importScripts('./releases/v1.0.1-b1596/pwa-manifest.js');
const BUILD=self.SEAMEN_BUILD,CACHE=BUILD.cache,ROOT=self.registration.scope;
const urls=new Set(BUILD.files.map(([path])=>new URL(path,ROOT).href));
async function verified(response,expected){
 if(!response?.ok||response.type==='opaque')throw Error('Missing release resource');
 const bytes=await response.clone().arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==expected)throw Error('Incomplete or mismatched release');
 return response;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const existed=(await caches.keys()).includes(CACHE),cache=await caches.open(CACHE);
 try{
  // Sequential batches bound memory/network pressure on mobile devices.
  for(let i=0;i<BUILD.files.length;i+=4)await Promise.all(BUILD.files.slice(i,i+4).map(async([path,hash])=>{
   const url=new URL(path,ROOT).href;
   await cache.put(url,await verified(await fetch(url,{cache:'no-store'}),hash));
  }));
  // Only a complete build can replace the worker. Old loaded frames are not reloaded.
  await self.skipWaiting();
 }catch(error){if(!existed)await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type==='SEAMEN_ACTIVATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='SEAMEN_BUILD')event.ports[0]?.postMessage({build:BUILD.id});
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const canonical=new URL(url.pathname, url.origin).href;
 // Old immutable games remain running until the player explicitly reloads.
 // Their Restart action reloads the old URL: route that navigation to the launcher,
 // never reload an existing client or mix its runtime files with the new release.
 const relative=url.pathname.slice(new URL(ROOT).pathname.length);
 if(request.mode==='navigate'&&url.pathname.startsWith(new URL(ROOT).pathname)&&
    /^releases\/v[^/]+\/(?:index\.html)?$/.test(relative)&&
    !relative.startsWith('releases/'+BUILD.id+'/')){
  event.respondWith(Promise.resolve(Response.redirect(ROOT,302)));return;
 }

 if(urls.has(canonical)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE),cached=await cache.match(canonical);
   if(cached)return cached;
   // Never fall back to unrelated HTML or another build's JavaScript.
   const entry=BUILD.files.find(([path])=>new URL(path,ROOT).href===canonical);
   try{const response=await verified(await fetch(canonical,{cache:'no-store'}),entry[1]);await cache.put(canonical,response.clone());return response;}
   catch(_){return new Response('This release file is unavailable. Reconnect and restart the game.',{status:503,headers:{'Content-Type':'text/plain'}});}
  })());return;
 }
 // Directory index aliases must resolve to this same verified build.
 if(url.pathname===new URL('releases/'+BUILD.id+'/',ROOT).pathname){
  event.respondWith(caches.open(CACHE).then(c=>c.match(new URL('releases/'+BUILD.id+'/index.html',ROOT).href)));return;
 }
 // Old active frames keep their old URLs, cache and source assets. No cache or
 // user data is purged on upgrade; music keeps the established network-only policy.
 if(!url.pathname.includes('/assets/music/')&&!url.pathname.startsWith(new URL('releases/'+BUILD.id+'/',ROOT).pathname)){
  event.respondWith((async()=>{
   for(const name of await caches.keys()){
    if(name===CACHE||!name.startsWith('seamen-'))continue;
    const response=await (await caches.open(name)).match(request,{ignoreSearch:true});if(response)return response;
   }
   return fetch(request);
  })());
 }
});

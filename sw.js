const CACHE='nanairo-drops-v10';
const VERSIONED=['./','./index.html','./styles.css?v=10','./title.css?v=10','./map.css?v=10','./app.js?v=10','./title-layout.js?v=10','./title-screen.js?v=10','./map.js?v=10','./progress.js?v=10','./game-touch.js?v=10','./viewport.js?v=10','./viewport-debug.js?v=10','./viewport-debug.css?v=10'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const response=await fetch('./precache.json',{cache:'reload'});if(!response.ok)throw Error('Offline manifest unavailable');
  const files=[...new Set([...await response.json(),...VERSIONED])];const cache=await caches.open(CACHE);
  await cache.addAll(files.map(url=>new Request(url,{cache:'reload'})));await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nanairo-drops-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(new Request(event.request,{cache:'no-cache'})).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response;
  }).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});

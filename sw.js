const CACHE = 'nanairo-drops-v6';
const FILES = ['./','./index.html','./styles.css?v=6','./title.css?v=6','./app.js?v=6','./title-layout.js?v=6','./title-screen.js?v=6','./game-touch.js?v=5','./manifest.webmanifest','./assets/title-complete.png','./assets/start-button.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Never seed a new version from the HTTP cache.
  await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nanairo-drops-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(new Request(event.request,{cache:'no-cache'})).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(async()=> (await caches.match(event.request)) || (event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});

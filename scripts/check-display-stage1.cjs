const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs');const assert=require('node:assert/strict');
const release=fs.readdirSync('dist/display-check').find(n=>n.startsWith('s1-'));
const base=process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/';
(async()=>{
 const html=fs.readFileSync(`dist/display-check/${release}/index.html`,'utf8');
 assert(!/<img|<dialog|\bimport\s|serviceWorker\.register|\.unregister\(|\.style\.|\b100(?:vh|svh|lvh|dvh)|viewport\.js/i.test(html));
 assert(!JSON.parse(fs.readFileSync('dist/precache.json')).some(p=>p.includes('/display-check/')));
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 for(const standalone of [false,true]){
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  if(standalone)await c.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
  const p=await c.newPage();await p.goto(`${base}display-check/${release}/`);
  await p.waitForFunction(()=>document.querySelector('#metrics').textContent.includes('ONLINE OK'));
  assert.equal(await p.locator('#surface').evaluate(e=>e.getBoundingClientRect().bottom),844);
  assert.equal(await p.locator('.edge.top').evaluate(e=>e.getBoundingClientRect().top),0);
  assert.equal(await p.locator('.edge.bottom').evaluate(e=>e.getBoundingClientRect().bottom),844);
  assert.equal(await p.evaluate(()=>visualViewport.scale),1);
  assert.equal((await p.evaluate(()=>navigator.serviceWorker.getRegistrations())).length,0);
  const m=await p.evaluate(async()=>await(await fetch('./manifest.webmanifest')).json());assert.equal(m.start_url,'./');assert.equal(m.scope,'./');assert.equal(m.display,'standalone');assert(!m.icons);
  if(process.env.SCREENSHOT_DIR)await p.screenshot({path:`${process.env.SCREENSHOT_DIR}/stage1-${standalone?'standalone-simulated':'browser'}.png`});
  await c.setOffline(true);await p.evaluate(()=>dispatchEvent(new Event('offline')));assert.match(await p.locator('#metrics').textContent(),/判定不可/);
  await p.setViewportSize({width:390,height:759});assert.equal(await p.locator('#surface').evaluate(e=>e.getBoundingClientRect().bottom),759);
  console.log('PASS minimal page, edge markers, no registration, standalone='+standalone);await c.close();
 }
 // A previously registered parent-scope worker must pass this path directly to network.
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();
 await p.goto(base);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await p.evaluate(async release=>{localStorage.setItem('stage1-save-sentinel','preserve');const c=await caches.open('unrelated-display-check-sentinel');await c.put('./sentinel',new Response('keep'));const game=await caches.open('nanairo-drops-v10');await game.put('./display-check/'+release+'/',new Response('OLD-CHECK-CACHE'));},release);
 await p.goto(`${base}display-check/${release}/`);await p.waitForFunction(()=>document.querySelector('#metrics').textContent.includes('SW経路分離確認済み'));
 const result=await p.evaluate(async()=>({save:localStorage.getItem('stage1-save-sentinel'),keys:await caches.keys(),registrations:(await navigator.serviceWorker.getRegistrations()).length,header:(await fetch('./fresh.json?test='+Math.random(),{cache:'no-store'})).headers.get('X-Nanairo-Check-Route')}));
 assert.equal(result.save,'preserve');assert(result.keys.includes('nanairo-drops-v10'));assert(result.keys.includes('unrelated-display-check-sentinel'));assert.equal(result.registrations,1);assert.equal(result.header,'network-only-v1');
 const cachePaths=await p.evaluate(async()=>{const cache=await caches.open('nanairo-drops-v10');return(await cache.keys()).map(r=>r.url)});assert.equal(cachePaths.filter(url=>url.includes(release)).length,1);assert(!(await p.content()).includes('OLD-CHECK-CACHE'));assert.equal(await p.locator('#surface').count(),1);
 await c.setOffline(true);await p.goto(`${base}display-check/${release}/`).then(()=>{throw Error('minimal page must not fall back to game/cache')},()=>{});
 assert.equal(await p.locator('#title-screen').count(),0);
 const restored=await c.newPage();await restored.goto(base);await restored.locator('#title-screen').waitFor({state:'visible'});assert.equal(await restored.evaluate(()=>localStorage.getItem('stage1-save-sentinel')),'preserve');
 console.log('PASS parent SW network-only route, no game fallback, no cache/storage clearing');await c.close();await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

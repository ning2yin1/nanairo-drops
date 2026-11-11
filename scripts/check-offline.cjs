const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 const ctx=await b.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true});await ctx.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));const p=await ctx.newPage();
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/');
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller,{},{timeout:60000});
 assert((await p.evaluate(()=>caches.keys())).includes('nanairo-drops-v10'));
 await p.waitForTimeout(500);
 await ctx.setOffline(true);await p.reload();await p.locator('#start img').evaluate(i=>i.decode());
 await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
 await p.locator('.map-background').evaluateAll(async images=>{for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode()))});
 assert.equal(await p.locator('.stage-pin').count(),50);assert.equal(await p.locator('#coin-count').textContent(),'0');
 await p.locator('[data-stage="1"]').tap();await p.locator('#game-dialog form button').tap();
 await p.locator('#map-home').tap();await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
 await p.locator('#settings').tap();await p.locator('#open-viewport-debug').tap();await p.locator('#viewport-debug [data-copy]:enabled').waitFor();
 const report=JSON.parse(await p.locator('#viewport-debug textarea').inputValue());assert.equal(report.mode.standalone,true);assert.match(report.build,/^v10-/);assert.equal(report.settings.manifest.value.display,'standalone');await p.locator('#viewport-debug [data-close]').tap();
 console.log('PASS offline PWA diagnostic panel and manifest; TOP, all five backgrounds, 50 pins, JSON, stage dialog and TOP/map round trip');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

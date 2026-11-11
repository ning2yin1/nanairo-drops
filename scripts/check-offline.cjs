const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 const ctx=await b.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true});const p=await ctx.newPage();
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/');
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller,{},{timeout:60000});
 assert((await p.evaluate(()=>caches.keys())).includes('nanairo-drops-v8'));
 await p.waitForTimeout(500);
 await ctx.setOffline(true);await p.reload();await p.locator('#start img').evaluate(i=>i.decode());
 await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
 await p.locator('.map-background').evaluateAll(async images=>{for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode()))});
 assert.equal(await p.locator('.stage-pin').count(),50);assert.equal(await p.locator('#coin-count').textContent(),'0');
 await p.locator('[data-stage="1"]').tap();await p.locator('#game-dialog button').tap();
 await p.locator('#map-home').tap();await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
 console.log('PASS offline TOP, all five backgrounds, 50 pins, JSON, stage dialog and TOP/map round trip');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

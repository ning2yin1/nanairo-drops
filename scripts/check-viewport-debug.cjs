const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});
 await context.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?debugViewport=1');await page.locator('#viewport-debug[open]').waitFor();
 const textarea=page.locator('#viewport-debug textarea');await page.waitForFunction(()=>{const t=document.querySelector('#viewport-debug textarea');return t?.value.includes('diagnosticVersion')});
 await page.addStyleTag({content:'[data-viewport-safe-probe]{padding-top:47px!important;padding-bottom:34px!important}'});
 await page.locator('[data-refresh]').tap();await page.waitForFunction(()=>JSON.parse(document.querySelector('#viewport-debug textarea').value).safeArea.top===47);
 const report=JSON.parse(await textarea.inputValue());
 assert.match(report.build,/^v9-[a-f0-9]{12}$/);assert.equal(report.mode.standalone,true);assert.equal(report.window.innerHeight,844);assert.equal(report.safeArea.top,47);
 assert.equal(report.comparison47.values.find(v=>v.label==='safe-area-inset-top').matches47,true);
 for(const u of ['100vh','100svh','100lvh','100dvh'])assert.equal(report.viewportUnits[u].height,844);
 for(const e of ['html','body','root','currentScreen']){assert.equal(typeof report.elements[e].rect.bottom,'number');assert(report.elements[e].computed.padding);assert(report.elements[e].computed.margin);assert('maxHeight' in report.elements[e].computed)}
 assert.match(report.settings.viewport,/viewport-fit=cover/);assert.equal(report.settings.statusBarStyle,'black-translucent');assert.equal(report.settings.manifest.value.display,'standalone');
 await page.locator('[data-copy]').tap();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await textarea.inputValue());
 const rootBefore=await page.locator('main').boundingBox();const artBefore=await page.locator('.title-art').boundingBox();
 for(const target of ['html','body','root','screen']){
  const selector={html:'html',body:'body',root:'main',screen:'#title-screen'}[target];
  const old=await page.locator(selector).evaluate(e=>e.style.getPropertyValue('background-color'));
  await page.locator('[data-target]').selectOption(target);await page.locator('[data-apply]').tap();
  assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 0, 255)');
  assert.deepEqual(await page.locator('main').boundingBox(),rootBefore);assert.deepEqual(await page.locator('.title-art').boundingBox(),artBefore);
  await page.locator('[data-restore]').tap();assert.equal(await page.locator(selector).evaluate(e=>e.style.getPropertyValue('background-color')),old);
 }
 await page.locator('[data-target]').selectOption('html');await page.locator('[data-apply]').tap();await page.locator('[data-collapse]').tap();
 assert.equal(await page.locator('.viewport-debug-content').isVisible(),false);await page.locator('[data-close]').tap();assert.equal(await page.locator('html').evaluate(e=>e.style.getPropertyValue('background-color')),'');
 assert.equal(await page.locator('#start').isEnabled(),true);
 console.log('PASS query open, all requested measurements, clipboard, 47 comparison, reversible colors, no layout mutation');
 await page.goto(base);assert.equal(await page.locator('#viewport-debug[open]').count(),0);
 const a=await page.locator('.title-art').boundingBox();const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+350*a.width/707,y:a.y+350*a.height/1536}]});
 await page.locator('#viewport-debug[open]').waitFor();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.locator('[data-close]').tap();await page.locator('#start').tap();await page.locator('#map-screen').waitFor({state:'visible'});
 await page.locator('#settings').tap();await page.locator('#open-viewport-debug').tap();await page.locator('#viewport-debug[open]').waitFor();
 await page.waitForFunction(()=>{const t=document.querySelector('#viewport-debug textarea');return t?.value&&JSON.parse(t.value).elements.currentScreen.id==='map-screen'});
 await page.locator('[data-target]').selectOption('scroll');await page.locator('[data-apply]').tap();assert.equal(await page.locator('.map-scroll').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 0, 255)');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.map-scroll').evaluate(e=>e.style.getPropertyValue('background-color')),'');
 assert.deepEqual(errors,[]);console.log('PASS normal launch hidden, PWA TOP long-press, map settings entry, map color and cancel restore');await context.close();
 const fallback=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await fallback.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:undefined});document.execCommand=()=>false});
 const p=await fallback.newPage();await p.goto(base+'?debugViewport=1');await p.locator('[data-copy]:enabled').waitFor();await p.locator('[data-copy]').tap();
 assert.match(await p.locator('.viewport-debug-status').textContent(),/自動コピーできません/);
 assert.equal(await p.locator('#viewport-debug textarea').evaluate(e=>e.readOnly&&e.selectionStart===0&&e.selectionEnd===e.value.length),true);
 console.log('PASS blocked clipboard -> selectable readonly report');await fallback.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 const results=[];
 for(const scenario of [
  {name:'browser',standalone:false,height:874,inset:0},
  {name:'standalone-short-visual',standalone:true,height:874,inset:34},
  {name:'standalone',standalone:true,height:874,inset:0},
  {name:'browser-short',standalone:false,height:759,inset:0}
 ]){
  const context=await browser.newContext({viewport:{width:402,height:scenario.height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(({standalone,inset})=>{
   Object.defineProperty(navigator,'standalone',{value:standalone});
   if(inset)Object.defineProperty(visualViewport,'height',{get:()=>innerHeight-inset});
  },scenario);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.addStyleTag({content:'#title-screen{--safe-top:62px;--safe-bottom:34px}.map-header{padding-top:62px}#locate-current{bottom:50px}'});
  const measure=()=>page.evaluate(async()=>{
   const m=await import('./viewport.js?v=10');m.syncViewport();return m.viewportDiagnostics();
  });
  await page.evaluate(async()=>{(await import('./title-screen.js?v=10')).fitTitle();await Promise.all([...document.querySelectorAll('#title-screen img')].map(i=>i.decode()))});
  const top=await measure();
  for(const selector of ['html','body','main','#title-screen'])assert.equal(top.elements[selector].bottom,scenario.height,selector);
  assert.equal(top.standalone,scenario.standalone);
  const cover=await page.locator('.title-art').boundingBox();assert(cover.y<=.1&&cover.y+cover.height>=scenario.height-.1);assert(Math.abs(cover.width/cover.height-707/1536)<.0001);
  if(process.env.SCREENSHOT_DIR&&['browser','standalone-short-visual'].includes(scenario.name))await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/top-${scenario.standalone?'pwa':'browser'}-402x874.png`});
  await page.locator('#start').tap();await page.locator('#map-screen').waitFor({state:'visible'});
  const scroll=page.locator('.map-scroll');await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);
  await page.locator('.map-background').last().evaluate(i=>i.decode());
  const map=await measure();
  for(const selector of ['main','#map-screen','.map-scroll'])assert.equal(map.elements[selector].bottom,scenario.height,selector);
  assert.equal(map.elements['.map-scroll'].paddingBottom,'0px');
  const image=await page.locator('.map-background').last().boundingBox();assert(Math.abs(image.y+image.height-scenario.height)<1,'last map image must reach the bottom');
  const locate=await page.locator('#locate-current').boundingBox();assert(locate.y+locate.height<=scenario.height-34);
  if(process.env.SCREENSHOT_DIR&&['browser','standalone-short-visual'].includes(scenario.name))await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/map-${scenario.standalone?'pwa':'browser'}-402x874.png`});
  await page.setViewportSize({width:402,height:667});
  await page.waitForFunction(()=>document.querySelector('main').getBoundingClientRect().bottom===667);
  assert.equal((await page.locator('#map-screen').boundingBox()).height,667);
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.locator('#map-home').tap();assert.equal((await page.locator('#title-screen').boundingBox()).height,667);
  assert.deepEqual(errors,[]);
  results.push({scenario,top,map});console.log('PASS root + screen bottoms, image coverage, safe controls, resize and resume:',scenario.name);
  await context.close();
 }
 if(process.env.METRICS_FILE)fs.writeFileSync(process.env.METRICS_FILE,JSON.stringify({environment:'Chromium mobile emulation; standalone flag and shortened visual viewport are simulated, not physical iOS readings',results},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});

// Numeric reproduction of supplied iPhone readings, not an actual zoomed iOS renderer.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 for(const standalone of [true,false]){
  const c=await b.newContext({viewport:{width:780,height:1594},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.addInitScript(value=>{Object.defineProperty(navigator,'standalone',{value});Object.defineProperty(screen,'width',{value:390});Object.defineProperty(screen,'height',{value:844});Object.defineProperty(visualViewport,'scale',{value:.5})},standalone);
  const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/');
  await p.addStyleTag({content:'[data-app-viewport-probe="vh"],[data-viewport-unit-probe="vh"],[data-viewport-unit-probe="lvh"]{height:1688px!important}'});
  await p.evaluate(async()=>{(await import('./viewport.js?v=10')).syncViewport()});
  const expected=standalone?1688:1594;
  assert.equal((await p.locator('main').boundingBox()).height,expected);assert.equal((await p.locator('#title-screen').boundingBox()).height,expected);
  await p.evaluate(async()=>{(await import('./viewport-debug.js?v=10')).openViewportDebug()});
  await p.locator('#viewport-debug [data-copy]:enabled').waitFor();
  const report=JSON.parse(await p.locator('#viewport-debug textarea').inputValue());
  assert.equal(report.viewportUnits['100vh'].height,1688);assert.equal(report.viewportUnits['100dvh'].height,1594);
  assert.equal(report.elements.root.rect.height,expected);assert.equal(report.visualViewport.scale,.5);
  assert.equal(report.heightBasis,standalone?'100vh':'100dvh');
  assert.equal(report.screenProjection.elements.root.projectedBottomScreenCssPx,expected*.5);
  assert.equal(report.screenProjection.elements.root.screenHeightGapCssPx,standalone?0:47);
  assert.equal(report.scaleTimeline.beforeOpen.visualViewport.scale,.5);assert.equal(report.scaleTimeline.afterOpen.visualViewport.scale,.5);
  assert.equal(report.horizontalLayout.documentScrollWidth,780);
  await p.locator('#viewport-debug [data-close]').click();
  const art=await p.locator('.title-art').boundingBox();assert(art.y+art.height>=expected-.1);assert(Math.abs(art.width/art.height-707/1536)<.0001);
  await p.locator('#start').click();await p.locator('#map-screen').waitFor({state:'visible'});
  assert.equal((await p.locator('#map-screen').boundingBox()).height,expected);const scroll=await p.locator('.map-scroll').boundingBox();assert.equal(scroll.y+scroll.height,expected);
  assert.equal(await p.locator('.stage-pin').count(),50);assert.deepEqual(errors,[]);
  console.log('PASS independent viewport basis:',standalone?'standalone':'browser','vh=1688 dvh=1594 scale=.5 root='+expected+' projected='+expected*.5);await c.close();
 }await b.close();})().catch(e=>{console.error(e);process.exit(1)});

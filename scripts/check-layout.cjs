// Optional browser validation; requires Playwright and Chromium in the test environment.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 for(const [width,height,top,bottom] of [[402,874,62,34],[378,818,47,34],[402,759,0,0],[390,844,47,34],[375,667,20,0],[430,932,59,34],[320,568,20,0]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/nanairo-drops/');
  await page.addStyleTag({content:`#title-screen{--safe-top:${top}px;--safe-bottom:${bottom}px}`});
  await page.evaluate(async()=>{(await import('./title-screen.js?v=6')).fitTitle();await document.querySelector('.title-background').decode()});
  const result=await page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
   const img=document.querySelector('.title-background'),art=document.querySelector('.title-art').getBoundingClientRect(),button=document.querySelector('#start').getBoundingClientRect();
   return {root:box(document.querySelector('main')),screen:box(document.querySelector('#title-screen')),image:box(img),fit:getComputedStyle(img).objectFit,transform:getComputedStyle(img).transform,
    images:document.querySelectorAll('img[src$="title-complete.png"]').length,canvases:document.querySelectorAll('canvas').length,logoTop:art.y+258*art.width/707,logoLeft:art.x+48*art.width/707,logoRight:art.x+660*art.width/707,
    button:[button.x,button.y,button.right,button.bottom],scale:art.width/art.height,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
  });
  for(const key of ['screen','image'])assert.deepEqual(result[key],[0,0,width,height]);
  assert.equal(await page.locator('#start img').count(),0);
  assert.equal(await page.locator('#start').textContent(),'');
  assert.equal(result.images,1);assert.equal(result.canvases,0);assert.equal(result.fit,'cover');assert.equal(result.transform,'none');assert(Math.abs(result.scale-707/1536)<.0001);

  assert(result.logoTop>=top-.5 && result.logoLeft>=-.5 && result.logoRight<=width+.5);
  assert(result.button[0]>=-.5&&result.button[1]>=top-.5&&result.button[2]<=width+.5&&result.button[3]<=height-bottom+.5);
  assert.deepEqual(result.scroll,[width,height]);
  await page.locator('#start').tap();await page.locator('#back').waitFor({state:'visible'});await page.locator('#back').tap();
  await page.locator('#start').tap();await page.locator('#back').waitFor({state:'visible'});await page.locator('#back').tap();
  const cdp=await context.newCDPSession(page);
  for(const [from,to] of [[80,160],[160,40]]){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:width/2-from/2,y:220},{id:1,x:width/2+from/2,y:220}]});
   for(let i=1;i<=8;i++){const d=from+(to-from)*i/8;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:0,x:width/2-d/2,y:220},{id:1,x:width/2+d/2,y:220}]})}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.touchscreen.tap(width/2,200);await page.touchscreen.tap(width/2,200);
  assert.equal(await page.evaluate(()=>visualViewport.scale),1);assert.deepEqual(errors,[]);
  await page.setViewportSize({width,height:height-60});await page.waitForTimeout(100);
  assert.equal((await page.locator('#title-screen').boundingBox()).height,height-60);
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/title-${width}x${height}.png`});
  console.log('PASS',width,height,JSON.stringify(result));await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

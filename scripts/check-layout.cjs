// Run against a built /nanairo-drops/ deployment with Playwright + Chromium available.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync(new URL('../nanairo-map-assets/nanairo-map-assets/data/stage-positions.json',`file://${__filename}`)));
const base=process.env.TEST_URL||'http://127.0.0.1:5173/nanairo-drops/';
const shot=process.env.SCREENSHOT_DIR;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM,args:['--no-sandbox']}:{})});
 for(const [width,height,safeTop,safeBottom] of [[402,874,62,34],[375,667,20,0],[390,844,47,34]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});const p=await ctx.newPage();const errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
  await p.goto(base);await p.addStyleTag({content:`#title-screen{--safe-top:${safeTop}px;--safe-bottom:${safeBottom}px}`});
  await p.evaluate(async()=>{(await import('./title-screen.js?v=10')).fitTitle();await Promise.all([...document.querySelectorAll('#title-screen img')].map(i=>i.decode()))});
  const top=await p.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   return {screen:rect('#title-screen'),art:rect('.title-art'),bg:rect('.title-background'),button:rect('#start'),transform:getComputedStyle(document.querySelector('.title-background')).transform};
  });
  assert.equal(top.screen.width,width);assert.equal(top.screen.height,height);assert.equal(top.transform,'none');
  assert(top.art.x<=.1&&top.art.y<=.1&&top.art.right>=width-.1&&top.art.bottom>=height-.1);
  assert(Math.abs(top.art.width/top.art.height-707/1536)<.0001);
  assert(Math.abs(top.button.x-(top.art.x+36*top.art.width/707))<.1);
  assert(Math.abs(top.button.y-(top.art.y+1240*top.art.height/1536))<.1);
  assert(Math.abs(top.button.width-630*top.art.width/707)<.1);assert(top.button.bottom<=height-safeBottom+.1);
  if(width===402&&shot)await p.screenshot({path:`${shot}/top-402x874.png`});
  await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
  await p.waitForFunction(()=>document.querySelector('.map-scroll').scrollTop>0);
  assert.equal(await p.locator('.stage-pin').count(),50);assert.equal(await p.locator('.stage-pin.current').count(),1);assert.equal(await p.locator('.stage-pin.cleared').count(),0);assert.equal(await p.locator('.stage-pin:disabled').count(),49);
  assert.equal(await p.locator('#current-stage').textContent(),'1');assert.equal(await p.locator('#coin-count').textContent(),'0');
  assert.equal(await p.locator('.map-rabbit').count(),1);assert.equal(await p.locator('.sparkle').count(),1);
  const order=await p.locator('.map-area').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.area)));assert.deepEqual(order,data.tileOrderTopToBottom);
  const areas=await p.locator('.map-area').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {id:Number(n.dataset.area),x:r.x,y:r.y,w:r.width,h:r.height}}));
  for(let i=0;i<areas.length;i++){assert(Math.abs(areas[i].h-areas[i].w*2622/1206)<.1);if(i)assert(Math.abs(areas[i].y-(areas[i-1].y+areas[i-1].h))<.1)}
  for(const s of data.stages){
   const bounds=await p.locator(`[data-stage="${s.stage}"]`).boundingBox();const area=areas.find(a=>a.id===s.area);
   assert(Math.abs(bounds.x+bounds.width/2-area.x-area.w*s.x)<.1,`stage ${s.stage} x`);
   assert(Math.abs(bounds.y+bounds.height/2-area.y-area.h*s.y)<.1,`stage ${s.stage} y`);
   const number=await p.locator(`[data-stage="${s.stage}"] .stage-number`).boundingBox();
   assert(Math.abs(number.x+number.width/2-bounds.x-bounds.width/2)<.1);assert(Math.abs(number.y+number.height/2-bounds.y-bounds.height/2)<.1);
   assert.equal(await p.locator(`[data-stage="${s.stage}"] .difficulty`).count(),s.difficulty==='normal'?0:1);
  }
  const threeDigits=await p.evaluate(()=>{
    const pin=document.querySelector('.stage-pin').cloneNode(true);pin.removeAttribute('data-stage');pin.style.setProperty('--number-size',`${42/12.06}cqw`);
    pin.querySelector('.stage-number').textContent='100';document.querySelector('.map-area').append(pin);
    const n=pin.querySelector('.stage-number'),r=n.getBoundingClientRect(),b=pin.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(n);const ink=range.getBoundingClientRect();
    const result={offset:Math.abs(r.x+r.width/2-b.x-b.width/2),fits:ink.width<=b.width};pin.remove();return result;
  });assert(threeDigits.offset<.1&&threeDigits.fits);
  const saveBefore=await p.evaluate(()=>JSON.stringify({...localStorage}));
  await p.locator('[data-stage="2"]').evaluate(el=>el.click());assert.equal(await p.locator('#game-dialog').isVisible(),false);
  await p.locator('[data-stage="1"]').tap();await p.locator('#game-dialog').waitFor({state:'visible'});assert.match(await p.locator('#dialog-title').textContent(),/1/);await p.locator('#game-dialog form button').tap();
  assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),saveBefore);
  const headerBefore=await p.locator('.map-header').boundingBox();
  const scroller=p.locator('.map-scroll');const scrollBefore=await scroller.evaluate(e=>e.scrollTop);
  const cdp=await ctx.newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.85,y:height*.4}]});
  for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.85,y:height*(.4+i*.025)}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
  assert((await scroller.evaluate(e=>e.scrollTop))<scrollBefore,'native map scroll');
  await scroller.evaluate(e=>e.scrollTo(0,0));await p.locator('#locate-current').tap();
  await p.waitForFunction(()=>{const c=document.querySelector('[aria-current="step"]').getBoundingClientRect(),v=document.querySelector('.map-scroll').getBoundingClientRect();return c.top>=v.top&&c.bottom<=v.bottom});
  assert.deepEqual(await p.locator('.map-header').boundingBox(),headerBefore);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:width*.4,y:height*.4},{id:1,x:width*.6,y:height*.4}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:0,x:width*.2,y:height*.4},{id:1,x:width*.8,y:height*.4}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await p.evaluate(()=>visualViewport.scale),1);
  await p.locator('#settings').tap();await p.locator('#game-dialog form button').tap();
  if(width===402&&shot){await p.locator('.map-background').last().evaluate(i=>i.decode());await p.screenshot({path:`${shot}/map-402x874.png`})}
  if(width===402){
    await p.addStyleTag({content:'.map-header{padding-top:62px}#locate-current{bottom:50px}'});
    await p.locator('#locate-current').tap();
    await p.waitForFunction(()=>{const pin=document.querySelector('[aria-current="step"]').getBoundingClientRect(),head=document.querySelector('.map-header').getBoundingClientRect();return pin.top>=head.bottom&&pin.bottom<=innerHeight-34});
    assert.equal((await p.locator('.map-header-art').boundingBox()).y,62);
    if(shot)await p.screenshot({path:`${shot}/map-safe-area-402x874.png`});
  }
  await p.locator('#map-home').tap();assert(await p.locator('#title-screen').isVisible());await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);console.log('PASS TOP + 50 map positions, seams, native scroll, locate, dialogs, save unchanged:',width,height);await ctx.close();
 }
 // Use preview progress only inside a test context; production defaults stay 1 / 0.
 for(const current of [5,8,20]){
  const ctx=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const state={currentStage:current,coins:1200,clearedStages:Array.from({length:current-1},(_,i)=>i+1),future:{keep:true}};
  await ctx.addInitScript(value=>{localStorage.setItem('nanairo-drops-progress',JSON.stringify(value));localStorage.setItem('unrelated-save','keep')},state);
  const p=await ctx.newPage();await p.goto(base);await p.locator('#start').tap();await p.locator('#map-screen').waitFor({state:'visible'});
  assert.equal(await p.locator('#current-stage').textContent(),String(current));assert.equal(await p.locator('#coin-count').textContent(),'1,200');
  assert.equal(await p.locator('.cleared').count(),current-1);assert.equal(await p.locator('.map-rabbit').count(),1);
  const pin=p.locator(`[data-stage="${current}"]`);assert.equal(await pin.getAttribute('aria-current'),'step');
  if(current!==5)assert.equal(await pin.locator('.difficulty').count(),1);
  await p.waitForTimeout(100);await pin.tap();await p.locator('#game-dialog form button').tap();
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('nanairo-drops-progress'))),state);assert.equal(await p.evaluate(()=>localStorage.getItem('unrelated-save')),'keep');
  if(current===5&&shot){await p.locator('[data-area="1"] .map-background').evaluate(i=>i.decode());await p.screenshot({path:`${shot}/map-preview-stage5.png`})}
  console.log('PASS saved state + difficulty overlay:',current);await ctx.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

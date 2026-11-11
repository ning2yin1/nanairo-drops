import {readProgress,stageState} from './progress.js?v=7';
const base = new URL('./nanairo-map-assets/nanairo-map-assets/',import.meta.url);
const asset = path => new URL(path,base).href;
const screen = document.querySelector('#map-screen');
const scroller = screen.querySelector('.map-scroll');
const tiles = screen.querySelector('.map-tiles');
let data, loading, progress, onStage, width = 0;
function image(path, className='') {
  const img=document.createElement('img');img.src=asset(path);img.alt='';img.className=className;img.draggable=false;return img;
}
function place(element,x,y,w,h,sourceWidth=1206,sourceHeight=2622) {
  Object.assign(element.style,{left:`${x/sourceWidth*100}%`,top:`${y/sourceHeight*100}%`,width:`${w/sourceWidth*100}%`,height:`${h/sourceHeight*100}%`});
}
function makeStage(stage) {
  const status=stageState(stage.stage,progress);
  const pin=document.createElement('button');pin.type='button';pin.className=`stage-pin ${status}`;
  pin.dataset.stage=stage.stage;pin.dataset.difficulty=stage.difficulty;
  pin.style.left=`${stage.x*100}%`;pin.style.top=`${stage.y*100}%`;
  pin.style.width=`${data.assetScale.stageCanvasPx/stage.width*100}%`;
  pin.style.setProperty('--number-size',`${data.assetScale.numberFontSizePx[Math.min(String(stage.stage).length,3)]/12.06}cqw`);
  pin.disabled=status==='locked';
  pin.setAttribute('aria-label',`ステージ${stage.stage}・${{current:'現在地',cleared:'クリア済み',locked:'未解放'}[status]}${stage.difficulty==='hard'?'・ハード':stage.difficulty==='superHard'?'・スーパーハード':''}`);
  if(status==='current'){
    pin.setAttribute('aria-current','step');pin.append(image('ui/sparkle.png','stage-layer sparkle'));
  }
  if(stage.difficulty==='hard'||stage.difficulty==='superHard')pin.append(image(`stage-buttons/stage-${stage.difficulty==='hard'?'hard':'super-hard'}-frame.png`,'stage-layer difficulty'));
  pin.append(image(`stage-buttons/stage-${status}.png`,'stage-layer state'));
  const number=document.createElement('span');number.className='stage-number';number.textContent=stage.stage;pin.append(number);
  if(status==='locked'){
    const lock=image('stage-buttons/stage-lock-icon.png','stage-layer lock');
    lock.style.transform=`translate(${data.assetScale.lockOffsetXPx/192*100}%,${data.assetScale.lockOffsetYPx/192*100}%)`;
    pin.append(lock);
  }
  pin.addEventListener('click',()=>{if(stageState(stage.stage,readProgress())!=='locked')onStage(stage.stage)});
  return pin;
}
function render() {
  progress=readProgress();tiles.replaceChildren();
  screen.querySelector('#current-stage').textContent=progress.currentStage;
  screen.querySelector('#coin-count').textContent=progress.coins.toLocaleString('ja-JP');
  for(const id of data.tileOrderTopToBottom){
    const area=data.areas.find(area=>area.area===id);
    const tile=document.createElement('section');tile.className='map-area';tile.dataset.area=id;tile.setAttribute('aria-label',area.name);
    const bg=image(`backgrounds/${area.background}`,'map-background');bg.width=area.width;bg.height=area.height;bg.loading='lazy';tile.append(bg);
    const label=document.createElement('h2');label.className='area-label';label.textContent=area.name;
    place(label,area.label.xPx,area.label.yPx,area.label.widthPx,area.label.heightPx);
    label.style.fontSize=`${44*(area.label.heightPx/117)/12.06}cqw`;tile.append(label);
    for(const stage of data.stages.filter(stage=>stage.area===id)){
      tile.append(makeStage(stage));
      if(stageState(stage.stage,progress)==='current'){
        const r=data.assetScale.rabbit;const rabbit=image('characters/rabbit.png','map-rabbit');
        place(rabbit,Math.max(0,Math.min(stage.xPx+r.offsetXPx,1206-r.boxWidthPx)),stage.yPx+r.offsetYPx,r.boxWidthPx,r.boxHeightPx);tile.append(rabbit);
        const tag=document.createElement('span');tag.className='current-tag';tag.textContent='現在地';
        place(tag,stage.xPx-78,stage.yPx+108,156,54);tile.append(tag);
      }
    }
    tiles.append(tile);
  }
}
export async function initializeMap(callback) {
  onStage=callback;
  if(data)return;
  if(!loading)loading=fetch(asset('data/stage-positions.json')).then(response=>{
    if(!response.ok)throw Error('マップの配置情報を読み込めませんでした');return response.json();
  }).then(value=>{
    if(value.stages.length!==50||value.areas.length!==5)throw Error('マップの配置情報を確認してください');
    data=value;
  }).catch(error=>{loading=null;throw error});
  await loading;
}
export function locateCurrent(behavior='auto') {
  const current=tiles.querySelector('[aria-current="step"]');if(!current)return;
  const rect=current.getBoundingClientRect(), viewport=scroller.getBoundingClientRect();
  const target=scroller.scrollTop+rect.top-viewport.top+rect.height/2-scroller.clientHeight/2;
  scroller.scrollTo({top:Math.max(0,Math.min(target,scroller.scrollHeight-scroller.clientHeight)),behavior});
}
export function openMap() {
  render();screen.hidden=false;fitMap();
  requestAnimationFrame(()=>{locateCurrent();screen.querySelector('#map-heading').focus({preventScroll:true})});
}
function fitMap(){
  if(screen.hidden)return;
  screen.style.height=`${window.visualViewport?.height||window.innerHeight}px`;
  const next=scroller.clientWidth;if(next!==width){width=next;requestAnimationFrame(()=>locateCurrent())}
}
new ResizeObserver(fitMap).observe(scroller);
window.visualViewport?.addEventListener('resize',fitMap);
window.addEventListener('storage',()=>{if(!screen.hidden&&data){render();requestAnimationFrame(()=>locateCurrent())}});
screen.querySelector('#locate-current').addEventListener('click',()=>locateCurrent(matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'));

const DIAGNOSTIC_VERSION='viewport-diagnostics-v10';
let panel, output, summary, status, lastFocus, colorChange, manifestPromise;
let holdTimer, holdPoint;
let panelSession=null;
const meta=name=>document.querySelector(`meta[name="${name}"]`)?.content??null;
function currentScreen(){return document.querySelector('main > .screen:not([hidden])')}
function measureElement(element){
  if(!element)return null;
  const r=element.getBoundingClientRect(),s=getComputedStyle(element);
  return {tag:element.tagName.toLowerCase(),id:element.id||null,visible:element.getClientRects().length>0,
    rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height},
    computed:{display:s.display,position:s.position,boxSizing:s.boxSizing,width:s.width,minWidth:s.minWidth,maxWidth:s.maxWidth,zoom:s.zoom??null,transform:s.transform,overflowX:s.overflowX,overflowY:s.overflowY,height:s.height,minHeight:s.minHeight,maxHeight:s.maxHeight,
      padding:{top:s.paddingTop,right:s.paddingRight,bottom:s.paddingBottom,left:s.paddingLeft},
      margin:{top:s.marginTop,right:s.marginRight,bottom:s.marginBottom,left:s.marginLeft},
      backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage},
    inlineHeight:element.style.height||null,appHeightVariable:s.getPropertyValue('--app-height').trim()||null};
}
function measureProbes(){
  const safe=document.createElement('div');safe.dataset.viewportSafeProbe='';
  safe.style.cssText='position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.append(safe);const css=getComputedStyle(safe);
  const safeArea={top:parseFloat(css.paddingTop)||0,bottom:parseFloat(css.paddingBottom)||0};safe.remove();
  const viewportUnits={};
  for(const unit of ['vh','svh','lvh','dvh']){
    const supported=CSS.supports('height',`100${unit}`);
    const probe=document.createElement('div');probe.dataset.viewportUnitProbe=unit;probe.style.cssText=`position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none`;
    if(supported)document.body.append(probe);
    viewportUnits[`100${unit}`]={supported,height:supported?probe.getBoundingClientRect().height:null};probe.remove();
  }
  return {safeArea,viewportUnits};
}
function scaleSnapshot(label){
  const vv=window.visualViewport;
  const box=panel?.open?panel.getBoundingClientRect():null;
  return {viewportMeta:meta('viewport'),focusedElement:document.activeElement?.id||document.activeElement?.tagName||null,panelBounds:box?{left:box.left,right:box.right,width:box.width}:null,label,time:performance.now(),innerWidth,innerHeight,clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,
    visualViewport:vv?{width:vv.width,height:vv.height,scale:vv.scale,offsetTop:vv.offsetTop,offsetLeft:vv.offsetLeft}:null,
    documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
    screenToInnerWidthRatio:innerWidth?screen.width/innerWidth:null};
}
function widthAudit(){
  const viewportWidth=document.documentElement.clientWidth;
  const offenders=[],panelOffenders=[];
  for(const element of document.body.querySelectorAll('*')){
    if(!element.getClientRects().length)continue;
    const diagnostic=!!element.closest('#viewport-debug');
    const css=getComputedStyle(element);if(css.visibility==='hidden')continue;
    const r=element.getBoundingClientRect();if(r.left>=-1&&r.right<=viewportWidth+1)continue;
    const clippedBy=[];
    for(let parent=element.parentElement;parent;parent=parent.parentElement){if(['hidden','clip','auto','scroll'].includes(getComputedStyle(parent).overflowX))clippedBy.push(parent.id||parent.tagName.toLowerCase())}
    (diagnostic?panelOffenders:offenders).push({tag:element.tagName.toLowerCase(),id:element.id||null,className:element.className,left:r.left,right:r.right,width:r.width,
      computedWidth:css.width,minWidth:css.minWidth,maxWidth:css.maxWidth,zoom:css.zoom??null,transform:css.transform,clippedBy});
  }
  return {viewportWidth,documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,total:offenders.length,offenders:offenders.slice(0,30),diagnosticPanel:{element:measureElement(panel),overflowCount:panelOffenders.length,offenders:panelOffenders.slice(0,15)},note:'はみ出しが祖先でクリップされている場合、それだけでページ幅拡大の原因とは断定しません。'};
}
async function readManifest(){
  if(!manifestPromise){
    const link=document.querySelector('link[rel="manifest"]');
    manifestPromise=link?fetch(link.href,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then(value=>({source:new URL(link.href).pathname,value})).catch(error=>({error:String(error)})):Promise.resolve(null);
  }
  return manifestPromise;
}
export async function collectViewportReport(){
  const active=currentScreen(), root=document.querySelector('main');
  const elements={html:measureElement(document.documentElement),body:measureElement(document.body),root:measureElement(root),currentScreen:measureElement(active),mapScroll:measureElement(document.querySelector('.map-scroll'))};
  const {safeArea,viewportUnits}=measureProbes();
  const vv=window.visualViewport;
  const scale=vv?.scale??1,offsetTop=vv?.offsetTop??0;
  const compare=(label,rawDomValue)=>({label,rawDomCssPx:rawDomValue,value:rawDomValue*scale,unit:'screen CSS px',deltaFrom47:rawDomValue*scale-47,matches47:Math.abs(rawDomValue*scale-47)<=1});
  const comparisons=[compare('safe-area-inset-top',safeArea.top),compare('safe-area-inset-bottom',safeArea.bottom)];
  const screenProjection={scale,offsetTop,note:'DOM座標をvisualViewport.scaleで補正。画面上端とvisual viewport原点が一致する前提の参考値で、未確認のネイティブ領域は含みません。',elements:{}};
  for(const [name,element] of [['root',elements.root],['currentScreen',elements.currentScreen]])if(element){
    comparisons.push(compare(`innerHeight - ${name}.bottom`,innerHeight-element.rect.bottom));
    comparisons.push(compare(`clientHeight - ${name}.bottom`,document.documentElement.clientHeight-element.rect.bottom));
    const projectedBottom=(element.rect.bottom-offsetTop)*scale;
    const gap=screen.height-projectedBottom;
    screenProjection.elements[name]={projectedBottomScreenCssPx:projectedBottom,screenHeightGapCssPx:gap};
    comparisons.push({label:`screen.height - projected ${name}.bottom`,value:gap,unit:'screen CSS px',deltaFrom47:gap-47,matches47:Math.abs(gap-47)<=1});
  }
  if(elements.root&&elements.currentScreen)comparisons.push(compare('root.bottom - currentScreen.bottom',elements.root.rect.bottom-elements.currentScreen.rect.bottom));
  const report={diagnosticVersion:DIAGNOSTIC_VERSION,build:meta('nanairo-build')||'unbuilt-source',measuredAt:new Date().toISOString(),
    mode:{standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,mediaStandalone:matchMedia('(display-mode: standalone)').matches,iosStandalone:navigator.standalone??null,devicePixelRatio},
    screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},
    window:{innerWidth,innerHeight},documentElement:{clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight},
    visualViewport:vv?{width:vv.width,height:vv.height,offsetTop:vv.offsetTop,offsetLeft:vv.offsetLeft,scale:vv.scale}:null,
    safeArea,viewportUnits,elements,screenProjection,
    heightBasis:document.querySelector('main').dataset.viewportHeightBasis??null,
    scaleTimeline:panelSession?{...panelSession,latest:scaleSnapshot('collect')}:null,
    horizontalLayout:widthAudit(),
    comparison47:{referenceCssPx:47,diagnosticOnly:true,values:comparisons,note:'47はscreen CSS pxの比較用。DOMはscaleで補正し、高さ補正には使用しません。screen.heightはブラウザUI等を含む場合があります。'},
    settings:{viewport:meta('viewport'),statusBarStyle:meta('apple-mobile-web-app-status-bar-style'),webAppCapable:meta('apple-mobile-web-app-capable'),manifest:null,note:'meta/manifestは現在配信された設定です。iOSがインストール時に保持した値は取得できません。'},
    serviceWorker:{controller:navigator.serviceWorker?.controller?.scriptURL??null},
    colorProbe:colorChange?{target:colorChange.label,color:colorChange.color}:null,
    userAgent:navigator.userAgent};
  report.settings.manifest=await readManifest();
  return report;
}
function restoreColor(){
  if(!colorChange)return;
  const {element,value,priority}=colorChange;
  if(value)element.style.setProperty('background-color',value,priority);else element.style.removeProperty('background-color');
  colorChange=null;
}
async function refresh(){
  panel.querySelector('[data-copy]').disabled=true;
  try{
    const report=await collectViewportReport();
    output.value=JSON.stringify(report,null,2);
    summary.textContent=`ビルド: ${report.build}\n${report.mode.standalone?'PWA / standalone':'ブラウザ'}・DPR ${report.mode.devicePixelRatio}\ninnerHeight ${report.window.innerHeight} / clientHeight ${report.documentElement.clientHeight} / visualViewport ${report.visualViewport?.height??'なし'}\n100vh ${report.viewportUnits['100vh'].height} / 100dvh ${report.viewportUnits['100dvh'].height} / 基準 ${report.heightBasis}\nscale 前 ${report.scaleTimeline?.beforeOpen.visualViewport?.scale??'不明'} → 後 ${report.scaleTimeline?.afterOpen?.visualViewport?.scale??'計測中'} → 現在 ${report.visualViewport?.scale??'不明'}\nsafe-top ${report.safeArea.top} / safe-bottom ${report.safeArea.bottom}\n47pxに一致（±1）: ${report.comparison47.values.filter(v=>v.matches47).map(v=>v.label).join('、')||'なし'}`;
    panel.querySelector('[data-copy]').disabled=false;
  }catch(error){status.textContent=`計測できませんでした: ${error}`}
}
function selectOutput(){output.focus({preventScroll:true});output.select();output.setSelectionRange(0,output.value.length)}
async function copy(){
  const text=output.value;
  try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent='診断結果をコピーしました。'}
  catch{
    selectOutput();let copied=false;try{copied=document.execCommand('copy')}catch{}
    status.textContent=copied?'診断結果をコピーしました。':'自動コピーできません。選択された結果を長押しして「コピー」を選んでください。';
  }
}
function createPanel(){
  panel=document.createElement('dialog');panel.id='viewport-debug';panel.className='viewport-debug';panel.setAttribute('aria-labelledby','viewport-debug-title');
  panel.innerHTML=`<header class="viewport-debug-toolbar"><strong id="viewport-debug-title">画面の診断</strong><button type="button" data-collapse aria-expanded="true">折りたたむ</button><button type="button" data-close>閉じる</button></header>
<div class="viewport-debug-content"><p class="viewport-debug-summary"></p>
<div class="viewport-debug-actions"><button type="button" data-refresh>再計測</button><button type="button" data-copy disabled>診断結果をコピー</button><button type="button" data-select>すべて選択</button></div>
<label>診断結果（直接選択・コピーできます）<textarea readonly spellcheck="false" aria-label="診断結果"></textarea></label>
<fieldset><legend>下端の色を切り分ける（診断中のみ）</legend>
<label>対象 <select data-target><option value="html">html</option><option value="body">body</option><option value="root">ルート main</option><option value="screen">現在画面</option><option value="scroll">マップのスクロール領域</option></select></label>
<label>色 <select data-color><option value="#ff00ff">マゼンタ</option><option value="#00ff00">緑</option><option value="#00bfff">水色</option></select></label>
<div class="viewport-debug-actions"><button type="button" data-apply>背景色を変更</button><button type="button" data-restore>色を元に戻す</button></div>
<p>変更後は折りたたんで下端を確認してください。閉じると色は元に戻ります。画像や高さは変更しません。</p></fieldset>
<p>パネルは自動更新しません。画面回転・復帰後は再計測してください。meta/manifestは配信中の設定です。iOSがインストール時に保持した値は取得できません。</p>
<p class="viewport-debug-status" role="status" aria-live="polite"></p></div>`;
  document.body.append(panel);output=panel.querySelector('textarea');summary=panel.querySelector('.viewport-debug-summary');status=panel.querySelector('[role="status"]');
  panel.querySelector('[data-close]').addEventListener('click',()=>{restoreColor();panel.close()});
  panel.querySelector('[data-refresh]').addEventListener('click',refresh);
  panel.querySelector('[data-copy]').addEventListener('click',copy);
  panel.querySelector('[data-select]').addEventListener('click',()=>{selectOutput();status.textContent='選択しました。長押しメニューからコピーできます。'});
  panel.querySelector('[data-collapse]').addEventListener('click',event=>{
    const collapsed=panel.classList.toggle('is-collapsed');event.target.textContent=collapsed?'展開':'折りたたむ';event.target.setAttribute('aria-expanded',String(!collapsed));
  });
  panel.querySelector('[data-apply]').addEventListener('click',()=>{
    restoreColor();const target=panel.querySelector('[data-target]').value;
    const element={html:document.documentElement,body:document.body,root:document.querySelector('main'),screen:currentScreen(),scroll:document.querySelector('#map-screen:not([hidden]) .map-scroll')}[target];
    if(!element){status.textContent='マップ表示中にこの対象を選んでください。';return}
    const color=panel.querySelector('[data-color]').value;
    colorChange={element,value:element.style.getPropertyValue('background-color'),priority:element.style.getPropertyPriority('background-color'),label:target,color};
    element.style.setProperty('background-color',color,'important');status.textContent=`${target}の背景色を変更しました。`;
    refresh();
  });
  panel.querySelector('[data-restore]').addEventListener('click',()=>{restoreColor();status.textContent='元の色に戻しました。';refresh()});
  panel.addEventListener('cancel',restoreColor);
  panel.addEventListener('close',()=>{restoreColor();lastFocus?.focus?.({preventScroll:true})});
  window.addEventListener('pagehide',restoreColor);
}
export function openViewportDebug(){
  clearTimeout(holdTimer);
  if(panel?.open)return;
  panelSession={beforeOpen:scaleSnapshot('beforeOpen'),afterOpen:null,events:[]};
  if(!panel)createPanel();
  lastFocus=document.activeElement;panel.classList.remove('is-collapsed');panel.querySelector('[data-collapse]').textContent='折りたたむ';panel.querySelector('[data-collapse]').setAttribute('aria-expanded','true');
  status.textContent='';output.value='計測中…';panel.querySelector('[data-copy]').disabled=true;panel.showModal();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{panelSession.afterOpen=scaleSnapshot('afterOpen');refresh()}));
}
export function installViewportDebug(){
  window.visualViewport?.addEventListener('resize',()=>{if(panel?.open&&panelSession){panelSession.events.push(scaleSnapshot('visualViewport.resize'));if(panelSession.events.length>12)panelSession.events.shift()}});
  // A long press on the TOP logo is available even when the installed start URL has no query.
  document.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0||panel?.open)return;
    const title=document.querySelector('#title-screen');if(title.hidden||!title.contains(event.target))return;
    const art=title.querySelector('.title-art').getBoundingClientRect(),s=art.width/707;
    const x=(event.clientX-art.left)/s,y=(event.clientY-art.top)/s;
    if(x<40||x>665||y<250||y>550)return;
    holdPoint={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);holdTimer=setTimeout(openViewportDebug,2000);
  });
  document.addEventListener('pointermove',event=>{if(holdPoint&&Math.hypot(event.clientX-holdPoint.x,event.clientY-holdPoint.y)>12)clearTimeout(holdTimer)});
  for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>{clearTimeout(holdTimer);holdPoint=null});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(holdTimer)});
  document.querySelector('#open-viewport-debug').addEventListener('click',()=>{document.querySelector('#game-dialog').close();openViewportDebug()});
  if(new URLSearchParams(location.search).get('debugViewport')==='1')openViewportDebug();
}

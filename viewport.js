// One viewport owner; vh and dvh are measured independently, never overwritten.
const root=document.querySelector('main');
function createProbe(unit){
  const element=document.createElement('div');element.dataset.appViewportProbe=unit;element.setAttribute('aria-hidden','true');
  const supported=CSS.supports('height',`100${unit}`);
  element.style.cssText=`position:fixed;top:0;left:0;width:0;height:100${supported?unit:'vh'};visibility:hidden;pointer-events:none`;
  document.body.append(element);return element;
}
const probes={vh:createProbe('vh'),dvh:createProbe('dvh')};
const standaloneQuery=matchMedia('(display-mode: standalone)');
let frame=0;
const isStandalone=()=>standaloneQuery.matches||navigator.standalone===true;
export function viewportDiagnostics(){
  const rect=element=>{
    if(!element)return null;const r=element.getBoundingClientRect(),s=getComputedStyle(element);
    return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,paddingBottom:s.paddingBottom,marginBottom:s.marginBottom};
  };
  return {standalone:isStandalone(),innerHeight,clientHeight:document.documentElement.clientHeight,
    visualHeight:window.visualViewport?.height??null,visualOffsetTop:window.visualViewport?.offsetTop??null,visualScale:window.visualViewport?.scale??null,
    cssVhHeight:probes.vh.getBoundingClientRect().height,cssDynamicHeight:probes.dvh.getBoundingClientRect().height,
    heightBasis:root.dataset.viewportHeightBasis,
    elements:Object.fromEntries(['html','body','main','#title-screen','#map-screen','.map-scroll'].map(s=>[s,rect(document.querySelector(s))]))};
}
export function syncViewport(){
  const standalone=isStandalone();
  // Device measurements: standalone 100vh covers the full screen; dvh can be shorter.
  // Never add safe-area constants or compare screen.height to unscaled DOM heights.
  const basis=standalone?'vh':'dvh';
  const height=probes[basis].getBoundingClientRect().height||innerHeight;
  root.dataset.viewportMode=standalone?'standalone':'browser';root.dataset.viewportHeightBasis=`100${basis}`;
  if(height>0)root.style.setProperty('--app-height',`${height}px`);
}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;syncViewport()})}
window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);window.addEventListener('pageshow',schedule);
window.visualViewport?.addEventListener('resize',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
standaloneQuery.addEventListener?.('change',schedule);
new ResizeObserver(schedule).observe(document.documentElement);
for(const probe of Object.values(probes))new ResizeObserver(schedule).observe(probe);
syncViewport();

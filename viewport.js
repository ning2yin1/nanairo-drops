// One viewport owner. Individual screens fill this root, never visualViewport.
const root = document.querySelector('main');
const probe = document.createElement('div');
probe.setAttribute('aria-hidden','true');
probe.style.cssText='position:fixed;top:0;left:0;width:0;height:100vh;height:100dvh;visibility:hidden;pointer-events:none';
document.body.append(probe);
const standaloneQuery = matchMedia('(display-mode: standalone)');
let frame=0;
export function viewportDiagnostics() {
  const standalone=standaloneQuery.matches||navigator.standalone===true;
  const rect=element=>{
    if(!element)return null;
    const r=element.getBoundingClientRect(),s=getComputedStyle(element);
    return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,paddingBottom:s.paddingBottom,marginBottom:s.marginBottom};
  };
  return {standalone,innerHeight:window.innerHeight,clientHeight:document.documentElement.clientHeight,
    visualHeight:window.visualViewport?.height??null,visualOffsetTop:window.visualViewport?.offsetTop??null,
    visualScale:window.visualViewport?.scale??null,cssDynamicHeight:probe.getBoundingClientRect().height,
    elements:Object.fromEntries(['html','body','main','#title-screen','#map-screen','.map-scroll'].map(selector=>[selector,rect(document.querySelector(selector))]))};
}
export function syncViewport() {
  const standalone=standaloneQuery.matches||navigator.standalone===true;
  const dynamicHeight=probe.getBoundingClientRect().height;
  // In standalone, a shortened visual viewport must not remove the home-bar area.
  // No safe-area or toolbar constants are subtracted or added here.
  const height=standalone
    ?Math.max(window.innerHeight,document.documentElement.clientHeight,dynamicHeight)
    :(dynamicHeight||window.innerHeight);
  if(height>0)root.style.setProperty('--app-height',`${height}px`);
}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;syncViewport()})}
window.addEventListener('resize',schedule);
window.addEventListener('orientationchange',schedule);
window.addEventListener('pageshow',schedule);
window.visualViewport?.addEventListener('resize',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
standaloneQuery.addEventListener?.('change',schedule);
new ResizeObserver(schedule).observe(document.documentElement);
new ResizeObserver(schedule).observe(probe);
syncViewport();

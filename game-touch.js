// Only explicitly marked game surfaces lock native gestures. Future map screens
// can omit this attribute and use touch-action: pan-y pinch-zoom or pan-y.
const selector = '[data-game-touch="locked"]';
function locked(event) { return event.target instanceof Element && event.target.closest(selector); }
for(const type of ['gesturestart','gesturechange','gestureend']) {
  document.addEventListener(type,event=>{if(locked(event)&&event.cancelable)event.preventDefault();},{passive:false});
}
document.addEventListener('touchmove',event=>{
  if(locked(event)&&event.touches.length>1&&event.cancelable)event.preventDefault();
},{passive:false});
let lastEnd = 0;
let lastSurface = null;
document.addEventListener('touchend',event=>{
  const surface = locked(event);
  if(!surface || event.touches.length) return;
  const now = performance.now();
  // iOS fallback: suppress only a second non-button tap, preserving button clicks.
  if(surface===lastSurface&&now-lastEnd<300&&!event.target.closest('button,a,input')&&event.cancelable)event.preventDefault();
  lastEnd=now;lastSurface=surface;
},{passive:false});

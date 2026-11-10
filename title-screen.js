import {containGeometry} from './title-layout.js?v=5';
const screen = document.querySelector('#title-screen');
const art = screen.querySelector('.title-art');
const root = document.querySelector('main');
export function fitTitle() {
  // iOS toolbars and standalone mode may report different dynamic CSS heights.
  // Keep the viewport root full size; only the artwork fits inside safe areas.
  const viewport = window.visualViewport;
  const heightValue = `${viewport?.height || window.innerHeight}px`;
  document.documentElement.style.setProperty('--viewport-height',heightValue);
  root.style.height = heightValue;
  if(screen.hidden)return;
  const {width,height} = screen.getBoundingClientRect();
  if(!width || !height)return;
  const style = getComputedStyle(screen);
  const g = containGeometry(width,height,
    parseFloat(style.getPropertyValue('--safe-top'))||0,
    parseFloat(style.getPropertyValue('--safe-bottom'))||0,
    parseFloat(style.getPropertyValue('--safe-left'))||0,
    parseFloat(style.getPropertyValue('--safe-right'))||0);
  Object.assign(art.style,{left:`${g.left}px`,top:`${g.top}px`,width:`${g.width}px`,height:`${g.height}px`});
}
new ResizeObserver(fitTitle).observe(screen);
window.addEventListener('pageshow', fitTitle);
window.addEventListener('resize', fitTitle);
window.visualViewport?.addEventListener('resize',fitTitle);
fitTitle();

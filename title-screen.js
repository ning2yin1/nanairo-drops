import {syncViewport} from './viewport.js?v=10';
import {coverGeometry} from './title-layout.js?v=10';
const screen = document.querySelector('#title-screen');
const art = screen.querySelector('.title-art');
export function fitTitle() {
  if(screen.hidden)return;
  syncViewport();
  const {width,height} = screen.getBoundingClientRect();
  if(!width || !height)return;
  const style = getComputedStyle(screen);
  const g = coverGeometry(width,height,
    parseFloat(style.getPropertyValue('--safe-top'))||0,
    parseFloat(style.getPropertyValue('--safe-bottom'))||0);
  Object.assign(art.style,{left:`${g.left}px`,top:`${g.top}px`,width:`${g.width}px`,height:`${g.height}px`});
}
new ResizeObserver(fitTitle).observe(screen);
window.addEventListener('pageshow', fitTitle);
window.addEventListener('resize', fitTitle);
window.visualViewport?.addEventListener('resize',fitTitle);
fitTitle();

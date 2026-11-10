import {coverGeometry} from './title-layout.js?v=4';
const screen = document.querySelector('#title-screen');
const art = screen.querySelector('.title-art');
const root = document.querySelector('main');
export function fitTitle() {
  // iOS toolbars and standalone mode may report different dynamic CSS heights.
  // Use the visible viewport itself; safe areas never reduce the background box.
  const viewport = window.visualViewport;
  const heightValue = `${viewport?.height || window.innerHeight}px`;
  document.documentElement.style.setProperty('--viewport-height',heightValue);
  root.style.height = heightValue;
  if(screen.hidden)return;
  const {width,height} = screen.getBoundingClientRect();
  if(!width || !height)return;
  const style = getComputedStyle(screen);
  const g = coverGeometry(width,height,
    parseFloat(style.getPropertyValue('--safe-top'))||0,
    parseFloat(style.getPropertyValue('--safe-bottom'))||0);
  screen.style.setProperty('--art-top',`${g.top}px`);
  Object.assign(art.style,{left:`${g.left}px`,top:`${g.top}px`,width:`${g.width}px`,height:`${g.height}px`});
}
new ResizeObserver(fitTitle).observe(screen);
window.addEventListener('pageshow', fitTitle);
window.addEventListener('resize', fitTitle);
window.visualViewport?.addEventListener('resize',fitTitle);
fitTitle();

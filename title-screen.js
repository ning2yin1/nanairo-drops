import {titleGeometry, drawTin} from './title-layout.js?v=3';
const screen = document.querySelector('#title-screen');
const art = screen.querySelector('.title-art');
const canvas = screen.querySelector('canvas');
const image = new Image();
image.src = new URL('./assets/title-background.png', import.meta.url).href;
image.addEventListener('load', fitTitle);
image.addEventListener('error', () => {
  document.querySelector('#image-error').hidden = false;
  document.querySelector('#start').disabled = true;
});
export function fitTitle() {
  if (screen.hidden) return;
  const {width,height} = screen.getBoundingClientRect();
  if(!width || !height) return;
  const style = getComputedStyle(screen);
  const g = titleGeometry(width,height,parseFloat(style.paddingTop)||0,parseFloat(style.paddingBottom)||0);
  Object.assign(art.style,{left:`${g.left}px`,top:`${g.top}px`,width:`${g.width}px`,height:`${g.height}px`});
  if(!image.complete || !image.naturalWidth) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width*dpr);canvas.height = Math.round(height*dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawTin(ctx,image,width,height,g);
}
new ResizeObserver(fitTitle).observe(screen);
window.addEventListener('pageshow', fitTitle);
window.addEventListener('resize', fitTitle);
fitTitle();

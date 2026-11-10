import { fitTitle } from './title-layout.js';
const title = document.querySelector('#title-screen');
const preparing = document.querySelector('#preparing-screen');
const start = document.querySelector('#start');
const back = document.querySelector('#back');
let transitioning = false;
let timer;
function showPreparing() {
  if (transitioning || title.hidden) return;
  transitioning = true;
  start.disabled = true;
  start.classList.add('is-pressed');
  timer = setTimeout(() => {
    title.hidden = true;
    preparing.hidden = false;
    document.querySelector('#preparing-title').focus({preventScroll:true});
    transitioning = false;
  }, 130);
}
function showTitle() {
  clearTimeout(timer);
  preparing.hidden = true;
  title.hidden = false;
  fitTitle();
  start.disabled = false;
  start.classList.remove('is-pressed');
  transitioning = false;
  start.focus({preventScroll:true});
}
start.addEventListener('click', showPreparing);
back.addEventListener('click', showTitle);
for (const img of document.querySelectorAll('.title-art img')) {
  const fail = () => { document.querySelector('#image-error').hidden = false; start.disabled = true; };
  img.addEventListener('error', fail);
  if (img.complete && !img.naturalWidth) fail();
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('オフライン機能を登録できませんでした', error)));
}

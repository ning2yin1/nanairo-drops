import {installViewportDebug} from './viewport-debug.js?v=10';
import {fitTitle} from './title-screen.js?v=10';
import {initializeMap,openMap} from './map.js?v=10';
import './game-touch.js?v=10';
const title=document.querySelector('#title-screen');
const map=document.querySelector('#map-screen');
const start=document.querySelector('#start');
const errorMessage=document.querySelector('#image-error');
const dialog=document.querySelector('#game-dialog');
let transitioning=false;
function showMessage(heading,message){
  document.querySelector('#open-viewport-debug').hidden=heading!=='設定';
  document.querySelector('#dialog-title').textContent=heading;
  document.querySelector('#dialog-message').textContent=message;
  if(!dialog.open)dialog.showModal();
}
start.addEventListener('click',async()=>{
  if(transitioning)return;
  transitioning=true;start.disabled=true;start.classList.add('is-pressed');
  try{
    await Promise.all([
      initializeMap(stage=>showMessage(`ステージ ${stage}`,'ただいま準備中です。もう少しだけお待ちくださいね！')),
      new Promise(resolve=>setTimeout(resolve,130))
    ]);
    title.hidden=true;openMap();errorMessage.hidden=true;
  }catch(error){errorMessage.textContent='マップを読み込めませんでした。通信状態を確認して、もう一度スタートしてください。';errorMessage.hidden=false;}
  finally{transitioning=false;start.disabled=false;start.classList.remove('is-pressed')}
});
document.querySelector('#map-home').addEventListener('click',()=>{
  map.hidden=true;title.hidden=false;fitTitle();start.focus({preventScroll:true});
});
document.querySelector('#settings').addEventListener('click',()=>showMessage('設定','設定項目は、ただいま準備中です。'));
for(const img of document.querySelectorAll('#title-screen img')){
  const fail=()=>{errorMessage.textContent='画像を読み込めませんでした。通信状態を確認して、再度ページを開いてください。';errorMessage.hidden=false;start.disabled=true};
  img.addEventListener('error',fail);if(img.complete&&!img.naturalWidth)fail();
}
if('serviceWorker' in navigator){
  const controlledAtLoad=!!navigator.serviceWorker.controller;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    // Fresh installs already loaded the latest page; only an upgrade needs a reload.
    if(controlledAtLoad&&!reloading){reloading=true;location.reload()}
  });
  navigator.serviceWorker.register('./sw.js?v=10',{updateViaCache:'none'}).catch(error=>console.warn('オフライン機能を登録できませんでした',error));
}

installViewportDebug();

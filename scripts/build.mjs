import {mkdir,rm,copyFile,cp,readFile,readdir,writeFile} from 'node:fs/promises';
const files=['index.html','styles.css','title.css','map.css','app.js','title-layout.js','title-screen.js','map.js','progress.js','viewport.js','game-touch.js','sw.js','manifest.webmanifest'];
for(const name of files)await readFile(name);
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of files)await copyFile(name,`dist/${name}`);
await cp('assets','dist/assets',{recursive:true});
const root='nanairo-map-assets';
await cp(`${root}/nanairo-top-assets`,`dist/${root}/nanairo-top-assets`,{recursive:true,filter:source=>!source.endsWith('title-reference.png')});
for(const folder of ['backgrounds','stage-buttons','characters','ui','data'])await cp(`${root}/nanairo-map-assets/${folder}`,`dist/${root}/nanairo-map-assets/${folder}`,{recursive:true});
await copyFile('index.html','dist/404.html');
// The service worker precaches exactly the shipped files, including the map JSON.
async function walk(path){const result=[];for(const entry of await readdir(path,{withFileTypes:true})){const name=`${path}/${entry.name}`;if(entry.isDirectory())result.push(...await walk(name));else result.push('./'+name.slice(5));}return result;}
const precache=(await walk('dist')).filter(path=>!['./sw.js','./404.html'].includes(path));
await writeFile('dist/precache.json',JSON.stringify(precache));
console.log('Built TOP + map in dist/ with relative paths and a complete offline asset list.');

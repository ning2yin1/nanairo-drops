import {mkdir,rm,copyFile,cp,readFile} from 'node:fs/promises';
const files=['index.html','styles.css','app.js','sw.js','manifest.webmanifest'];
for(const name of files) await readFile(name);
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const name of files) await copyFile(name,`dist/${name}`);
await cp('assets','dist/assets',{recursive:true});
await copyFile('index.html','dist/404.html');
console.log('Built static application in dist/ (relative paths support /nanairo-drops/).');

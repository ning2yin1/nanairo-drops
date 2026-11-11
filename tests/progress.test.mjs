import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readProgress,stageState,SAVE_KEY} from '../progress.js';
const storage=value=>({getItem:key=>{assert.equal(key,SAVE_KEY);return value},setItem:()=>{throw Error('Reads must not write saves')}});
test('new play starts at stage 1 / zero coins, not preview progress',()=>assert.deepEqual(readProgress(storage(null)),{version:1,currentStage:1,coins:0,clearedStages:[]}));
test('saved progress and unknown fields survive without a write',()=>{
 const saved={currentStage:20,coins:4321,clearedStages:[1,5,8],futureData:{music:false}};
 assert.deepEqual(readProgress(storage(JSON.stringify(saved))),saved);
});
test('current precedes cleared, locked stages stay locked',()=>{
 const p={currentStage:8,clearedStages:[1,8]};assert.equal(stageState(8,p),'current');assert.equal(stageState(1,p),'cleared');assert.equal(stageState(9,p),'locked');
});
test('corrupt or unavailable storage safely falls back without overwriting',()=>{
 for(const value of ['{bad','[]','null'])assert.equal(readProgress(storage(value)).currentStage,1);
 assert.equal(readProgress({getItem(){throw Error('blocked')}}).coins,0);
});

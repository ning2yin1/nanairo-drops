// No previous save implementation exists in this repository. Never use preview data.
export const SAVE_KEY = 'nanairo-drops-progress';
export function readProgress(storage) {
  const fresh = {version:1,currentStage:1,clearedStages:[],coins:0};
  try {
    storage ??= globalThis.localStorage;
    const raw = JSON.parse(storage.getItem(SAVE_KEY) || 'null');
    if(!raw || typeof raw !== 'object' || Array.isArray(raw))return fresh;
    return {...raw,
      currentStage:Number.isSafeInteger(raw.currentStage)&&raw.currentStage>0?raw.currentStage:1,
      coins:Number.isSafeInteger(raw.coins)&&raw.coins>=0?raw.coins:0,
      clearedStages:Array.isArray(raw.clearedStages)?raw.clearedStages.filter(n=>Number.isSafeInteger(n)&&n>0):[]};
  } catch { return fresh; }
}
// Reading and opening placeholder stages never writes, clears, or advances a save.
export function stageState(stage, progress) {
  if(stage === progress.currentStage)return 'current';
  return progress.clearedStages.includes(stage)?'cleared':'locked';
}

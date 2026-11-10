// Source coordinates stay unchanged: only plain tin texture and rim are extended.
export function titleGeometry(width, height, safeTop = 0, safeBottom = 0) {
  const rimUnit = Math.min(width / 707, height / 1536);
  safeTop = Math.max(safeTop, 36 * rimUnit);
  safeBottom = Math.max(safeBottom, 32 * rimUnit);
  const scale = Math.min(width / 707, Math.max(1, height - safeTop - safeBottom) / 1379);
  const top = Math.max(safeTop - 65 * scale,
    Math.min((height - 1536 * scale) / 2, height - safeBottom - 1444 * scale));
  return {scale, left:(width - 707 * scale) / 2, top, width:707 * scale, height:1536 * scale};
}

// Nine regions: the artwork is uniformly scaled; texture strips fill the gaps.
// A separate rim follows the viewport edge, so the result remains a single tin.
export function drawTin(ctx, image, width, height, g) {
  const unit = Math.min(width / 707, height / 1536);
  const rim = 24 * unit, topRim = 36 * unit, bottomRim = 32 * unit;
  const xs = [[16,4,rim,g.left+24*g.scale-rim], [24,659,g.left+24*g.scale,659*g.scale], [687,4,g.left+683*g.scale,width-rim-g.left-683*g.scale]];
  const ys = [[36,8,topRim,g.top+36*g.scale-topRim], [36,1468,g.top+36*g.scale,1468*g.scale], [1496,8,g.top+1504*g.scale,height-bottomRim-g.top-1504*g.scale]];
  ctx.save();
  ctx.beginPath();ctx.rect(rim-1,topRim-1,width-2*rim+2,height-topRim-bottomRim+2);ctx.clip();
  for(const [sx,sw,dx,dw] of xs) for(const [sy,sh,dy,dh] of ys) {
    if(dw>0 && dh>0)ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
  }
  ctx.restore();
  // Side rim follows the artwork's cream/red boundary, not a stretched scene.
  ctx.save();ctx.beginPath();ctx.rect(0,topRim-1,width,height-topRim-bottomRim+2);ctx.clip();
  for(const [sx,dx] of [[0,0],[683,width-rim]]) for(const [sy,sh,dy,dh] of ys) {
    if(dh>0)ctx.drawImage(image,sx,sy,24,sh,dx,dy,rim,dh);
  }
  ctx.restore();
  const edgeX=[[0,24,0,rim],[24,659,rim,width-2*rim],[683,24,width-rim,rim]];
  for(const [sx,sw,dx,dw] of edgeX) {
    ctx.drawImage(image,sx,0,sw,36,dx,0,dw,topRim);
    ctx.drawImage(image,sx,1504,sw,32,dx,height-bottomRim,dw,bottomRim);
  }
}

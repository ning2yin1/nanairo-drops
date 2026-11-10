// Match object-fit:cover with one uniform scale; never stretch or slice artwork.
export function coverGeometry(width, height, safeTop = 0, safeBottom = 0) {
  const scale = Math.max(width / 707, height / 1536);
  const imageWidth = 707 * scale, imageHeight = 1536 * scale;
  const minTop = Math.max(height - imageHeight, safeTop - 258 * scale);
  const maxTop = Math.min(0, height - safeBottom - 1444 * scale);
  const centered = (height - imageHeight) / 2;
  const top = minTop <= maxTop ? Math.max(minTop, Math.min(centered, maxTop)) : Math.max(height-imageHeight, Math.min(0,centered));
  return {left:(width-imageWidth)/2, top, width:imageWidth, height:imageHeight, scale};
}

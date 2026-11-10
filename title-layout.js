// Fit the entire original artwork, including both gold rims, inside safe areas.
export function containGeometry(width, height, top = 0, bottom = 0, left = 0, right = 0) {
  const availableWidth = Math.max(0, width - left - right);
  const availableHeight = Math.max(0, height - top - bottom);
  const scale = Math.min(availableWidth / 707, availableHeight / 1536);
  const imageWidth = 707 * scale;
  const imageHeight = 1536 * scale;
  return {left:left+(availableWidth-imageWidth)/2, top:top+(availableHeight-imageHeight)/2,
    width:imageWidth, height:imageHeight, scale};
}

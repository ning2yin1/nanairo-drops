// The same uniform cover geometry drives the single image and the button.
export function coverGeometry(width, height, safeTop = 0, safeBottom = 0) {
  const scale = Math.max(width / 707, height / 1536);
  const imageWidth = 707 * scale;
  const imageHeight = 1536 * scale;
  const upper = Math.min(0, height - safeBottom - 1444 * scale);
  const lower = Math.max(height - imageHeight, safeTop - 258 * scale);
  const centered = (height - imageHeight) / 2;
  // On portrait iPhones, keep both the logo and the complete button visible.
  // Only the outside of the original image is cropped; nothing is sliced.
  const top = lower <= upper ? Math.max(lower, Math.min(centered, upper)) : upper;
  return {left:(width-imageWidth)/2, top, width:imageWidth, height:imageHeight, scale};
}

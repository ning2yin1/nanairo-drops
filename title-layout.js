// Keep the artwork and its overlaid button in one unmodified coordinate system.
const screen = document.querySelector('#title-screen');
const art = screen.querySelector('.title-art');
export function fitTitle() {
  if (screen.hidden) return;
  const {width, height} = screen.getBoundingClientRect();
  const style = getComputedStyle(screen);
  const safeTop = parseFloat(style.paddingTop) || 0;
  const safeBottom = parseFloat(style.paddingBottom) || 0;
  // Fruit starts below y=65; the complete button ends at y=1444.
  // Only the decorative tin edges may leave the viewport.
  const scale = Math.min(width / 707, (height - safeTop - safeBottom) / (1444 - 65));
  const top = Math.max(safeTop - 65 * scale,
    Math.min((height - 1536 * scale) / 2, height - safeBottom - 1444 * scale));
  art.style.width = `${707 * scale}px`;
  art.style.top = `${top}px`;
  screen.style.setProperty('--cream-end', `${top + 580 * scale}px`);
}
new ResizeObserver(fitTitle).observe(screen);
window.addEventListener('pageshow', fitTitle);
fitTitle();

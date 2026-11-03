// src/view.js
// Transforms between image coordinates and canvas (screen) coordinates.
// All zooming happens here; node data stays in image space, so zoom can
// never affect measurements.

export const view = { scale: 1, offsetX: 0, offsetY: 0, fitScale: 1 };

const MIN_ZOOM = 0.2; // relative to fit
const MAX_ZOOM = 60;

export function fitImage(canvas, image) {
  if (!image) return;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  if (cw === 0 || ch === 0) return;
  view.fitScale = Math.min(cw / image.naturalWidth, ch / image.naturalHeight);
  view.scale = view.fitScale;
  view.offsetX = (cw - image.naturalWidth * view.scale) / 2;
  view.offsetY = (ch - image.naturalHeight * view.scale) / 2;
}

// Zoom by `factor`, keeping the image point under (sx, sy) stationary.
export function zoomAt(image, factor, sx, sy) {
  if (!image) return;
  const min = view.fitScale * MIN_ZOOM;
  const max = view.fitScale * MAX_ZOOM;
  const newScale = Math.min(Math.max(view.scale * factor, min), max);

  const ix = (sx - view.offsetX) / view.scale;
  const iy = (sy - view.offsetY) / view.scale;

  view.scale = newScale;
  view.offsetX = sx - ix * newScale;
  view.offsetY = sy - iy * newScale;
}

export function zoomAtCenter(canvas, image, factor) {
  zoomAt(image, factor, canvas.clientWidth / 2, canvas.clientHeight / 2);
}

// Translate the view by screen-space deltas.
export function panBy(dx, dy) {
  view.offsetX += dx;
  view.offsetY += dy;
}

// Zoom factor relative to the fitted view. Used to size overlay graphics.
export function zoomFactor() {
  const z = view.fitScale > 0 ? view.scale / view.fitScale : 1;
  return Math.min(Math.max(z, 0.5), 6);
}

export function toImage(sx, sy) {
  return {
    x: (sx - view.offsetX) / view.scale,
    y: (sy - view.offsetY) / view.scale,
  };
}

export function toScreen(ix, iy) {
  return {
    x: ix * view.scale + view.offsetX,
    y: iy * view.scale + view.offsetY,
  };
}

// src/storage.js
// Persist the imported image and user preferences so they survive reloads.

const IMAGE_KEY = "map-measure:image";
const ALPHA_KEY = "map-measure:overlay-alpha";

export function saveImage(dataUrl) {
  try {
    localStorage.setItem(IMAGE_KEY, dataUrl);
    return true;
  } catch {
    return false; // quota exceeded
  }
}

export function loadStoredImage() {
  const dataUrl = localStorage.getItem(IMAGE_KEY);
  return dataUrl ? decodeImage(dataUrl) : null;
}

export function decodeImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });
}

export function saveOverlayAlpha(alpha) {
  try {
    localStorage.setItem(ALPHA_KEY, String(alpha));
  } catch {
    // Non-fatal: preference just won't persist.
  }
}

export function loadOverlayAlpha() {
  const value = parseFloat(localStorage.getItem(ALPHA_KEY));
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0.1), 1);
}

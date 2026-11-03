// src/state.js
// Single source of truth for app data and the distance math derived from it.

export const state = {
  image: null, // HTMLImageElement | null
  tool: "scale", // 'scale' | 'measure'
  scaleNodes: [], // up to 2 points, in image coordinates
  scaleDistance: 1, // real-world distance between the two scale nodes
  scaleUnit: "mi",
  waypoints: [], // measurement chain, in image coordinates
  overlayAlpha: 0.65, // transparency of nodes/lines/labels
};

// Pixels per real-world unit, or null if the scale isn't fully defined.
export function pixelsPerUnit() {
  if (state.scaleNodes.length < 2 || state.scaleDistance <= 0) return null;
  const [a, b] = state.scaleNodes;
  const px = Math.hypot(b.x - a.x, b.y - a.y);
  return px > 0 ? px / state.scaleDistance : null;
}

// Distance of each leg in the user's unit. Null if scale is not set.
export function legDistances() {
  const ppu = pixelsPerUnit();
  if (!ppu) return null;
  const legs = [];
  for (let i = 1; i < state.waypoints.length; i++) {
    const a = state.waypoints[i - 1];
    const b = state.waypoints[i];
    legs.push(Math.hypot(b.x - a.x, b.y - a.y) / ppu);
  }
  return legs;
}

export function totalDistance() {
  const legs = legDistances();
  if (!legs) return null;
  return legs.reduce((sum, d) => sum + d, 0);
}

export function formatDistance(d) {
  return d >= 100 ? d.toFixed(1) : d.toFixed(2);
}

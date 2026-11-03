// src/renderer.js
// All canvas drawing. Reads state; never mutates it.

import { state, legDistances, formatDistance } from "./state.js";
import { view, toScreen, zoomFactor } from "./view.js";

const SCALE_COLOR = "#f59e0b";
const MEASURE_COLOR = "#22d3ee";
const NODE_RADIUS = 5;

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  }

  function drawNode(p, color, z) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, NODE_RADIUS * z, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2 * z;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
    ctx.stroke();
  }

  function drawPolyline(nodes, color, z) {
    const pts = nodes.map((n) => toScreen(n.x, n.y));
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 2 * z;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    for (const p of pts) drawNode(p, color, z);
  }

  function drawLabel(x, y, text, z) {
    ctx.font = `${Math.round(12 * z)}px system-ui, sans-serif`;
    const pad = 4 * z;
    const h = 20 * z;
    const w = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x - w / 2 - pad, y - h / 2 - pad, w + pad * 2, h + pad);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function drawLegLabels(z) {
    const legs = legDistances();
    if (!legs) return;
    for (let i = 0; i < legs.length; i++) {
      const a = toScreen(state.waypoints[i].x, state.waypoints[i].y);
      const b = toScreen(state.waypoints[i + 1].x, state.waypoints[i + 1].y);
      drawLabel(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        `${formatDistance(legs[i])} ${state.scaleUnit}`,
        z,
      );
    }
  }

  function render() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    if (!state.image) return;

    const { scale, offsetX, offsetY } = view;
    ctx.drawImage(
      state.image,
      offsetX,
      offsetY,
      state.image.naturalWidth * scale,
      state.image.naturalHeight * scale,
    );

    // Overlay graphics: zoom-scaled sizes, user-controlled opacity.
    const z = zoomFactor();
    ctx.globalAlpha = state.overlayAlpha;
    drawPolyline(state.scaleNodes, SCALE_COLOR, z);
    drawPolyline(state.waypoints, MEASURE_COLOR, z);
    drawLegLabels(z);
    ctx.globalAlpha = 1;
  }

  return { render, resize };
}

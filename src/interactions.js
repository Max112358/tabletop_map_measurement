// src/interactions.js
// Pointer and wheel handling: create, drag, delete nodes, zoom, pan.
// Calls onChange() whenever state or view changes.

import { state } from "./state.js";
import { toImage, toScreen, zoomAt, zoomFactor, panBy } from "./view.js";

const BASE_HIT_RADIUS = 10; // screen pixels
const DRAG_THRESHOLD = 4; // screen pixels

export function attachInteractions(canvas, onChange) {
  canvas.addEventListener("auxclick", (e) => e.preventDefault());

  let drag = null; // { nodes, index }
  let downPos = null;
  let moved = false;
  let panning = false;
  let panLast = null;

  function activeNodes() {
    return state.tool === "scale" ? state.scaleNodes : state.waypoints;
  }

  function hitRadius() {
    // Nodes grow with zoom, so the grab target grows too.
    return Math.max(BASE_HIT_RADIUS, 5 * zoomFactor() + 4);
  }

  function hitTest(sx, sy) {
    const nodes = activeNodes();
    for (let i = 0; i < nodes.length; i++) {
      const p = toScreen(nodes[i].x, nodes[i].y);
      if (Math.hypot(p.x - sx, p.y - sy) <= hitRadius()) return i;
    }
    return -1;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!state.image) return;

    // Middle mouse button: start panning.
    if (e.button === 1) {
      e.preventDefault();
      panning = true;
      panLast = { x: e.offsetX, y: e.offsetY };
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;
    const index = hitTest(e.offsetX, e.offsetY);
    drag = index >= 0 ? { nodes: activeNodes(), index } : null;
    downPos = { x: e.offsetX, y: e.offsetY };
    moved = false;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (panning && panLast) {
      panBy(e.offsetX - panLast.x, e.offsetY - panLast.y);
      panLast = { x: e.offsetX, y: e.offsetY };
      onChange();
      return;
    }

    if (!drag || !downPos) return;
    if (
      Math.hypot(e.offsetX - downPos.x, e.offsetY - downPos.y) > DRAG_THRESHOLD
    ) {
      moved = true;
    }
    if (moved) {
      const p = toImage(e.offsetX, e.offsetY);
      drag.nodes[drag.index] = p;
      onChange();
    }
  });

  function endPointer() {
    if (panning) {
      panning = false;
      panLast = null;
      canvas.style.cursor = "";
      return;
    }

    if (!downPos) return;

    if (!moved) {
      if (drag) {
        // Click (not drag) on an existing node.
        if (state.tool === "measure") {
          // Deleting from the array automatically reconnects neighbors,
          // since legs are drawn between consecutive waypoints.
          drag.nodes.splice(drag.index, 1);
          onChange();
        }
        // Scale nodes are drag-only; use a fresh pair to redo the scale.
      } else {
        const p = toImage(downPos.x, downPos.y);
        if (state.tool === "scale") {
          if (state.scaleNodes.length < 2) state.scaleNodes.push(p);
        } else {
          state.waypoints.push(p);
        }
        onChange();
      }
    }

    drag = null;
    downPos = null;
    moved = false;
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // Scroll wheel zooms in/out around the cursor position.
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!state.image) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(state.image, factor, e.offsetX, e.offsetY);
      onChange();
    },
    { passive: false },
  );
}

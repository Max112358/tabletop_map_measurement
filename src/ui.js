// src/ui.js
// DOM updates for the sidebar and toolbar, plus event wiring for tool
// selection, scale inputs, and the opacity slider.

import {
  state,
  pixelsPerUnit,
  legDistances,
  totalDistance,
  formatDistance,
} from "./state.js";
import { saveOverlayAlpha } from "./storage.js";

export function createUi(onChange, zoomActions) {
  const els = {
    legList: document.getElementById("leg-list"),
    total: document.getElementById("total"),
    scaleStatus: document.getElementById("scale-status"),
    toolScale: document.getElementById("tool-scale"),
    toolMeasure: document.getElementById("tool-measure"),
    scaleDistance: document.getElementById("scale-distance"),
    scaleUnit: document.getElementById("scale-unit"),
    alphaSlider: document.getElementById("overlay-alpha"),
    zoomIn: document.getElementById("zoom-in"),
    zoomOut: document.getElementById("zoom-out"),
    zoomFit: document.getElementById("zoom-fit"),
  };

  function setTool(tool) {
    state.tool = tool;
    els.toolScale.classList.toggle("active", tool === "scale");
    els.toolMeasure.classList.toggle("active", tool === "measure");
    onChange();
  }

  els.toolScale.addEventListener("click", () => setTool("scale"));
  els.toolMeasure.addEventListener("click", () => setTool("measure"));

  els.scaleDistance.addEventListener("input", () => {
    state.scaleDistance = parseFloat(els.scaleDistance.value) || 0;
    onChange();
  });
  els.scaleUnit.addEventListener("change", () => {
    state.scaleUnit = els.scaleUnit.value;
    onChange();
  });

  els.zoomIn.addEventListener("click", zoomActions.zoomIn);
  els.zoomOut.addEventListener("click", zoomActions.zoomOut);
  els.zoomFit.addEventListener("click", zoomActions.zoomFit);

  els.alphaSlider.value = String(state.overlayAlpha);
  els.alphaSlider.addEventListener("input", () => {
    state.overlayAlpha = parseFloat(els.alphaSlider.value);
    saveOverlayAlpha(state.overlayAlpha);
    onChange();
  });

  function refresh() {
    const ready = pixelsPerUnit() !== null;
    els.scaleStatus.textContent = ready
      ? `Scale set: 1 ${state.scaleUnit} = ${pixelsPerUnit().toFixed(1)} px`
      : "Set the scale first: click two points on the map\u2019s distance key.";

    els.legList.replaceChildren();
    const legs = legDistances();
    if (legs) {
      legs.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = `${formatDistance(d)} ${state.scaleUnit}`;
        els.legList.appendChild(li);
      });
      const total = totalDistance();
      els.total.textContent =
        legs.length > 0
          ? `Total: ${formatDistance(total)} ${state.scaleUnit}`
          : "";
    } else {
      els.total.textContent = "";
    }
  }

  return { refresh };
}

// src/main.js
// Entry point: wires storage, renderer, interactions, and UI together.

import { state } from "./state.js";
import { fitImage, zoomAtCenter } from "./view.js";
import {
  saveImage,
  loadStoredImage,
  loadOverlayAlpha,
  decodeImage,
} from "./storage.js";
import { createRenderer } from "./renderer.js";
import { attachInteractions } from "./interactions.js";
import { createUi } from "./ui.js";

const canvas = document.getElementById("map-canvas");
const importBtn = document.getElementById("import-btn");
const fileInput = document.getElementById("file-input");

// Restore persisted preferences before the UI reads them.
const savedAlpha = loadOverlayAlpha();
if (savedAlpha !== null) state.overlayAlpha = savedAlpha;

const renderer = createRenderer(canvas);
const ui = createUi(update, {
  zoomIn: () => {
    zoomAtCenter(canvas, state.image, 1.25);
    update();
  },
  zoomOut: () => {
    zoomAtCenter(canvas, state.image, 0.8);
    update();
  },
  zoomFit: () => {
    fitImage(canvas, state.image);
    update();
  },
});

function update() {
  renderer.render();
  ui.refresh();
}

function setImage(image) {
  state.image = image;
  fitImage(canvas, image);
  update();
}

// Import flow: file -> data URL -> localStorage + canvas.
importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (!file) return;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (!saveImage(dataUrl)) {
    alert(
      "Image is too large to save in local storage. " +
        "It will work for this session but will not be remembered.",
    );
  }
  setImage(await decodeImage(dataUrl));
});

// Restore the previous session's image, if any.
const stored = loadStoredImage();
if (stored) {
  stored.then(setImage).catch(() => {});
}

// Refit on window/container resize.
new ResizeObserver(() => {
  renderer.resize();
  if (state.image) fitImage(canvas, state.image);
  update();
}).observe(canvas.parentElement);

renderer.resize();
attachInteractions(canvas, update, () => ui.setTool("measure"));
update();

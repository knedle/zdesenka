import { clamp, computeScaledDimensions, displayToLogicalScale, displayDeltaToLogicalDelta, centerPoint } from './geometry.js';

const BACKGROUND_ZOOM_STEP = 1.1;
const BACKGROUND_MIN_SCALE = 0.05;
const BACKGROUND_MAX_SCALE = 10;

const placeholderEl = document.getElementById('placeholder');
const messageEl = document.getElementById('message');
const stageWrapperEl = document.getElementById('stage-wrapper');
const stageEl = document.getElementById('stage');
const backgroundEl = document.getElementById('background');
const logoLayerEl = document.getElementById('logo-layer');
const logoImgEl = document.getElementById('logo');
const logoHandleEl = document.getElementById('logo-handle');

const zoomOutBtn = document.getElementById('zoom-out');
const zoomInBtn = document.getElementById('zoom-in');
const insertLogoBtn = document.getElementById('insert-logo');
const saveBtn = document.getElementById('save');

console.log('Zděšenka editor: elementy načteny', {
  placeholderEl, messageEl, stageWrapperEl, stageEl, backgroundEl,
  logoLayerEl, logoImgEl, logoHandleEl,
  zoomOutBtn, zoomInBtn, insertLogoBtn, saveBtn,
});

const state = {
  background: null,
  logo: null,
};

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

function setControlsEnabled(enabled) {
  zoomOutBtn.disabled = !enabled;
  zoomInBtn.disabled = !enabled;
  insertLogoBtn.disabled = !enabled;
  saveBtn.disabled = !enabled;
}

function render() {
  if (!state.background) {
    placeholderEl.hidden = false;
    backgroundEl.hidden = true;
    logoLayerEl.hidden = true;
    return;
  }

  placeholderEl.hidden = true;
  backgroundEl.hidden = false;
  backgroundEl.src = state.background.bitmap.src;
  backgroundEl.width = state.background.width;
  backgroundEl.height = state.background.height;

  if (state.logo) {
    logoLayerEl.hidden = false;
  } else {
    logoLayerEl.hidden = true;
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek'));
    img.src = URL.createObjectURL(file);
  });
}

document.addEventListener('paste', async (event) => {
  const items = event.clipboardData ? Array.from(event.clipboardData.items) : [];
  const imageItem = items.find((item) => item.type.startsWith('image/'));

  if (!imageItem) {
    showMessage('Ve schránce není obrázek');
    return;
  }

  const file = imageItem.getAsFile();
  const bitmap = await loadImage(file);

  state.background = {
    bitmap,
    naturalWidth: bitmap.naturalWidth,
    naturalHeight: bitmap.naturalHeight,
    scale: 1,
    width: bitmap.naturalWidth,
    height: bitmap.naturalHeight,
  };
  state.logo = null;

  hideMessage();
  setControlsEnabled(true);
  render();
});

function setBackgroundScale(newScale) {
  if (!state.background) return;
  state.background.scale = clamp(newScale, BACKGROUND_MIN_SCALE, BACKGROUND_MAX_SCALE);
  const { width, height } = computeScaledDimensions(
    state.background.naturalWidth,
    state.background.naturalHeight,
    state.background.scale
  );
  state.background.width = width;
  state.background.height = height;
  render();
}

zoomInBtn.addEventListener('click', () => {
  setBackgroundScale(state.background.scale * BACKGROUND_ZOOM_STEP);
});

zoomOutBtn.addEventListener('click', () => {
  setBackgroundScale(state.background.scale / BACKGROUND_ZOOM_STEP);
});

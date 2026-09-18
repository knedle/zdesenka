import { clamp, computeScaledDimensions, displayToLogicalScale, displayDeltaToLogicalDelta, centerPoint } from './geometry.js';
import { composeImage } from './export.js';

const BACKGROUND_ZOOM_STEP = 1.1;
const BACKGROUND_MIN_SCALE = 0.05;
const BACKGROUND_MAX_SCALE = 10;
const LOGO_MIN_SCALE = 0.05;
const LOGO_MAX_SCALE = 20;

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
    const { width: logoWidth, height: logoHeight } = computeScaledDimensions(
      logoImgEl.naturalWidth,
      logoImgEl.naturalHeight,
      state.logo.scale
    );
    const left = state.logo.x - logoWidth / 2;
    const top = state.logo.y - logoHeight / 2;
    logoLayerEl.style.width = `${logoWidth}px`;
    logoLayerEl.style.height = `${logoHeight}px`;
    logoLayerEl.style.transform = `translate(${left}px, ${top}px)`;
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

async function setBackgroundFromFile(file) {
  try {
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
  } catch (error) {
    showMessage('Nepodařilo se načíst obrázek');
  }
}

document.addEventListener('paste', (event) => {
  const items = event.clipboardData ? Array.from(event.clipboardData.items) : [];
  const imageItem = items.find((item) => item.type.startsWith('image/'));

  if (!imageItem) {
    showMessage('Ve schránce není obrázek');
    return;
  }

  const file = imageItem.getAsFile();
  if (!file) {
    showMessage('Ve schránce není obrázek');
    return;
  }

  setBackgroundFromFile(file);
});

stageWrapperEl.addEventListener('dragover', (event) => {
  event.preventDefault();
  stageWrapperEl.classList.add('drag-over');
});

stageWrapperEl.addEventListener('dragleave', () => {
  stageWrapperEl.classList.remove('drag-over');
});

stageWrapperEl.addEventListener('drop', (event) => {
  event.preventDefault();
  stageWrapperEl.classList.remove('drag-over');

  const files = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
  const file = files.find((item) => item.type.startsWith('image/'));

  if (!file) {
    showMessage('Přetažený soubor není obrázek');
    return;
  }

  setBackgroundFromFile(file);
});

function setBackgroundScale(newScale) {
  if (!state.background) return;
  state.background.scale = clamp(newScale, BACKGROUND_MIN_SCALE, BACKGROUND_MAX_SCALE);
  const { width, height } = computeScaledDimensions(
    state.background.naturalWidth,
    state.background.naturalHeight,
    state.background.scale
  );
  if (state.logo) {
    const ratio = width / state.background.width;
    state.logo.x *= ratio;
    state.logo.y *= ratio;
    state.logo.scale *= ratio;
  }
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

insertLogoBtn.addEventListener('click', () => {
  if (!state.background) return;
  const center = centerPoint(state.background.width, state.background.height);
  state.logo = { x: center.x, y: center.y, scale: 1 };
  render();
});

logoLayerEl.addEventListener('pointerdown', (event) => {
  if (event.target === logoHandleEl) return;
  event.preventDefault();
  logoLayerEl.setPointerCapture(event.pointerId);

  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const startLogoX = state.logo.x;
  const startLogoY = state.logo.y;
  const displayScale = displayToLogicalScale(
    stageEl.getBoundingClientRect().width,
    state.background.width
  );

  function onMove(moveEvent) {
    const deltaDisplayX = moveEvent.clientX - startClientX;
    const deltaDisplayY = moveEvent.clientY - startClientY;
    state.logo.x = startLogoX + displayDeltaToLogicalDelta(deltaDisplayX, displayScale);
    state.logo.y = startLogoY + displayDeltaToLogicalDelta(deltaDisplayY, displayScale);
    render();
  }

  function onUp() {
    logoLayerEl.releasePointerCapture(event.pointerId);
    logoLayerEl.removeEventListener('pointermove', onMove);
    logoLayerEl.removeEventListener('pointerup', onUp);
  }

  logoLayerEl.addEventListener('pointermove', onMove);
  logoLayerEl.addEventListener('pointerup', onUp);
});

function distanceFromLogoCenter(clientX, clientY) {
  const stageRect = stageEl.getBoundingClientRect();
  const displayScale = displayToLogicalScale(stageRect.width, state.background.width);
  const px = displayDeltaToLogicalDelta(clientX - stageRect.left, displayScale);
  const py = displayDeltaToLogicalDelta(clientY - stageRect.top, displayScale);
  const dx = px - state.logo.x;
  const dy = py - state.logo.y;
  return Math.sqrt(dx * dx + dy * dy);
}

logoHandleEl.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  event.stopPropagation();
  logoHandleEl.setPointerCapture(event.pointerId);

  const startScale = state.logo.scale;
  const startDistance = distanceFromLogoCenter(event.clientX, event.clientY);

  function onMove(moveEvent) {
    const distance = distanceFromLogoCenter(moveEvent.clientX, moveEvent.clientY);
    const ratio = distance / startDistance;
    state.logo.scale = clamp(startScale * ratio, LOGO_MIN_SCALE, LOGO_MAX_SCALE);
    render();
  }

  function onUp() {
    logoHandleEl.releasePointerCapture(event.pointerId);
    logoHandleEl.removeEventListener('pointermove', onMove);
    logoHandleEl.removeEventListener('pointerup', onUp);
  }

  logoHandleEl.addEventListener('pointermove', onMove);
  logoHandleEl.addEventListener('pointerup', onUp);
});

saveBtn.addEventListener('click', async () => {
  if (!state.background) return;
  const blob = await composeImage(state.background, state.logo, logoImgEl);
  if (!blob) {
    showMessage('Obrázek je příliš velký na uložení');
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'zdesenka.png';
  link.click();
  URL.revokeObjectURL(url);
});

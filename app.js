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

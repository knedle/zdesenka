# Zděšenka editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statická jednostránková webová aplikace, do které lze vložit obrázek přes Ctrl+V, zvětšit/zmenšit jeho skutečné rozlišení, vložit doprostřed logo `jsemZdesena.png`, tažením a škálováním logo upravit, a výsledek uložit jako jeden PNG soubor.

**Architecture:** Čisté HTML/CSS/JS bez buildu a bez závislostí. `app.js` drží stav (`background`, `logo`) a řídí DOM/pointer eventy; čisté výpočetní funkce (škálování, převod souřadnic) jsou vyčleněné do `geometry.js`, aby šly ověřit izolovaně přes Node. `export.js` skládá finální PNG na offscreen `<canvas>`.

**Tech Stack:** Vanilla HTML/CSS/JS (ES moduly), žádný bundler, žádné npm závislosti. Lokální testování přes `python -m http.server` (ES moduly vyžadují http(s), ne `file://`).

**Spec:** `docs/superpowers/specs/2026-08-29-zdesenka-editor-design.md`

## Global Constraints

- Žádný build krok, žádné npm závislosti — vše musí fungovat jako statické soubory přímo nasaditelné na GitHub Pages z kořene repozitáře.
- Souřadnice loga (`x, y`) se vždy počítají a ukládají v pixelových souřadnicích podkladu (logických px), ne v CSS/obrazovkových px — export musí odpovídat náhledu bez ohledu na aktuální zobrazovací poměr.
- Resize podkladu se vždy počítá z původní (nezmenšené) bitmapy — `state.background.bitmap` se po vytvoření nikdy nepřepisuje zmenšenou verzí.
- Poměr stran loga se při škálování nikdy nemění nezávisle v X a Y.
- Žádné blokující `window.confirm`/`window.alert` dialogy.
- Bez automatizovaného test frameworku ani `tests/` adresáře v repozitáři (rozhodnutí ze schváleného spec dokumentu) — geometrické funkce se ověřují ad-hoc přes `node -e`, zbytek manuálně v prohlížeči podle checklistu ze spec dokumentu.
- Export tlačítko („Uložit“) i ovládání zoomu/vložení loga jsou disabled, dokud není vložen podkladový obrázek.

---

## Předem uzamčený návrh souborů a rozhraní

Aby na sebe úkoly navazovaly beze zmatků, zde je finální podoba klíčových souborů, na kterou se úkoly níže odkazují.

**`index.html`** — kompletní markup (žádné další prvky se později nepřidávají):

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zděšenka editor</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="toolbar">
    <h1>Zděšenka editor</h1>
    <div class="toolbar-controls">
      <button id="zoom-out" type="button" disabled>Zmenšit obrázek</button>
      <button id="zoom-in" type="button" disabled>Zvětšit obrázek</button>
      <button id="insert-logo" type="button" disabled>Vložit Zděšenku</button>
      <button id="save" type="button" disabled>Uložit</button>
    </div>
  </header>

  <main id="stage-wrapper">
    <p id="placeholder">Vlož obrázek (Ctrl+V)</p>
    <p id="message" hidden></p>
    <div id="stage">
      <img id="background" alt="" hidden />
      <div id="logo-layer" hidden>
        <img id="logo" src="jsemZdesena.png" alt="Zděšenka" draggable="false" />
        <div id="logo-handle"></div>
      </div>
    </div>
  </main>

  <script type="module" src="app.js"></script>
</body>
</html>
```

**Stavový model v `app.js`:**

```js
const state = {
  background: null, // { bitmap: HTMLImageElement, naturalWidth, naturalHeight, scale, width, height }
  logo: null,        // { x, y, scale } — x,y = střed loga v logických px podkladu
};
```

**`geometry.js` — veřejné funkce (used napříč `app.js` a `export.js`):**

```js
export function clamp(value, min, max)
export function computeScaledDimensions(naturalWidth, naturalHeight, scale) // -> { width, height } (zaokrouhlené na celé px)
export function displayToLogicalScale(displayWidth, logicalWidth)          // -> poměr display/logical
export function displayDeltaToLogicalDelta(deltaDisplayPx, displayScale)   // -> deltaDisplayPx / displayScale
export function centerPoint(width, height)                                  // -> { x: width/2, y: height/2 }
```

**`export.js` — veřejná funkce:**

```js
export function composeImage(background, logo, logoImageElement) // -> Promise<Blob> (image/png)
```

---

### Task 1: Scaffold — HTML kostra, CSS layout, prázdné app.js

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`

**Interfaces:**
- Produces: DOM strukturu a element ID popsané v sekci "Předem uzamčený návrh souborů" výše — všechny další úkoly na ně odkazují (`#zoom-out`, `#zoom-in`, `#insert-logo`, `#save`, `#placeholder`, `#message`, `#stage-wrapper`, `#stage`, `#background`, `#logo-layer`, `#logo`, `#logo-handle`).

- [ ] **Krok 1: Vytvořit `index.html`**

Použít přesně markup ze sekce "Předem uzamčený návrh souborů" výše.

- [ ] **Krok 2: Vytvořit `style.css`**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #1a1a1a;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #ddd;
}

.toolbar h1 {
  font-size: 1.1rem;
  margin: 0;
  margin-right: auto;
}

.toolbar-controls button {
  margin-left: 0.5rem;
}

#stage-wrapper {
  position: relative;
  margin: 1rem;
  padding: 1rem;
  overflow: auto;
  max-height: 80vh;
  border: 1px dashed #bbb;
}

#placeholder {
  color: #888;
  text-align: center;
}

#message {
  color: #b00020;
  font-weight: 600;
}

#stage {
  position: relative;
  display: inline-block;
}

#background {
  display: block;
}

#logo-layer {
  position: absolute;
  top: 0;
  left: 0;
  cursor: move;
  touch-action: none;
}

#logo {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

#logo-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  right: -7px;
  bottom: -7px;
  background: #0066ff;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: nwse-resize;
  touch-action: none;
}
```

- [ ] **Krok 3: Vytvořit prázdné `app.js`, které jen ověří napojení elementů**

```js
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
```

- [ ] **Krok 4: Manuální ověření**

Spustit lokální server: `python -m http.server 8000` v kořeni repozitáře, otevřít `http://localhost:8000/` v prohlížeči.

Ověřit:
- Zobrazí se text „Vlož obrázek (Ctrl+V)“.
- V toolbaru jsou 4 tlačítka, všechna disabled (šedá, neklikatelná).
- V konzoli (DevTools) se vypíše `Zděšenka editor: elementy načteny` s objektem, kde žádná hodnota není `null`.
- V konzoli nejsou žádné chyby.

- [ ] **Krok 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: scaffold Zděšenka editor page"
```

---

### Task 2: geometry.js — čisté výpočetní funkce

**Files:**
- Create: `geometry.js`

**Interfaces:**
- Produces: `clamp`, `computeScaledDimensions`, `displayToLogicalScale`, `displayDeltaToLogicalDelta`, `centerPoint` — signatury viz sekce "Předem uzamčený návrh souborů". Používá se v Task 3, 4, 5, 6, 7, 8.

- [ ] **Krok 1: Napsat `geometry.js`**

```js
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function computeScaledDimensions(naturalWidth, naturalHeight, scale) {
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  };
}

export function displayToLogicalScale(displayWidth, logicalWidth) {
  return displayWidth / logicalWidth;
}

export function displayDeltaToLogicalDelta(deltaDisplayPx, displayScale) {
  return deltaDisplayPx / displayScale;
}

export function centerPoint(width, height) {
  return { x: width / 2, y: height / 2 };
}
```

- [ ] **Krok 2: Ad-hoc ověření přes Node (bez perzistentní test suite, viz Global Constraints)**

Run:

```bash
node -e "
import('./geometry.js').then(({ clamp, computeScaledDimensions, displayToLogicalScale, displayDeltaToLogicalDelta, centerPoint }) => {
  console.assert(clamp(5, 0, 10) === 5, 'clamp mid');
  console.assert(clamp(-1, 0, 10) === 0, 'clamp low');
  console.assert(clamp(99, 0, 10) === 10, 'clamp high');

  const dims = computeScaledDimensions(200, 100, 1.5);
  console.assert(dims.width === 300 && dims.height === 150, 'computeScaledDimensions');

  const scale = displayToLogicalScale(100, 200);
  console.assert(scale === 0.5, 'displayToLogicalScale');

  const delta = displayDeltaToLogicalDelta(10, 0.5);
  console.assert(delta === 20, 'displayDeltaToLogicalDelta');

  const c = centerPoint(300, 150);
  console.assert(c.x === 150 && c.y === 75, 'centerPoint');

  console.log('geometry.js: vsechny kontroly OK');
});
"
```

Expected output: `geometry.js: vsechny kontroly OK` a žádné `Assertion failed` řádky.

- [ ] **Krok 3: Commit**

```bash
git add geometry.js
git commit -m "feat: add pure geometry helper functions"
```

---

### Task 3: Vložení obrázku přes Ctrl+V (paste handling)

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: nic z geometry.js zatím (podklad se vkládá vždy v přirozené velikosti, `scale = 1`).
- Produces: `state.background` naplněný po úspěšném paste; `render()` funkci, kterou budou volat i další úkoly; `showMessage(text)` / `hideMessage()` pomocné funkce.

- [ ] **Krok 1: Doplnit stav, `render()`, `showMessage`/`hideMessage` a paste handler do `app.js`**

Přidat na konec `app.js` (za existující deklarace elementů):

```js
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
```

- [ ] **Krok 2: Manuální ověření**

Spustit `python -m http.server 8000`, otevřít stránku, zkopírovat libovolný obrázek (např. screenshot přes systémový nástroj) do schránky a stisknout Ctrl+V na stránce.

Ověřit:
- Placeholder zmizí, zobrazí se vložený obrázek v původní velikosti.
- V DevTools konzoli `state.background` (dočasně přes `window.state = state;` na konci souboru, nebo přes breakpoint) má správné `naturalWidth`/`naturalHeight` odpovídající skutečnému obrázku.
- Všechna 4 tlačítka v toolbaru jsou nyní aktivní (nejsou disabled).
- Zkopírování textu (ne obrázku) do schránky a Ctrl+V zobrazí hlášku „Ve schránce není obrázek“, obrázek na ploše se nezmění.
- Vložení druhého (jiného) obrázku nahradí ten první.

- [ ] **Krok 3: Commit**

```bash
git add app.js
git commit -m "feat: handle Ctrl+V paste to set background image"
```

---

### Task 4: Ovládání zoomu podkladu (skutečná změna rozlišení)

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `computeScaledDimensions`, `clamp` z `geometry.js`.
- Produces: `setBackgroundScale(newScale)` — používá se pouze interně v tomto úkolu, ale dokumentováno pro přehlednost.

- [ ] **Krok 1: Přidat import a konstanty na začátek `app.js`**

```js
import { clamp, computeScaledDimensions, displayToLogicalScale, displayDeltaToLogicalDelta, centerPoint } from './geometry.js';

const BACKGROUND_ZOOM_STEP = 1.1;
const BACKGROUND_MIN_SCALE = 0.05;
const BACKGROUND_MAX_SCALE = 10;
```

(Importují se rovnou i funkce potřebné pro Task 5–7, aby se `app.js` needitoval opakovaně na stejném řádku.)

- [ ] **Krok 2: Přidat `setBackgroundScale` a napojit tlačítka**

Přidat do `app.js`:

```js
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
```

- [ ] **Krok 3: Manuální ověření**

Otevřít stránku, vložit obrázek, opakovaně klikat na „Zvětšit obrázek“ a „Zmenšit obrázek“.

Ověřit:
- Obrázek na ploše viditelně mění velikost při každém kliknutí.
- Opakované zvětšení a pak zmenšení zpět na `scale = 1` vypadá stejně ostře jako originál (žádná degradace, protože `state.background.bitmap` se nikdy nepřepisuje).
- Zoom nejde zmenšit do nuly ani záporných hodnot ani při mnoha rychlých kliknutích (respektuje `BACKGROUND_MIN_SCALE`/`MAX_SCALE`).

- [ ] **Krok 4: Commit**

```bash
git add app.js
git commit -m "feat: add background zoom in/out controls"
```

---

### Task 5: Vložení loga (vycentrované, zatím bez tažení/škálování)

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `centerPoint`, `computeScaledDimensions` z `geometry.js`.
- Produces: `state.logo` naplněný po kliknutí na „Vložit Zděšenku“; rozšířený `render()`, který pozicuje `#logo-layer` podle `state.logo`.

- [ ] **Krok 1: Doplnit konstantu pro škálu loga a napojit tlačítko**

Přidat do `app.js`:

```js
const LOGO_MIN_SCALE = 0.05;
const LOGO_MAX_SCALE = 20;

insertLogoBtn.addEventListener('click', () => {
  if (!state.background) return;
  const center = centerPoint(state.background.width, state.background.height);
  state.logo = { x: center.x, y: center.y, scale: 1 };
  render();
});
```

- [ ] **Krok 2: Rozšířit `render()` o pozicování loga**

Nahradit v `render()` blok:

```js
  if (state.logo) {
    logoLayerEl.hidden = false;
  } else {
    logoLayerEl.hidden = true;
  }
```

za:

```js
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
```

- [ ] **Krok 3: Manuální ověření**

Otevřít stránku, vložit obrázek, kliknout na „Vložit Zděšenku“.

Ověřit:
- Logo se objeví vycentrované na podkladovém obrázku.
- Logo má správný poměr stran (není zdeformované).
- Opakované kliknutí na „Vložit Zděšenku“ logo znovu vycentruje (reset pozice).
- Vložení nového obrázku (nový paste) logo z plochy odstraní (viz `state.logo = null` v Task 3).

- [ ] **Krok 4: Commit**

```bash
git add app.js
git commit -m "feat: insert centered logo layer"
```

---

### Task 6: Tažení loga myší/dotykem

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `displayToLogicalScale`, `displayDeltaToLogicalDelta` z `geometry.js`.
- Produces: interaktivní tažení `#logo-layer`, mění `state.logo.x`/`state.logo.y`.

- [ ] **Krok 1: Přidat pointer handlery pro tažení**

Přidat do `app.js`:

```js
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
```

- [ ] **Krok 2: Manuální ověření**

Otevřít stránku, vložit obrázek, vložit logo, tažením myší logo přesunout na jiné místo.

Ověřit:
- Logo plynule sleduje kurzor při tažení (bez trhání/zpoždění).
- Po puštění tlačítka myši logo zůstane na nové pozici.
- Tažení mimo hranice podkladového obrázku nezpůsobí chybu v konzoli (logo může vizuálně přesáhnout okraj — to je v pořádku, spec nevyžaduje omezení).

- [ ] **Krok 3: Commit**

```bash
git add app.js
git commit -m "feat: make logo draggable"
```

---

### Task 7: Škálování loga přes úchyt (v poměru stran)

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `clamp`, `displayToLogicalScale`, `displayDeltaToLogicalDelta` z `geometry.js`.
- Produces: interaktivní škálování přes `#logo-handle`, mění `state.logo.scale`.

- [ ] **Krok 1: Přidat pointer handlery pro škálování**

Přidat do `app.js`:

```js
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
```

- [ ] **Krok 2: Manuální ověření**

Otevřít stránku, vložit obrázek, vložit logo, tažením modrého úchytu v pravém dolním rohu loga logo zvětšit a zmenšit.

Ověřit:
- Logo se plynule zvětšuje/zmenšuje tažením úchytu.
- Poměr stran loga zůstává zachovaný při všech velikostech (změřit šířku/výšku loga v DevTools a zkontrolovat, že poměr odpovídá originálnímu PNG).
- Tažení úchytu nehýbe s pozicí loga (mění se jen velikost, ne `x`/`y`).
- Logo nejde zmenšit na nulovou/zápornou velikost ani při přetažení úchytu přes střed loga.

- [ ] **Krok 3: Commit**

```bash
git add app.js
git commit -m "feat: make logo resizable via corner handle"
```

---

### Task 8: Export a stažení výsledného PNG

**Files:**
- Create: `export.js`
- Modify: `app.js`

**Interfaces:**
- Consumes (v `export.js`): `computeScaledDimensions` z `geometry.js`.
- Produces: `composeImage(background, logo, logoImageElement)` — viz signatura v sekci "Předem uzamčený návrh souborů".

- [ ] **Krok 1: Napsat `export.js`**

```js
import { computeScaledDimensions } from './geometry.js';

export function composeImage(background, logo, logoImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = background.width;
  canvas.height = background.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(background.bitmap, 0, 0, background.width, background.height);

  if (logo) {
    const { width: logoWidth, height: logoHeight } = computeScaledDimensions(
      logoImageElement.naturalWidth,
      logoImageElement.naturalHeight,
      logo.scale
    );
    ctx.drawImage(
      logoImageElement,
      logo.x - logoWidth / 2,
      logo.y - logoHeight / 2,
      logoWidth,
      logoHeight
    );
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
```

- [ ] **Krok 2: Napojit export v `app.js`**

Přidat import na začátek `app.js`:

```js
import { composeImage } from './export.js';
```

Přidat na konec `app.js`:

```js
saveBtn.addEventListener('click', async () => {
  if (!state.background) return;
  const blob = await composeImage(state.background, state.logo, logoImgEl);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'zdesenka.png';
  link.click();
  URL.revokeObjectURL(url);
});
```

- [ ] **Krok 3: Manuální ověření**

Otevřít stránku, vložit obrázek, zvětšit/zmenšit ho, vložit logo, přetáhnout a zmenšit/zvětšit logo, kliknout na „Uložit“.

Ověřit:
- Prohlížeč stáhne soubor `zdesenka.png`.
- Otevření staženého souboru ukazuje kompozici, která vizuálně odpovídá tomu, co bylo vidět na stránce (pozice, velikost a poměr stran loga sedí).
- Rozlišení staženého PNG odpovídá aktuálnímu `state.background.width/height` (zkontrolovat přes vlastnosti souboru nebo otevřením v editoru obrázků).
- Export bez vloženého loga (jen podklad) funguje také — stáhne se PNG jen s podkladem.

- [ ] **Krok 4: Commit**

```bash
git add export.js app.js
git commit -m "feat: export composed background+logo image as PNG download"
```

---

### Task 9: Finální manuální QA podle spec checklistu

**Files:**
- Modify: `app.js` (pouze pokud QA odhalí konkrétní chybu k opravě)

**Interfaces:**
- Nekonzumuje ani neprodukuje nové rozhraní — jde o závěrečné ověření celého toku podle checklistu ve spec dokumentu.

- [ ] **Krok 1: Projít celý checklist ze spec dokumentu**

Spustit `python -m http.server 8000`, otevřít stránku a projít bod po bodu checklist z `docs/superpowers/specs/2026-08-29-zdesenka-editor-design.md` (sekce "Testování"):

- Paste obrázku ze schránky vytvoří podklad se správným rozlišením.
- Zvětšení/zmenšení podkladu skutečně mění výsledné rozlišení (ověřit na exportu).
- Opakované zvětšení/zmenšení nedegraduje kvalitu.
- „Vložit Zděšenku“ přidá logo vycentrované na plátně.
- Tažení loga mění jeho pozici plynule.
- Škálování loga zachovává poměr stran.
- Export vytvoří PNG odpovídající náhledu.
- Funguje na obrázcích různých poměrů stran (na výšku, na šířku, čtverec) a na velmi velkých/malých obrázcích.
- Opakovaný paste nového obrázku správně nahradí předchozí a resetuje logo.

- [ ] **Krok 2: Opravit případné nalezené chyby**

Pokud některý bod selže, opravit přímo v `app.js`/`export.js`/`geometry.js` a znovu ověřit daný bod ručně (bez automatizovaných testů, dle Global Constraints).

- [ ] **Krok 3: Commit (pouze pokud došlo k opravám v kroku 2)**

```bash
git add app.js export.js geometry.js
git commit -m "fix: address issues found in manual QA pass"
```

Pokud QA neodhalilo žádné problémy, tento krok se přeskočí — commit z Task 8 zůstává poslední.

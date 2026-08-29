# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stav repozitáře

Aplikace je hotová a implementovaná. Repozitář je reálný git repozitář s historií commitů (implementace proběhla postupně napříč několika úkoly). Obsahuje:

- `index.html` — jediná stránka aplikace, `app.js` je načtený jako `<script type="module">`.
- `style.css` — styly.
- `app.js` — hlavní logika: obsluha vložení ze schránky (Ctrl+V), zoom podkladu, vložení/přesun/změna velikosti loga, napojení na export.
- `geometry.js` — čisté pomocné geometrické funkce (škálování, clamp, přepočet display↔logických souřadnic) beze stavu a bez závislosti na DOM.
- `export.js` — složení podkladu a loga do jednoho `<canvas>` a export jako PNG (`canvas.toBlob`).
- `jsemZdesena.png` — logo ("JSEM ZDĚŠENA!", vraní grafika), které se vkládá do uživatelských obrázků.
- `project.md` — původní zadání projektu v češtině (viz níže).

Žádný build krok, bundler ani závislosti (žádné `node_modules`, žádný `package.json`) — čisté HTML/CSS/JS. `app.js` používá ES moduly (`import`/`export`), takže stránku je nutné servírovat přes http(s) (např. `python -m http.server`), **ne** otvírat přímo jako `file://` — moduly by se v tom případě nenačetly kvůli CORS omezením prohlížečů.

Zdroj pravdy pro návrh a rozhodnutí je v:

- `docs/superpowers/specs/2026-08-29-zdesenka-editor-design.md` — specifikace/design.
- `docs/superpowers/plans/2026-08-29-zdesenka-editor.md` — implementační plán rozdělený na úkoly.

## Zadání projektu (`project.md`)

Vytvořit webovou stránku, která je prázdné plátno:

1. Umožnit vložení obrázku přes Ctrl+V.
2. Umožnit uživateli manipulovat s velikostí vloženého obrázku — pro první verzi stačí zvětšovat/zmenšovat.
3. Přidat tlačítko (např. vpravo nahoře) s popiskem **"Vložit Zděšenku"**, které vloží logo `jsemZdesena.png` doprostřed vloženého obrázku.
4. Po vložení musí být možné s logem dále manipulovat: posouvat, zmenšovat a zvětšovat — v poměru (zachovat proporce).
5. Nakonec umožnit výsledný obrázek **uložit** (podkladový obrázek + umístěné/zmenšené logo) jako jeden výsledný obrázek.

### Záměr nasazení

- Ideálně nasadit jako statický web na **GitHub Pages**, stejně jako sesterské projekty zmíněné v zadání ("formuláře", "trollpacky") — tzn. jde o samostatnou statickou HTML/JS aplikaci bez backendu, nasaditelnou přes GitHub Pages.
- Pokud nasazení na GitHub Pages nepůjde, alternativou je vytvořit místo kódu **MD plán implementace**, který půjde předat no-code/AI nástroji pro tvorbu stránek (zadání zmiňuje "Lovable" nebo "Macaly" jako příklady).

### Skutečná architektura (jak je to implementované)

Jednostránková aplikace čistě na straně klienta, bez frameworku — žádné zpracování na serveru, nasaditelná jako statické soubory na GitHub Pages:

- Podklad (vložený obrázek) se vykresluje jako `<img>` element, logo jako absolutně umístěná vrstva (`#logo-layer`) nad ním — obě vrstvy jsou v DOMu, ne v `<canvas>`, dokud se výsledek neuloží.
- Vložení ze schránky: `paste` event listener na `document`, hledá `image/*` položku v `clipboardData.items`, načte ji přes `Image` + `URL.createObjectURL`.
- Přesun loga: `pointerdown`/`pointermove`/`pointerup` na `#logo-layer` s pointer capture; změna velikosti přes samostatný úchyt (`#logo-handle`), který škáluje logo od jeho středu a zachovává poměr stran.
- Zoom podkladu: tlačítka zoom in/out přepočítávají `state.background.scale` (`geometry.js` → `computeScaledDimensions`); logo se při změně měřítka podkladu přeškáluje spolu s ním, aby zůstala zachována jeho relativní pozice a velikost vůči podkladu.
- Export/uložení: `export.js` → `composeImage()` vykreslí podklad i logo do jednoho dočasného `<canvas>` a přes `canvas.toBlob()` vytvoří PNG, které se stáhne přes dočasný `<a download>` odkaz.
- Chybové stavy (chybí obrázek ve schránce, nepodařilo se načíst obrázek, canvas je při exportu příliš velký na `toBlob()`) se hlásí uživateli přes `showMessage()` do `#message` prvku, česky.

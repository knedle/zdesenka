# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stav repozitáře

Tento repozitář zatím obsahuje pouze zadání a jeden asset — **žádný kód ještě nebyl napsán**:

- `project.md` — zadání projektu v češtině.
- `jsemZdesena.png` — logo ("JSEM ZDĚŠENA!", vraní grafika), které musí jít vkládat do uživatelských obrázků.

Toto zatím není git repozitář. Při zahájení implementace je potřeba inicializovat git a nastavit toolchain podle zvoleného způsobu nasazení (viz "Nasazení" níže) — žádný existující build/lint/test setup zatím není, není co zachovávat.

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

### Předpokládaná architektura (jakmile se začne implementovat)

Protože cílem je statická stránka bez backendu:

- Jednostránková aplikace čistě na straně klienta (HTML/CSS/JS, případně lehký framework, pokud se zavede) — žádné zpracování na serveru, takže jde nasadit jako statické soubory na GitHub Pages.
- Klíčové interakce: vložení ze schránky → `<canvas>` (nebo absolutně umístěná obrazová vrstva), přetahovatelná/změnitelná vrstva pro logo a export z canvasu (např. `canvas.toDataURL()` / `toBlob()`) pro finální uložení.
- Při zmenšování/zvětšování loga zachovávat poměr stran, dle zadání ("zmenšovat, zvětšovat v poměru").

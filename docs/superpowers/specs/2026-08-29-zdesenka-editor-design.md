# Zděšenka editor — návrh

Datum: 2026-08-29
Stav: schváleno uživatelem, připraveno k implementaci

## Cíl

Jednostránkový webový nástroj: uživatel vloží obrázek přes Ctrl+V, může
změnit jeho rozlišení (zvětšit/zmenšit), přes tlačítko vloží doprostřed
logo `jsemZdesena.png`, se kterým dál může hýbat a měnit jeho velikost
(v poměru stran), a nakonec výsledek uloží jako jeden PNG soubor.

Cílové nasazení: statická stránka na GitHub Pages, bez backendu —
stejně jako sesterské projekty zmíněné v `project.md` ("formuláře",
"trollpacky").

## Technologie

Čisté HTML/CSS/JS, žádný build krok, žádné závislosti. Soubory v
kořeni repozitáře, aby šly přímo nasadit na GitHub Pages:

- `index.html`
- `style.css`
- `app.js`
- `jsemZdesena.png` (existující asset, zůstává v kořeni)

Git repozitář byl založen lokálně (`git init`); vytvoření GitHub repa,
připojení remote a push řeší uživatel sám.

## Architektura a komponenty

### 1. Stage (plocha)

Prázdná při načtení stránky, zobrazuje výzvu „Vlož obrázek (Ctrl+V)“.
Naslouchá `paste` eventu na `document`. Z `event.clipboardData.items`
vezme první položku typu `image/*`, dekóduje ji (např. přes
`createImageBitmap` nebo `Image` + object URL) a uloží jako podkladovou
vrstvu.

Logická velikost plátna = přirozené pixelové rozměry vloženého
obrázku. Zobrazení na stránce může být menší (CSS `max-width`, aby se
vešlo do okna), ale interní rozlišení a souřadnice se vždy počítají v
pixelech podkladového obrázku, ne v CSS/obrazovkových px.

### 2. Ovládání velikosti podkladu

Tlačítka (nebo slider) zvětšit/zmenšit, které mění **skutečné**
rozlišení podkladu — ne jen vizuální CSS zoom. Aby při opakovaném
zmenšování/zvětšování nedocházelo k degradaci kvality, resize se vždy
počítá z původní (nezmenšené) bitmapy, ne z aktuálně zobrazené zmenšené
verze. Poměr stran se zachovává.

### 3. Vložení loga

Tlačítko „Vložit Zděšenku“ (vpravo nahoře) přidá `jsemZdesena.png` jako
samostatnou vrstvu — absolutně pozicovaný `<img>` element nad
podkladem, vycentrovaný na plátně. Reprezentace stavu loga:

```
logo = { x, y, scale }
```

kde `x, y` je střed loga v pixelových souřadnicích podkladu (ne CSS
px) a `scale` je násobek jeho přirozené velikosti.

Logo je:
- **táhnutelné** — pointer events (`pointerdown`/`pointermove`/`pointerup`)
  mění `x, y`; při přepočtu z obrazovkových CSS souřadnic na pixelové
  souřadnice podkladu se použije aktuální poměr zobrazované vs.
  skutečné velikosti plátna.
- **škálovatelné v poměru stran** — např. úchyt v rohu loga nebo
  tlačítka +/-, mění `scale`; poměr stran loga se nikdy nemění
  nezávisle v X a Y.

Vizuálně se `x, y, scale` promítají do CSS transformu (`translate` +
`scale`) daného `<img>` elementu, přepočtené na aktuální zobrazovací
poměr plátna.

### 4. Export („Uložit“)

Tlačítko je neaktivní, dokud není vložen podkladový obrázek. Po
kliknutí:

1. Vytvoří se offscreen `<canvas>` o rozměrech aktuálního (případně
   zmenšeného/zvětšeného) podkladu.
2. Vykreslí se podkladová bitmapa (`drawImage`).
3. Vykreslí se logo na pozici `x, y` se `scale` — vše v souřadnicích
   podkladu, takže výsledek odpovídá tomu, co uživatel viděl na
   obrazovce, bez ohledu na aktuální zobrazovací zoom okna.
4. `canvas.toBlob('image/png')` → vytvoří se dočasný `<a download>`
   odkaz a spustí se stažení souboru.

## Ošetření chyb a hraničních případů

- **Paste bez obrázku ve schránce** — zobrazí se krátká inline hláška
  „Ve schránce není obrázek“, žádná změna stavu.
- **Vícenásobný paste** — nový vložený obrázek nahradí předchozí
  podklad a resetuje logo (odstraní ho z plátna, pokud tam bylo).
  Bez potvrzovacího dialogu (žádný blokující `window.confirm`/`alert`,
  aby nešlo o rušivou UX ani technický risk s blokujícími dialogy).
- **Export bez podkladu** — tlačítko „Uložit“ je disabled.
- **Prohlížečová podpora** — `paste` event + `clipboardData.items`
  funguje bez zvláštních oprávnění v běžných prohlížečích (Chrome,
  Firefox, Edge); nepoužívá se `navigator.clipboard.read()`, který by
  vyžadoval permission prompt.

## Testování

Bez automatizovaného test frameworku — jde o malý jednostránkový
nástroj bez logiky, která by potřebovala jednotkové testy nad rámec
manuálního ověření chování v prohlížeči. Manuální kontrolní seznam:

- [ ] Paste obrázku z schránky vytvoří podklad se správným rozlišením.
- [ ] Zvětšení/zmenšení podkladu skutečně mění výsledné rozlišení
      (ověřit na exportu), ne jen vizuální zobrazení.
- [ ] Opakované zvětšení/zmenšení nedegraduje kvalitu (počítá se z
      originální bitmapy).
- [ ] „Vložit Zděšenku“ přidá logo vycentrované na plátně.
- [ ] Tažení loga myší/dotykem mění jeho pozici plynule.
- [ ] Škálování loga zachovává poměr stran.
- [ ] Export vytvoří PNG, které vizuálně odpovídá náhledu (pozice a
      velikost loga sedí).
- [ ] Funguje na obrázcích různých poměrů stran (na výšku, na šířku,
      čtverec) a na velmi velkých/malých obrázcích.
- [ ] Opakovaný paste nového obrázku správně nahradí předchozí a
      resetuje logo.

## Mimo rozsah (YAGNI, možné budoucí rozšíření)

- Více vrstev/log najednou.
- Rotace loga.
- Undo/redo.
- Automatizované nasazení (GitHub Actions) — nasazení řeší uživatel
  ručně přes nastavení GitHub Pages repozitáře.

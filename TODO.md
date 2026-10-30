# TODO Plán refaktoringu: Od akademického dotazníku k intuitivnímu studentskému rádci

Na základě tvých 9 bodů a screenshotů transformujeme systém z „akademického testovacího formuláře“ na **reálný, přirozený a užitečný nástroj pro studenta informatiky KIP PřF OU**, který tápe ve výběru bakalářky.

---

## 📋 Fázový TODO List

### Fáze 1: Vyčištění UI a přirozený jazyk (Quick Wins)
- [x] **1.1 Odstranění akademických závorek a metatextů**
  - Odstraněny texty `(Reverzní)`, `(Model TAM dle Davis, 1989)`, `(Hollandův model RIASEC)`, `(Brooke, 1996)`.
  - Otázky přeformulovány na přirozenou češtinu bez surových citací a psychometrických popisků.
- [x] **1.2 Zpřesnění cílové skupiny a vstupní větvení**
  - Přidáno přátelské vysvětlení a kontext pro studenty, kteří již téma mají.
  - Položka jistoty zjednodušena na srozumitelnou otázku: *„Máte v tuto chvíli jasno, o jakém tématu chcete psát svou bakalářskou práci?“* s přirozenými kotvami škály.

---

### Fáze 2: Diagnostický kvíz místo posuvníků (Otázky ➔ Výpočet profilu)
- [x] **2.1 Návrh 12 scénářových otázek pro RIASEC a osobnostní preference**
  - Místo manuálního odhadování procent má student 12 vyvážených scénářů s tlačítky 1–5 bez IT biasu.
  - Každá otázka zasahuje do 2–3 dimenzí najednou (Item-Trait Contribution Matrix).
- [x] **2.2 Odvození kariérních kotev a pracovního stylu z kvízu**
  - Přirozené nepřímé otázky na motivaci (autonomie, technická výzva, smysluplnost, stabilita).
  - Automatický výpočet % pro každou kotvu a výběr dvou dominantních kotev na pozadí.
- [x] **2.3 Automatický výpočet parametrů stylu a živý náhled**
  - Odvození stylu (adaptivní/inovativní), výstupu (aplikace vs. analýza) a supervize přímo z matice odpovědí.
  - Okamžitý přehledný vizuální souhrn profilu pro studenta před odesláním.

---

### Fáze 3: Integrace exportu ze STAGu (Automatické sylaby a známky)
- [x] **3.1 Parser studijních výsledků z IS-STAG**
  - Vytvoření parseru pro export ze STAGu (PDF / TXT / CSV / zkopírovaný text z portálu).
  - Automatické rozpoznání absolvovaných předmětů (kódy KIP/...), známek (A–E) a kreditů.
- [x] **3.2 Drag & Drop nahrání exportu v rozhraní**
  - Nahrazení zdlouhavého ručního klikání předmětů jednoduchým nahráním souboru ze STAGu nebo vložením textu přes schránku (Ctrl+V) s možností rychlé kontroly.

---

### Fáze 4: Výsledková stránka, Personifikace & Export
- [x] **4.1 Přehledný osobnostní a profesní profil studenta**
  - Zobrazení orientačního profilu (tvůj typ RIASEC, dominantní kotvy a silné stránky), který studentovi slouží jako samostatná hodnota i bez ohledu na témata.
- [x] **4.2 „Doporučení pro tebe“ u Top 3 témat**
  - Proč právě toto téma a jak si ho upravit na míru: konkrétní návrhy, jak téma modifikovat či rozšířit (např. *„Pokud tě baví React, navrhni vedoucímu rozšíření o moderní frontend...“*).
  - Transparentní a přehledné vysvětlení náročnosti tématu a formulace konkrétních otázek na první konzultaci s vedoucím.
- [x] **4.3 Export výsledků do PDF / přehledného dokumentu**
  - Specializovaný `@media print` tiskový layout pro A4 rešeršní list pro vedoucího práce s hlavičkou KIP PřF OU bez zbytečných tlačítek a webového balastu.

### Fáze 5: Admin page
- [ ] **5.1 Bezpečnost celý admin bude viditelný až po příhlášení ("tajný" endpoint /login)**
  - Základní bezpečnost ať nikdo nemůže zmanipulovat výsledky.

---

### Fáze 6: Testování a kontrola
- [ ] **6.1 Unit testy diagnostického výpočtu** (ověření převodu odpovědí na RIASEC a kotvy).
- [ ] **6.2 End-to-end průchod** v prohlížeči (plynulost kvízu, STAG import, zobrazení doporučení a exportu).

# Doporučovací systém pro výběr závěrečné práce (DSR Artefakt)

Softwarový prototyp a pilotní experimentální prostředí vyvinuté v rámci bakalářské práce:
* **Autor:** David Faul
* **Vedoucí práce:** doc. RNDr. PaedDr. Hashim Habiballa, PhD., Ph.D.
* **Instituce:** Ostravská univerzita, Přírodovědecká fakulta, Katedra informatiky a počítačů (KIP)
* **Rok:** 2027

---

## 🚀 Rychlé spuštění (One-command Start)

Celý systém (FastAPI backend + React frontend) spustíte jediným příkazem z kořenového adresáře:

```bash
./start.sh
```

Aplikace bude dostupná na:
* **Webové rozhraní (Frontend):** [http://localhost:3000](http://localhost:3000)
* **Interaktivní Swagger API dokumentace (Backend):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📐 Architektura a matematický model

Systém přesně odpovídá specifikaci v kapitole 5 textu práce:

```
[1. Vstupní modul] ➔ [2. Tři dílčí skóre] ➔ [3. Agregace a pořadí] ➔ [4. Šablonové zdůvodnění] ➔ [5. Rozhraní React]
```

### 1. Výpočet celkového skóre ($S_i$)
$$S_i = \alpha \cdot S_{\text{exp},i} + \beta \cdot S_{\text{cont},i} + \gamma \cdot S_{\text{kw},i}$$
* **$S_{\text{exp},i}$**: Shoda psychologického profilu (RIASEC, Scheinovy kotvy, kognitivní styl, orientace, supervize) s penalizací náročnosti $1 - \lambda (1 - I_{\text{eff}}) d_i$.
* **$S_{\text{cont},i}$**: Obsahová podobnost TF-IDF sylabů předmětů (vážených známkami A=1.0 až E=0.6) a anotace tématu s českou lemmatizací.
* **$S_{\text{kw},i}$**: Shoda zájmových klíčových slov $|K_u \cap K_i| / |K_u|$.
* **Dynamický přepočet vah:** Při absenci volitelných modulů se váhy automaticky přepočítávají na součet 1.0 (pokud student nezadá sylaby ani klíčová slova, platí $\alpha = 1.0$).

---

## 🖥️ Uživatelské režimy v aplikaci

1. **Výzkumný průvodce (Pilotní experiment):**
   * **Krok 0: GDPR souhlas** – anonymní sběr dat, generování pseudonymního session kódu (`STU-XXX1234`).
   * **Krok 1: Pre-test a Demografie** – vstupní rozhodovací jistota (0–10) a výzkumná sebeúčinnost ($I_{\text{eff}}$ z Bloku C).
   * **Krok 2: Profilový formulář** – RIASEC, kotvy, pracovní preference, volitelné známky z předmětů KIP a koníčky.
   * **Krok 3: Top doporučení** – Top 3 až 5 témat s rozpadem složek skóre a šablonovým zdůvodněním.
   * **Krok 4: Post-test** – výstupní rozhodovací jistota (0–10 pro H2 párový test), SUS škála (Brooke 1996 pro H3), TAM škála vnímané užitečnosti (Davis 1989) a otevřená zpětná vazba.
   * **Krok 5: Vyhodnocení** – okamžitý výpočet individuálního SUS skóre a změny jistoty.

2. **Demo Sandbox (Citlivostní analýza):**
   * Interaktivní ladění parametrů a vah $\alpha, \beta, \gamma$ v reálném čase.
   * Ideální pro demonstraci funkčnosti u obhajoby a experimentální ověření stability pořadí (Kendallovo $\tau$).

3. **Správa a Export (Admin Panel):**
   * Živý monitoring velikosti vzorku ($N$), průměrného SUS skóre, posunu jistoty a velikosti účinku $d_z$ (Lakens 2013).
   * **Jednoklikový export CSV** připravený pro statistické balíčky **Jamovi, SPSS, R i Python**.
   * Univerzální nahrávání souborů s tématy (JSON, CSV, TSV, text) nebo automatická indexace ze složky `data/import/`.

---

## 🧪 Spuštění testů

```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests
```

Všechny algoritmické a sémantické testy procházejí (100% pass).

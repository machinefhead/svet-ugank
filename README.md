# Svet ugank

Slovenska spletna igralnica za otroke in odrasle. Začetni razvoj: **Osmosmerka, Križanka, Sudoku, Labirint**.

**Status R2:** Osmosmerko je mogoče igrati. Skandinavska križanka, Sudoku in Labirint so vzorčni prikazi DEMO. Vzdevek, tema, aktivna uganka in osebni rezultati so shranjeni v brskalniku na tej napravi. R2 ne vključuje javne objave, računov ali skupnih lestvic.

## Lokalni zagon

Z Node.js 24 v projektni mapi zaženi `npm ci` in `npm run dev`, nato odpri lokalni naslov, ki ga izpiše Vite. Za preverjanje uporabi `npm test` in `npm run build`.

Hiter pregled v brskalniku: izberi »Začni igrati«, nastavi vzdevek in odpri Osmosmerko. Najdi besedo, spremeni težavnost brez klika na »Nova uganka« in osveži stran: ista mreža in najdena beseda morata ostati prikazani. Po dokončanju preveri en zapis v »Mojih rezultatih«. Na telefonu preizkusi vlečenje ali dva dotika končnih črk.

## Začni tukaj
1. [00_START_HERE.md](00_START_HERE.md) — aktualno stanje in omejitve
2. [08_DECISIONS.md](08_DECISIONS.md) — potrjene odločitve
3. [01_PRODUCT_SPEC.md](01_PRODUCT_SPEC.md) — namen in obseg
4. [02_GAME_REQUIREMENTS.md](02_GAME_REQUIREMENTS.md) — merila štirih ugank
5. [03_UI_UX.md](03_UI_UX.md) — izkušnja in oblikovanje
6. [04_PROFILES_OFFLINE_SYNC.md](04_PROFILES_OFFLINE_SYNC.md) — lokalni profili zdaj, strežniški pozneje
7. [05_ARCHITECTURE.md](05_ARCHITECTURE.md) — modularna zasnova
8. [06_ROADMAP.md](06_ROADMAP.md) — zaporedje razvoja
9. [07_QA_ACCEPTANCE.md](07_QA_ACCEPTANCE.md) — preverjanje kakovosti
10. [09_GITHUB_SETUP.md](09_GITHUB_SETUP.md) — proces dela
11. [AGENTS.md](AGENTS.md) — navodila za Codex

Orodja, modele in pripravo nalog opisuje [docs/CODEX_WORKFLOW.md](docs/CODEX_WORKFLOW.md).

**Referenčni prototip V3:** ostaja v arhivu ChatGPT Project (paket `SvetUgank_START_2026-11-15.zip`). Ni potrjena produkcijska osnova in ga trenutno ne kopiramo v `main`. Če ga Codex potrebuje za inventuro, mora biti dejansko priložen njegovemu delovnemu okolju.

Nobenih sprememb javnega gostovanja ali drugih repozitorijev brez izrecne odobritve lastnika.

# Svet ugank

Slovenska spletna igralnica za otroke in odrasle. Začetni razvoj: **Osmosmerka, Križanka, Sudoku, Labirint**.

**R4 za pregled.** Osmosmerka in Labirint sta igralna. Skandinavska križanka in Sudoku sta vzorčna prikaza DEMO v pripravi. Katalog napoveduje tri prihodnje igre za več igralcev.

## Lokalni zagon

Uporabi Node.js 24. Namesti odvisnosti z `npm ci`, nato uporabi `npm run dev` in odpri naslov, ki ga izpiše Vite. Teste poženeš z `npm test`, produkcijski predogled pa z `npm run build` in `npm run preview`.

Na naslovnici izberi »Začni igrati«, nato igro. Na začetnem zaslonu izberi nastavitve in pritisni »Začni igro«. Če imaš nedokončano igro, jo odpre »Nadaljuj« z isto mrežo in napredkom. »Nova uganka« vrne na nastavitve. Napredek zamenjaš šele, ko potrdiš nov začetek.

V Osmosmerki izberi »Klasična« ali »Po meri«. Na telefonu se dotakni prve in zadnje črke. V Labirintu uporabi palico pod mrežo, smerne gumbe ali na fokusirani mreži puščice oziroma W, A, S, D. Gumba za namig in potrjen ogled rešitve sta na dnu igre.

Tema ter napredek R4 se shranita v verzionirane ključe `svet-ugank:r4:*`. Iz stare shrambe se prenese tema. Ob stari nezdružljivi uganki začetni zaslon predlaga nov začetek. Zapisa R2 in R3 ostaneta v brskalniku kot zgodovinska podatka.

Gradnja uporablja pot `/svet-ugank/`. Postopek prve objave po potrjeni združitvi in nastavitev Pages sta v [navodilih za GitHub](09_GITHUB_SETUP.md). Lokalni napredek z localhosta na github.io ne preide samodejno.

## Začni tukaj
1. [00_START_HERE.md](00_START_HERE.md) — aktualno stanje in omejitve
2. [08_DECISIONS.md](08_DECISIONS.md) — potrjene odločitve
3. [01_PRODUCT_SPEC.md](01_PRODUCT_SPEC.md) — namen in obseg
4. [02_GAME_REQUIREMENTS.md](02_GAME_REQUIREMENTS.md) — merila štirih ugank
5. [03_UI_UX.md](03_UI_UX.md) — izkušnja in oblikovanje
6. [04_PROFILES_OFFLINE_SYNC.md](04_PROFILES_OFFLINE_SYNC.md) — lokalni napredek in prihodnji računi
7. [05_ARCHITECTURE.md](05_ARCHITECTURE.md) — modularna zasnova
8. [06_ROADMAP.md](06_ROADMAP.md) — zaporedje razvoja
9. [07_QA_ACCEPTANCE.md](07_QA_ACCEPTANCE.md) — preverjanje kakovosti
10. [09_GITHUB_SETUP.md](09_GITHUB_SETUP.md) — proces dela
11. [AGENTS.md](AGENTS.md) — navodila za Codex

Orodja, modele in pripravo nalog opisuje [docs/CODEX_WORKFLOW.md](docs/CODEX_WORKFLOW.md).

**Referenčni prototip V3:** ostaja v arhivu ChatGPT Project (paket `SvetUgank_START_2026-11-15.zip`). Ni potrjena produkcijska osnova in ga trenutno ne kopiramo v `main`. Če ga Codex potrebuje za inventuro, mora biti dejansko priložen njegovemu delovnemu okolju.

Nobenih sprememb javnega gostovanja ali drugih repozitorijev brez izrecne odobritve lastnika.

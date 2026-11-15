# Svet ugank

Slovenska spletna igralnica za otroke in odrasle. Začetni razvoj: **Osmosmerka, Križanka, Sudoku, Labirint**.

**Status R3:** Osmosmerka in Labirint sta igralna. Skandinavska križanka in Sudoku sta vzorčna prikaza DEMO. Brskalnik hrani lokalni vzdevek, temo, aktivni uganki in osebne rezultate. Aktivno Osmosmerko R2 lahko nadaljuješ, prejšnji časi pa so v zgodovini R2 na naslovnici.

## Lokalni zagon

Z Node.js 24 v projektni mapi zaženi `npm ci` in `npm run dev`, nato odpri lokalni naslov, ki ga izpiše Vite. Ciljni preizkusi Labirinta in shrambe tečejo z `node --test tests/maze.test.mjs tests/storage.test.mjs`. Produkcijsko gradnjo preveri z `npm run build` in `npm run preview`.

Za hiter pregled na naslovnici po želji nastavi vzdevek, nato prek »Začni igrati« odpri Osmosmerko. Najdi besedo, spremeni težavnost in osveži stran. Ista mreža in zelena najdena beseda morata ostati prikazani. Novo stopnjo uveljavi z »Nova uganka« in potrditvijo zamenjave. Po dokončanju se vrni na naslovnico in preveri en zapis v »Mojih rezultatih«. Na telefonu preizkusi vlečenje ali dva dotika končnih črk.

V Labirintu uporabi smerne gumbe, puščice na fokusirani mreži, dotik sosednjega polja ali vlečenje po hodniku. Za veliko mrežo sta pod njo »Povečava« in »Drsenje mreže«. »Na začetek« ohrani isto mrežo. Namig označi samo naslednji korak. Potrjen ogled rešitve izključi rezultat za to uganko tudi po ponovnem začetku.

Gradnja uporablja pot `/svet-ugank/`. Postopek prve objave po potrjeni združitvi in nastavitev Pages sta v [navodilih za GitHub](09_GITHUB_SETUP.md). Lokalni napredek z localhosta na github.io ne preide samodejno.

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

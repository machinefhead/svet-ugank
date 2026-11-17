# Svet ugank

Slovenska spletna igralnica v razvoju. Predvidene prve vrste so Osmosmerka, Skandinavska križanka, Sudoku in Labirint.

## Trenutno stanje razvojne veje R4

**Razvoj Osmosmerke in Labirinta je na izrecno željo lastnika ustavljen.** Njuni implementaciji (generatorji, seje, igralna polja, upravljanje in testi) sta odstranjeni iz te razvojne veje. V katalogu ostajata označeni **V prenovi**, vendar ju ni mogoče igrati. Naslednja zasnova še ni dogovorjena; ne začni ju samodejno znova implementirati.

Sudoku in Skandinavska križanka sta še vedno samo statična prikaza **DEMO**. Razdelek **Za dva ali več igralcev** vsebuje zgolj neaktivne napovedi Križec-krožec, Štiri v vrsto in Zračni hokej.

Ohranjeni so naslovnica, izbor iger, svetla/temna/sistemska tema in demonstracijska prikaza. Vmesnik nima lokalnega vzdevka in osebnih rezultatov. Obstoječi stari podatki v brskalnikovi shrambi niso izbrisani, vendar jih stran ne prikazuje.

## Lokalni zagon

V projektni mapi z ustreznim Node.js zaženi:

```sh
npm ci
npm run dev
```

Za preverjanje ostalega ogrodja: `npm test` in `npm run build`.

Vite uporablja osnovno pot `/svet-ugank/`. Razvojna veja ni javna objava. Javni GitHub Pages se posodobi šele po izrecno odobreni združitvi v `main`.

## Projektni dokumenti

Izhodišča so v `00_START_HERE.md`, `01_PRODUCT_SPEC.md`, `02_GAME_REQUIREMENTS.md`, `03_UI_UX.md`, `05_ARCHITECTURE.md`, `06_ROADMAP.md` in `08_DECISIONS.md`. Stari zapisi o izvedbah R2–R4 so zgodovina razvoja, ne opis trenutnih delujočih iger. Prototip V3 ostaja referenca in ni potrjena produkcijska osnova.

**Do naslednjih lastnikovih navodil ne dodajaj novega generatorja, igralne mehanike ali nove vrste igre.**

# 05 — Modularna arhitektura

Cilj: čim manj sistemov in odvisnosti, brez prezgodnjega backenda.

- `index.html`, `src/main.ts` in `src/styles.css`: odzivni prikaz, hash navigacija, začetni zasloni in skupni dialogi. `src/game-ui.ts` povezuje oba igralna modula z obrazcem in dejanji pod mrežo.
- `src/wordsearch/` in `src/maze/`: ločeni modeli, generatorji, igralna pravila in prikazi. Preverjanje poti v Labirintu je v neodvisnem modulu `solver.ts`.
- `src/storage.ts`: ločeni verzionirani ključi za temo in seji obeh iger; modula sej preverita obnovljeni napredek. `tests/` vsebuje deterministične ciljne preizkuse.
- Lokalni paketi, PWA cache in samostojna HTML izdaja ostajajo v načrtu.
- `reference/`: dokumentirana referenca na V3; prototip ni produkcijski temelj.
- `server/`: **ni del prvih faz**; rezervirano za prihodnost, če bodo potrebni pravi računi in skupne lestvice.

Potrjen stack je TypeScript + Vite + DOM/CSS. Za trenutne podatke uporabljamo `localStorage`. Statična gradnja za GitHub Pages uporablja osnovno pot `/svet-ugank/`.

Za spletno PWA je ob objavi praviloma potreben HTTPS za service worker. Lokalna samostojna HTML izvožena datoteka ni isto kot PWA.

Meje modulov: predstavitev ne sme vsebovati pravil preverjanja; besedišče ni zakodirano v UI; generatorji naj imajo za testiranje določljiva semena. Ne uvajaj storitev, računov in analitike, dokler jih dejansko ne potrebujemo.

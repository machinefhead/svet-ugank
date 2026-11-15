# 05 — Modularna arhitektura (predlog, ne potrjen stack)

Cilj: čim manj sistemov in odvisnosti, brez prezgodnjega backenda.

- `web/`: statični odzivni UI, prikaz mrež, modalna okna, lokalno shranjevanje.
- `games/`: ločeni generatorji in preverjevalniki vseh štirih iger, deterministični testi.
- `content/`: pregledane slovenske besede in skandinavske križanke s pravilnimi namigi.
- `offline/`: lokalni paketi, PWA cache ter shranjevanje napredka.
- `tools/`: preverjanje in po potrebi gradnja samostojne offline HTML izdaje.
- `reference/`: dokumentirana referenca na V3; prototip ni produkcijski temelj.
- `server/`: **ni del prvih faz**; rezervirano za prihodnost, če bodo potrebni pravi računi in skupne lestvice.

Možen preprost stack: TypeScript + Vite + DOM/CSS brez težkega frameworka, IndexedDB za večje lokalne podatke. To je predlog; Codex naj z razlogi potrdi ali zavrne izbiro pred začetkom dela.

Za spletno PWA je ob objavi praviloma potreben HTTPS za service worker. Lokalna samostojna HTML izvožena datoteka ni isto kot PWA.

Meje modulov: predstavitev ne sme vsebovati pravil preverjanja; besedišče ni zakodirano v UI; generatorji naj imajo za testiranje določljiva semena. Ne uvajaj storitev, računov in analitike, dokler jih dejansko ne potrebujemo.

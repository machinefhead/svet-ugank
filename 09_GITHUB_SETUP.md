# 09 — GitHub in Codex

Razvoj poteka samo v repozitoriju `machinefhead/svet-ugank`. `main` je stabilna veja. Postopek razvojne veje, ciljnih testov, commita, običajnega pusha in Draft PR opisuje [Codex workflow](docs/CODEX_WORKFLOW.md). Po pregledu združitev izvede lastnik ali koordinator.

## GitHub Pages

Lastnik je 15. 11. 2026 odobril javni repozitorij in javno stran. Ob preverjanju za R3 je GitHub poročal vidnost Public. Ciljni naslov [Svet ugank na GitHub Pages](https://machinefhead.github.io/svet-ugank/) in javni API za Pages sta vrnila HTTP 404. Objava R3 je odvisna od potrjene združitve in nastavitve Pages.

1. Če je repozitorij še zaseben, lastnik v **Settings → General → Danger Zone → Change repository visibility** izbere **Public**.
2. V **Settings → Pages → Build and deployment → Source** lastnik izbere **GitHub Actions**.
3. Po potrjeni združitvi v `main` preveri zagon **GitHub Pages** v zavihku **Actions** in naslov, ki ga izpiše uspešen korak objave. Če je bil Pages omogočen po združitvi, lahko workflow ročno zaženeš na veji `main`. V primeru napake preglej izpis neuspešnega koraka.

Workflow uporablja Node.js 24, `npm ci` in `npm run build`. Artefakt iz `dist` lahko objavi samo iz `main`. Nastavitve repozitorija, DNS in druge strani upravlja lastnik. V javni git, paket in artefakte sodijo samo javni podatki brez gesel, skrivnosti ali osebnih podatkov.

Lokalni napredek in rezultati so vezani na izvor spletnega mesta. Podatki z localhosta se na github.io ne prenesejo samodejno. Izvoz in uvoz sta prihodnji možnosti.

# Codex navodila — Svet ugank

**Jezik komunikacije:** slovenščina. Igralni UI in besedišče: slovensko.

Za vsako nalogo preberi `00_START_HERE.md`, `08_DECISIONS.md` in relevantne specifikacije, preden spremeniš kodo.

- Delaš **samo** izrecno naročeno nalogo v tem repozitoriju. Pred razvojem osveži `origin/main` in iz njega odpri ločeno vejo `feat/…` ali `fix/…`. Ohrani obstoječe nedokončano delo. Ne uvajaj novih vrst ugank, računov, backend storitev ali plačil samovoljno.
- Osnovne igre: Osmosmerka, Skandinavska križanka, Sudoku, Labirint.
- V3 ni potrjena produkcijska osnova. Arhiva ne uporabljaj, če ni dejansko na voljo; v tem primeru to povej.
- Algoritemska logika, podatki in UI so ločeni. Preverjaj rešitve ter enoličnost, kjer je potrebna.
- Križanka mora res vsebovati opise in puščice v gosti mreži. Nikoli ne označi razmetanih gesel za pravo skandinavsko križanko.
- Težavnost ne pomeni samo večje mreže. Igralne nastavitve se uveljavijo šele po »Nova uganka«.
- Videz: brez samovoljnega menjavanja palete; naslovnica in modali zahtevajo usklajen, potrjen dizajn.
- Razkritje celotne rešitve samo po namerni potrditvi; ne spreminjaj rešitvenega stanja ob ogledu.
- Najprej lokalni napredek brez gesel. Pravi računi, skupna lestvica in strežniška sinhronizacija so **odloženi**.
- Ne dotikaj se obstoječe javne strani ali drugih repozitorijev. Brez skrivnosti in osebnih podatkov v repozitoriju.
- Pred zaključkom izvedi relevantne ciljne teste, minimalni regresijski smoke, `npm run build` in `git diff --check`. Celoten težki nabor zaženi le ob konkretni potrebi ali izrecni zahtevi.
- Po uspešnem preverjanju preglej diff, commitaj in običajno potisni svojo razvojno vejo. Odpri Draft PR proti `main`. Poročaj URL, SHA, spremenjene datoteke, dejansko izvedene teste (PASS/FAIL) in omejitve. Če platforma zahteva ločeno odobritev ali dejanje spodleti, jasno poročaj.
- `main` je stabilna veja. Codex vanjo neposredno ne commita ali potiska in razvojnega PR ne združi sam. Po pregledu združitev izvede lastnik ali koordinator.
- Javna vidnost repozitorija in javni GitHub Pages sta odobrena 15. 11. 2026. Dejanski status preveri. Nastavitve GitHuba upravlja lastnik. Ko je Pages omogočen, GitHub Actions objavlja samo iz `main` po potrjeni združitvi. Razvojne veje in PR ne objavljajo.

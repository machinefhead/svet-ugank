# 02 — Zahteve za igre

## Skupna pravila
Vsaka uganka ima stabilen `puzzleId`, revizijo, vrsto, nastavitve, definicijo in preverljivo rešitev. Generator in preverjevalnik sta ločena od prikaza. Zamenjava nastavitev trenutne uganke ne spreminja; zažene jo šele »Nova uganka«. Uspešno dokončanje prikaže modal. Ogledu rešitve sledi izrecna potrditev.

## Osmosmerka
- Pravilno ime v UI: »Osmosmerka«.
- R2.1 za nove uganke ponuja tri prednastavitve. Izbira začne veljati z »Nova uganka«.

| Stopnja | Mreža | Besede | Smeri | Prekrivanja |
| --- | --- | --- | --- | --- |
| Začetna | 6 × 6 | 4 dolžine 3–4 | Desno in dol | 0–1, cilj 0 |
| Lahka | 8 × 8 | 6 dolžine 3–5 | Desno, dol, diagonali navzdol | 0–2, cilj 1 |
| Srednja | 10 × 10 | 8 dolžine 4–7 | Vseh osem možnih; vsaj štiri različne, vsaj dve diagonalni in dve obratni postavitvi | 2–5, cilj 3 |

- Prekrivanje šteje vsako ponovno uporabo črke na že zasedenem polju. Enoličnost velja v vseh osmih smereh, igralec pa sme označiti oba konca v kateremkoli vrstnem redu.
- Model generatorja ločeno določa velikost, število in dolžino besed, dovoljene smeri, ciljno prekrivanje in polnilo. Začetna in lahka imata enakomerno polnilo, srednja uporabi pogostost črk iz besednega nabora.
- Težka, zelo težka in ultra težka so predvidene po igralnem preizkusu prvih treh stopenj. Ročna izbira osi in tematski slovarji so prihodnje možnosti.
- Slovenske besede in šumniki, brez nesmiselnih seznamov.
- Označevanje z miško, dotikom in tipkovnico. Najdene besede so zelene s kljukico na seznamu, napačna izbira rdeča z besedilom, namig oranžen z besedilom.
- Težavnost ni zgolj velikost; povezana je tudi s prekrivanji, dolžinami, smermi, podobnostjo besed.

## Sudoku
- 4×4, 6×6 in 9×9 s pravilnimi regijami.
- Vsaka uganka ima natanko eno rešitev; ustrezno preverjena težavnost, ne le štetje praznih polj.
- Tipkovnica, dotik in razumljivi namigi brez samodejnega razkritja rešitve.

## Labirint
- Prikazne mreže 13 × 13, 21 × 21, 33 × 33, 45 × 45 in 61 × 61. Velikost in težavnost (Lahka, Srednja, Zahtevna) sta neodvisni. Privzeto 13 × 13 in Lahka.
- Generator revizije 1 izdela zvezno drevo z eno potjo do cilja. BFS preveri pot ter izmeri njeno dolžino, ovinke, razpotja na poti, slepe konce in največjo globino napačne veje.
- Growing Tree primerja 15 kandidatov, po tri za vsako od petih verjetnosti izbire najnovejše aktivne celice. Prednost imajo poti dolžine vsaj 1,15-krat najkrajše geometrijske razdalje in z vsaj štirimi ovinki oziroma polovico logične širine, če je ta večja. Če se uvrstijo manj kot trije kandidati, se uporabijo vsi preverjeni kandidati. Dodatnih poskusov ni.
- Znotraj istega semena in velikosti se stopnje določijo z najnižjo, srednjo in najvišjo oceno v skupini. Ocena je vsota dolžine poti, dveh točk na ovinek, šestih na razpotje in največje globine napačne veje, deljena z logično širino. Posamezne meritve se med stopnjami lahko prekrivajo.
- Premik je omejen na eno odprto sosednje polje. Ohranjen je zadnji veljavni položaj pri zdrsu ali izgubi kazalca. Na voljo so tipkovnica, klik, dotik, vlečenje in smerni gumbi.

## Križanka
- Cilj je **prava skandinavska križanka**: opisi v celicah mreže, puščice, gosta in smiselna križanja.
- V3 je samo poenostavljen neuspešen poskus; ne sprejmi naključno razmetanih gesel kot končne križanke.
- Za prvo kakovostno izvedbo so dovolj ročno pregledane mreže in besedna baza; generator ne sme ustvarjati napačnih namigov.
- Slovenski opisi, besedne oblike, pravilna dolžina, črke na vseh križiščih skladne. Povečava/izbira opisa tudi na telefonu.
- Ne uvajaj drugih različic križank v prvo izdajo brez odločitve.

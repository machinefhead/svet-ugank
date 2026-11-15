# 02 — Zahteve za igre

## Skupna pravila
Vsaka uganka ima stabilen `puzzleId`, revizijo, vrsto, nastavitve, definicijo in preverljivo rešitev. Generator in preverjevalnik sta ločena od prikaza. Zamenjava nastavitev trenutne uganke ne spreminja; zažene jo šele »Nova uganka«. Uspešno dokončanje prikaže modal. Ogledu rešitve sledi izrecna potrditev.

## Osmosmerka
- Pravilno ime v UI: »Osmosmerka«.
- Resnične vse vodoravne, navpične in diagonalne smeri, naprej in nazaj.
- Nastavitve: velikost mreže, število/tema/dolžina besed, težavnost in dovoljene smeri.
- Slovenske besede in šumniki, brez nesmiselnih seznamov.
- Gladko označevanje z miško in dotikom; najdene besede vidno označene (kljukica, izrazit slog).
- Težavnost ni zgolj velikost; povezana je tudi s prekrivanji, dolžinami, smermi, podobnostjo besed.

## Sudoku
- 4×4, 6×6 in 9×9 s pravilnimi regijami.
- Vsaka uganka ima natanko eno rešitev; ustrezno preverjena težavnost, ne le štetje praznih polj.
- Tipkovnica, dotik in razumljivi namigi brez samodejnega razkritja rešitve.

## Labirint
- Različne velikosti, več slepih ulic, razpotij, zavajajočih poti in različno zavite pravilne poti.
- Težavnost upošteva tudi ovinke, dolžino poti, napačne odcepe in ne le mrežo.
- Pri premikanju s prstom ni treba zadeti drobne pike; ne izgubljaj položaja ob zdrsu. Podpora tipkovnici in dotiku sosednjega polja.
- Generirane poti vedno povezujejo začetek in cilj; testirati mnogo semen.

## Križanka
- Cilj je **prava skandinavska križanka**: opisi v celicah mreže, puščice, gosta in smiselna križanja.
- V3 je samo poenostavljen neuspešen poskus; ne sprejmi naključno razmetanih gesel kot končne križanke.
- Za prvo kakovostno izvedbo so dovolj ročno pregledane mreže in besedna baza; generator ne sme ustvarjati napačnih namigov.
- Slovenski opisi, besedne oblike, pravilna dolžina, črke na vseh križiščih skladne. Povečava/izbira opisa tudi na telefonu.
- Ne uvajaj drugih različic križank v prvo izdajo brez odločitve.
